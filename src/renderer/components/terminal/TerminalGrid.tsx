import React from 'react'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSequenceStore } from '@/stores/sequence-store'
import { useSettingsStore } from '@/stores/settings-store'
import { TerminalPanel } from './TerminalPanel'
import { TerminalTabs } from './TerminalTabs'
import { SequenceRunnerPanel } from '@/components/sequences/SequenceRunnerPanel'
import { Terminal as TerminalIcon } from 'lucide-react'
import { useTranslation } from '@/stores/i18n-store'

export function TerminalGrid(): React.JSX.Element {
  const { sessions, activeSessionId, splitMode, createTerminal } = useTerminalStore()
  const activeRun = useSequenceStore((s) => s.activeRun)
  const defaultShell = useSettingsStore((s) => s.settings.defaultShell)
  const { language } = useTranslation()

  const foregroundSessions = sessions.filter((s) => !s.isBackground)

  // Determine which sessions are currently visible based on splitMode
  const getVisibleSessionIds = (): Set<string> => {
    const visibleIds = new Set<string>()
    if (splitMode === 'none') {
      const active = foregroundSessions.find((s) => s.id === activeSessionId)
      if (active) {
        visibleIds.add(active.id)
      } else if (foregroundSessions[0]) {
        visibleIds.add(foregroundSessions[0].id)
      }
    } else {
      // Split mode: first 2 foreground sessions
      foregroundSessions.slice(0, 2).forEach((s) => visibleIds.add(s.id))
    }
    return visibleIds
  }

  const visibleSessionIds = getVisibleSessionIds()

  const gridClass =
    splitMode === 'vertical'
      ? 'grid grid-cols-2 gap-1.5'
      : splitMode === 'horizontal'
        ? 'grid grid-rows-2 gap-1.5'
        : 'flex flex-col'

  return (
    <div className="flex flex-col h-full bg-[#0c0c0f]">
      <TerminalTabs />
      <div className="flex flex-1 min-h-0">
        {activeRun && <SequenceRunnerPanel />}

        <div className="relative flex-1 min-h-0 flex flex-col">
          {/* Duy trì toàn bộ sessions trong DOM (kể cả terminal chạy ngầm) để bảo toàn 100% buffer */}
          <div className={`relative flex-1 min-h-0 p-1.5 ${splitMode === 'none' ? 'w-full h-full' : gridClass}`}>
            {sessions.map((session) => {
              const isVisible = !session.isBackground && visibleSessionIds.has(session.id)
              return (
                <div
                  key={session.id}
                  className={`min-h-0 min-w-0 ${
                    isVisible
                      ? 'relative w-full h-full flex-1'
                      : 'absolute inset-0 w-full h-full pointer-events-none'
                  }`}
                  style={{
                    visibility: isVisible ? 'visible' : 'hidden',
                    zIndex: isVisible ? 10 : 0
                  }}
                >
                  <TerminalPanel sessionId={session.id} isVisible={isVisible} />
                </div>
              )
            })}
          </div>

          {/* Hiển thị màn hình chờ khi không có tab nào ở chế độ foreground */}
          {foregroundSessions.length === 0 && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-zinc-500 p-4 bg-[#0c0c0f]">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md">
                <TerminalIcon size={36} className="text-zinc-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-zinc-300">
                  {language === 'en' ? 'No terminal session open' : 'Chưa có terminal nào trên màn hình'}
                </p>
                <p className="text-xs text-zinc-500">
                  {language === 'en'
                    ? `Click below to spawn a new Terminal using default shell in Settings (${defaultShell.toUpperCase()})`
                    : `Nhấn nút bên dưới để mở Terminal theo cấu hình mặc định trong Cài đặt (${defaultShell.toUpperCase()})`}
                </p>
              </div>

              <button
                onClick={() => createTerminal({ shell: defaultShell || 'powershell' })}
                className="mt-3 flex items-center gap-2 h-10 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-zinc-200 hover:text-white font-medium text-xs sm:text-sm shadow-sm cursor-pointer transition-colors"
              >
                <TerminalIcon size={16} className="text-zinc-400" />
                <span>
                  {language === 'en' ? `Open Terminal (${defaultShell.toUpperCase()})` : `Mở Terminal (${defaultShell.toUpperCase()})`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
