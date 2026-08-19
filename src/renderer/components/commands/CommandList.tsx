import React, { useState, useEffect } from 'react'
import { useCommandStore } from '@/stores/command-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useProfileStore } from '@/stores/profile-store'
import { CommandGroup } from './CommandGroup'
import { CommandForm } from './CommandForm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus, Download, Upload, Columns2, Rows3, Maximize2, Minimize2, PanelLeftClose } from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/stores/confirm-store'
import type { Command } from '../../../shared/types'
import { useCommandRunner } from '@/components/providers/CommandRunnerProvider'
import { useSettingsStore } from '@/stores/settings-store'
import { useTranslation } from '@/stores/i18n-store'

const LAYOUT_WIDTH_KEY = 'clim-commands-layout-width'

interface CommandListProps {
  onNavigateToTerminal?: () => void
}

export function CommandList({
  onNavigateToTerminal
}: CommandListProps): React.JSX.Element {
  const {
    commands,
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
  const { getActiveProfile } = useProfileStore()

  const { settings, updateSettings } = useSettingsStore()
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [editingCommand, setEditingCommand] = useState<Command | null>(null)
  const columns = settings.commandColumns || 2
  const [layoutWidth, setLayoutWidth] = useState<'centered' | 'full'>(() => {
    const saved = localStorage.getItem(LAYOUT_WIDTH_KEY)
    return saved === 'full' ? 'full' : 'centered'
  })

  const toggleLayoutWidth = () => {
    const next = layoutWidth === 'centered' ? 'full' : 'centered'
    setLayoutWidth(next)
    localStorage.setItem(LAYOUT_WIDTH_KEY, next)
    toast.info(next === 'centered' ? 'Chế độ hiển thị: Kích thước dạng Web ở giữa' : 'Chế độ hiển thị: Tràn viền (Full width)')
  }

  const { runCommand } = useCommandRunner()

  useEffect(() => {
    loadCommands()
  }, [loadCommands])

  const handleRun = async (command: Command): Promise<void> => {
    await runCommand(command, onNavigateToTerminal)
  }

  const handleEdit = (command: Command): void => {
    setEditingCommand(command)
    setFormOpen(true)
  }

  const handleDelete = async (id: string): Promise<void> => {
    const cmd = commands.find((c) => c.id === id)
    const confirmed = await confirmAction({
      title: 'Xác nhận xóa câu lệnh',
      description: cmd?.name
        ? `Bạn có chắc chắn muốn xóa câu lệnh "${cmd.name}" không? Thao tác này không thể hoàn tác.`
        : 'Bạn có chắc chắn muốn xóa câu lệnh này không?',
      confirmText: 'Xóa câu lệnh',
      cancelText: 'Hủy',
      variant: 'destructive'
    })
    if (confirmed) {
      await deleteCommand(id)
      toast.success('Đã xóa lệnh thành công')
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
    <div className="flex flex-col h-full w-full bg-zinc-950 overflow-hidden">
      {/* Toolbar: Tạo mới | Tìm kiếm | Nhập | Xuất | Cột */}
      <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/50 border-b border-zinc-800/60 flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingCommand(null)
            setFormOpen(true)
          }}
          className="h-9 shrink-0 text-sm font-semibold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 px-3.5 gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus size={15} />
          {t('common.add')}
        </Button>

        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('commands.searchPlaceholder')}
            className="pl-9 h-9 text-sm bg-zinc-900/60 border-zinc-700/60 text-zinc-200 placeholder:text-zinc-500"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={handleImport}
          title="Nhập file JSON cấu hình"
        >
          <Upload size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={handleExport}
          title="Xuất file JSON"
        >
          <Download size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8.5 w-8.5 shrink-0 ${
            columns === 2
              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          onClick={() => updateSettings({ commandColumns: columns === 1 ? 2 : 1 })}
          title={columns === 2 ? 'Chuyển sang 1 cột' : 'Chuyển sang 2 cột'}
        >
          {columns === 2 ? <Columns2 size={16} /> : <Rows3 size={16} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 shrink-0 ${
            layoutWidth === 'centered'
              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          onClick={toggleLayoutWidth}
          title={layoutWidth === 'centered' ? 'Chuyển sang chế độ Tràn viền (Full width)' : 'Chuyển sang chế độ Kích thước Dạng Web ở giữa'}
        >
          {layoutWidth === 'centered' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>

      {/* Main Scrollable Content */}
      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className={layoutWidth === 'centered' ? 'max-w-4xl mx-auto px-4 py-4 pb-12 space-y-4' : 'px-4 sm:px-6 py-4 pb-12 space-y-4'}>
          {favorites.length > 0 && (
            <CommandGroup
              key="favorites"
              category="⭐ Lệnh ghim"
              commands={favorites}
              columns={(columns === 1 ? 1 : 2)}
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
                  columns={(columns === 1 ? 1 : 2)}
                  onRun={handleRun}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
          )}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-zinc-600 text-xs">
              {searchQuery ? t('commands.noCommands') : t('commands.noCommands')}
            </div>
          )}
        </div>
      </ScrollArea>

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
