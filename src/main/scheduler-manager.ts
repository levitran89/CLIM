import { Notification } from 'electron'
import Store from 'electron-store'
import { exec } from 'child_process'
import https from 'https'
import http from 'http'
import { URL } from 'url'
import type {
  ScheduledTask,
  TaskExecutionLog,
  WebhookConfig,
  Command,
  CommandSequence
} from '../shared/types'

interface SchedulerStoreSchema {
  tasks: ScheduledTask[]
  logs: TaskExecutionLog[]
  webhookConfig: WebhookConfig
}

const schedulerStore = new Store<SchedulerStoreSchema>({
  name: 'clim-scheduler',
  defaults: {
    tasks: [],
    logs: [],
    webhookConfig: {}
  }
})

const mainConfigStore = new Store<{ commands: Command[]; sequences: CommandSequence[] }>({
  defaults: {
    commands: [],
    sequences: []
  }
})

export class SchedulerManager {
  private timer: NodeJS.Timeout | null = null
  private runningTaskIds = new Set<string>()

  constructor() {
    this.start()
  }

  /**
   * Bắt đầu vòng lặp định thời kiểm tra tác vụ (mỗi 10 giây)
   */
  public start(): void {
    if (this.timer) return

    // Run startup tasks once after 3 seconds
    setTimeout(() => {
      this.checkAndRunStartupTasks()
    }, 3000)

    this.timer = setInterval(() => {
      this.tick()
    }, 10000)
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  // ─── CRUD Tasks ───────────────────────────────────────────────

  public getTasks(): ScheduledTask[] {
    return schedulerStore.get('tasks', [])
  }

  public saveTask(task: ScheduledTask): void {
    const tasks = this.getTasks()
    const index = tasks.findIndex((t) => t.id === task.id)
    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...task }
    } else {
      tasks.push(task)
    }
    schedulerStore.set('tasks', tasks)
  }

  public deleteTask(id: string): void {
    const tasks = this.getTasks()
    schedulerStore.set(
      'tasks',
      tasks.filter((t) => t.id !== id)
    )
  }

  public toggleTask(id: string, enabled: boolean): void {
    const tasks = this.getTasks()
    const task = tasks.find((t) => t.id === id)
    if (task) {
      task.enabled = enabled
      if (enabled) {
        // Đặt lại thời điểm chạy để thời gian đếm ngược tính lại từ đầu
        task.lastRunAt = Date.now()
      }
      schedulerStore.set('tasks', tasks)
    }
  }

  // ─── Execution Logs ───────────────────────────────────────────

  public getLogs(): TaskExecutionLog[] {
    return schedulerStore.get('logs', [])
  }

  public clearLogs(): void {
    schedulerStore.set('logs', [])
  }

  private addLog(log: TaskExecutionLog): void {
    const logs = this.getLogs()
    // Giữ lại 100 log gần nhất
    const updated = [log, ...logs].slice(0, 100)
    schedulerStore.set('logs', updated)
  }

  // ─── Webhook Configuration ────────────────────────────────────

  public getWebhookConfig(): WebhookConfig {
    return schedulerStore.get('webhookConfig', {})
  }

  public saveWebhookConfig(config: WebhookConfig): void {
    schedulerStore.set('webhookConfig', config)
  }

  // ─── Scheduler Core Logic ─────────────────────────────────────

  private async tick(): Promise<void> {
    const tasks = this.getTasks()
    const now = Date.now()
    const nowDate = new Date()
    const currentHHmm = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`

    for (const task of tasks) {
      if (!task.enabled || this.runningTaskIds.has(task.id)) {
        continue
      }

      let shouldRun = false

      if (task.scheduleType === 'interval') {
        const intervalMs = (task.intervalMinutes || 5) * 60 * 1000
        const lastRun = task.lastRunAt || 0
        if (now - lastRun >= intervalMs) {
          shouldRun = true
        }
      } else if (task.scheduleType === 'daily') {
        if (task.dailyTime === currentHHmm) {
          const lastRun = task.lastRunAt || 0
          // Tránh chạy lặp lại trong cùng 1 phút
          if (now - lastRun > 65000) {
            shouldRun = true
          }
        }
      }

      if (shouldRun) {
        this.executeTask(task)
      }
    }
  }

  private async checkAndRunStartupTasks(): Promise<void> {
    const tasks = this.getTasks()
    for (const task of tasks) {
      if (task.enabled && task.scheduleType === 'startup') {
        this.executeTask(task)
      }
    }
  }

  /**
   * Thực thi một tác vụ lập lịch (Chạy ngầm hoặc Chạy thủ công Run Now)
   */
  public async executeTask(
    task: ScheduledTask,
    commandsStore?: Command[],
    sequencesStore?: CommandSequence[]
  ): Promise<{ success: boolean; log: TaskExecutionLog }> {
    this.runningTaskIds.add(task.id)

    // Cập nhật trạng thái running
    task.lastRunAt = Date.now()
    task.lastStatus = 'running'
    this.saveTask(task)

    const startedAt = Date.now()
    let commandToRun = ''
    let targetName = 'Tác vụ'
    let status: 'success' | 'failed' = 'success'
    let outputPreview = ''
    let exitCode = 0

    // Lấy lệnh hoặc quy trình từ tham số hoặc nạp từ store
    if (task.targetType === 'command') {
      const allCommands: Command[] =
        commandsStore && commandsStore.length > 0
          ? commandsStore
          : mainConfigStore.get('commands', [])
      const cmd = allCommands.find((c) => c.id === task.targetId || c.name === task.targetId)
      if (cmd) {
        commandToRun = cmd.command
        targetName = cmd.name
      } else if (task.targetId && (task.targetId.includes(' ') || task.targetId.startsWith('ping') || task.targetId.startsWith('curl') || task.targetId.startsWith('echo'))) {
        commandToRun = task.targetId
        targetName = task.name || 'Lệnh trực tiếp'
      } else {
        commandToRun = ''
        status = 'failed'
        exitCode = 1
        outputPreview = `Không tìm thấy câu lệnh có ID hoặc tên: "${task.targetId}". Vui lòng chỉnh sửa lại tác vụ để chọn câu lệnh hợp lệ.`
      }
    } else {
      const allSequences: CommandSequence[] =
        sequencesStore && sequencesStore.length > 0
          ? sequencesStore
          : mainConfigStore.get('sequences', [])
      const seq = allSequences.find((s) => s.id === task.targetId || s.name === task.targetId)
      if (seq) {
        targetName = seq.name
        const steps = seq.steps || []
        const stepCmds = steps
          .map((s) => s.command)
          .filter(Boolean)
        commandToRun = stepCmds.join(' && ')
        if (!commandToRun) {
          status = 'failed'
          exitCode = 1
          outputPreview = 'Quy trình không có bước lệnh nào để chạy'
        }
      } else {
        commandToRun = ''
        status = 'failed'
        exitCode = 1
        outputPreview = `Không tìm thấy quy trình có ID hoặc tên: "${task.targetId}". Vui lòng chỉnh sửa lại tác vụ.`
      }
    }

    if (commandToRun) {
      // 1. Phân giải biến môi trường từ Active Profile
      const profiles = mainConfigStore.get('profiles', []) as any[]
      const activeProfileId = mainConfigStore.get('activeProfileId', '') as string
      const activeProfile =
        profiles.find((p) => p.id === activeProfileId) || profiles.find((p) => p.isDefault)
      const envVars: Record<string, string> = {}
      if (activeProfile && activeProfile.variables) {
        for (const [k, v] of Object.entries(activeProfile.variables)) {
          envVars[k] = String(v)
        }
      }
      for (const [k, v] of Object.entries(envVars)) {
        const reg1 = new RegExp(`\\$\\{${k}\\}`, 'g')
        const reg2 = new RegExp(`\\{\\{${k}\\}\\}`, 'g')
        const reg3 = new RegExp(`\\$${k}\\b`, 'g')
        commandToRun = commandToRun.replace(reg1, v).replace(reg2, v).replace(reg3, v)
      }

      // 2. Tự động chuyển ping vô hạn (-t) thành 4 gói tin (-n 4) khi chạy tự động ngầm
      let sanitizedCmd = commandToRun
      if (sanitizedCmd.toLowerCase().includes('ping')) {
        const isWin = process.platform === 'win32'
        sanitizedCmd = sanitizedCmd
          .replace(/\s-t\b/gi, isWin ? ' -n 4' : ' -c 4')
          .replace(/\bping\s+-t\s+/gi, isWin ? 'ping -n 4 ' : 'ping -c 4 ')
      }

      try {
        // Quản lý vòng đời 2 giai đoạn: Chờ 30s -> Ghi log quá hạn lần 1 nếu chưa xong -> Gia hạn thêm 30s (Tổng 60s)
        const warningTimer = setTimeout(() => {
          const interimLog: TaskExecutionLog = {
            id: crypto.randomUUID(),
            taskId: task.id,
            taskName: task.name,
            targetType: task.targetType,
            targetName,
            startedAt,
            finishedAt: Date.now(),
            durationMs: 30000,
            status: 'failed',
            outputPreview: '⏳ Lệnh đang chạy vượt quá 30s (Quá hạn lần 1). Hệ thống đang tự động gia hạn thêm 30s để chờ kết quả hoàn tất...',
            exitCode: 124
          }
          this.addLog(interimLog)
        }, 30000)

        const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>(
          (resolve, reject) => {
            const isWin = process.platform === 'win32'
            const shellOption = isWin ? 'powershell.exe' : undefined
            exec(
              sanitizedCmd,
              {
                timeout: 60000,
                maxBuffer: 1024 * 1024 * 5,
                shell: shellOption,
                encoding: 'utf8',
                env: { ...process.env, ...envVars }
              },
              (error, stdout, stderr) => {
                clearTimeout(warningTimer)
                if (error) {
                  exitCode = typeof error.code === 'number' ? error.code : 1
                  reject({ error, stdout, stderr })
                } else {
                  exitCode = 0
                  resolve({ stdout, stderr })
                }
              }
            )
          }
        )

        status = 'success'
        outputPreview = (stdout || stderr || 'Thực thi thành công').slice(0, 800)
      } catch (err: unknown) {
        const errObj = err as { error?: Error; stdout?: string; stderr?: string }
        const stdoutStr = errObj.stdout || ''
        const stderrStr = errObj.stderr || ''

        // Nếu stdout chứa kết quả ping hoặc phản hồi hợp lệ, đánh giá là thành công
        if (
          stdoutStr.includes('Reply from') ||
          (stdoutStr.includes('bytes=') &&
            !stdoutStr.includes('Destination host unreachable') &&
            !stdoutStr.includes('Request timed out')) ||
          (stdoutStr.length > 50 && !stderrStr && !stdoutStr.toLowerCase().includes('error'))
        ) {
          status = 'success'
          exitCode = 0
          outputPreview = stdoutStr.slice(0, 800)
        } else {
          status = 'failed'
          outputPreview = (stderrStr || stdoutStr || (errObj.error?.message ?? String(err))).slice(0, 800)
        }
      }
    }

    const finishedAt = Date.now()
    const durationMs = finishedAt - startedAt

    // Tạo log
    const log: TaskExecutionLog = {
      id: crypto.randomUUID(),
      taskId: task.id,
      taskName: task.name,
      targetType: task.targetType,
      targetName,
      startedAt,
      finishedAt,
      durationMs,
      status,
      outputPreview,
      exitCode
    }

    this.addLog(log)
    this.runningTaskIds.delete(task.id)

    // Cập nhật trạng thái task
    task.lastStatus = status
    this.saveTask(task)

    // 1. Bắn Desktop Notification
    if (task.notifyOnComplete && Notification.isSupported()) {
      new Notification({
        title: `CLIM: ${task.name}`,
        body: `Trạng thái: ${status === 'success' ? '✅ Thành công' : '❌ Thất bại'} (${Math.round(durationMs / 1000)}s)`
      }).show()
    }

    // 2. Gửi Webhook nếu được bật
    if (task.webhookEnabled) {
      this.sendWebhookNotification(task, log)
    }

    return { success: status === 'success', log }
  }

  // ─── Webhook Dispatcher ───────────────────────────────────────

  public async sendWebhookNotification(
    task: ScheduledTask,
    log: TaskExecutionLog
  ): Promise<void> {
    const config = this.getWebhookConfig()

    // 1. Discord Webhook
    if (config.discordUrl && config.discordUrl.startsWith('http')) {
      const color = log.status === 'success' ? 0x10b981 : 0xef4444
      const payload = {
        username: 'CLIM Scheduler Bot',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
        embeds: [
          {
            title: `⏰ Lập Lịch: ${task.name}`,
            description: `Tác vụ **${log.targetName}** vừa hoàn tất thực thi định kỳ.`,
            color,
            fields: [
              {
                name: 'Trạng thái',
                value: log.status === 'success' ? '✅ Thành công (Exit 0)' : `❌ Thất bại (Exit ${log.exitCode})`,
                inline: true
              },
              {
                name: 'Thời gian chạy',
                value: `${Math.round(log.durationMs / 1000)} giây`,
                inline: true
              },
              {
                name: 'Xem trước Log',
                value: `\`\`\`\n${(log.outputPreview || 'Không có log').slice(0, 300)}\n\`\`\``
              }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      }
      this.httpPost(config.discordUrl, payload)
    }

    // 2. Telegram Bot
    if (config.telegramToken && config.telegramChatId) {
      const statusIcon = log.status === 'success' ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI'
      const text = `⏰ *CLIM TASK SCHEDULER*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📌 *Tác vụ:* ${task.name}\n` +
        `🎯 *Đối tượng:* ${log.targetName}\n` +
        `📊 *Trạng thái:* ${statusIcon}\n` +
        `⏱️ *Thời lượng:* ${Math.round(log.durationMs / 1000)}s\n` +
        `📝 *Log output:*\n\`${(log.outputPreview || 'None').slice(0, 200)}\``

      const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`
      this.httpPost(url, {
        chat_id: config.telegramChatId,
        text,
        parse_mode: 'Markdown'
      })
    }
  }

  /**
   * Kiểm tra kết nối Webhook
   */
  public async testWebhook(
    type: 'discord' | 'telegram',
    config: WebhookConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (type === 'discord') {
        if (!config.discordUrl) throw new Error('Chưa nhập Discord Webhook URL')
        const payload = {
          content: '🔔 **CLIM Webhook Test**: Kết nối Webhook Discord thành công!'
        }
        await this.httpPost(config.discordUrl, payload)
        return { success: true }
      } else {
        if (!config.telegramToken || !config.telegramChatId) {
          throw new Error('Chưa nhập Telegram Bot Token hoặc Chat ID')
        }
        const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`
        await this.httpPost(url, {
          chat_id: config.telegramChatId,
          text: '🔔 *CLIM Telegram Test*: Kết nối Telegram Bot thành công!',
          parse_mode: 'Markdown'
        })
        return { success: true }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  }

  /**
   * Gửi Báo cáo sự cố qua Webhook
   */
  public async sendIncidentWebhook(
    type: 'discord' | 'telegram',
    config: WebhookConfig,
    incidentData: { title: string; sessionTitle: string; command: string; summary: string; logExcerpt: string; rootCause?: string; recommendedFix?: string; isSuccess?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isSuccess = incidentData.isSuccess === true
      
      if (type === 'discord') {
        if (!config.discordUrl) throw new Error('Chưa nhập Discord Webhook URL')
        
        // Discord color: 0x2ECC71 (3066993) for Green, 0xED4245 (15548997) for Red
        const embedColor = isSuccess ? 3066993 : 15548997
        const embedTitle = isSuccess ? '🟢 [THÀNH CÔNG] BÁO CÁO THỰC THI' : '🔴 [SỰ CỐ] BÁO CÁO THỰC THI'
        
        const payload = {
          embeds: [
            {
              title: embedTitle,
              description: `📌 **Tiêu đề:** ${incidentData.title}\n🖥️ **Phiên Terminal:** \`${incidentData.sessionTitle}\`\n⌨️ **Lệnh:** \`${incidentData.command || 'N/A'}\`\n\n${isSuccess ? '📝 **Tóm tắt & Kết quả:**' : '⚠️ **Tóm tắt & Nguyên nhân:**'}\n${incidentData.summary || 'Không có mô tả chi tiết.'}`,
              color: embedColor,
              fields: [
                {
                  name: '📋 Trích Đoạn Log Chi Tiết',
                  value: `\`\`\`text\n${(incidentData.logExcerpt || 'Không có dữ liệu log').slice(0, 950)}\n\`\`\``
                }
              ],
              footer: {
                text: `CLIM System Manager • ${new Date().toLocaleTimeString('vi-VN')}`
              },
              timestamp: new Date().toISOString()
            }
          ]
        }

        if (incidentData.recommendedFix && !isSuccess) {
          payload.embeds[0].fields.push({
            name: '💡 Hướng Khắc Phục Đề Xuất (AI)',
            value: `\`\`\`bash\n${incidentData.recommendedFix.slice(0, 300)}\n\`\`\``
          })
        }

        await this.httpPost(config.discordUrl, payload)
        return { success: true }
      } else {
        if (!config.telegramToken || !config.telegramChatId) {
          throw new Error('Chưa nhập Telegram Bot Token hoặc Chat ID')
        }

        const telegramHeader = isSuccess ? '🟢 *[THÀNH CÔNG] BÁO CÁO THỰC THI*' : '🔴 *[SỰ CỐ] BÁO CÁO THỰC THI*'
        const summaryLabel = isSuccess ? '📝 *Tóm tắt & Kết quả:*' : '⚠️ *Tóm tắt & Nguyên nhân:*'

        let text = `${telegramHeader}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📌 *Tiêu đề:* ${incidentData.title}\n` +
          `🖥️ *Phiên Terminal:* \`${incidentData.sessionTitle}\`\n` +
          `⌨️ *Lệnh:* \`${incidentData.command || 'N/A'}\`\n\n` +
          `${summaryLabel}\n${incidentData.summary || 'Không có mô tả chi tiết.'}\n\n` +
          `📋 *Trích Đoạn Log Chi Tiết:*\n\`\`\`text\n${(incidentData.logExcerpt || 'Không có dữ liệu log').slice(0, 950)}\n\`\`\``

        if (incidentData.recommendedFix && !isSuccess) {
          text += `\n\n💡 *Hướng Khắc Phục Đề Xuất:*\n\`\`\`bash\n${incidentData.recommendedFix.slice(0, 300)}\n\`\`\``
        }

        const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`
        await this.httpPost(url, {
          chat_id: config.telegramChatId,
          text,
          parse_mode: 'Markdown'
        })
        return { success: true }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  }

  /**
   * Bắn cảnh báo Process Watchdog khi tiến trình bị tắt/crash đột ngột
   */
  public async sendWatchdogAlert(data: {
    sessionTitle: string
    command?: string
    exitCode?: number
    recentOutput?: string
    autoRestarted?: boolean
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.getWebhookConfig()
      const isAutoRestarted = data.autoRestarted === true

      // 1. Discord Webhook
      if (config.discordUrl && config.discordUrl.startsWith('http')) {
        const color = isAutoRestarted ? 0xf59e0b : 0xef4444
        const embedTitle = isAutoRestarted
          ? '🔄 [WATCHDOG] TIẾN TRÌNH ĐÃ TỰ ĐỘNG KHỞI ĐỘNG LẠI'
          : '🚨 [BÁO ĐỘNG SỰ CỐ] TIẾN TRÌNH NỀN ĐÃ BỊ TẮT ĐỘT NGỘT'

        const payload = {
          username: 'CLIM Watchdog Bot',
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/1008/1008909.png',
          embeds: [
            {
              title: embedTitle,
              description: `Tiến trình **${data.sessionTitle}** vừa bị dừng/thoát với mã **Exit Code ${data.exitCode ?? 1}**.`,
              color,
              fields: [
                { name: '🖥️ Phiên Terminal', value: `\`${data.sessionTitle}\``, inline: true },
                { name: '⌨️ Lệnh thực thi', value: `\`${data.command || 'N/A'}\``, inline: true },
                { name: '⏱️ Thời điểm', value: new Date().toLocaleTimeString('vi-VN'), inline: true },
                {
                  name: '📋 Trích đoạn Log cuối',
                  value: `\`\`\`text\n${(data.recentOutput || 'Không có log đầu ra').slice(-800)}\n\`\`\``
                }
              ],
              footer: {
                text: isAutoRestarted
                  ? 'CLIM Watchdog • Đã tự động kích hoạt lại dịch vụ'
                  : 'CLIM Watchdog • Cảnh báo dừng dịch vụ'
              },
              timestamp: new Date().toISOString()
            }
          ]
        }
        this.httpPost(config.discordUrl, payload)
      }

      // 2. Telegram Bot
      if (config.telegramToken && config.telegramChatId) {
        const header = isAutoRestarted
          ? '🔄 *[WATCHDOG] ĐÃ TỰ ĐỘNG RESTART TIẾN TRÌNH*'
          : '🚨 *[BÁO ĐỘNG SỰ CỐ] TIẾN TRÌNH NỀN ĐÃ BỊ TẮT*'
        const text =
          `${header}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🖥️ *Phiên:* \`${data.sessionTitle}\`\n` +
          `⌨️ *Lệnh:* \`${data.command || 'N/A'}\`\n` +
          `⚠️ *Mã thoát:* Exit ${data.exitCode ?? 1}\n` +
          `⏱️ *Thời điểm:* ${new Date().toLocaleTimeString('vi-VN')}\n` +
          (isAutoRestarted ? `🟢 *Trạng thái:* Hệ thống đã tự động kích hoạt lại!\n\n` : `\n`) +
          `📋 *Trích đoạn Log cuối:*\n\`\`\`text\n${(data.recentOutput || 'Không có log').slice(-500)}\`\`\``

        const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`
        this.httpPost(url, {
          chat_id: config.telegramChatId,
          text,
          parse_mode: 'Markdown'
        })
      }

      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  }

  private httpPost(targetUrl: string, body: object): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const parsed = new URL(targetUrl)
        const postData = JSON.stringify(body)
        const options = {
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 5000
        }

        const client = parsed.protocol === 'https:' ? https : http
        const req = client.request(options, (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve()
          } else {
            reject(new Error(`HTTP Status ${res.statusCode}`))
          }
        })

        req.on('error', (e) => reject(e))
        req.on('timeout', () => {
          req.destroy()
          reject(new Error('Request timeout'))
        })

        req.write(postData)
        req.end()
      } catch (err) {
        reject(err)
      }
    })
  }
}

export const schedulerManager = new SchedulerManager()
