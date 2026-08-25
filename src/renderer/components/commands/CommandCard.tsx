import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Pencil, Trash2, Terminal, Square, Star } from 'lucide-react'
import type { Command } from '../../../shared/types'
import { useTerminalStore } from '@/stores/terminal-store'
import { useCommandStore } from '@/stores/command-store'
import { confirmAction } from '@/stores/confirm-store'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/stores/i18n-store'

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
  const { t, language } = useTranslation()

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
      const confirmed = await confirmAction({
        title: language === 'en' ? 'Stop command execution' : 'Dừng thực thi lệnh',
        description: language === 'en' ? `Are you sure you want to stop running command "${command.name}"?` : `Bạn có chắc chắn muốn dừng tiến trình câu lệnh "${command.name}" đang chạy không?`,
        confirmText: language === 'en' ? 'Stop' : 'Dừng lệnh',
        cancelText: t('common.cancel'),
        variant: 'warning'
      })
      if (confirmed) {
        await killTerminal(session.id)
      }
    }
  }

  return (
    <div
      className={cn(
        'group p-3 rounded-lg transition-all duration-150 border cursor-pointer relative',
        isRunning
          ? 'bg-gradient-to-r from-emerald-950/30 to-zinc-900/90 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
          : 'bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-900/90 hover:border-zinc-700/80 hover:shadow-sm'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0" onClick={() => onRun(command)}>
          <div className="flex items-center gap-2 flex-wrap">
            <Terminal
              size={15}
              className={cn(
                'shrink-0',
                isRunning ? 'text-emerald-400' : shellColors[command.shell || 'powershell']
              )}
            />
            <span
              className={cn(
                'text-sm sm:text-base font-bold truncate',
                isRunning ? 'text-emerald-100' : 'text-zinc-100'
              )}
            >
              {command.name}
            </span>
            {command.category && (
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                {command.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {isRunning && (
              <span
                className={cn(
                  'shrink-0 text-xs px-2 py-0.5 rounded-md font-semibold',
                  session.isBackground
                    ? 'bg-amber-500/25 text-amber-300'
                    : 'bg-emerald-500/30 text-emerald-300'
                )}
              >
                {session.isBackground
                  ? (language === 'en' ? 'Background' : 'Chạy ngầm')
                  : (language === 'en' ? 'Running' : 'Đang chạy')}
              </span>
            )}
            <p
              className={cn(
                'text-xs sm:text-sm font-mono truncate flex-1',
                isRunning ? 'text-emerald-300/80 font-medium' : 'text-zinc-400'
              )}
            >
              {command.command}
            </p>
          </div>
          {(command.tags || []).length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {(command.tags || []).slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 h-5 bg-zinc-800 text-zinc-300 border-zinc-700/60 font-medium"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-1 transition-opacity shrink-0',
            isRunning || command.isFavorite
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          )}
        >
          {isRunning ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white font-semibold border border-rose-500/40 hover:border-rose-400 shadow-sm rounded-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 group/stop"
              onClick={handleStop}
              title={language === 'en' ? 'Stop command' : 'Dừng lệnh'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
              <Square size={10} className="fill-current" />
              <span>{language === 'en' ? 'Stop' : 'Dừng'}</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-zinc-950 font-semibold border border-emerald-500/35 hover:border-emerald-400 shadow-sm rounded-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 group/run"
              onClick={(e) => {
                e.stopPropagation()
                onRun(command)
              }}
              title={language === 'en' ? 'Run command' : 'Chạy lệnh'}
            >
              <Play size={11} className="fill-current group-hover/run:scale-110 transition-transform" />
              <span>{language === 'en' ? 'Run' : 'Chạy'}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 cursor-pointer',
              command.isFavorite
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
            onClick={handleToggleFavorite}
            title={command.isFavorite ? (language === 'en' ? 'Unpin' : 'Bỏ ghim') : (language === 'en' ? 'Pin command' : 'Ghim lệnh')}
          >
            <Star size={16} fill={command.isFavorite ? 'currentColor' : 'none'} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(command)
            }}
            title={t('common.edit')}
          >
            <Pencil size={16} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(command.id)
            }}
            title={t('common.delete')}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
