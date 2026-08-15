import React, { useState, useEffect } from 'react'
import { useCommandStore } from '@/stores/command-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { CommandGroup } from './CommandGroup'
import { CommandForm } from './CommandForm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus, Download, Upload, Columns2, Rows3 } from 'lucide-react'
import { toast } from 'sonner'
import type { Command } from '../../../shared/types'

const COLUMNS_KEY = 'clim-commands-columns'

interface CommandListProps {
  onNavigateToTerminal?: () => void
}

export function CommandList({
  onNavigateToTerminal
}: CommandListProps): React.JSX.Element {
  const {
    searchQuery,
    setSearchQuery,
    loadCommands,
    addCommand,
    updateCommand,
    deleteCommand,
    filteredCommands,
    categories,
    exportCommands,
    importCommands
  } = useCommandStore()

  const { createTerminal, sessions, setActiveSession } = useTerminalStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editingCommand, setEditingCommand] = useState<Command | null>(null)
  const [columns, setColumns] = useState<1 | 2>(() => {
    const saved = localStorage.getItem(COLUMNS_KEY)
    return saved === '2' ? 2 : 1
  })

  useEffect(() => {
    loadCommands()
  }, [loadCommands])

  useEffect(() => {
    localStorage.setItem(COLUMNS_KEY, String(columns))
  }, [columns])

  const handleRun = async (command: Command): Promise<void> => {
    const existingSession = sessions.find(
      (s) => s.commandId === command.id && s.status === 'running'
    )
    if (existingSession) {
      if (existingSession.isBackground) {
        useTerminalStore.getState().updateSession(existingSession.id, { isBackground: false })
      }
      setActiveSession(existingSession.id)
      onNavigateToTerminal?.()
      return
    }

    toast.info(`Đang khởi chạy "${command.name}"...`)
    const sessionId = await createTerminal({
      shell: command.shell || 'powershell',
      cwd: command.workingDirectory,
      title: command.name,
      commandId: command.id
    })
    setActiveSession(sessionId)
    onNavigateToTerminal?.()
    setTimeout(() => {
      window.api.terminal.input(sessionId, command.command + '\r\n')
    }, 500)
  }

  const handleEdit = (command: Command): void => {
    setEditingCommand(command)
    setFormOpen(true)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lệnh này không?')) {
      await deleteCommand(id)
      toast.success('Đã xóa lệnh')
    }
  }

  const handleFormSubmit = async (
    data: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    if (editingCommand) {
      await updateCommand(editingCommand.id, data)
      toast.success('Đã cập nhật lệnh')
    } else {
      await addCommand(data)
      toast.success('Đã tạo lệnh mới')
    }
    setEditingCommand(null)
  }

  const handleExport = async (): Promise<void> => {
    const commands = await exportCommands()
    const blob = new Blob([JSON.stringify(commands, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clim-commands.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Đã xuất file cấu hình')
  }

  const handleImport = (): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const text = await file.text()
      try {
        const commands = JSON.parse(text) as Command[]
        await importCommands(commands)
        toast.success(`Đã nhập ${commands.length} lệnh từ file JSON`)
      } catch {
        toast.error('File JSON không hợp lệ')
      }
    }
    input.click()
  }

  const filtered = filteredCommands()
  const cats = categories()
  const favorites = filtered.filter((c) => c.isFavorite)

  const grouped = cats.reduce(
    (acc, cat) => {
      acc[cat] = filtered.filter((c) => c.category === cat && !c.isFavorite)
      return acc
    },
    {} as Record<string, Command[]>
  )

  return (
    <div className="flex flex-col h-full px-[50px]">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        {/* Toolbar: Tạo mới | Tìm kiếm | Nhập | Xuất | Cột */}
        <div className="p-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingCommand(null)
              setFormOpen(true)
            }}
            className="h-8 shrink-0 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <Plus size={12} className="mr-1" />
            Tạo mới
          </Button>

          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm lệnh..."
              className="pl-8 h-8 text-xs bg-zinc-800/50 border-zinc-700/50"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-zinc-500 hover:text-zinc-300"
            onClick={handleImport}
            title="Nhập file JSON cấu hình"
          >
            <Upload size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-zinc-500 hover:text-zinc-300"
            onClick={handleExport}
            title="Xuất file JSON"
          >
            <Download size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shrink-0 ${
              columns === 2
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setColumns((c) => (c === 1 ? 2 : 1))}
            title={columns === 2 ? 'Hiển thị 1 cột' : 'Hiển thị 2 cột'}
          >
            {columns === 2 ? <Columns2 size={14} /> : <Rows3 size={14} />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-1">
          {favorites.length > 0 && (
            <CommandGroup
              key="favorites"
              category="⭐ Lệnh ghim"
              commands={favorites}
              columns={columns}
              onRun={handleRun}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {Object.entries(grouped).map(
            ([cat, cmds]) =>
              cmds.length > 0 && (
                <CommandGroup
                  key={cat}
                  category={cat}
                  commands={cmds}
                  columns={columns}
                  onRun={handleRun}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
          )}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-zinc-600 text-xs">
              {searchQuery ? 'Không tìm thấy lệnh nào' : 'Chưa có lệnh nào'}
            </div>
          )}
        </ScrollArea>
      </div>

      <CommandForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingCommand(null)
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCommand}
      />
    </div>
  )
}
