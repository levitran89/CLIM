import React, { useState } from 'react'
import { useSchedulerStore } from '@/stores/scheduler-store'
import { confirmAction } from '@/stores/confirm-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Terminal,
  ListOrdered,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { TaskExecutionLog } from '@shared/types'

export function ExecutionLogViewer(): React.JSX.Element {
  const { logs, clearLogs } = useSchedulerStore()
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const filteredLogs = logs.filter((l) => {
    if (filter === 'success') return l.status === 'success'
    if (filter === 'failed') return l.status === 'failed'
    return true
  })

  const formatDate = (timestamp: number): string => {
    const d = new Date(timestamp)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} - ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <History size={18} className="text-emerald-400" />
          <span className="text-sm font-bold text-zinc-100">
            Lịch sử Thực thi ({logs.length} bản ghi)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-zinc-800 text-zinc-100 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Tất cả ({logs.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filter === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Thành công ({logs.filter((l) => l.status === 'success').length})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filter === 'failed'
                  ? 'bg-red-500/20 text-red-300 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Thất bại ({logs.filter((l) => l.status === 'failed').length})
            </button>
          </div>

          {logs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const ok = await confirmAction({
                  title: 'Xóa sạch lịch sử thực thi',
                  description: 'Bạn có chắc muốn xóa toàn bộ lịch sử chạy của các tác vụ lập lịch không?',
                  confirmText: 'Xóa sạch',
                  variant: 'destructive'
                })
                if (ok) clearLogs()
              }}
              className="h-8 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 gap-1.5 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Xóa lịch sử</span>
            </Button>
          )}
        </div>
      </div>

      {/* List / Table */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-zinc-950/40 border border-zinc-800/80 rounded-2xl">
          <History size={36} className="mx-auto text-zinc-600 mb-3" />
          <div className="text-sm font-semibold text-zinc-300">Chưa có lịch sử thực thi nào</div>
          <p className="text-xs text-zinc-500 mt-1">
            Khi các tác vụ tự động đến giờ chạy hoặc bạn nhấn "Chạy ngay", kết quả sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id
            const isSuccess = log.status === 'success'

            return (
              <div
                key={log.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSuccess
                    ? 'bg-zinc-950/70 border-zinc-800/80 hover:border-emerald-500/40'
                    : 'bg-red-950/10 border-red-900/40 hover:border-red-500/40'
                }`}
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="flex items-center justify-between cursor-pointer flex-wrap gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSuccess
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isSuccess ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-100">{log.taskName}</span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-2 bg-zinc-800 text-zinc-400 border-zinc-700 font-mono"
                        >
                          {log.targetType === 'command' ? 'Lệnh' : 'Quy trình'}: {log.targetName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-zinc-500" />
                          {formatDate(log.startedAt)}
                        </span>
                        <span>•</span>
                        <span>Thời lượng: {Math.round(log.durationMs / 1000)}s</span>
                        {log.exitCode !== undefined && log.exitCode !== 0 && (
                          <span className="text-red-400 font-mono font-bold">
                            (Exit Code {log.exitCode})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-xs py-0.5 px-2.5 font-semibold ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {isSuccess ? 'Thành công' : 'Thất bại'}
                    </Badge>
                    <button className="text-zinc-500 hover:text-zinc-300">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Output Preview */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/80">
                    <div className="text-xs font-bold text-zinc-400 mb-1.5 flex items-center justify-between">
                      <span>Log Output ({log.targetName}):</span>
                    </div>
                    <pre className="p-3 bg-zinc-950 border border-zinc-800/90 rounded-lg text-xs font-mono text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                      {log.outputPreview || 'Không có log chi tiết'}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
