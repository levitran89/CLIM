import React from 'react'
import { useTerminalStore } from '@/stores/terminal-store'
import { TerminalPanel } from './TerminalPanel'
import { TerminalTabs } from './TerminalTabs'
import { Terminal as TerminalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TerminalGrid(): React.JSX.Element {
  const { sessions, activeSessionId, splitMode, createTerminal } =
    useTerminalStore()
    
  const foregroundSessions = sessions.filter(s => !s.isBackground)

  if (foregroundSessions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <TerminalTabs />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500">
          <div className="p-4 rounded-full bg-zinc-800/50 border border-zinc-700/30">
            <TerminalIcon size={32} className="text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-400">
              Chưa có terminal nào
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Tạo một terminal mới hoặc khởi chạy lệnh từ danh sách
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => createTerminal()}
            className="mt-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <TerminalIcon size={14} className="mr-2" />
            Terminal mới
          </Button>
        </div>
      </div>
    )
  }

  const getVisibleSessions = () => {
    if (splitMode === 'none') {
      const active = foregroundSessions.find((s) => s.id === activeSessionId)
      return active ? [active] : [foregroundSessions[0]]
    }
    // Show first 2 sessions in split mode
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
      <div className={`flex-1 min-h-0 p-1 ${gridClass}`}>
        {visibleSessions.map((session) => (
          <div key={session.id} className="min-h-0 min-w-0">
            <TerminalPanel sessionId={session.id} />
          </div>
        ))}
      </div>
    </div>
  )
}
