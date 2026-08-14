import React from 'react'
import { useTerminal } from '@/hooks/useTerminal'
import '@xterm/xterm/css/xterm.css'

interface TerminalPanelProps {
  sessionId: string
}

export function TerminalPanel({ sessionId }: TerminalPanelProps): React.JSX.Element {
  const { containerRef } = useTerminal({ sessionId })

  return (
    <div className="h-full w-full bg-[#0c0c0f] rounded-lg overflow-hidden">
      <div
        ref={containerRef}
        className="h-full w-full p-2"
        style={{ minHeight: 0 }}
      />
    </div>
  )
}
