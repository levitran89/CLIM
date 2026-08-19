import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertOctagon,
  Copy,
  Check,
  Send,
  Sparkles,
  FileText,
  Clock,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  X
} from 'lucide-react'
import { useRecordingStore } from '@/stores/recording-store'
import { toast } from 'sonner'

interface IncidentReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionTitle?: string
  lastCommand?: string
  logExcerpt: string
  rootCause?: string
  recommendedFix?: string
}

export function IncidentReportModal({
  open,
  onOpenChange,
  sessionTitle = 'Terminal Session',
  lastCommand = '',
  logExcerpt = '',
  rootCause = '',
  recommendedFix = ''
}: IncidentReportModalProps): React.JSX.Element {
  const { createIncidentReport } = useRecordingStore()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [copied, setCopied] = useState(false)
  const [sendingWebhook, setSendingWebhook] = useState(false)
  const [isSuccess, setIsSuccess] = useState(true)

  // Reset/sync state when modal opens
  useEffect(() => {
    if (open) {
      const hasError = Boolean(rootCause && rootCause.trim().length > 0)
      const successState = !hasError
      setIsSuccess(successState)
      setTitle(`Báo cáo ${lastCommand ? `lệnh "${lastCommand}"` : 'Terminal'} lúc ${new Date().toLocaleTimeString('vi-VN')}`)
      setSummary(
        rootCause ||
          (successState
            ? 'Lệnh đã thực thi hoàn tất, kết quả bình thường.'
            : 'Phát hiện sự cố hoặc mã lỗi trong quá trình thực thi.')
      )
      setCopied(false)
    }
  }, [open, sessionTitle, lastCommand, rootCause])

  const buildMarkdownReport = (): string => {
    return `# ${isSuccess ? '✅' : '🚨'} BÁO CÁO THỰC THI (EXECUTION REPORT)
**Thời gian:** ${new Date().toLocaleString('vi-VN')}
**Phiên Terminal:** ${sessionTitle}
**Lệnh thực thi:** \`${lastCommand || 'N/A'}\`
**Trạng thái:** ${isSuccess ? 'Thành công (Success)' : 'Có lỗi (Failed/Investigating)'}

---

## 📌 Tóm Tắt & Ghi Chú
${summary}

${recommendedFix ? `## 💡 Hướng Khắc Phục Đề Xuất\n\`\`\`bash\n${recommendedFix}\n\`\`\`\n` : ''}
## 📋 Trích Đoạn Log Chi Tiết
\`\`\`text
${logExcerpt}
\`\`\`

---
*Báo cáo được tạo tự động bởi ứng dụng Quản Trị Hệ Thống CLIM.*
`
  }

  const handleCopy = () => {
    const md = buildMarkdownReport()
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Đã sao chép Báo Cáo Thực Thi (Markdown) vào Clipboard')
  }

  const handleSaveIncident = () => {
    createIncidentReport({
      title: title.trim() || 'Báo cáo sự cố',
      sessionTitle,
      command: lastCommand,
      summary: summary.trim(),
      rootCause,
      recommendedFix,
      logExcerpt,
      status: 'open'
    })
    onOpenChange(false)
  }

  const handleSendWebhook = async (type: 'discord' | 'telegram') => {
    setSendingWebhook(true)
    try {
      if (window.api?.scheduler?.getWebhookConfig && window.api?.scheduler?.sendIncidentWebhook) {
        const config = await window.api.scheduler.getWebhookConfig()
        const incidentData = {
          title: title.trim() || `Báo cáo ${lastCommand || 'Terminal'}`,
          sessionTitle,
          command: lastCommand,
          summary: summary.trim(),
          logExcerpt,
          rootCause,
          recommendedFix,
          isSuccess
        }
        const res = await window.api.scheduler.sendIncidentWebhook(type, config, incidentData)
        if (res.success) {
          toast.success(`Đã gửi báo cáo tới ${type.toUpperCase()} thành công`)
        } else {
          toast.error(`Không thể gửi webhook: ${res.error || 'Kiểm tra cấu hình trong Lập lịch'}`)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi gửi webhook'
      toast.error(`Lỗi: ${msg}`)
    } finally {
      setSendingWebhook(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 p-0 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-zinc-800 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-zinc-100">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSuccess ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'}`}>
              {isSuccess ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />}
            </div>
            <span>Xuất Báo Cáo Thực Thi (Execution Report)</span>
          </DialogTitle>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
            title="Đóng cửa sổ báo cáo"
          >
            <X size={16} />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-2.5 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <div>
              <span className="text-[10px] text-zinc-500 block">Phiên Terminal</span>
              <span className="font-bold text-zinc-200 truncate">{sessionTitle}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Lệnh Vừa Chạy</span>
              <span className="font-mono text-emerald-400 truncate">{lastCommand || 'N/A'}</span>
            </div>
          </div>

          {/* Title and Status */}
          <div className="flex gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs font-semibold text-zinc-300">Tiêu đề báo cáo</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-900 border-zinc-750 text-xs sm:text-sm"
                placeholder="VD: Cập nhật thành công hệ thống..."
              />
            </div>
            
            <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 shrink-0 h-[38px] items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(true)
                  if (summary === 'Phát hiện sự cố hoặc mã lỗi trong quá trình thực thi.') {
                    setSummary('Lệnh đã thực thi hoàn tất, kết quả bình thường.')
                  }
                }}
                className={`px-3 h-full rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSuccess
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <span>🟢</span>
                <span>Thành công</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false)
                  if (summary === 'Lệnh đã thực thi hoàn tất, kết quả bình thường.') {
                    setSummary('Phát hiện sự cố hoặc mã lỗi trong quá trình thực thi.')
                  }
                }}
                className={`px-3 h-full rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isSuccess
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <span>🔴</span>
                <span>Sự cố</span>
              </button>
            </div>
          </div>

          {/* Summary / Root Cause */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-purple-400" />
              Tóm tắt & Ghi chú
            </Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="bg-zinc-900 border-zinc-750 text-xs resize-none"
              placeholder="Mô tả kết quả hoặc nguyên nhân sự cố..."
            />
          </div>

          {/* Log Excerpt */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Terminal size={13} className="text-zinc-400" />
              Trích đoạn Log chi tiết
            </Label>
            <pre className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl font-mono text-[11px] text-zinc-300 max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
              {logExcerpt || 'Không có log trích đoạn.'}
            </pre>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          {/* Quick Webhook Sender */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sendingWebhook}
              onClick={() => handleSendWebhook('discord')}
              className="h-8 text-xs border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 gap-1 cursor-pointer"
              title="Gửi báo cáo ngay vào kênh Discord"
            >
              <Send size={12} />
              <span>Discord</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sendingWebhook}
              onClick={() => handleSendWebhook('telegram')}
              className="h-8 text-xs border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 gap-1 cursor-pointer"
              title="Gửi báo cáo ngay vào nhóm Telegram"
            >
              <Send size={12} />
              <span>Telegram</span>
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Đã Sao Chép' : 'Sao Chép Markdown'}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSaveIncident}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              Lưu Báo Cáo
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
