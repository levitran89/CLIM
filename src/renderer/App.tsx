import React, { useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { MainContent } from '@/components/layout/MainContent'
import { StatusBar } from '@/components/layout/StatusBar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useSettingsStore } from '@/stores/settings-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useAIStore } from '@/stores/ai-store'
import { useCloudSyncStore } from '@/stores/cloud-sync-store'
import { useI18nStore } from '@/stores/i18n-store'
import { getTerminalBufferText } from '@/lib/terminal-buffer-registry'
import { watchdogService } from '@/services/watchdog-service'
import { logSystemEvent } from '@/lib/system-logger'
import { Toaster, toast } from 'sonner'

import { CommandRunnerProvider } from '@/components/providers/CommandRunnerProvider'

export default function App(): React.JSX.Element {
  const { sessions } = useTerminalStore()
  const accentColor = useSettingsStore((s) => s.settings.accentColor)

  // Apply dynamic accent color to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor || 'emerald')
  }, [accentColor])

  // Initial Data Load & Start Watchdog
  useEffect(() => {
    useSettingsStore.getState().loadSettings()
    useAIStore.getState().loadStorage()
    useCloudSyncStore.getState().loadConfig()
    useI18nStore.getState().loadLanguage()
    watchdogService.start()
    return () => watchdogService.stop()
  }, [])

  // Listen for terminal exit events
  useEffect(() => {
    if (!window.api?.terminal?.onExit) return
    const removeListener = window.api.terminal.onExit(
      (sessionId: string, exitCode: number) => {
        const store = useTerminalStore.getState()
        const session = store.sessions.find(s => s.id === sessionId)
        store.updateSession(sessionId, { status: 'stopped' })
        
        if (session) {
          // 1. Process Watchdog Alert to Telegram & Discord
          if (session.watchdogEnabled) {
            const rawText = getTerminalBufferText(sessionId)
            window.api.scheduler
              .sendWatchdogAlert({
                sessionTitle: session.title,
                command: session.lastExecutedCommand || session.title,
                exitCode,
                recentOutput: rawText,
                autoRestarted: session.autoRestart
              })
              .catch(() => {})

            // If auto-restart is enabled, respawn after 3 seconds
            if (session.autoRestart) {
              toast.warning(
                `[Watchdog] Tiến trình "${session.title}" bị dừng. Đang tự động khởi động lại sau 3s...`,
                { duration: 4000 }
              )
              setTimeout(async () => {
                try {
                  const newSessionId = await store.createTerminal({
                    shell: session.shell,
                    cwd: session.workingDirectory,
                    title: session.title,
                    commandId: session.commandId,
                    sequenceId: session.sequenceId,
                    sequenceStepId: session.sequenceStepId
                  })
                  store.updateSession(newSessionId, {
                    watchdogEnabled: true,
                    autoRestart: true,
                    isBackground: session.isBackground,
                    lastExecutedCommand: session.lastExecutedCommand
                  })
                  if (session.lastExecutedCommand) {
                    window.api.terminal.input(newSessionId, `${session.lastExecutedCommand}\r`)
                  }
                  toast.success(`[Watchdog] Đã khởi động lại thành công "${session.title}"`)
                } catch {
                  toast.error(`[Watchdog] Không thể tự động khởi động lại "${session.title}"`)
                }
              }, 3000)
            }
          }

          if (exitCode === 0) {
            toast.success(`Lệnh "${session.title}" đã hoàn thành`)
            logSystemEvent(
              'success',
              'terminal',
              session.title,
              `Phiên terminal "${session.title}" đã hoàn thành thành công (Exit 0)`
            )
          } else {
            toast.error(`Lệnh "${session.title}" dừng với mã lỗi ${exitCode}`, {
              action: {
                label: '⚡ Sửa lỗi với AI',
                onClick: () => {
                  useAIStore.getState().openErrorFixModal({
                    errorOutput: `Lệnh "${session.title}" thất bại với exit code ${exitCode}. Hãy chẩn đoán nguyên nhân và đề xuất câu lệnh khắc phục.`,
                    lastCommand: session.title,
                    shell: (session.shell as 'powershell' | 'cmd' | 'wsl') || 'powershell'
                  })
                }
              },
              duration: 10000
            })
            logSystemEvent(
              'error',
              'terminal',
              session.title,
              `Phiên terminal "${session.title}" kết thúc với mã lỗi Exit ${exitCode}`,
              getTerminalBufferText(sessionId).slice(-500)
            )
          }
        }
      }
    )
    return () => removeListener()
  }, [])

  return (
    <CommandRunnerProvider>
      <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
        <TitleBar />

        <div className="flex-1 min-h-0">
          <MainContent />
        </div>

        <StatusBar />
        <ConfirmDialog />
        <Toaster theme="dark" position="bottom-right" />
      </div>
    </CommandRunnerProvider>
  )
}
