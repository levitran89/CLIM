import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen, Star } from 'lucide-react'
import { CommandCard } from './CommandCard'
import type { Command } from '../../../shared/types'
import { useTranslation } from '@/stores/i18n-store'

interface CommandGroupProps {
  category: string
  commands: Command[]
  columns?: 1 | 2
  onRun: (command: Command) => void
  onEdit: (command: Command) => void
  onDelete: (id: string) => void
}

export function CommandGroup({
  category,
  commands,
  columns = 1,
  onRun,
  onEdit,
  onDelete
}: CommandGroupProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(true)
  const { language } = useTranslation()
  const isFavoriteGroup = category.includes('ghim') || category.includes('Favorite') || category.includes('Pinned') || category.includes('⭐')

  const displayCategory = isFavoriteGroup
    ? (language === 'en' ? '⭐ Pinned Commands' : '⭐ Lệnh Ghim')
    : category

  return (
    <div className="mb-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 transition-all shadow-sm">
      {/* Category Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full pb-2 mb-2 border-b border-zinc-800/60 text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-transform" />
          ) : (
            <ChevronRight size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-transform" />
          )}

          {isFavoriteGroup ? (
            <Star size={14} className="text-amber-400 fill-amber-400" />
          ) : isOpen ? (
            <FolderOpen size={14} className="text-emerald-400/90" />
          ) : (
            <Folder size={14} className="text-zinc-500" />
          )}

          <span className="tracking-wide uppercase text-[11px] font-bold">
            {displayCategory}
          </span>
        </div>

        <span className="text-[10px] font-mono bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700/50">
          {commands.length} {language === 'en' ? (commands.length > 1 ? 'commands' : 'command') : 'lệnh'}
        </span>
      </button>

      {/* Commands List / Grid */}
      {isOpen && (
        <div
          className={`animate-fade-in ${
            columns === 2
              ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5'
              : 'space-y-1.5'
          }`}
        >
          {commands.map((cmd) => (
            <CommandCard
              key={cmd.id}
              command={cmd}
              onRun={onRun}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
