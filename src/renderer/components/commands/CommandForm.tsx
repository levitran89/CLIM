import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X, Upload, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { Command } from '../../../shared/types'

interface CommandFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: Command | null
}

export function CommandForm({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: CommandFormProps): React.JSX.Element {
  const [name, setName] = useState(initialData?.name || '')
  const [command, setCommand] = useState(initialData?.command || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [category, setCategory] = useState(initialData?.category || 'General')
  const [workingDirectory, setWorkingDirectory] = useState(
    initialData?.workingDirectory || ''
  )
  const [shell, setShell] = useState<'powershell' | 'cmd' | 'wsl'>(
    initialData?.shell || 'powershell'
  )
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [activeTab, setActiveTab] = useState<'create' | 'import'>('create')

  useEffect(() => {
    if (open) {
      setName(initialData?.name || '')
      setCommand(initialData?.command || '')
      setDescription(initialData?.description || '')
      setCategory(initialData?.category || 'General')
      setWorkingDirectory(initialData?.workingDirectory || '')
      setShell(initialData?.shell || 'powershell')
      setTags(initialData?.tags || [])
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

  const handleImportScript = (): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.bat,.ps1,.txt'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const fileName = file.name
      const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()

      if (ext === '.bat' || ext === '.ps1' || ext === '.txt') {
        const filePath = (file as any).path || fileName
        const scriptName = fileName.replace(ext, '')
        const scriptShell = ext === '.bat' ? 'cmd' : 'powershell'
        
        setName(scriptName)
        // Set the path wrapped in quotes to handle spaces
        setCommand(filePath.includes(' ') ? `"${filePath}"` : filePath)
        if (ext !== '.txt') setShell(scriptShell)

        // Extract and set the working directory
        const dirIndex = filePath.lastIndexOf('\\')
        if (dirIndex > -1) {
          const dirPath = filePath.substring(0, dirIndex)
          if (dirPath && dirPath !== filePath) {
            setWorkingDirectory(dirPath)
          }
        }

        toast.success(`Đã lấy đường dẫn file "${fileName}"`)
      }
    }
    input.click()
  }

  const handleExportScript = async (): Promise<void> => {
    if (!command.trim()) {
      toast.error('Vui lòng nhập nội dung lệnh trước khi lưu!')
      return
    }
    
    const ext = shell === 'cmd' ? 'bat' : 'ps1'
    const defaultName = name ? `${name}.${ext}` : `script.${ext}`
    
    try {
      const filePath = await window.api.system.saveFile(command, defaultName)
      if (filePath) {
        // Enclose in quotes if path has spaces to ensure safe execution
        const safePath = filePath.includes(' ') ? `"${filePath}"` : filePath
        setCommand(safePath)
        toast.success(`Đã xuất ra file: ${filePath}`)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi lưu file!')
    }
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim() || !command.trim()) return

    onSubmit({
      name: name.trim(),
      command: command.trim(),
      description: description.trim() || undefined,
      category: category.trim() || 'General',
      workingDirectory: workingDirectory.trim() || undefined,
      shell,
      tags,
      color: initialData?.color,
      keybind: initialData?.keybind
    })

    onOpenChange(false)
    // Reset
    setName('')
    setCommand('')
    setDescription('')
    setCategory('General')
    setWorkingDirectory('')
    setShell('powershell')
    setTags([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-between items-center pr-6">
            <DialogTitle>
              {initialData ? 'Sửa lệnh' : 'Lệnh mới'}
            </DialogTitle>
            {!initialData && (
              <div className="flex bg-zinc-900/50 p-1 rounded-md mb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 text-xs py-1.5 px-3 rounded-sm transition-all ${
                    activeTab === 'create' 
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  Tạo thủ công
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  className={`flex-1 text-xs py-1.5 px-3 rounded-sm transition-all ${
                    activeTab === 'import' 
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  Import File
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Tên lệnh *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Start Dev Server"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">
              {activeTab === 'import' ? 'File thực thi *' : 'Lệnh thực thi *'}
            </label>
            {activeTab === 'create' || initialData ? (
              <div className="space-y-1">
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="npm run dev"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono resize-y"
                  required
                />
                <div className="text-[10.5px] text-zinc-500 bg-zinc-900/40 p-1.5 rounded border border-zinc-800/50">
                  <span className="font-semibold text-zinc-400">💡 Gợi ý cú pháp đổi port:</span><br/>
                  • Vite / React / Next: <code className="text-indigo-300">npm run dev -- --port 3000</code><br/>
                  • Node (mặc định): <code className="text-indigo-300">set PORT=3000 && npm start</code><br/>
                  • Python: <code className="text-indigo-300">python -m http.server 3000</code><br/>
                  • Omniroute: <code className="text-indigo-300">omniroute --port 3000</code>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={command}
                  readOnly
                  placeholder="C:\Đường_dẫn_tới_file.bat"
                  className="font-mono flex-1 text-amber-500/80 bg-zinc-900/50 cursor-default"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleImportScript}
                  className="shrink-0 border-zinc-700 hover:bg-zinc-800"
                >
                  <Upload size={14} className="mr-2" />
                  Chọn File
                </Button>
              </div>
            )}
            
            {activeTab === 'create' && !initialData && (
              <div className="flex justify-end mt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleExportScript}
                  className="h-6 text-[10px] text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 px-2"
                >
                  <Save size={10} className="mr-1" />
                  Lưu đoạn lệnh này thành file
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">
              Mô tả
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chạy Vite development server"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">
                Danh mục
              </label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Chung"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Shell</label>
              <select
                value={shell}
                onChange={(e) =>
                  setShell(e.target.value as 'powershell' | 'cmd' | 'wsl')
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="powershell">PowerShell</option>
                <option value="cmd">CMD</option>
                <option value="wsl">WSL</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">
              Thư mục làm việc (Working Directory)
            </label>
            <Input
              value={workingDirectory}
              onChange={(e) => setWorkingDirectory(e.target.value)}
              placeholder="C:\Projects\my-app"
            />
          </div>

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
                className="flex-1"
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
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {initialData ? 'Lưu thay đổi' : 'Thêm lệnh'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
