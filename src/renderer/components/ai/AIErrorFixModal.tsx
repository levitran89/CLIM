import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAIStore } from '@/stores/ai-store'
import { requestAIErrorFix, type AIErrorFixResponse } from '@/services/ai-service'
import {
  Sparkles,
  Terminal,
  Play,
  Copy,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Check,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import type { Command } from '@shared/types'

interface AIErrorFixModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  errorOutput: string
  lastCommand: string
  shell: 'powershell' | 'cmd' | 'wsl'
  onRunFixCommand: (fixCmd: Command) => void
  onOpenSettings?: () => void
}

export function AIErrorFixModal({
  open,
  onOpenChange,
  errorOutput,
  lastCommand,
  shell,
  onRunFixCommand,
  onOpenSettings
}: AIErrorFixModalProps): React.JSX.Element {
  const [fixResult, setFixResult] = useState<AIErrorFixResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { config } = useAIStore()

  useEffect(() => {
    if (open && errorOutput) {
      handleDiagnose()
    } else {
      setFixResult(null)
      setApiError(null)
    }
  }, [open, errorOutput])

  const handleDiagnose = async (): Promise<void> => {
    if (config.provider !== 'ollama' && !config.apiKey) {
      toast.error(`Chưa có API Key cho ${config.provider.toUpperCase()}.`, {
        description: 'Vui lòng cấu hình API Key trong Cài đặt để dùng AI sửa lỗi.'
      })
      onOpenSettings?.()
      return
    }

    setIsLoading(true)
    setApiError(null)
    try {
      const res = await requestAIErrorFix(errorOutput, lastCommand, shell, config)
      setFixResult(res)
    } catch (err: any) {
      const errorMsg = err.message || ''
      let friendlyError = 'Đã xảy ra lỗi khi kết nối với AI. Vui lòng kiểm tra lại cấu hình hoặc thử lại sau.'
      
      if (errorMsg.includes('Quota exceeded') || errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
        friendlyError = 'API Key của bạn đã vượt quá giới hạn lượt dùng miễn phí (Quota Exceeded). Vui lòng đợi vài phút rồi thử lại, hoặc kiểm tra lại gói cước API của bạn.'
      } else if (errorMsg.includes('API key not valid') || errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        friendlyError = 'API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong phần Cài đặt.'
      }

      setApiError(friendlyError)
      toast.error('Lỗi khi phân tích lỗi', {
        description: friendlyError
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string): void => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Đã sao chép câu lệnh sửa lỗi!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApplyFix = (): void => {
    if (!fixResult || !fixResult.fixCommand) return
    const cmd: Command = {
      id: `ai-fix-${Date.now()}`,
      name: `Sửa lỗi: ${lastCommand.slice(0, 25)}`,
      command: fixResult.fixCommand,
      category: 'AI Auto-Fix',
      shell,
      description: fixResult.explanation,
      tags: ['ai-fix'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    onOpenChange(false)
    onRunFixCommand(cmd)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[92vw] max-w-xl p-0 overflow-hidden shadow-2xl rounded-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Tự Động Phân Tích & Sửa Lỗi Terminal
              </DialogTitle>
              <p className="text-xs text-zinc-400">
                AI Copilot chẩn đoán nguyên nhân và đề xuất lệnh khắc phục
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Failed command & error snippet */}
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-red-400 font-semibold">
              <AlertCircle size={14} />
              <span>Lệnh vừa chạy bị lỗi ({shell.toUpperCase()}):</span>
            </div>
            <code className="block p-2 bg-zinc-950 rounded-lg font-mono text-zinc-300 overflow-x-auto select-all">
              {lastCommand || '(Không xác định)'}
            </code>
          </div>

          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 size={32} className="mx-auto text-purple-400 animate-spin" />
              <p className="text-xs text-zinc-400">AI đang phân tích mã lỗi terminal và tìm giải pháp...</p>
            </div>
          ) : apiError ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-2">
              <AlertCircle size={28} className="mx-auto text-red-400 mb-2" />
              <h4 className="font-bold text-red-400 text-sm">Không thể hoàn tất phân tích</h4>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-md mx-auto">
                {apiError}
              </p>
            </div>
          ) : fixResult ? (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* Root Cause */}
              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  🔍 Nguyên nhân sự cố:
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {fixResult.rootCause}
                </p>
              </div>

              {/* Proposed Fix Command */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Câu lệnh đề xuất khắc phục:
                </span>
                <div className="relative group">
                  <div className="p-3.5 bg-zinc-950 border border-emerald-500/30 rounded-xl font-mono text-xs text-emerald-400 select-all overflow-x-auto leading-relaxed pr-12">
                    {fixResult.fixCommand}
                  </div>
                  <button
                    onClick={() => handleCopy(fixResult.fixCommand)}
                    className="absolute right-2.5 top-2.5 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                    title="Sao chép"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Fix Explanation */}
              {fixResult.explanation && (
                <p className="text-xs text-zinc-400 italic">
                  💡 {fixResult.explanation}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {fixResult && !isLoading && (
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-zinc-200 text-xs px-4 h-9"
            >
              Đóng
            </Button>
            <Button
              size="sm"
              onClick={handleApplyFix}
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-5 h-9 gap-1.5 cursor-pointer shadow-sm"
            >
              <Play size={14} className="fill-zinc-950" />
              <span>Chạy Lệnh Khắc Phục Ngay</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
