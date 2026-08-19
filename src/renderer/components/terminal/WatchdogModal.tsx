import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, ShieldCheck, RefreshCw, Send, CheckCircle2, AlertTriangle, Network } from 'lucide-react'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSchedulerStore } from '@/stores/scheduler-store'
import { toast } from 'sonner'

interface WatchdogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string | null
}

export function WatchdogModal({
  open,
  onOpenChange,
  sessionId
}: WatchdogModalProps): React.JSX.Element {
  const { sessions, updateSession } = useTerminalStore()
  const { webhookConfig } = useSchedulerStore()

  const session = sessions.find((s) => s.id === sessionId)

  const isEnabled = session?.watchdogEnabled ?? false
  const isAutoRestart = session?.autoRestart ?? false

  const hasWebhookConfigured = Boolean(
    (webhookConfig.telegramToken && webhookConfig.telegramChatId) ||
      (webhookConfig.discordUrl && webhookConfig.discordUrl.startsWith('http'))
  )

  const handleToggleWatchdog = () => {
    if (!session) return
    const nextState = !isEnabled
    updateSession(session.id, { watchdogEnabled: nextState })
    if (nextState) {
      toast.success(`Đã bật giám sát sống còn (Watchdog) cho "${session.title}"`)
    } else {
      toast.info(`Đã tắt giám sát Watchdog cho "${session.title}"`)
    }
  }

  const handleToggleAutoRestart = () => {
    if (!session) return
    const nextState = !isAutoRestart
    updateSession(session.id, { autoRestart: nextState })
    if (nextState) {
      toast.success(`Đã bật tự động khởi động lại (Auto-restart) cho "${session.title}"`)
    } else {
      toast.info(`Đã tắt tự động khởi động lại cho "${session.title}"`)
    }
  }

  const handleTestAlert = async () => {
    if (!session) return
    if (!hasWebhookConfigured) {
      toast.error('Chưa cấu hình Telegram Bot hoặc Discord Webhook trong Cài đặt/Lập lịch!')
      return
    }
    toast.info('Đang gửi tin nhắn cảnh báo thử nghiệm lên Telegram/Discord...')
    const res = await window.api.scheduler.sendWatchdogAlert({
      sessionTitle: session.title,
      command: session.lastExecutedCommand || session.title,
      exitCode: 1,
      recentOutput: 'Đây là tin nhắn thử nghiệm tính năng Giám Sát Tiến Trình Nền (Process Watchdog Alert) từ CLIM.',
      autoRestarted: isAutoRestart
    })
    if (res.success) {
      toast.success('Đã gửi tin nhắn báo động thử nghiệm thành công!')
    } else {
      toast.error(`Lỗi gửi webhook: ${res.error || 'Không xác định'}`)
    }
  }

  if (!session) return <></>

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md ${
              isEnabled
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}>
              {isEnabled ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Giám Sát Sống Còn (Watchdog)</span>
                <Badge className={isEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]' : 'bg-zinc-800 text-zinc-400 text-[10px]'}>
                  {isEnabled ? 'ĐANG GIÁM SÁT' : 'CHƯA BẬT'}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tự động gửi cảnh báo khẩn cấp qua Telegram & Discord khi dịch vụ bị tắt hoặc crash.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {/* Target session info */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Phiên Terminal:</span>
              <span className="text-zinc-200 font-bold">{session.title}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>PID:</span>
              <span className="text-emerald-400">{session.pid || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Trạng thái:</span>
              <span className={session.status === 'running' ? 'text-emerald-400' : 'text-rose-400'}>
                {session.status === 'running' ? '🟢 Đang chạy' : '⚪ Đã dừng'}
              </span>
            </div>
          </div>

          {/* Option 1: Bật Giám sát Watchdog */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
            <div className="space-y-0.5 max-w-[280px]">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-amber-400" />
                Cảnh báo khi tiến trình tắt/crash
              </div>
              <p className="text-[11px] text-zinc-400">
                Gửi thông báo Telegram/Discord ngay khi tiến trình thoát hoặc bị ngắt bởi Ctrl+C.
              </p>
            </div>

            <Button
              size="sm"
              variant={isEnabled ? 'default' : 'outline'}
              onClick={handleToggleWatchdog}
              className={`h-8 px-3 text-xs font-bold cursor-pointer ${
                isEnabled
                  ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 shadow-sm'
                  : 'border-zinc-750 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {isEnabled ? 'Bật (ON)' : 'Tắt (OFF)'}
            </Button>
          </div>

          {/* Option 2: Giám sát Cổng Dịch Vụ (Port Watchdog) */}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Network size={14} className="text-cyan-400" />
                Giám sát Cổng Mạng (Port Watchdog)
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                {session.watchdogPort ? `Port :${session.watchdogPort}` : 'Tự động dò tìm qua log'}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400">
              Bắt ngay tức thì khi bạn bấm <strong>Ctrl+C</strong> hoặc server bị dừng làm mất cổng mạng.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-zinc-400 font-mono">Số Cổng:</span>
              <input
                type="number"
                placeholder="VD: 5173, 20128, 3000..."
                value={session.watchdogPort || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  updateSession(session.id, { watchdogPort: isNaN(val) ? undefined : val })
                }}
                className="flex-1 h-7 px-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Option 2: Tự động khởi động lại (Auto-restart) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
            <div className="space-y-0.5 max-w-[280px]">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <RefreshCw size={14} className="text-emerald-400" />
                Tự động khởi động lại (Auto-Restart)
              </div>
              <p className="text-[11px] text-zinc-400">
                Tự động kích hoạt lại dịch vụ sau 3 giây khi bị ngắt kết nối.
              </p>
            </div>

            <Button
              size="sm"
              variant={isAutoRestart ? 'default' : 'outline'}
              disabled={!isEnabled}
              onClick={handleToggleAutoRestart}
              className={`h-8 px-3 text-xs font-bold cursor-pointer ${
                isAutoRestart
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'border-zinc-750 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {isAutoRestart ? 'Bật (ON)' : 'Tắt (OFF)'}
            </Button>
          </div>

          {/* Webhook Status Notice */}
          {!hasWebhookConfigured && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>
                Bạn chưa cấu hình Telegram Bot Token hoặc Discord Webhook. Vui lòng vào <strong>Cài đặt</strong> hoặc tab <strong>Lập Lịch</strong> để nhập token nhận tin nhắn.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 border-t border-zinc-850 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleTestAlert}
            className="h-8 text-xs text-zinc-400 hover:text-amber-300 hover:bg-zinc-900 gap-1.5 cursor-pointer"
          >
            <Send size={12} />
            <span>Thử gửi báo động</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
          >
            Xong
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
