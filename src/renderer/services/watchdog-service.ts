import { useTerminalStore } from '@/stores/terminal-store'
import { getTerminalBufferText } from '@/lib/terminal-buffer-registry'
import { logSystemEvent } from '@/lib/system-logger'
import { toast } from 'sonner'
import type { PortInfo } from '@shared/types'

class WatchdogService {
  private timer: NodeJS.Timeout | null = null
  // Map of sessionId -> last known open port number
  private trackedPorts = new Map<string, { port: number; lastSeenOpen: boolean }>()
  private isProcessing = false

  public start(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.checkWatchdogs().catch((err) => {
        console.error('[WatchdogService] Check error:', err)
      })
    }, 2000)
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * Tự động trích xuất số port từ buffer của terminal (ví dụ: localhost:5173, port 20128, :3000...)
   */
  public extractPortFromBuffer(rawText: string): number | null {
    if (!rawText) return null
    // Matches patterns like:
    // http://localhost:5173/
    // http://127.0.0.1:20128
    // bound 0.0.0.0:20128
    // port 3000
    // listening on 8080
    const patterns = [
      /(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|169\.254\.\d+\.\d+):(\d{2,5})/i,
      /(?:port|cổng|listening on)\s*[:=]?\s*(\d{2,5})/i,
      /(?:ready on|running at)\s*[:=]?\s*(\d{2,5})/i
    ]

    for (const pattern of patterns) {
      const match = rawText.match(pattern)
      if (match && match[1]) {
        const p = parseInt(match[1], 10)
        if (p > 0 && p <= 65535) return p
      }
    }
    return null
  }

  public async checkWatchdogs(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      const { sessions, updateSession, createTerminal } = useTerminalStore.getState()
      const watchdogSessions = sessions.filter((s) => s.watchdogEnabled)
      if (watchdogSessions.length === 0) {
        this.trackedPorts.clear()
        this.isProcessing = false
        return
      }

      // 1. Lấy danh sách port đang mở hiện tại trên hệ thống
      const openPorts: PortInfo[] = await window.api.system.getPorts().catch(() => [])
      const openPortNumbers = new Set(openPorts.map((p) => p.port))

      for (const session of watchdogSessions) {
        // Tìm port được gán hoặc tự động phân tích từ log terminal
        let port = session.watchdogPort
        if (!port) {
          const rawBuffer = getTerminalBufferText(session.id)
          const detected = this.extractPortFromBuffer(rawBuffer)
          if (detected) {
            port = detected
            updateSession(session.id, { watchdogPort: detected })
          }
        }

        if (!port) continue

        const isCurrentlyOpen = openPortNumbers.has(port)
        const tracked = this.trackedPorts.get(session.id)

        if (!tracked) {
          // Bắt đầu theo dõi
          this.trackedPorts.set(session.id, { port, lastSeenOpen: isCurrentlyOpen })
          continue
        }

        // Kiểm tra chuyển trạng thái: ĐANG MỞ (true) -> BỊ ĐÓNG / MẤT PORT (false)
        if (tracked.lastSeenOpen && !isCurrentlyOpen) {
          // Dịch vụ / Server đã bị tắt hoặc Ctrl+C!
          tracked.lastSeenOpen = false
          this.trackedPorts.set(session.id, tracked)

          const rawBuffer = getTerminalBufferText(session.id)
          const alertCommand = session.lastExecutedCommand || session.title || `Dịch vụ Port :${port}`

          toast.error(
            `🚨 [Watchdog] Dịch vụ "${session.title}" (Port ${port}) vừa bị tắt đột ngột (Ctrl+C hoặc ngắt kết nối)!`,
            { duration: 8000 }
          )

          // Gửi thông báo khẩn cấp lên Telegram & Discord
          window.api.scheduler
            .sendWatchdogAlert({
              sessionTitle: session.title,
              command: alertCommand,
              exitCode: 130, // SIGINT / Ctrl+C
              recentOutput:
                rawBuffer.slice(-600) ||
                `Dịch vụ trên cổng mạng ${port} đã bị ngắt kết nối hoặc tắt bởi người dùng (Ctrl+C).`,
              autoRestarted: session.autoRestart
            })
            .catch((err) => {
              console.error('[WatchdogService] Send alert failed:', err)
            })

          logSystemEvent(
            'error',
            'watchdog',
            session.title,
            `Báo động Watchdog: Dịch vụ "${session.title}" (Port ${port}) đã bị tắt / ngắt kết nối!`,
            rawBuffer.slice(-500) || `Port ${port} closed.`
          )

          // Nếu có bật Auto-restart: Tự động chạy lại câu lệnh khởi động server
          if (session.autoRestart) {
            toast.warning(
              `[Watchdog] Đang tự động kích hoạt lại dịch vụ "${session.title}" sau 3s...`,
              { duration: 4000 }
            )

            logSystemEvent(
              'warning',
              'watchdog',
              session.title,
              `Đang tự động khởi động lại dịch vụ "${session.title}" (Port ${port}) sau 3s...`
            )

            setTimeout(async () => {
              try {
                if (session.lastExecutedCommand) {
                  window.api.terminal.input(session.id, `${session.lastExecutedCommand}\r`)
                } else {
                  window.api.terminal.input(session.id, `npm run dev\r`)
                }
                toast.success(`[Watchdog] Đã kích hoạt lại dịch vụ "${session.title}" thành công!`)
                logSystemEvent(
                  'success',
                  'watchdog',
                  session.title,
                  `Đã tự động khởi động lại thành công dịch vụ "${session.title}"`
                )
              } catch (err) {
                console.error('[WatchdogService] Auto-restart failed:', err)
              }
            }, 3000)
          }
        } else if (!tracked.lastSeenOpen && isCurrentlyOpen) {
          // Dịch vụ đã mở lại
          tracked.lastSeenOpen = true
          this.trackedPorts.set(session.id, tracked)
        }
      }
    } catch (err) {
      console.error('[WatchdogService] check error:', err)
    } finally {
      this.isProcessing = false
    }
  }
}

export const watchdogService = new WatchdogService()
