import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Pencil, Trash2, Terminal, Square, Star } from 'lucide-react'
import type { Command } from '../../../shared/types'
import { useTerminalStore } from '@/stores/terminal-store'
import { useCommandStore } from '@/stores/command-store'

interface CommandCardProps {
  command: Command
  onRun: (command: Command) => void
  onEdit: (command: Command) => void
  onDelete: (id: string) => void
}

const shellColors: Record<string, string> = {
  powershell: 'text-blue-400',
  cmd: 'text-amber-400',
  wsl: 'text-orange-400'
}

export function CommandCard({
  command,
  onRun,
  onEdit,
  onDelete
}: CommandCardProps): React.JSX.Element {
  const { sessions, killTerminal } = useTerminalStore()
  const { updateCommand } = useCommandStore()

  const session = sessions.find(
    (s) => s.commandId === command.id && s.status === 'running'
  )

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateCommand(command.id, { isFavorite: !command.isFavorite })
  }

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (session) {
      if (window.confirm('Bạn có chắc chắn muốn dừng lệnh này không?')) {
        await killTerminal(session.id)
      }
    }
  }

  return (
    <div className="group px-3 py-2 rounded-lg hover:bg-zinc-800/60 transition-all duration-150 border border-transparent hover:border-zinc-700/30 cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0" onClick={() => onRun(command)}>
          <div className="flex items-center gap-2">
            <Terminal
              size={12}
              className={`shrink-0 ${shellColors[command.shell || 'powershell']}`}
            />
            <span className="text-sm font-medium text-zinc-200 truncate flex-1">
              {command.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {session && (
              <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${session.isBackground ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {session.isBackground ? 'Chạy ngầm' : 'Đang chạy'}
              </span>
            )}
            <p className="text-xs text-zinc-500 font-mono truncate flex-1">
              {command.command}
            </p>
          </div>
          {(command.tags || []).length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {(command.tags || []).slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-0.5 transition-opacity shrink-0 ${session || command.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {session ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleStop}
              title="Dừng lệnh"
            >
              <Square size={11} fill="currentColor" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              onClick={(e) => {
                e.stopPropagation()
                onRun(command)
              }}
              title="Chạy lệnh"
            >
              <Play size={11} />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${command.isFavorite ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-400 hover:text-zinc-200'}`}
            onClick={handleToggleFavorite}
            title={command.isFavorite ? 'Bỏ ghim' : 'Ghim lệnh'}
          >
            <Star size={11} fill={command.isFavorite ? 'currentColor' : 'none'} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-zinc-200"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(command)
            }}
            title="Sửa"
          >
            <Pencil size={11} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(command.id)
            }}
            title="Xóa"
          >
            <Trash2 size={11} />
          </Button>
        </div>
      </div>
    </div>
  )
}
