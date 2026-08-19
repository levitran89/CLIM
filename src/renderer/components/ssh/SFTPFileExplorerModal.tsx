import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Folder,
  File,
  FileCode,
  FileText,
  ArrowUp,
  RefreshCw,
  Trash2,
  Edit2,
  Save,
  Plus,
  FolderPlus,
  Server,
  ChevronRight,
  HardDrive,
  Download,
  Upload,
  X,
  Check
} from 'lucide-react'
import { confirmAction } from '@/stores/confirm-store'
import { useTranslation } from '@/stores/i18n-store'
import { toast } from 'sonner'
import type { SFTPItem, SSHHost } from '@shared/types'

interface SFTPFileExplorerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  host: SSHHost | null
}

export function SFTPFileExplorerModal({
  open,
  onOpenChange,
  host
}: SFTPFileExplorerModalProps): React.JSX.Element {
  const { t } = useTranslation()
  const [currentPath, setCurrentPath] = useState('.')
  const [items, setItems] = useState<SFTPItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // File Editor state
  const [editingFilePath, setEditingFilePath] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editorLoading, setEditorLoading] = useState(false)
  const [savingFile, setSavingFile] = useState(false)

  // New folder state
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const fetchDirectory = async (path = currentPath) => {
    if (!host) return
    setLoading(true)
    setError(null)
    try {
      if (window.api?.sftp?.listDirectory) {
        const res = await window.api.sftp.listDirectory(host.id, path)
        if (res.success) {
          setItems(res.items)
          setCurrentPath(res.currentPath)
        } else {
          setError(res.error || 'Lỗi đọc thư mục máy chủ.')
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && host) {
      fetchDirectory('.')
    }
  }, [open, host])

  const handleOpenFolder = (item: SFTPItem) => {
    if (item.type === 'directory') {
      fetchDirectory(item.path)
    }
  }

  const handleGoUp = () => {
    if (currentPath === '/' || currentPath === '.') return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const parentPath = parts.length === 0 ? '/' : `/${parts.join('/')}`
    fetchDirectory(parentPath)
  }

  const handleOpenFileEditor = async (item: SFTPItem) => {
    if (item.type !== 'file') return
    setEditingFilePath(item.path)
    setEditorLoading(true)
    try {
      if (window.api?.sftp?.readFile) {
        const res = await window.api.sftp.readFile(host!.id, item.path)
        if (res.success) {
          setEditingContent(res.content)
        } else {
          toast.error(`Không thể đọc tệp: ${res.error || ''}`)
          setEditingFilePath(null)
        }
      }
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`)
      setEditingFilePath(null)
    } finally {
      setEditorLoading(false)
    }
  }

  const handleSaveFileContent = async () => {
    if (!editingFilePath || !host) return
    setSavingFile(true)
    try {
      if (window.api?.sftp?.writeFile) {
        const res = await window.api.sftp.writeFile(host.id, editingFilePath, editingContent)
        if (res.success) {
          toast.success('Đã lưu tệp từ xa thành công!')
        } else {
          toast.error(`Lỗi lưu tệp: ${res.error || ''}`)
        }
      }
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`)
    } finally {
      setSavingFile(false)
    }
  }

  const handleDeleteItem = async (item: SFTPItem) => {
    const ok = await confirmAction({
      title: `Xóa ${item.type === 'directory' ? 'thư mục' : 'tệp'} "${item.name}"?`,
      description: `Hành động này sẽ xóa vĩnh viễn đường dẫn "${item.path}" trên máy chủ VPS.`,
      confirmText: 'Xác Nhận Xóa',
      variant: 'destructive'
    })
    if (!ok || !host) return
    try {
      if (window.api?.sftp?.deleteItem) {
        const res = await window.api.sftp.deleteItem(host.id, item.path)
        if (res.success) {
          toast.success(`Đã xóa "${item.name}"`)
          fetchDirectory()
        } else {
          toast.error(`Lỗi xóa: ${res.error || ''}`)
        }
      }
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !host) return
    const folderPath = currentPath === '/' ? `/${newFolderName.trim()}` : `${currentPath}/${newFolderName.trim()}`
    try {
      if (window.api?.sftp?.createDirectory) {
        const res = await window.api.sftp.createDirectory(host.id, folderPath)
        if (res.success) {
          toast.success(`Đã tạo thư mục "${newFolderName.trim()}"`)
          setNewFolderModalOpen(false)
          setNewFolderName('')
          fetchDirectory()
        } else {
          toast.error(`Lỗi tạo thư mục: ${res.error || ''}`)
        }
      }
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`)
    }
  }

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const getFileIcon = (item: SFTPItem) => {
    if (item.type === 'directory') return <Folder size={16} className="text-amber-400 fill-amber-400/20" />
    if (item.name.endsWith('.js') || item.name.endsWith('.ts') || item.name.endsWith('.py') || item.name.endsWith('.json') || item.name.endsWith('.sh') || item.name.endsWith('.yml')) {
      return <FileCode size={16} className="text-emerald-400" />
    }
    return <FileText size={16} className="text-zinc-400" />
  }

  // Split path for breadcrumb
  const pathParts = currentPath.split('/').filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[94vw] h-[88vh] max-h-[920px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-800 flex flex-row items-center justify-between shrink-0 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HardDrive size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>{t('sftp.title') || 'Quản Lý Tệp Máy Chủ (SFTP)'}</span>
                {host && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-[11px]">
                    {host.name} ({host.host})
                  </Badge>
                )}
              </DialogTitle>
              <span className="text-xs text-zinc-400 font-mono">
                {items.length} {t('sftp.itemsCount') || 'tệp & thư mục'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNewFolderModalOpen(true)}
              className="h-8 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 gap-1.5 cursor-pointer"
            >
              <FolderPlus size={13} className="text-amber-400" />
              <span>{t('sftp.newFolder') || 'Thư Mục Mới'}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchDirectory()}
              disabled={loading}
              className="h-8 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 cursor-pointer"
              title="Làm mới thư mục"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-400' : ''} />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer ml-1"
              title="Đóng cửa sổ (Esc)"
            >
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        {/* Path Breadcrumb Bar */}
        <div className="px-6 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center gap-1.5 text-xs overflow-x-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGoUp}
            disabled={currentPath === '/' || currentPath === '.'}
            className="h-7 px-2 text-zinc-400 hover:text-zinc-200 cursor-pointer shrink-0"
            title="Lên thư mục cha"
          >
            <ArrowUp size={13} />
          </Button>

          <button
            onClick={() => fetchDirectory('/')}
            className="text-zinc-400 hover:text-emerald-400 font-mono font-semibold cursor-pointer px-1 py-0.5 rounded hover:bg-zinc-800"
          >
            /
          </button>

          {pathParts.map((part, index) => {
            const accumulatedPath = '/' + pathParts.slice(0, index + 1).join('/')
            return (
              <React.Fragment key={accumulatedPath}>
                <ChevronRight size={12} className="text-zinc-600 shrink-0" />
                <button
                  onClick={() => fetchDirectory(accumulatedPath)}
                  className="text-zinc-300 hover:text-emerald-400 font-mono cursor-pointer px-1 py-0.5 rounded hover:bg-zinc-800 truncate max-w-[120px]"
                >
                  {part}
                </button>
              </React.Fragment>
            )
          })}
        </div>

        {/* Content Explorer Area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-zinc-950">
          {/* Error State with Auto-Fix option for Private Key permissions */}
          {error && (
            <div className="mx-6 my-3 p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-rose-400">Lỗi kết nối SFTP:</span>
                <span className="font-mono break-all">{error}</span>
              </div>
              {error.includes('Permission') && host?.authType === 'privateKey' && (
                <div className="pt-1 flex items-center justify-between border-t border-rose-500/20">
                  <span className="text-[11px] text-zinc-400">
                    OpenSSH yêu cầu quyền hạn riêng tư nghiêm ngặt cho Private Key.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (host && window.api?.ssh?.save) {
                        toast.info('Đang tối ưu quyền hạn Private Key...')
                        await window.api.ssh.save(host)
                        toast.success('Đã cấu hình quyền hạn Key! Đang thử lại...')
                        fetchDirectory('.')
                      }
                    }}
                    className="h-7 text-xs bg-rose-900/50 border-rose-500/50 hover:bg-rose-800 text-white gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Tự động phân quyền Key & Thử lại</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs gap-2">
              <RefreshCw size={16} className="animate-spin text-emerald-400" />
              <span>Đang tải danh sách tệp từ xa...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
              <Folder size={32} className="text-zinc-700" />
              <span>{t('sftp.empty') || 'Thư mục trống'}</span>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="divide-y divide-zinc-850 text-xs">
                {items.map((item) => (
                  <div
                    key={item.path}
                    onDoubleClick={() => {
                      if (item.type === 'directory') handleOpenFolder(item)
                      else handleOpenFileEditor(item)
                    }}
                    className="flex items-center justify-between px-6 py-2.5 hover:bg-zinc-900/80 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                      {getFileIcon(item)}
                      <span className={`font-mono truncate ${item.type === 'directory' ? 'text-zinc-100 font-semibold hover:underline' : 'text-zinc-300'}`}>
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 shrink-0">
                      <span className="w-20 text-right">{item.type === 'directory' ? '<DIR>' : formatBytes(item.size)}</span>
                      <span className="w-24 text-zinc-600 hidden sm:inline">{item.permissions}</span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.type === 'file' && (
                          <button
                            onClick={() => handleOpenFileEditor(item)}
                            className="p-1 text-zinc-400 hover:text-emerald-400 rounded hover:bg-zinc-800 cursor-pointer"
                            title="Xem / Sửa tệp"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800 cursor-pointer"
                          title="Xóa tệp"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Remote File Editor Dialog */}
        <Dialog open={Boolean(editingFilePath)} onOpenChange={(open) => !open && setEditingFilePath(null)}>
          <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-100 p-0 h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <DialogHeader className="px-6 py-3.5 border-b border-zinc-800 flex flex-row items-center justify-between shrink-0 bg-zinc-900/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCode size={16} className="text-emerald-400 shrink-0" />
                <DialogTitle className="text-sm font-bold text-zinc-100 font-mono truncate">
                  {editingFilePath}
                </DialogTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={savingFile}
                  onClick={handleSaveFileContent}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold gap-1.5 cursor-pointer"
                >
                  <Save size={13} />
                  <span>{savingFile ? 'Đang lưu...' : 'Lưu Tệp (Save)'}</span>
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 p-4 bg-zinc-950 flex flex-col min-h-0">
              {editorLoading ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
                  <RefreshCw size={16} className="animate-spin text-emerald-400 mr-2" />
                  Đang tải nội dung tệp...
                </div>
              ) : (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="flex-1 w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
                  spellCheck={false}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* New Folder Modal */}
        <Dialog open={newFolderModalOpen} onOpenChange={setNewFolderModalOpen}>
          <DialogContent className="max-w-sm bg-zinc-950 border-zinc-800 text-zinc-100 p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <FolderPlus size={16} className="text-amber-400" />
                Tạo Thư Mục Mới
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Tên thư mục:</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="VD: logs hoặc public_html"
                className="bg-zinc-900 border-zinc-800 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewFolderModalOpen(false)}
                className="h-8 text-xs border-zinc-700 bg-zinc-900"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleCreateFolder}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold"
              >
                Tạo Thư Mục
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
