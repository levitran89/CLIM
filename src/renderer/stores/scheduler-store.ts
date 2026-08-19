import { create } from 'zustand'
import type { ScheduledTask, TaskExecutionLog, WebhookConfig } from '@shared/types'
import { logSystemEvent } from '@/lib/system-logger'
import { toast } from 'sonner'

interface SchedulerState {
  tasks: ScheduledTask[]
  logs: TaskExecutionLog[]
  webhookConfig: WebhookConfig
  loading: boolean
  runningTaskIds: string[]

  loadTasks: () => Promise<void>
  saveTask: (task: ScheduledTask) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTask: (id: string, enabled: boolean) => Promise<void>
  runTaskNow: (id: string) => Promise<void>

  loadLogs: () => Promise<void>
  clearLogs: () => Promise<void>

  loadWebhookConfig: () => Promise<void>
  saveWebhookConfig: (config: WebhookConfig) => Promise<void>
  testWebhook: (type: 'discord' | 'telegram', config: WebhookConfig) => Promise<{ success: boolean; error?: string }>
}

export const useSchedulerStore = create<SchedulerState>((set, get) => ({
  tasks: [],
  logs: [],
  webhookConfig: {},
  loading: false,
  runningTaskIds: [],

  loadTasks: async () => {
    try {
      set({ loading: true })
      const tasks = await window.api.scheduler.listTasks()
      set({ tasks })
    } catch {
      // ignore
    } finally {
      set({ loading: false })
    }
  },

  saveTask: async (task: ScheduledTask) => {
    try {
      await window.api.scheduler.saveTask(task)
      await get().loadTasks()
      toast.success(`Đã lưu lịch tự động: "${task.name}"`)
    } catch {
      toast.error('Không thể lưu tác vụ lập lịch')
    }
  },

  deleteTask: async (id: string) => {
    try {
      await window.api.scheduler.deleteTask(id)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      }))
      toast.success('Đã xóa tác vụ lập lịch')
    } catch {
      toast.error('Không thể xóa tác vụ')
    }
  },

  toggleTask: async (id: string, enabled: boolean) => {
    try {
      await window.api.scheduler.toggleTask(id, enabled)
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, enabled, lastRunAt: enabled ? Date.now() : t.lastRunAt } : t
        )
      }))
      toast.success(enabled ? 'Đã kích hoạt tác vụ' : 'Đã tạm dừng tác vụ')
    } catch {
      toast.error('Không thể cập nhật trạng thái tác vụ')
    }
  },

  runTaskNow: async (id: string) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return

    set((state) => ({
      runningTaskIds: [...state.runningTaskIds, id]
    }))

    try {
      toast.info(`Đang chạy tác vụ: "${task.name}"...`)
      const res = await window.api.scheduler.runTaskNow(id)
      if (res.success) {
        toast.success(`Tác vụ "${task.name}" chạy thành công!`)
        logSystemEvent(
          'success',
          'scheduler',
          task.name,
          `Tác vụ lập lịch "${task.name}" thực thi thành công (${Math.round(res.log.durationMs / 1000)}s)`,
          res.log.outputPreview
        )
      } else {
        toast.error(`Tác vụ "${task.name}" thất bại (Exit ${res.log.exitCode})`)
        logSystemEvent(
          'error',
          'scheduler',
          task.name,
          `Tác vụ lập lịch "${task.name}" thất bại (Exit ${res.log.exitCode})`,
          res.log.outputPreview
        )
      }
      await get().loadTasks()
      await get().loadLogs()
    } catch (err) {
      toast.error(`Lỗi khi chạy tác vụ "${task.name}"`)
      logSystemEvent('error', 'scheduler', task.name, `Lỗi khi thực thi tác vụ: ${String(err)}`)
    } finally {
      set((state) => ({
        runningTaskIds: state.runningTaskIds.filter((tid) => tid !== id)
      }))
    }
  },

  loadLogs: async () => {
    try {
      const logs = await window.api.scheduler.listLogs()
      set({ logs })
    } catch {
      // ignore
    }
  },

  clearLogs: async () => {
    try {
      await window.api.scheduler.clearLogs()
      set({ logs: [] })
      toast.success('Đã xóa sạch lịch sử thực thi')
    } catch {
      toast.error('Không thể xóa lịch sử')
    }
  },

  loadWebhookConfig: async () => {
    try {
      const webhookConfig = await window.api.scheduler.getWebhookConfig()
      set({ webhookConfig: webhookConfig || {} })
    } catch {
      // ignore
    }
  },

  saveWebhookConfig: async (config: WebhookConfig) => {
    try {
      await window.api.scheduler.saveWebhookConfig(config)
      set({ webhookConfig: config })
      toast.success('Đã lưu cấu hình Webhook')
    } catch {
      toast.error('Không thể lưu cấu hình Webhook')
    }
  },

  testWebhook: async (type: 'discord' | 'telegram', config: WebhookConfig) => {
    try {
      const res = await window.api.scheduler.testWebhook(type, config)
      if (res.success) {
        toast.success(`Gửi thử nghiệm ${type.toUpperCase()} thành công!`)
      } else {
        toast.error(`Lỗi thử nghiệm: ${res.error}`)
      }
      return res
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Lỗi kết nối Webhook: ${msg}`)
      return { success: false, error: msg }
    }
  }
}))
