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
  ListOrdered,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/stores/confirm-store'
import type { CommandSequence, SequenceRunMode } from '@shared/types'
import { useSequenceStore } from '@/stores/sequence-store'
import { SequenceForm, type SequenceFormData } from './SequenceForm'
import { twoColumnListClass } from '@/lib/utils'
import { useCommandRunner } from '@/components/providers/CommandRunnerProvider'
import { useSettingsStore } from '@/stores/settings-store'
import { useTranslation } from '@/stores/i18n-store'

const LAYOUT_WIDTH_KEY = 'clim-sequences-layout-width'

const runModeLabel: Record<SequenceRunMode, string> = {
  none: 'Manual',
  first: 'Run First',
  all: 'Run All'
}

interface SequenceManagerProps {
  onNavigateToTerminal?: () => void
}

export function SequenceManager({
  onNavigateToTerminal
}: SequenceManagerProps): React.JSX.Element {
  const { settings, updateSettings } = useSettingsStore()
  const { t, language } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [editingSequence, setEditingSequence] = useState<CommandSequence | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const columns = settings.sequenceColumns || 2
  const [layoutWidth, setLayoutWidth] = useState<'centered' | 'full'>(() => {
    const saved = localStorage.getItem(LAYOUT_WIDTH_KEY)
    return saved === 'full' ? 'full' : 'centered'
  })

  const toggleLayoutWidth = () => {
    const next = layoutWidth === 'centered' ? 'full' : 'centered'
    setLayoutWidth(next)
    localStorage.setItem(LAYOUT_WIDTH_KEY, next)
  }

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
        toast.success(language === 'en' ? 'Sequence updated' : 'Đã cập nhật dãy lệnh')
      } else {
        await addSequence(data)
        toast.success(language === 'en' ? 'New sequence added' : 'Đã thêm dãy lệnh mới')
      }
      setFormOpen(false)
      setEditingSequence(null)
      await loadSequences()
    } catch {
      toast.error(language === 'en' ? 'Failed to save sequence' : 'Lỗi khi lưu dãy lệnh')
    }
  }

  const { runSequence } = useCommandRunner()

  const handleRunSequence = async (sequence: CommandSequence): Promise<void> => {
    await runSequence(sequence, onNavigateToTerminal)
  }

  const handleStopSequence = async (): Promise<void> => {
    const name = sequences.find((s) => s.id === activeRun?.sequenceId)?.name
    await stopSequence()
    toast.warning(name ? (language === 'en' ? `Stopped sequence "${name}"` : `Đã dừng quy trình "${name}"`) : (language === 'en' ? 'Stopped sequence' : 'Đã dừng quy trình'))
  }

  const handleEditSequence = (seq: CommandSequence): void => {
    setEditingSequence(seq)
    setFormOpen(true)
  }

  const handleDeleteSequence = async (id: string): Promise<void> => {
    const seq = sequences.find((s) => s.id === id)
    const confirmed = await confirmAction({
      title: language === 'en' ? 'Confirm delete sequence' : 'Xác nhận xóa quy trình',
      description: seq?.name
        ? (language === 'en' ? `Are you sure you want to delete sequence "${seq.name}" (${seq.steps.length} steps)? This action cannot be undone.` : `Bạn có chắc chắn muốn xóa quy trình "${seq.name}" (${seq.steps.length} bước) không? Thao tác này không thể hoàn tác.`)
        : (language === 'en' ? 'Are you sure you want to delete this sequence?' : 'Bạn có chắc chắn muốn xóa quy trình này không?'),
      confirmText: language === 'en' ? 'Delete sequence' : 'Xóa quy trình',
      cancelText: t('common.cancel'),
      variant: 'destructive'
    })
    if (confirmed) {
      await deleteSequence(id)
      await loadSequences()
      toast.success(language === 'en' ? 'Sequence deleted successfully' : 'Đã xóa quy trình thành công')
    }
  }

  const toggleColumns = (): void => {
    updateSettings({ sequenceColumns: columns === 1 ? 2 : 1 })
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 overflow-hidden">
      <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/50 border-b border-zinc-800/60 flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingSequence(null)
            setFormOpen(true)
          }}
          className="h-9 shrink-0 text-sm font-semibold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 px-3.5 gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus size={15} />
          {t('sequences.addSequence')}
        </Button>

        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('sequences.searchPlaceholder')}
            className="pl-9 h-9 text-sm bg-zinc-900/60 border-zinc-700/60 text-zinc-200 placeholder:text-zinc-500"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 shrink-0 ${
            columns === 2
              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          onClick={toggleColumns}
          title={columns === 2 ? t('common.oneColumn') : t('common.twoColumns')}
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
          title={layoutWidth === 'centered' ? t('common.fullWidth') : t('common.webWidth')}
        >
          {layoutWidth === 'centered' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className={layoutWidth === 'centered' ? 'max-w-4xl mx-auto px-4 py-4 pb-12' : 'px-4 sm:px-6 py-4 pb-12'}>
          {filteredSequences.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              <List size={32} className="mx-auto mb-2.5 opacity-40 text-zinc-400" />
              {searchQuery ? 'Không tìm thấy quy trình nào phù hợp' : 'Chưa có quy trình nào được tạo'}
            </div>
          ) : (
            <div
              className={
                columns === 2 ? `${twoColumnListClass} pb-4` : 'space-y-2 pb-4'
              }
            >
              {filteredSequences.map((seq) => {
                const isRunning = activeRun?.sequenceId === seq.id
                const mode = seq.runMode || 'first'
                return (
                  <div
                    key={seq.id}
                    className={`group p-3.5 rounded-xl transition-all duration-150 border cursor-pointer ${
                      isRunning
                        ? 'bg-gradient-to-r from-emerald-950/40 to-zinc-900/90 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-900/90 hover:border-zinc-700/80 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ListOrdered size={15} className="shrink-0 text-violet-400" />
                          <span className="text-sm sm:text-base font-bold text-zinc-100 truncate">
                            {seq.name}
                          </span>
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-medium">
                            {runModeLabel[mode]}
                          </span>
                          {isRunning && (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-md font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {language === 'en' ? 'Running' : 'Đang chạy'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400 truncate mt-1.5 leading-relaxed">
                          <strong className="text-zinc-300 font-mono">
                            {seq.steps.length} {language === 'en' ? (seq.steps.length === 1 ? 'command' : 'commands') : 'lệnh'}
                          </strong>
                          {seq.shell ? ` · Shell: ${seq.shell}` : ''}
                          {seq.description ? ` · ${seq.description}` : ''}
                        </p>
                        {(seq.tags || []).length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {(seq.tags || []).slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 h-5 inline-flex items-center bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded-md font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex items-center gap-1 shrink-0 transition-opacity ${
                          isRunning ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isRunning ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white font-semibold border border-rose-500/40 hover:border-rose-400 shadow-sm hover:shadow-[0_0_12px_rgba(244,63,94,0.35)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 group/stop"
                            title={language === 'en' ? 'Stop sequence' : 'Dừng dãy lệnh'}
                            onClick={handleStopSequence}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
                            <Square size={10} className="fill-current" />
                            <span>{language === 'en' ? 'Stop' : 'Dừng'}</span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-zinc-950 font-semibold border border-emerald-500/35 hover:border-emerald-400 shadow-sm hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 group/run"
                            title={language === 'en' ? 'Run sequence' : 'Chạy dãy lệnh'}
                            onClick={() => handleRunSequence(seq)}
                            disabled={!!activeRun}
                          >
                            <Play size={11} className="fill-current group-hover/run:scale-110 transition-transform" />
                            <span>{language === 'en' ? 'Run' : 'Chạy'}</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                          title={language === 'en' ? 'Edit' : 'Sửa'}
                          onClick={() => handleEditSequence(seq)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                          title={language === 'en' ? 'Delete' : 'Xóa'}
                          onClick={() => handleDeleteSequence(seq.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

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
