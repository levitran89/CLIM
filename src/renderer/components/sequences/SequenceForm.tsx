import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Plus,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  Terminal,
  ListOrdered,
  Layers,
  Settings2,
  PlayCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { useTranslation } from '@/stores/i18n-store'
import type { CommandSequence, SequenceStep, SequenceRunMode, ShellType } from '@shared/types'

export interface SequenceFormData {
  name: string
  description: string
  category: string
  steps: SequenceStep[]
  workingDirectory?: string
  shell?: ShellType
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
  const { t, language } = useTranslation()
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [category, setCategory] = useState(initialData?.category || 'General')
  const [steps, setSteps] = useState<SequenceStep[]>([])
  const [workingDirectory, setWorkingDirectory] = useState(initialData?.workingDirectory || '')
  const [shell, setShell] = useState<ShellType>(initialData?.shell || 'powershell')
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
    if (!name.trim() || validSteps.length === 0) {
      toast.error(language === 'en' ? 'Please enter a sequence title and at least one execution step' : 'Vui lòng nhập tên quy trình và ít nhất một câu lệnh thực thi')
      return
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || '',
      category: category.trim() || 'General',
      steps: validSteps,
      workingDirectory: workingDirectory.trim() || undefined,
      shell,
      tags,
      runMode
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[88vh] max-h-[760px] bg-zinc-900 border border-zinc-700/90 text-zinc-100 p-6 rounded-2xl shadow-[0_0_70px_rgba(0,0,0,0.9),0_0_35px_rgba(139,92,246,0.18)] ring-1 ring-zinc-600/50 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="shrink-0 mb-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
              <ListOrdered size={20} />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                {initialData
                  ? (language === 'en' ? 'Edit Sequence' : 'Chỉnh sửa Quy trình')
                  : (language === 'en' ? 'Create New Sequence (Pipeline)' : 'Tạo Quy trình Mới (Pipeline)')}
              </DialogTitle>
              <p className="text-xs text-zinc-400 mt-0.5">
                {initialData
                  ? (language === 'en' ? 'Manage sequential or parallel command execution steps' : 'Quản lý danh sách câu lệnh thực thi tuần tự hoặc song song trong quy trình')
                  : (language === 'en' ? 'Group multiple CLI commands into an automated multi-step pipeline' : 'Gom nhiều câu lệnh CLI thành một quy trình tự động hóa nhiều bước')}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body: 2 Columns */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-0">
            {/* CỘT TRÁI (58%): Danh sách các bước */}
            <div className="lg:col-span-7 flex flex-col h-full min-h-0 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 p-3.5 shadow-inner overflow-hidden">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-emerald-400" />
                  <span className="text-sm font-bold text-zinc-200">
                    {language === 'en' ? 'Execution Steps' : 'Quy trình các bước'}
                  </span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-zinc-800 text-emerald-400 font-mono font-bold">
                    {steps.length} {language === 'en' ? (steps.length > 1 ? 'steps' : 'step') : 'bước'}
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addStep}
                  className="h-7 px-3 text-xs font-semibold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40 gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={13} /> {language === 'en' ? 'Add New Step' : 'Thêm bước mới'}
                </Button>
              </div>

              {/* Danh sách cuộn các bước */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-800/90 bg-zinc-900/90 hover:border-zinc-700 transition-all shadow-sm group"
                  >
                    {/* Nút điều hướng thứ tự bước */}
                    <div className="flex flex-col items-center pt-0.5 gap-0.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100 disabled:opacity-20 cursor-pointer"
                        title={language === 'en' ? 'Move Up' : 'Di chuyển lên trên'}
                      >
                        <ArrowUp size={13} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(index, 1)}
                        disabled={index === steps.length - 1}
                        className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100 disabled:opacity-20 cursor-pointer"
                        title={language === 'en' ? 'Move Down' : 'Di chuyển xuống dưới'}
                      >
                        <ArrowDown size={13} />
                      </Button>
                    </div>

                    {/* Nội dung Bước */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-emerald-400 border border-zinc-700/60 shrink-0">
                          {language === 'en' ? `STEP ${index + 1}` : `BƯỚC ${index + 1}`}
                        </span>
                        <Input
                          value={step.name || ''}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          placeholder={language === 'en' ? 'Step title (e.g. Sync git, Build frontend...)' : 'Tên bước (Ví dụ: Đồng bộ git, Build frontend...)'}
                          className="flex-1 h-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-200"
                        />
                        {/* Ô nhập số giây chờ tự động */}
                        <div
                          className="flex items-center gap-1 shrink-0 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-md px-1.5 h-7 transition-colors"
                          title={language === 'en' ? 'Auto-run delay in seconds before next step (0 = immediate/manual)' : 'Số giây chờ tự động trước khi chạy bước tiếp theo (0 = chạy thủ công/ngay lập tức)'}
                        >
                          <Clock size={11} className="text-zinc-500" />
                          <input
                            type="number"
                            min={0}
                            max={3600}
                            value={step.delaySeconds !== undefined ? step.delaySeconds : ''}
                            onChange={(e) =>
                              updateStep(step.id, {
                                delaySeconds: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0)
                              })
                            }
                            placeholder="0"
                            className="w-7 bg-transparent text-xs text-amber-400 font-mono text-center focus:outline-none"
                          />
                          <span className="text-[10px] text-zinc-500 font-mono">s</span>
                        </div>
                      </div>
                      <Input
                        value={step.command}
                        onChange={(e) => updateStep(step.id, { command: e.target.value })}
                        placeholder={language === 'en' ? 'CLI execution script: git pull origin main, npm run build...' : 'Câu lệnh CLI thực thi: git pull origin master, npm run build...'}
                        className="h-8 text-xs sm:text-sm font-mono bg-zinc-950 border-zinc-800 text-emerald-300 font-medium placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Xóa bước */}
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer shrink-0 mt-0.5"
                      title={language === 'en' ? 'Delete this step' : 'Xóa bước này'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {steps.length === 0 && (
                  <div className="text-center py-16 text-zinc-500 text-sm">
                    <p>{language === 'en' ? 'No steps in sequence yet.' : 'Chưa có bước nào trong quy trình.'}</p>
                    <Button
                      type="button"
                      onClick={addStep}
                      className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                    >
                      <Plus size={14} className="mr-1" /> {language === 'en' ? 'Add First Step' : 'Thêm bước đầu tiên'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI (42%): Cấu hình Quy Trình */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full min-h-0 space-y-3">
              <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-0.5">
                {/* Tên quy trình */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-200">
                    {language === 'en' ? 'Sequence Title *' : 'Tên quy trình *'}
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Production Deploy Pipeline' : 'Ví dụ: Quy trình Deploy Production'}
                    className="bg-zinc-950 border-zinc-800 text-xs sm:text-sm h-8 text-zinc-100"
                    required
                  />
                </div>

                {/* Chế độ chạy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-200">
                    {language === 'en' ? 'Execution Mode' : 'Chế độ chạy quy trình'}
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {(
                      [
                        {
                          value: 'none' as const,
                          title: language === 'en' ? 'Manual Execution' : 'Không tự động chạy',
                          desc: language === 'en' ? 'Open single blank terminal. Run each step manually.' : 'Mở 1 terminal trống. Tự chọn chạy từng lệnh.'
                        },
                        {
                          value: 'first' as const,
                          title: language === 'en' ? 'Sequential Execution' : 'Chạy tuần tự (Lệnh đầu tiên trước)',
                          desc: language === 'en' ? 'Start from step 1, subsequent steps follow in 1 terminal window.' : 'Bắt đầu từ bước 1, các bước sau nối tiếp trong 1 cửa sổ.'
                        },
                        {
                          value: 'all' as const,
                          title: language === 'en' ? 'Parallel Execution' : 'Chạy đồng thời tất cả các lệnh',
                          desc: language === 'en' ? 'Launch separate parallel terminal tabs for each step.' : 'Mở song song các terminal riêng biệt cho từng lệnh.'
                        }
                      ] as const
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                          runMode === opt.value
                            ? 'border-emerald-500/60 bg-emerald-500/10 shadow-sm'
                            : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="runMode"
                          value={opt.value}
                          checked={runMode === opt.value}
                          onChange={() => setRunMode(opt.value)}
                          className="mt-0.5 accent-emerald-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-zinc-200">{opt.title}</div>
                          <p className="text-[10.5px] text-zinc-400 leading-tight">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mô tả */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-200">
                    {language === 'en' ? 'Detailed Description' : 'Mô tả chi tiết'}
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === 'en' ? 'Describe the purpose of this workflow...' : 'Mô tả mục đích sử dụng quy trình...'}
                    className="bg-zinc-950 border-zinc-800 text-xs resize-none text-zinc-100 py-1.5"
                    rows={2}
                  />
                </div>

                {/* Danh mục + Shell */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-200">
                      {language === 'en' ? 'Category' : 'Danh mục'}
                    </label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="General, DevOps..."
                      className="bg-zinc-950 border-zinc-800 text-xs h-8 text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-200">
                      {language === 'en' ? 'Execution Shell' : 'Shell thực thi'}
                    </label>
                    <select
                      value={shell}
                      onChange={(e) =>
                        setShell(e.target.value as ShellType)
                      }
                      className="flex h-8 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="ubuntu">Ubuntu Linux (WSL)</option>
                      <option value="wsl">WSL Linux (Default)</option>
                      <option value="gitbash">Git Bash</option>
                      <option value="powershell">PowerShell</option>
                      <option value="pwsh">PowerShell 7</option>
                      <option value="cmd">Command Prompt (CMD)</option>
                    </select>
                  </div>
                </div>

                {/* Thư mục làm việc */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-200">
                    {language === 'en' ? 'Working Directory' : 'Thư mục làm việc (Working Directory)'}
                  </label>
                  <Input
                    value={workingDirectory}
                    onChange={(e) => setWorkingDirectory(e.target.value)}
                    placeholder={language === 'en' ? 'C:\\Workspace\\my-app (Leave empty to use project root)' : 'C:\\Workspace\\my-app (Để trống nếu dùng mặc định)'}
                    className="bg-zinc-950 border-zinc-800 text-xs h-8 text-zinc-100 font-mono"
                  />
                </div>

                {/* Thẻ tag */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-200">
                    {language === 'en' ? 'Tags' : 'Thẻ phân loại (Tags)'}
                  </label>
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
                      placeholder={language === 'en' ? 'Add tag...' : 'Thêm thẻ...'}
                      className="flex-1 bg-zinc-950 border-zinc-800 text-xs h-8 text-zinc-100"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddTag}
                      className="h-8 px-3 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                    >
                      {language === 'en' ? 'Add' : 'Thêm'}
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1 text-[11px] px-2 py-0.5 bg-zinc-800 text-zinc-200 border-zinc-700">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-400 cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <DialogFooter className="pt-3 border-t border-zinc-800/80 mt-3 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 px-4 text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="h-8 px-5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer gap-1.5"
            >
              <Save size={14} />
              {initialData
                ? (language === 'en' ? 'Save Changes' : 'Lưu thay đổi')
                : (language === 'en' ? 'Create Sequence' : 'Tạo quy trình')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

