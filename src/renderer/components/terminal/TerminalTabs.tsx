import React, { useState, useRef, useEffect } from 'react'
import { useTerminalStore } from '@/stores/terminal-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Plus,
  X,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Square,
  EyeOff
} from 'lucide-react'

export function TerminalTabs(): React.JSX.Element {
  const {
    sessions,
    activeSessionId,
    splitMode,
    setActiveSession,
    createTerminal,
    killTerminal,
    renameSession,
    setSplitMode,
    updateSession
  } = useTerminalStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showShellMenu, setShowShellMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowShellMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDoubleClick = (id: string, title: string): void => {
    setEditingId(id)
    setEditValue(title)
  }

  const handleRenameSubmit = (id: string): void => {
    if (editValue.trim()) {
      renameSession(id, editValue.trim())
    }
    setEditingId(null)
  }

  const handleCloseTab = async (
    e: React.MouseEvent,
    id: string
  ): Promise<void> => {
    e.stopPropagation()
    await killTerminal(id)
  }

  const statusVariant = (
    status: string
  ): 'success' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'running':
        return 'success'
      case 'stopped':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const activeSession = sessions.find(s => s.id === activeSessionId)
  const foregroundSessions = sessions.filter(s => !s.isBackground)

  const handleBackground = () => {
    if (activeSessionId) {
      updateSession(activeSessionId, { isBackground: true })
      const nextSession = foregroundSessions.find(s => s.id !== activeSessionId)
      setActiveSession(nextSession?.id || null)
    }
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-900/80 border-b border-border/40 px-2 h-10">
      {/* Tabs */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
        {foregroundSessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setActiveSession(session.id)}
            onDoubleClick={() =>
              handleDoubleClick(session.id, session.title)
            }
            className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer
              transition-all duration-150 select-none min-w-0 shrink-0
              ${
                activeSessionId === session.id
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }
            `}
          >
            <Badge
              variant={statusVariant(session.status)}
              className="h-1.5 w-1.5 p-0 rounded-full"
            />

            {editingId === session.id ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleRenameSubmit(session.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(session.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="bg-transparent border-none outline-none text-xs w-20"
                autoFocus
              />
            ) : (
              <span className="truncate max-w-[100px]">{session.title}</span>
            )}

            <button
              onClick={(e) => handleCloseTab(e, session.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-1"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 border-l border-border/30 pl-2 ml-1">
        {activeSessionId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-amber-400 mr-1"
            onClick={handleBackground}
            title="Chạy ngầm"
          >
            <EyeOff size={14} />
          </Button>
        )}
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${showShellMenu ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-400 hover:text-emerald-400'}`}
            onClick={() => setShowShellMenu(!showShellMenu)}
            title="Terminal mới"
          >
            <Plus size={14} />
          </Button>

          {showShellMenu && (
            <div className="absolute top-full right-0 mt-1 w-36 py-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg z-50">
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 transition-colors"
                onClick={() => { createTerminal({ shell: 'powershell', title: 'PowerShell' }); setShowShellMenu(false) }}
              >
                PowerShell
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 transition-colors"
                onClick={() => { createTerminal({ shell: 'cmd', title: 'CMD' }); setShowShellMenu(false) }}
              >
                Command Prompt
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 transition-colors"
                onClick={() => { createTerminal({ shell: 'wsl', title: 'WSL' }); setShowShellMenu(false) }}
              >
                WSL
              </button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${splitMode === 'none' ? 'text-zinc-500' : 'text-zinc-400'}`}
          onClick={() => setSplitMode('none')}
          title="Giao diện đơn"
        >
          <Square size={14} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${splitMode === 'vertical' ? 'text-emerald-400' : 'text-zinc-400'}`}
          onClick={() => setSplitMode('vertical')}
          title="Chia dọc"
        >
          <SplitSquareVertical size={14} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${splitMode === 'horizontal' ? 'text-emerald-400' : 'text-zinc-400'}`}
          onClick={() => setSplitMode('horizontal')}
          title="Chia ngang"
        >
          <SplitSquareHorizontal size={14} />
        </Button>
      </div>
    </div>
  )
}
