import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  RefreshCw,
  XCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Network,
  Columns2,
  Rows3
} from 'lucide-react'
import { toast } from 'sonner'
import type { PortInfo } from '@shared/types'
import { getPortInfo } from './port-dict'
import { twoColumnListClass } from '@/lib/utils'

const COLUMNS_KEY = 'clim-ports-columns'

export function PortList(): React.JSX.Element {
  const [ports, setPorts] = useState<PortInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)
  const [expandedPort, setExpandedPort] = useState<number | null>(null)
  const [columns, setColumns] = useState<1 | 2>(() => {
    const saved = localStorage.getItem(COLUMNS_KEY)
    return saved === '2' ? 2 : 1
  })

  const fetchPorts = async (): Promise<void> => {
    setLoading(true)
    try {
      const activePorts = await window.api.system.getPorts()
      setPorts(activePorts)
      setHasFetchedOnce(true)
    } catch {
      toast.error('Lỗi khi tải danh sách port')
    } finally {
      setLoading(false)
    }
  }

  const handleKill = async (pid: number, port: number, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    if (!window.confirm(`Bạn có chắc muốn đóng port ${port} (PID: ${pid}) không?`)) return

    try {
      const res = await window.api.system.killPort(pid)
      if (res.success) {
        toast.success(`Đã đóng port ${port} thành công`)
        fetchPorts()
      } else if (res.requiresAdmin) {
        toast.error(
          'Không có quyền thực thi. Vui lòng khởi chạy CLIM với quyền administrator/sudo.',
          {
            duration: 5000,
            action: {
              label: 'Chi tiết',
              onClick: () =>
                alert(
                  res.error ||
                    'Vui lòng chạy lại CLIM với quyền administrator (Windows) hoặc sudo (Linux/macOS).'
                )
            }
          }
        )
      } else {
        toast.error(`Không thể đóng port ${port}: ${res.error}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không xác định'
      toast.error(`Lỗi: ${message}`)
    }
  }

  const filteredPorts = useMemo(() => {
    if (!searchQuery) return ports
    const query = searchQuery.toLowerCase()
    return ports.filter(
      (p) =>
        p.port.toString().includes(query) || p.processName.toLowerCase().includes(query)
    )
  }, [ports, searchQuery])

  const toggleColumns = (): void => {
    setColumns((c) => {
      const next = c === 1 ? 2 : 1
      localStorage.setItem(COLUMNS_KEY, String(next))
      return next
    })
  }

  return (
    <div className="flex flex-col h-full px-[50px]">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        {/* Toolbar giống tab Lệnh */}
        <div className="p-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPorts}
            disabled={loading}
            className="h-8 shrink-0 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <RefreshCw size={12} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            {hasFetchedOnce ? 'Làm mới' : 'Tải ports'}
          </Button>

          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm port hoặc tên tiến trình..."
              disabled={!hasFetchedOnce}
              className="pl-8 h-8 text-xs bg-zinc-800/50 border-zinc-700/50 disabled:opacity-50"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shrink-0 ${
              columns === 2
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={toggleColumns}
            title={columns === 2 ? 'Hiển thị 1 cột' : 'Hiển thị 2 cột'}
          >
            {columns === 2 ? <Columns2 size={14} /> : <Rows3 size={14} />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-1">
          {!hasFetchedOnce ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Network size={28} className="text-zinc-600" />
              <p className="text-zinc-500 text-xs text-center max-w-xs">
                Tải danh sách port có thể mất chút thời gian.
              </p>
              <Button
                onClick={fetchPorts}
                disabled={loading}
                className="h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              >
                {loading ? 'Đang lấy dữ liệu...' : 'Lấy danh sách Port'}
              </Button>
            </div>
          ) : filteredPorts.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-xs">
              {searchQuery ? 'Không tìm thấy cổng nào' : 'Không có cổng nào đang mở'}
            </div>
          ) : (
            <div
              className={
                columns === 2 ? `${twoColumnListClass} pb-2` : 'space-y-0.5 pb-2'
              }
            >
              {filteredPorts.map((p) => {
                const isExpanded = expandedPort === p.port
                const info = getPortInfo(p.port)
                const isSystem = info.importance === 'System'

                return (
                  <div
                    key={`${p.port}-${p.pid}`}
                    className="group rounded-lg border border-transparent hover:border-zinc-700/30 hover:bg-zinc-800/60 transition-all duration-150 overflow-hidden"
                  >
                    <div
                      className="flex items-start justify-between gap-2 px-3 py-2 cursor-pointer"
                      onClick={() => setExpandedPort(isExpanded ? null : p.port)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown size={12} className="shrink-0 text-zinc-500" />
                          ) : (
                            <ChevronRight size={12} className="shrink-0 text-zinc-500" />
                          )}
                          <Network size={12} className="shrink-0 text-sky-400" />
                          <span className="text-sm font-medium text-zinc-200 font-mono">
                            :{p.port}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                              isSystem
                                ? 'bg-red-500/20 text-red-400'
                                : info.importance === 'Common'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {info.importance}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono truncate mt-1 ml-6">
                          {p.processName} · PID {p.pid} · {p.protocol}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 shrink-0 transition-opacity ${
                          isSystem
                            ? 'text-zinc-600 opacity-50 cursor-not-allowed'
                            : 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={(e) => {
                          if (!isSystem) handleKill(p.pid, p.port, e)
                          else {
                            e.stopPropagation()
                            toast.error(
                              'Không thể đóng các port hệ thống để đảm bảo an toàn.'
                            )
                          }
                        }}
                        title={
                          isSystem ? 'Port hệ thống (Không thể đóng)' : 'Đóng kết nối (Kill)'
                        }
                      >
                        <XCircle size={12} />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 ml-6 border-t border-zinc-800/40 text-xs grid grid-cols-[88px_1fr] gap-y-1 gap-x-2">
                        <span className="text-zinc-500">PID</span>
                        <span className="text-zinc-300">{p.pid}</span>
                        <span className="text-zinc-500">Giao thức</span>
                        <span className="text-zinc-300">{p.protocol}</span>
                        <span className="text-zinc-500">Dịch vụ</span>
                        <span className="text-zinc-300">{info.service}</span>
                        <span className="text-zinc-500">Mô tả</span>
                        <span className="text-zinc-400">{info.description}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
