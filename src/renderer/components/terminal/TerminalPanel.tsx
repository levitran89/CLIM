import React, { useCallback } from 'react'
import { useTerminal } from '@/hooks/useTerminal'
import { useRecordingStore } from '@/stores/recording-store'
import '@xterm/xterm/css/xterm.css'

interface TerminalPanelProps {
  sessionId: string
}

export function TerminalPanel({ sessionId }: TerminalPanelProps): React.JSX.Element {
  const handleDataReceived = useCallback((data?: string) => {
    if (data) {
      useRecordingStore.getState().recordChunk(sessionId, data)
    }
  }, [sessionId])

  const { containerRef } = useTerminal({
    sessionId,
    onDataReceived: handleDataReceived
  })

  return (
    <div className="relative h-full w-full bg-[#0c0c0f] rounded-lg overflow-hidden flex flex-col">
      {/* Terminal Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full p-2 overflow-hidden"
        style={{ minHeight: 0 }}
      />
    </div>
  )
}
