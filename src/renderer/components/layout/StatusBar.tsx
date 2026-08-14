import React from 'react'
import { useTerminalStore } from '@/stores/terminal-store'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'

export function StatusBar(): React.JSX.Element {
  const { sessions } = useTerminalStore()

  const runningCount = sessions.filter((s) => s.status === 'running').length
  const activeSession = sessions.find(
    (s) => s.id === useTerminalStore.getState().activeSessionId
  )

  return (
    <div className="flex items-center justify-between h-6 px-3 bg-zinc-900/80 border-t border-zinc-800/40 text-[10px] text-zinc-500 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Zap size={10} className={runningCount > 0 ? 'text-emerald-400' : 'text-zinc-600'} />
          <span>
            {runningCount > 0
              ? `${runningCount} running`
              : 'No active terminals'}
          </span>
        </div>

        {activeSession && (
          <>
            <span className="text-zinc-700">│</span>
            <span>
              Shell:{' '}
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                {activeSession.shell.toUpperCase()}
              </Badge>
            </span>
            {activeSession.pid && (
              <>
                <span className="text-zinc-700">│</span>
                <span>PID: {activeSession.pid}</span>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-zinc-600">CLIM v1.0.0</span>
      </div>
    </div>
  )
}
