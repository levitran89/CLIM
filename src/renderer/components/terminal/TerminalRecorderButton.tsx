import React, { useState } from 'react'
import { useRecordingStore } from '@/stores/recording-store'
import { useTranslation } from '@/stores/i18n-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Radio,
  Square,
  Download,
  FileCode,
  Globe,
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react'
import type { TerminalRecording } from '@shared/types'

interface TerminalRecorderButtonProps {
  sessionId?: string
  sessionTitle?: string
}

export function TerminalRecorderButton({
  sessionId,
  sessionTitle = 'Terminal'
}: TerminalRecorderButtonProps): React.JSX.Element {
  const { language } = useTranslation()
  const {
    isRecording,
    activeSessionId,
    recordingDurationSec,
    activeRecording,
    startRecording,
    stopRecording,
    exportRecording
  } = useRecordingStore()

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [lastFinishedRec, setLastFinishedRec] = useState<TerminalRecording | null>(null)

  const isCurrentSessionRecording = isRecording && activeSessionId === sessionId

  const formatSec = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleToggle = () => {
    if (isRecording) {
      const rec = stopRecording()
      if (rec) {
        setLastFinishedRec(rec)
        setExportModalOpen(true)
      }
    } else {
      if (!sessionId) return
      startRecording(sessionId, sessionTitle)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size={isCurrentSessionRecording ? 'sm' : 'icon'}
        onClick={handleToggle}
        className={`h-9 rounded-lg cursor-pointer transition-all duration-150 active:scale-95 shrink-0 ${
          isCurrentSessionRecording
            ? 'px-2.5 bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30 animate-pulse gap-1.5'
            : isRecording
              ? 'w-9 text-zinc-600 opacity-60 cursor-not-allowed'
              : 'w-9 text-zinc-400 hover:text-red-400 hover:bg-red-500/15'
        }`}
        title={
          isCurrentSessionRecording
            ? (language === 'en' ? 'Click to Stop & Export terminal recording' : 'Bấm để Dừng & Xuất bản ghi terminal')
            : (language === 'en' ? 'Start recording terminal session (Asciinema / HTML / Text)' : 'Bắt đầu ghi lại phiên terminal (Asciinema / HTML / Text)')
        }
      >
        {isCurrentSessionRecording ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping shrink-0" />
            <span className="font-mono text-xs text-red-300">REC {formatSec(recordingDurationSec)}</span>
            <Square size={14} className="fill-red-400 text-red-400 ml-0.5" />
          </>
        ) : (
          <Radio size={20} />
        )}
      </Button>

      {/* Export Recording Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-6 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-100">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>{language === 'en' ? 'Terminal Session Recorded' : 'Đã Ghi Xong Phiên Terminal'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-3 text-xs">
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between text-zinc-400">
                <span>{language === 'en' ? 'Session:' : 'Phiên làm việc:'}</span>
                <strong className="text-zinc-200 font-mono">{lastFinishedRec?.title}</strong>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>{language === 'en' ? 'Duration:' : 'Thời lượng:'}</span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <Clock size={11} />
                  {((lastFinishedRec?.durationMs || 0) / 1000).toFixed(1)} {language === 'en' ? 'seconds' : 'giây'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>{language === 'en' ? 'Log events:' : 'Số sự kiện log:'}</span>
                <span className="text-zinc-300 font-mono">{lastFinishedRec?.events.length || 0} chunks</span>
              </div>
            </div>

            <p className="text-zinc-400">
              {language === 'en' ? 'Select format to export and share recording:' : 'Chọn định dạng để xuất và chia sẻ bản ghi:'}
            </p>

            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: Standalone HTML */}
              <button
                type="button"
                onClick={async () => {
                  await exportRecording('html')
                  setExportModalOpen(false)
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-100 group-hover:text-emerald-300">
                      Standalone HTML Player (.html)
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {language === 'en'
                        ? 'Open and replay directly in Chrome/Edge with a sleek web player.'
                        : 'Mở phát lại trực tiếp trên Chrome/Edge với player mượt mà.'}
                    </p>
                  </div>
                </div>
                <Download size={15} className="text-zinc-500 group-hover:text-emerald-400" />
              </button>

              {/* Option 2: Asciinema Cast */}
              <button
                type="button"
                onClick={async () => {
                  await exportRecording('cast')
                  setExportModalOpen(false)
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-purple-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25">
                    <FileCode size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-100 group-hover:text-purple-300">
                      Asciinema Cast (.cast v2)
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {language === 'en'
                        ? 'Standard format for asciinema.org and terminal players.'
                        : 'Định dạng chuẩn chia sẻ trên asciinema.org hoặc web player.'}
                    </p>
                  </div>
                </div>
                <Download size={15} className="text-zinc-500 group-hover:text-purple-400" />
              </button>

              {/* Option 3: Plain Text Log with Timestamps */}
              <button
                type="button"
                onClick={async () => {
                  await exportRecording('txt')
                  setExportModalOpen(false)
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 group-hover:bg-blue-500/25">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-100 group-hover:text-blue-300">
                      {language === 'en' ? 'Timestamped Log (.txt)' : 'Log Đính Kèm Timestamp (.txt)'}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {language === 'en'
                        ? 'Export full text output with relative timestamps.'
                        : 'Xuất toàn bộ văn bản có đánh dấu thời gian trôi qua.'}
                    </p>
                  </div>
                </div>
                <Download size={15} className="text-zinc-500 group-hover:text-blue-400" />
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExportModalOpen(false)}
              className="text-zinc-400 cursor-pointer"
            >
              {language === 'en' ? 'Close' : 'Đóng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
