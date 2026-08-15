import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'
import { CommandCard } from './CommandCard'
import { twoColumnListClass } from '@/lib/utils'
import type { Command } from '../../../shared/types'

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

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider hover:text-zinc-200 transition-colors"
      >
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Folder size={12} className="text-amber-500/70" />
        <span>{category}</span>
        <span className="text-zinc-600 font-normal normal-case">
          ({commands.length})
        </span>
      </button>

      {isOpen && (
        <div
          className={`ml-2 animate-fade-in ${
            columns === 2 ? twoColumnListClass : 'space-y-0.5'
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
