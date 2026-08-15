import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Pencil, Trash2, Terminal, Square, Star } from 'lucide-react'
import type { Command } from '../../../shared/types'
import { useTerminalStore } from '@/stores/terminal-store'
import { useCommandStore } from '@/stores/command-store'
import { cn } from '@/lib/utils'

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
  const isRunning = !!session

  const handleToggleFavorite = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    await updateCommand(command.id, { isFavorite: !command.isFavorite })
  }

  const handleStop = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    if (session) {
      if (window.confirm('Bạn có chắc chắn muốn dừng lệnh này không?')) {
        await killTerminal(session.id)
      }
    }
  }

  return (
    <div
      className={cn(
        'group px-3 py-2.5 rounded-lg transition-all duration-150 border cursor-pointer',
        isRunning
          ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]'
          : 'border-transparent hover:bg-zinc-800/60 hover:border-zinc-700/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0" onClick={() => onRun(command)}>
          <div className="flex items-center gap-2">
            <Terminal
              size={13}
              className={cn(
                'shrink-0',
                isRunning ? 'text-emerald-400' : shellColors[command.shell || 'powershell']
              )}
            />
            <span
              className={cn(
                'text-sm font-medium truncate flex-1',
                isRunning ? 'text-emerald-100' : 'text-zinc-200'
              )}
            >
              {command.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isRunning && (
              <span
                className={cn(
                  'shrink-0 text-[10px] px-1.5 py-0.5 rounded-sm font-medium',
                  session.isBackground
                    ? 'bg-amber-500/25 text-amber-300'
                    : 'bg-emerald-500/30 text-emerald-300'
                )}
              >
                {session.isBackground ? 'Chạy ngầm' : 'Đang chạy'}
              </span>
            )}
            <p
              className={cn(
                'text-xs font-mono truncate flex-1',
                isRunning ? 'text-emerald-400/70' : 'text-zinc-500'
              )}
            >
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

        <div
          className={cn(
            'flex items-center gap-0.5 transition-opacity shrink-0',
            isRunning || command.isFavorite
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          )}
        >
          {isRunning ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleStop}
              title="Dừng lệnh"
            >
              <Square size={15} fill="currentColor" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              onClick={(e) => {
                e.stopPropagation()
                onRun(command)
              }}
              title="Chạy lệnh"
            >
              <Play size={15} />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              command.isFavorite
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
            onClick={handleToggleFavorite}
            title={command.isFavorite ? 'Bỏ ghim' : 'Ghim lệnh'}
          >
            <Star size={15} fill={command.isFavorite ? 'currentColor' : 'none'} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(command)
            }}
            title="Sửa"
          >
            <Pencil size={15} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(command.id)
            }}
            title="Xóa"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>
    </div>
  )
}
