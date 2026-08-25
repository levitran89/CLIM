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
import {
  X,
  Upload,
  Save,
  Terminal,
  Code2,
  FileUp,
  FileCode2,
  UploadCloud,
  FolderOpen,
  Eye,
  Copy,
  Check
} from 'lucide-react'
import { getDirFromPath } from '@/lib/path-utils'
import { toast } from 'sonner'
import type { Command, ShellType } from '@shared/types'
import { useTranslation } from '@/stores/i18n-store'

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
  const { t, language } = useTranslation()
  const [name, setName] = useState(initialData?.name || '')
  const [command, setCommand] = useState(initialData?.command || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [category, setCategory] = useState(initialData?.category || 'General')
  const [workingDirectory, setWorkingDirectory] = useState(
    initialData?.workingDirectory || ''
  )
  const [shell, setShell] = useState<ShellType>(
    initialData?.shell || 'powershell'
  )
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [activeTab, setActiveTab] = useState<'create' | 'import'>('create')

  // File Preview States
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialData?.name || '')
      setCommand(initialData?.command || '')
      setDescription(initialData?.description || '')
      setCategory(initialData?.category || 'General')
      setWorkingDirectory(initialData?.workingDirectory || '')
      setShell(initialData?.shell || 'powershell')
      setTags(initialData?.tags || [])
      setFileContent(null)
      setIsPreviewOpen(false)
      setCopied(false)
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
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const fileName = file.name
      const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()

      if (ext === '.bat' || ext === '.ps1' || ext === '.txt') {
        const filePath = (file as any).path || fileName
        const scriptName = fileName.replace(ext, '')
        const scriptShell = ext === '.bat' ? 'cmd' : 'powershell'
        
        // Read file text
        try {
          const text = await file.text()
          setFileContent(text)
        } catch {
          // If file.text() fails, we will try system:readFile later
        }

        setName(scriptName)
        // Set the path wrapped in quotes to handle spaces
        setCommand(filePath.includes(' ') ? `"${filePath}"` : filePath)
        if (ext !== '.txt') setShell(scriptShell)

        // Extract and set the working directory
        const dirPath = getDirFromPath(filePath)
        if (dirPath && dirPath !== filePath) {
          setWorkingDirectory(dirPath)
        }

        toast.success(`Đã lấy đường dẫn file "${fileName}"`)
      }
    }
    input.click()
  }

  const handleViewFileContent = async (): Promise<void> => {
    if (!command.trim()) {
      toast.error('Chưa có file script nào được chọn!')
      return
    }

    if (fileContent !== null) {
      setIsPreviewOpen(true)
      return
    }

    // Try reading via system API
    try {
      const content = await window.api.system.readFile(command)
      if (content !== null) {
        setFileContent(content)
        setIsPreviewOpen(true)
      } else {
        toast.error('Không thể đọc nội dung file từ đường dẫn này!')
      }
    } catch {
      toast.error('Lỗi khi đọc file script!')
    }
  }

  const handleCopyContent = (): void => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent)
      setCopied(true)
      toast.success('Đã copy nội dung file vào clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
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
      <DialogContent className="w-[92vw] max-w-2xl bg-zinc-900 border border-zinc-700/90 text-zinc-100 p-6 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-zinc-600/50">
        {/* Header với Icon Badge nổi bật & Bộ chuyển Tab không giật kích thước */}
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <Terminal size={22} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  {initialData
                    ? (language === 'en' ? 'Edit Command' : 'Chỉnh sửa Câu lệnh')
                    : (language === 'en' ? 'Create New Command' : 'Tạo Câu lệnh Mới')}
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {initialData
                    ? (language === 'en' ? 'Update CLI script, working directory and variable parameters' : 'Cập nhật lệnh CLI, thư mục làm việc và tham số biến')
                    : (language === 'en' ? 'Add new command to library for quick 1-click execution' : 'Thêm lệnh mới vào thư viện để chạy nhanh với 1 click')}
                </p>
              </div>
            </div>

            {!initialData && (
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'create' 
                      ? 'bg-zinc-800 text-emerald-300 shadow-sm border border-zinc-700/60' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code2 size={14} />
                  <span>{language === 'en' ? 'Manual Setup' : 'Tạo thủ công'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'import' 
                      ? 'bg-zinc-800 text-emerald-300 shadow-sm border border-zinc-700/60' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FileUp size={14} />
                  <span>{language === 'en' ? 'Import File' : 'Import File'}</span>
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tên câu lệnh */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-200">
              {language === 'en' ? 'Command Title *' : 'Tên câu lệnh *'}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'en' ? 'e.g. Start Dev Server, Build App, Docker Compose Up' : 'VD: Start Dev Server, Build App, Docker Compose Up'}
              className="h-9 text-sm bg-zinc-950 border-zinc-800 text-zinc-100"
              required
            />
          </div>

          {/* Vùng Lệnh Thực Thi / Import File: Cố định chiều cao đồng nhất ~190px giúp không nhảy kích thước */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-200">
                {activeTab === 'import'
                  ? (language === 'en' ? 'Script executable file (.bat, .ps1, .txt) *' : 'File script thực thi (.bat, .ps1, .txt) *')
                  : (language === 'en' ? 'CLI Script *' : 'Lệnh thực thi (CLI) *')}
              </label>
              {activeTab === 'create' && !initialData && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleExportScript}
                  className="h-6 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 px-2 gap-1 cursor-pointer"
                  title={language === 'en' ? 'Export this command script to a file on your system' : 'Xuất nội dung lệnh này ra file script trên máy'}
                >
                  <Save size={12} />
                  {language === 'en' ? 'Save as script file' : 'Lưu thành file script'}
                </Button>
              )}
            </div>

            {/* Khung nội dung đồng nhất chiều cao 190px */}
            <div className="min-h-[190px]">
              {activeTab === 'create' || initialData ? (
                <div className="space-y-2 h-[190px] flex flex-col justify-between">
                  <textarea
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="npm run dev -- --port ${PORT}"
                    className="flex-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:border-emerald-500 font-mono resize-none text-zinc-100"
                    required
                  />
                  <div className="text-xs text-zinc-400 bg-zinc-950/90 p-2.5 rounded-xl border border-zinc-800/80 leading-relaxed shrink-0">
                    <span className="font-semibold text-emerald-400">
                      {language === 'en' ? '💡 Syntax tip:' : '💡 Gợi ý cú pháp:'}
                    </span>{' '}
                    {language === 'en'
                      ? <>Use <code className="text-emerald-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">${'{PORT}'}</code>, <code className="text-emerald-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">${'{NAME}'}</code> for interactive prompt variables.</>
                      : <>Dùng <code className="text-emerald-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">${'{PORT}'}</code>, <code className="text-emerald-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">${'{NAME}'}</code> để tạo biến hỏi lại khi chạy.</>}
                  </div>
                </div>
              ) : (
                <div
                  className="h-[190px] rounded-xl border-2 border-dashed border-zinc-700/80 bg-zinc-950/60 p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all"
                >
                  {command ? (
                    <div className="space-y-3 max-w-full px-2 w-full flex flex-col items-center">
                      <div className="flex items-center gap-2 max-w-full">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileCode2 size={18} />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-emerald-300 truncate max-w-md font-mono bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800">
                          {command}
                        </p>
                      </div>

                      {/* Action buttons: Xem nội dung & Đổi file khác */}
                      <div className="flex items-center justify-center gap-2.5 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleViewFileContent}
                          className="h-8 px-3 text-xs font-semibold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40 gap-1.5 cursor-pointer shadow-sm"
                          title={language === 'en' ? 'Preview script file code content' : 'Xem trước nội dung code trong file script này'}
                        >
                          <Eye size={14} />
                          <span>{language === 'en' ? 'View file content' : 'Xem nội dung file'}</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleImportScript}
                          className="h-8 px-3 text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700 gap-1.5 cursor-pointer"
                        >
                          <FolderOpen size={14} />
                          <span>{language === 'en' ? 'Change file' : 'Đổi file khác'}</span>
                        </Button>
                      </div>

                      <p className="text-[11px] text-zinc-400">
                        {language === 'en'
                          ? 'Script path and working directory have been linked automatically.'
                          : 'Đường dẫn script và thư mục làm việc đã được tự động liên kết.'}
                      </p>
                    </div>
                  ) : (
                    <div
                      onClick={handleImportScript}
                      className="space-y-2 w-full h-full flex flex-col items-center justify-center cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-900 group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400 border border-zinc-800 group-hover:border-emerald-500/40 flex items-center justify-center mx-auto transition-all">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors">
                          {language === 'en'
                            ? 'Click to select script file from computer (.bat, .ps1, .txt)'
                            : 'Nhấn để chọn file script từ máy tính (.bat, .ps1, .txt)'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {language === 'en'
                            ? 'File path will automatically be assigned as CLI script and its parent directory as Working Directory.'
                            : 'Đường dẫn file sẽ tự động được gán làm câu lệnh thực thi và thư mục cha làm Working Directory.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-200">
              {language === 'en' ? 'Detailed Description' : 'Mô tả chi tiết'}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'en' ? 'Run Vite development server with hot-reload' : 'Chạy Vite development server với hot-reload'}
              className="h-9 text-sm bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>

          {/* Danh mục + Shell */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-200">
                {language === 'en' ? 'Category' : 'Danh mục phân loại'}
              </label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="General, Frontend, Backend, Docker..."
                className="h-9 text-sm bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-200">
                {language === 'en' ? 'Execution Shell' : 'Shell thực thi'}
              </label>
              <select
                value={shell}
                onChange={(e) =>
                  setShell(e.target.value as ShellType)
                }
                className="flex h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-200 shadow-sm focus-visible:outline-none focus-visible:border-emerald-500 cursor-pointer"
              >
                <option value="ubuntu">Ubuntu Linux (WSL -d Ubuntu)</option>
                <option value="wsl">WSL Linux (wsl.exe)</option>
                <option value="gitbash">Git Bash (bash.exe)</option>
                <option value="powershell">PowerShell (powershell.exe)</option>
                <option value="pwsh">PowerShell 7 (pwsh.exe)</option>
                <option value="cmd">Command Prompt (cmd.exe)</option>
              </select>
            </div>
          </div>

          {/* Thư mục làm việc */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-200">
              {language === 'en' ? 'Working Directory' : 'Thư mục làm việc (Working Directory)'}
            </label>
            <Input
              value={workingDirectory}
              onChange={(e) => setWorkingDirectory(e.target.value)}
              placeholder={language === 'en' ? 'C:\\Workspace\\my-app (Leave empty to use project root)' : 'C:\\Workspace\\my-app (Để trống nếu dùng mặc định)'}
              className="h-9 text-sm bg-zinc-950 border-zinc-800 text-zinc-100 font-mono"
            />
          </div>

          {/* Thẻ tag */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-200">
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
                placeholder={language === 'en' ? 'Enter tag name and click Add...' : 'Nhập tên tag rồi bấm Thêm...'}
                className="flex-1 h-9 text-sm bg-zinc-950 border-zinc-800 text-zinc-100"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddTag}
                className="h-9 px-4 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
              >
                {language === 'en' ? 'Add' : 'Thêm'}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1.5 text-xs px-2.5 py-1 bg-zinc-800 text-zinc-200 border-zinc-700">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="pt-3 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="h-9 px-5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer"
            >
              {initialData
                ? (language === 'en' ? 'Save Changes' : 'Lưu thay đổi')
                : (language === 'en' ? 'Add Command' : 'Thêm lệnh')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Modal Xem trước Nội dung File Script */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-[92vw] max-w-3xl bg-zinc-900 border border-zinc-700/90 text-zinc-100 p-6 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-zinc-600/50">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileCode2 size={20} />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-zinc-100">
                    {language === 'en' ? 'Script file content' : 'Nội dung file script'}
                  </DialogTitle>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate max-w-lg">
                    {command}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
                className="h-8 px-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 gap-1.5 cursor-pointer shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? (language === 'en' ? 'Copied' : 'Đã sao chép') : (language === 'en' ? 'Copy' : 'Sao chép')}</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 max-h-[450px] overflow-y-auto font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre select-text">
            {fileContent ? fileContent : (language === 'en' ? '(File is empty or has no content)' : '(File rỗng hoặc không có nội dung)')}
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-800/80">
            <Button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="h-9 px-5 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}


