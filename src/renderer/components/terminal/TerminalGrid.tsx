import React from 'react'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSequenceStore } from '@/stores/sequence-store'
import { useSettingsStore } from '@/stores/settings-store'
import { TerminalPanel } from './TerminalPanel'
import { TerminalTabs } from './TerminalTabs'
import { SequenceRunnerPanel } from '@/components/sequences/SequenceRunnerPanel'
import { Terminal as TerminalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/stores/i18n-store'

export function TerminalGrid(): React.JSX.Element {
  const { sessions, activeSessionId, splitMode, createTerminal } = useTerminalStore()
  const activeRun = useSequenceStore((s) => s.activeRun)
  const defaultShell = useSettingsStore((s) => s.settings.defaultShell)
  const { language } = useTranslation()

  const foregroundSessions = sessions.filter((s) => !s.isBackground)

  const getVisibleSessions = (): typeof foregroundSessions => {
    if (splitMode === 'none') {
      const active = foregroundSessions.find((s) => s.id === activeSessionId)
      return active ? [active] : foregroundSessions[0] ? [foregroundSessions[0]] : []
    }
    return foregroundSessions.slice(0, 2)
  }

  const visibleSessions = getVisibleSessions()

  const gridClass =
    splitMode === 'vertical'
      ? 'grid grid-cols-2 gap-1'
      : splitMode === 'horizontal'
        ? 'grid grid-rows-2 gap-1'
        : ''

  return (
    <div className="flex flex-col h-full">
      <TerminalTabs />
      <div className="flex flex-1 min-h-0">
        {activeRun && <SequenceRunnerPanel />}

        <div className="flex-1 min-h-0 flex flex-col">
          {foregroundSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500 p-4">
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
          ) : (
            <div className={`flex-1 min-h-0 p-1 ${gridClass}`}>
              {visibleSessions.map((session) => (
                <div key={session.id} className="min-h-0 min-w-0 h-full">
                  <TerminalPanel sessionId={session.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
