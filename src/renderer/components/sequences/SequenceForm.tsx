import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Save, Trash2, ArrowUp, ArrowDown, Terminal } from 'lucide-react'
import { toast } from 'sonner'
import type { CommandSequence, SequenceStep, SequenceRunMode } from '@shared/types'
import { v4 as uuidv4 } from 'uuid'

export interface SequenceFormData {
  name: string
  description: string
  category: string
  steps: SequenceStep[]
  workingDirectory?: string
  shell?: 'powershell' | 'cmd' | 'wsl'
  tags: string[]
  runMode: SequenceRunMode
}

interface SequenceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SequenceFormData) => void
  initialData?: CommandSequence | null
}

const newStep = (): SequenceStep => ({ id: uuidv4(), name: '', command: '' })

export function SequenceForm({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: SequenceFormProps): React.JSX.Element {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [category, setCategory] = useState(initialData?.category || 'General')
  const [steps, setSteps] = useState<SequenceStep[]>([])
  const [workingDirectory, setWorkingDirectory] = useState(initialData?.workingDirectory || '')
  const [shell, setShell] = useState<'powershell' | 'cmd' | 'wsl'>(initialData?.shell || 'powershell')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [runMode, setRunMode] = useState<SequenceRunMode>(initialData?.runMode || 'first')

  useEffect(() => {
    if (open) {
      setName(initialData?.name || '')
      setDescription(initialData?.description || '')
      setCategory(initialData?.category || 'General')
      setSteps(
        initialData && initialData.steps.length > 0
          ? initialData.steps
          : [newStep()]
      )
      setWorkingDirectory(initialData?.workingDirectory || '')
      setShell(initialData?.shell || 'powershell')
      setTags(initialData?.tags || [])
      setTagInput('')
      setRunMode(initialData?.runMode || 'first')
    }
  }, [open, initialData])

  const handleAddTag = (): void => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string): void => {
    setTags(tags.filter((t) => t !== tag))
  }

  const addStep = (): void => {
    setSteps([...steps, newStep()])
  }

  const removeStep = (id: string): void => {
    setSteps(steps.filter((s) => s.id !== id))
  }

  const updateStep = (id: string, patch: Partial<SequenceStep>): void => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const moveStep = (index: number, dir: -1 | 1): void => {
    const target = index + dir
    if (target < 0 || target >= steps.length) return
    const arr = [...steps]
    const [moved] = arr.splice(index, 1)
    arr.splice(target, 0, moved)
    setSteps(arr)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validSteps = steps.filter((s) => s.command.trim() !== '')
    if (!name || validSteps.length === 0) {
      toast.error('Vui lòng nhập tên và ít nhất một lệnh thực thi')
      return
    }
    onSubmit({
      name,
      description,
      category,
      steps: validSteps,
      workingDirectory,
      shell,
      tags,
      runMode
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Sửa dãy lệnh' : 'Thêm dãy lệnh mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên dãy lệnh */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Tên dãy lệnh</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Deploy to Production"
              className="bg-zinc-800/50 border-zinc-700/50"
              required
            />
          </div>

          {/* Lệnh thực thi - tự gõ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400">
                Lệnh thực thi ({steps.filter((s) => s.command.trim() !== '').length} lệnh)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                className="h-6 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Plus size={12} className="mr-1" /> Thêm lệnh
              </Button>
            </div>
            <p className="text-[11px] text-zinc-600">
              Nhập tay từng lệnh CLI. Lệnh sẽ chạy lần lượt theo thứ tự.
            </p>

            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-start gap-2 p-2 rounded-md border border-zinc-700/50 bg-zinc-800/20"
              >
                <div className="flex flex-col items-center pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStep(index, -1)}
                    disabled={index === 0}
                    className="h-5 w-5 p-0"
                  >
                    <ArrowUp size={10} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStep(index, 1)}
                    disabled={index === steps.length - 1}
                    className="h-5 w-5 p-0"
                  >
                    <ArrowDown size={10} />
                  </Button>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-zinc-500 shrink-0" />
                    <span className="text-xs text-zinc-500 w-14 shrink-0">Bước {index + 1}</span>
                    <Input
                      value={step.name || ''}
                      onChange={(e) => updateStep(step.id, { name: e.target.value })}
                      placeholder="Tên bước (tùy chọn)"
                      className="flex-1 h-7 text-xs bg-zinc-900/50 border-zinc-700/50"
                    />
                  </div>
                  <Input
                    value={step.command}
                    onChange={(e) => updateStep(step.id, { command: e.target.value })}
                    placeholder="Nhập lệnh CLI, ví dụ: npm run build"
                    className="h-8 text-xs font-mono bg-zinc-900/50 border-zinc-700/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  className="p-1 mt-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

          </div>

          {/* Cách chạy khi nhấn Play */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">
              Khi nhấn chạy dãy lệnh
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  {
                    value: 'none' as const,
                    title: 'Không chạy lệnh nào',
                    desc: 'Mở 1 terminal trống. Chọn lệnh chạy từ panel bên trái tab Terminal.'
                  },
                  {
                    value: 'first' as const,
                    title: 'Chạy lệnh đầu tiên',
                    desc: 'Chạy bước 1 trong 1 terminal. Các bước sau chạy tiếp trong cùng cửa sổ.'
                  },
                  {
                    value: 'all' as const,
                    title: 'Chạy tất cả lệnh',
                    desc: 'Mỗi lệnh mở 1 cửa sổ terminal riêng và chạy ngay.'
                  }
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                    runMode === opt.value
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-zinc-700/50 bg-zinc-800/20 hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="runMode"
                    value={opt.value}
                    checked={runMode === opt.value}
                    onChange={() => setRunMode(opt.value)}
                    className="mt-0.5 accent-emerald-500"
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-zinc-200">{opt.title}</div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Mô tả</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về dãy lệnh này..."
              className="bg-zinc-800/50 border-zinc-700/50 resize-y"
              rows={3}
            />
          </div>

          {/* Danh mục + Shell */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Danh mục</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="General"
                className="bg-zinc-800/50 border-zinc-700/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Shell</label>
              <select
                value={shell}
                onChange={(e) =>
                  setShell(e.target.value as 'powershell' | 'cmd' | 'wsl')
                }
                className="flex h-9 w-full rounded-md border border-zinc-700/50 bg-zinc-800/50 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                <option value="powershell">PowerShell</option>
                <option value="cmd">CMD</option>
                <option value="wsl">WSL</option>
              </select>
            </div>
          </div>

          {/* Thư mục làm việc */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">
              Thư mục làm việc (Working Directory)
            </label>
            <Input
              value={workingDirectory}
              onChange={(e) => setWorkingDirectory(e.target.value)}
              placeholder="C:\\Projects\\my-app"
              className="bg-zinc-800/50 border-zinc-700/50"
            />
          </div>

          {/* Thẻ tag */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Thẻ (Tags)</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Thêm thẻ..."
                className="flex-1 bg-zinc-800/50 border-zinc-700/50"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddTag}
              >
                Thêm
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400"
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              size="sm"
            >
              <Save size={14} className="mr-1" />
              {initialData ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
