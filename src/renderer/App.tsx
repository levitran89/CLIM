import React, { useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { MainContent } from '@/components/layout/MainContent'
import { StatusBar } from '@/components/layout/StatusBar'
import { useTerminalStore } from '@/stores/terminal-store'

import { Toaster, toast } from 'sonner'

export default function App(): React.JSX.Element {
  const { sessions } = useTerminalStore()

  // Listen for terminal exit events
  useEffect(() => {
    const removeListener = window.api.terminal.onExit(
      (sessionId: string, exitCode: number) => {
        const store = useTerminalStore.getState()
        const session = store.sessions.find(s => s.id === sessionId)
        store.updateSession(sessionId, { status: 'stopped' })
        
        if (session) {
          if (exitCode === 0) {
            toast.success(`Lệnh "${session.title}" đã hoàn thành`)
          } else {
            toast.error(`Lệnh "${session.title}" dừng với lỗi (code: ${exitCode})`)
          }
        }
      }
    )
    return () => removeListener()
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <TitleBar />

      <div className="flex-1 min-h-0">
        <MainContent />
      </div>

      <StatusBar />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
