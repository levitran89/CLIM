import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Trash2,
  Play,
  Square,
  List,
  Search,
  Pencil,
  Columns2,
  Rows3,
  ListOrdered
} from 'lucide-react'
import { toast } from 'sonner'
import type { CommandSequence, SequenceRunMode } from '@shared/types'
import { useSequenceStore } from '@/stores/sequence-store'
import { SequenceForm, type SequenceFormData } from './SequenceForm'
import { twoColumnListClass } from '@/lib/utils'

const COLUMNS_KEY = 'clim-sequences-columns'

const runModeLabel: Record<SequenceRunMode, string> = {
  none: 'Không chạy',
  first: 'Chạy đầu',
  all: 'Chạy tất cả'
}

interface SequenceManagerProps {
  onNavigateToTerminal?: () => void
}

export function SequenceManager({
  onNavigateToTerminal
}: SequenceManagerProps): React.JSX.Element {
  const [formOpen, setFormOpen] = useState(false)
  const [editingSequence, setEditingSequence] = useState<CommandSequence | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [columns, setColumns] = useState<1 | 2>(() => {
    const saved = localStorage.getItem(COLUMNS_KEY)
    return saved === '2' ? 2 : 1
  })

  const sequences = useSequenceStore((s) => s.sequences)
  const activeRun = useSequenceStore((s) => s.activeRun)
  const loadSequences = useSequenceStore((s) => s.loadSequences)
  const addSequence = useSequenceStore((s) => s.addSequence)
  const updateSequence = useSequenceStore((s) => s.updateSequence)
  const deleteSequence = useSequenceStore((s) => s.deleteSequence)
  const startSequence = useSequenceStore((s) => s.startSequence)
  const stopSequence = useSequenceStore((s) => s.stopSequence)

  useEffect(() => {
    loadSequences()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredSequences = useMemo(() => {
    if (!searchQuery.trim()) return sequences
    const q = searchQuery.toLowerCase()
    return sequences.filter(
      (seq) =>
        seq.name.toLowerCase().includes(q) ||
        seq.description?.toLowerCase().includes(q) ||
        seq.category?.toLowerCase().includes(q) ||
        seq.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }, [sequences, searchQuery])

  const handleFormSubmit = async (data: SequenceFormData): Promise<void> => {
    try {
      if (editingSequence) {
        await updateSequence(editingSequence.id, data)
        toast.success('Đã cập nhật dãy lệnh')
      } else {
        await addSequence(data)
        toast.success('Đã thêm dãy lệnh mới')
      }
      setFormOpen(false)
      setEditingSequence(null)
      await loadSequences()
    } catch {
      toast.error('Lỗi khi lưu dãy lệnh')
    }
  }

  const handleRunSequence = async (sequence: CommandSequence): Promise<void> => {
    if (sequence.steps.length === 0) {
      toast.error('Dãy lệnh trống')
      return
    }
    if (activeRun) {
      toast.error('Đang có dãy lệnh khác chạy. Hãy kết thúc trên tab Terminal trước.')
      return
    }

    try {
      await startSequence(sequence)
      onNavigateToTerminal?.()
      const mode = sequence.runMode || 'first'
      if (mode === 'none') {
        toast.info(`Đã mở terminal cho "${sequence.name}". Chọn lệnh bên trái để chạy.`)
      } else if (mode === 'first') {
        toast.info(`Đã chạy lệnh đầu của "${sequence.name}"`)
      } else {
        toast.info(`Đã chạy tất cả lệnh của "${sequence.name}"`)
      }
    } catch {
      toast.error('Không thể khởi chạy dãy lệnh')
    }
  }

  const handleStopSequence = async (): Promise<void> => {
    const name = sequences.find((s) => s.id === activeRun?.sequenceId)?.name
    await stopSequence()
    toast.warning(name ? `Đã dừng dãy lệnh "${name}"` : 'Đã dừng dãy lệnh')
  }

  const handleEditSequence = (seq: CommandSequence): void => {
    setEditingSequence(seq)
    setFormOpen(true)
  }

  const handleDeleteSequence = async (id: string): Promise<void> => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dãy lệnh này không?')) {
      await deleteSequence(id)
      await loadSequences()
      toast.success('Đã xóa dãy lệnh')
    }
  }

  const toggleColumns = (): void => {
    setColumns((c) => {
      const next = c === 1 ? 2 : 1
      localStorage.setItem(COLUMNS_KEY, String(next))
      return next
    })
  }

  return (
    <div className="flex flex-col h-full px-[50px]">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        <div className="p-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingSequence(null)
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
              placeholder="Tìm kiếm dãy lệnh..."
              className="pl-8 h-8 text-xs bg-zinc-800/50 border-zinc-700/50"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shrink-0 ${
              columns === 2
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={toggleColumns}
            title={columns === 2 ? 'Hiển thị 1 cột' : 'Hiển thị 2 cột'}
          >
            {columns === 2 ? <Columns2 size={14} /> : <Rows3 size={14} />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-1">
          {filteredSequences.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-xs">
              <List size={28} className="mx-auto mb-2 opacity-30" />
              {searchQuery ? 'Không tìm thấy dãy lệnh nào' : 'Chưa có dãy lệnh nào'}
            </div>
          ) : (
            <div
              className={
                columns === 2 ? `${twoColumnListClass} pb-2` : 'space-y-0.5 pb-2'
              }
            >
              {filteredSequences.map((seq) => {
                const isRunning = activeRun?.sequenceId === seq.id
                const mode = seq.runMode || 'first'
                return (
                  <div
                    key={seq.id}
                    className={`group px-3 py-2 rounded-lg transition-all duration-150 border ${
                      isRunning
                        ? 'bg-emerald-500/15 border-emerald-500/40'
                        : 'border-transparent hover:bg-zinc-800/60 hover:border-zinc-700/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ListOrdered size={12} className="shrink-0 text-violet-400" />
                          <span className="text-sm font-medium text-zinc-200 truncate">
                            {seq.name}
                          </span>
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-sm bg-zinc-800 text-zinc-400">
                            {runModeLabel[mode]}
                          </span>
                          {isRunning && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-sm font-medium bg-emerald-500/20 text-emerald-400">
                              Đang chạy
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-1">
                          {seq.steps.length} lệnh
                          {seq.shell ? ` · ${seq.shell}` : ''}
                          {seq.description ? ` · ${seq.description}` : ''}
                        </p>
                        {(seq.tags || []).length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {(seq.tags || []).slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0 h-4 inline-flex items-center bg-zinc-800 text-zinc-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
                          isRunning ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isRunning ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Dừng dãy lệnh"
                            onClick={handleStopSequence}
                          >
                            <Square size={15} fill="currentColor" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            title="Chạy"
                            onClick={() => handleRunSequence(seq)}
                            disabled={!!activeRun}
                          >
                            <Play size={15} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
                          title="Sửa"
                          onClick={() => handleEditSequence(seq)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-red-400"
                          title="Xóa"
                          onClick={() => handleDeleteSequence(seq.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <SequenceForm
        open={formOpen}
        onOpenChange={(open: boolean) => {
          setFormOpen(open)
          if (!open) setEditingSequence(null)
        }}
        onSubmit={handleFormSubmit}
        initialData={editingSequence}
      />
    </div>
  )
}
