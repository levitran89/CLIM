import React, { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAIStore, type AISuggestion } from '@/stores/ai-store'
import { useCommandStore } from '@/stores/command-store'
import { useProfileStore } from '@/stores/profile-store'
import { requestAIGenerateCommand } from '@/services/ai-service'
import {
  Sparkles,
  Terminal,
  Play,
  Copy,
  BookmarkPlus,
  AlertTriangle,
  Send,
  Loader2,
  History,
  Trash2,
  Check,
  Settings,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import type { Command } from '@shared/types'

interface AICopilotModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRunCommand: (command: Command) => void
  onOpenSettings?: () => void
}

const QUICK_PROMPTS = [
  'Dọn dẹp toàn bộ Docker container và images không dùng',
  'Tìm tất cả file .log lớn hơn 50MB và nén lại thành zip',
  'Kiểm tra và kill tiến trình đang chiếm port 8080',
  'Tạo nhánh git mới feature/login và đẩy lên remote',
  'Tạo virtualenv Python và cài đặt requirements.txt'
]

export function AICopilotModal({
  open,
  onOpenChange,
  onRunCommand,
  onOpenSettings
}: AICopilotModalProps): React.JSX.Element {
  const [prompt, setPrompt] = useState('')
  const [shell, setShell] = useState<'powershell' | 'cmd' | 'wsl'>('powershell')
  const [isLoading, setIsLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<AISuggestion | null>(null)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const { config, history, addSuggestion, removeSuggestion, clearHistory } = useAIStore()
  const { addCommand } = useCommandStore()
  const activeProfile = useProfileStore((s) => s.getActiveProfile())

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80)
      setCopied(false)
    }
  }, [open])

  const handleGenerate = async (queryText?: string): Promise<void> => {
    const textToRun = (queryText || prompt).trim()
    if (!textToRun) {
      toast.warning('Vui lòng nhập nội dung yêu cầu.')
      return
    }

    if (config.provider !== 'ollama' && !config.apiKey) {
      toast.error(`Chưa cấu hình API Key cho ${config.provider.toUpperCase()}.`, {
        description: 'Vui lòng vào Cài đặt để thêm API Key.'
      })
      onOpenSettings?.()
      return
    }

    setIsLoading(true)
    try {
      const res = await requestAIGenerateCommand(
        textToRun,
        shell,
        config,
        undefined,
        activeProfile?.name
      )

      const saved = addSuggestion({
        prompt: textToRun,
        command: res.command,
        explanation: res.explanation,
        shell,
        isDangerous: res.isDangerous
      })

      setCurrentResult(saved)
      setPrompt('')
    } catch (err: any) {
      toast.error('Không thể tạo câu lệnh', {
        description: err.message || 'Vui lòng kiểm tra lại kết nối và API Key.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string): void => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Đã sao chép câu lệnh vào clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveToCommands = (item: AISuggestion): void => {
    addCommand({
      name: item.prompt.length > 35 ? item.prompt.slice(0, 35) + '...' : item.prompt,
      command: item.command,
      category: 'AI Generated',
      shell: item.shell,
      description: item.explanation,
      tags: ['ai', 'copilot', item.shell]
    })
    toast.success('Đã lưu câu lệnh vào Danh mục Lệnh!')
  }

  const handleExecute = (item: AISuggestion): void => {
    const virtualCmd: Command = {
      id: `ai-run-${Date.now()}`,
      name: item.prompt,
      command: item.command,
      category: 'AI Copilot',
      shell: item.shell,
      description: item.explanation,
      tags: ['ai'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    onOpenChange(false)
    onRunCommand(virtualCmd)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[92vw] max-w-2xl p-0 overflow-hidden shadow-2xl rounded-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                CLIM AI CLI Copilot
                <Badge className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/30 uppercase font-mono">
                  {config.provider} ({config.model})
                </Badge>
              </DialogTitle>
              <p className="text-xs text-zinc-400">
                Sinh câu lệnh CLI thông minh từ tiếng Việt hoặc tiếng Anh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                showHistory
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Lịch sử yêu cầu"
            >
              <History size={15} />
              <span className="hidden sm:inline">Lịch sử ({history.length})</span>
            </button>

            {onOpenSettings && (
              <button
                onClick={() => {
                  onOpenChange(false)
                  onOpenSettings()
                }}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title="Cấu hình AI Model & API Key"
              >
                <Settings size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Shell Selector & Prompt Input Area */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
              {(['powershell', 'cmd', 'wsl'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setShell(s)}
                  className={`px-3 py-1 rounded font-mono font-medium transition-colors cursor-pointer ${
                    shell === s
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            {activeProfile && (
              <div className="text-[11px] text-zinc-400 truncate max-w-[200px] hidden sm:block">
                Env: <span className="text-emerald-400 font-mono font-semibold">{activeProfile.name}</span>
              </div>
            )}
          </div>

          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              disabled={isLoading}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleGenerate()
                }
              }}
              placeholder="Nhập yêu cầu (vd: Tìm file log lớn hơn 50MB rồi nén lại)..."
              className="w-full h-12 pl-4 pr-12 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
            />
            <Button
              size="sm"
              disabled={isLoading || !prompt.trim()}
              onClick={() => handleGenerate()}
              className="absolute right-1.5 h-9 w-9 p-0 bg-purple-600 hover:bg-purple-500 text-white rounded-lg cursor-pointer"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            </Button>
          </div>

          {/* Quick prompt suggestions chips */}
          {!currentResult && !showHistory && (
            <div className="pt-1">
              <span className="text-[11px] text-zinc-500 font-medium block mb-1.5">Gợi ý câu lệnh thường dùng:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(qp)
                      handleGenerate(qp)
                    }}
                    className="text-[11px] px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-purple-300 rounded-lg transition-colors cursor-pointer text-left truncate max-w-full"
                  >
                    💡 {qp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Body content (Result or History) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {showHistory ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Lịch sử câu lệnh đã sinh ({history.length})
                </span>
                {history.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearHistory}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2 gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Xóa tất cả</span>
                  </Button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Chưa có lịch sử câu lệnh nào.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-zinc-200 truncate">{item.prompt}</span>
                      <div className="flex items-center gap-1">
                        <Badge className="text-[9px] bg-zinc-800 text-zinc-400 uppercase font-mono">
                          {item.shell}
                        </Badge>
                        <button
                          onClick={() => removeSuggestion(item.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                          title="Xóa"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 bg-zinc-900 rounded-lg font-mono text-xs text-purple-300 select-all overflow-x-auto">
                      {item.command}
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(item.command)}
                        className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        <Copy size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveToCommands(item)}
                        className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        <BookmarkPlus size={12} />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleExecute(item)}
                        className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold gap-1 cursor-pointer"
                      >
                        <Play size={12} />
                        <span>Chạy</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : currentResult ? (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {currentResult.isDangerous && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>
                    <strong>Cảnh báo an toàn:</strong> Câu lệnh này có chứa thao tác xóa hoặc can thiệp sâu vào hệ thống. Vui lòng đọc kỹ trước khi chạy!
                  </span>
                </div>
              )}

              {/* Command box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Terminal size={14} className="text-purple-400" />
                    Câu lệnh được tạo:
                  </span>
                  <Badge className="text-[10px] bg-zinc-800 text-zinc-300 uppercase font-mono">
                    {currentResult.shell}
                  </Badge>
                </div>

                <div className="relative group">
                  <div className="p-3.5 bg-zinc-950 border border-purple-500/30 rounded-xl font-mono text-xs sm:text-sm text-purple-300 select-all overflow-x-auto leading-relaxed pr-12 shadow-inner">
                    {currentResult.command}
                  </div>
                  <button
                    onClick={() => handleCopy(currentResult.command)}
                    className="absolute right-2.5 top-2.5 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Sao chép"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Explanation box */}
              {currentResult.explanation && (
                <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Giải thích ý nghĩa:
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {currentResult.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
              <Sparkles size={28} className="mx-auto text-zinc-600 animate-pulse" />
              <p>Nhập mô tả thao tác bạn muốn thực hiện ở trên để AI tạo câu lệnh chính xác.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {currentResult && !showHistory && (
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSaveToCommands(currentResult)}
                className="text-zinc-400 hover:text-zinc-200 text-xs h-9 px-3 gap-1.5 cursor-pointer border border-zinc-800"
              >
                <BookmarkPlus size={14} />
                <span>Lưu Vào Lệnh</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(currentResult.command)}
                className="text-zinc-400 hover:text-zinc-200 text-xs h-9 px-3 gap-1.5 cursor-pointer border border-zinc-800"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </Button>
            </div>

            <Button
              size="sm"
              onClick={() => handleExecute(currentResult)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 h-9 gap-1.5 cursor-pointer shadow-lg shadow-purple-500/20"
            >
              <Play size={14} className="fill-white" />
              <span>Chạy Trong Terminal</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
