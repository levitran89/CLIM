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
  Rows3,
  Maximize2,
  Minimize2,
  LayoutGrid,
  List
} from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/stores/confirm-store'
import type { PortInfo } from '@shared/types'
import { getPortInfo } from './port-dict'
import { twoColumnListClass } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settings-store'
import { useTranslation } from '@/stores/i18n-store'

export function PortList(): React.JSX.Element {
  const { settings, updateSettings } = useSettingsStore()
  const { t, language } = useTranslation()
  const [ports, setPorts] = useState<PortInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPort, setExpandedPort] = useState<number | null>(null)
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)

  const viewMode = settings.portViewMode || 'grid'
  const columns = settings.portColumns || 2
  const layoutWidth = settings.portLayoutWidth || 'full'

  const toggleLayoutWidth = (): void => {
    updateSettings({ portLayoutWidth: layoutWidth === 'centered' ? 'full' : 'centered' })
  }

  const fetchPorts = async (): Promise<void> => {
    setLoading(true)
    try {
      const activePorts = await window.api.system.getPorts()
      setPorts(activePorts)
      setHasFetchedOnce(true)
    } catch {
      toast.error(language === 'en' ? 'Failed to fetch active ports' : 'Lỗi khi tải danh sách port')
    } finally {
      setLoading(false)
    }
  }

  const handleKill = async (pid: number, port: number, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    const confirmed = await confirmAction({
      title: language === 'en' ? `Kill Port ${port}` : `Đóng Port ${port}`,
      description: language === 'en' ? `Are you sure you want to kill and close Port ${port} (PID: ${pid})?` : `Bạn có chắc chắn muốn giải phóng và đóng cổng mạng Port ${port} (Tiến trình PID: ${pid}) không?`,
      confirmText: language === 'en' ? 'Kill Port' : 'Đóng Port',
      cancelText: t('common.cancel'),
      variant: 'destructive'
    })
    if (!confirmed) return

    try {
      const res = await window.api.system.killPort(pid)
      if (res.success) {
        toast.success(language === 'en' ? `Port ${port} closed successfully` : `Đã đóng port ${port} thành công`)
        fetchPorts()
      } else if (res.requiresAdmin) {
        toast.error(
          language === 'en' ? 'Admin privileges required. Please run CLIM as administrator/sudo.' : 'Không có quyền thực thi. Vui lòng khởi chạy CLIM với quyền administrator/sudo.',
          {
            duration: 5000,
            action: {
              label: language === 'en' ? 'Details' : 'Chi tiết',
              onClick: () =>
                alert(
                  res.error ||
                    (language === 'en' ? 'Please relaunch CLIM as administrator (Windows) or sudo (Linux/macOS).' : 'Vui lòng chạy lại CLIM với quyền administrator (Windows) hoặc sudo (Linux/macOS).')
                )
            }
          }
        )
      } else {
        toast.error(`${language === 'en' ? 'Cannot kill port' : 'Không thể đóng port'} ${port}: ${res.error}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown'
      toast.error(`Error: ${message}`)
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
    updateSettings({ portColumns: columns === 1 ? 2 : 1 })
  }

  const toggleViewMode = (mode: 'grid' | 'compact'): void => {
    updateSettings({ portViewMode: mode })
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3 flex items-center gap-2.5 border-b border-zinc-800/60 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPorts}
          disabled={loading}
          className="h-8.5 shrink-0 text-xs sm:text-sm font-semibold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 px-3.5 gap-1.5 cursor-pointer shadow-sm"
        >
          <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
          {hasFetchedOnce ? t('common.refresh') : t('ports.refresh')}
        </Button>

        <div className="relative flex-1 min-w-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('ports.searchPlaceholder')}
            disabled={!hasFetchedOnce}
            className="pl-9 h-8.5 text-xs sm:text-sm bg-zinc-900/80 border-zinc-700/60 text-zinc-200 placeholder:text-zinc-500 disabled:opacity-50"
          />
        </div>

        {/* View Mode & Column Toggles */}
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${
              viewMode === 'grid'
                ? 'text-emerald-400 bg-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => toggleViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${
              viewMode === 'compact'
                ? 'text-emerald-400 bg-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => toggleViewMode('compact')}
            title="Compact View"
          >
            <List size={14} />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={`h-8.5 w-8.5 shrink-0 ${
            columns === 2
              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          onClick={toggleColumns}
          title={columns === 2 ? t('common.oneColumn') : t('common.twoColumns')}
        >
          {columns === 2 ? <Columns2 size={16} /> : <Rows3 size={16} />}
        </Button>

        {/* Full Width vs Centered Web Layout Switcher */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-8.5 w-8.5 shrink-0 ${
            layoutWidth === 'centered'
              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          onClick={toggleLayoutWidth}
          title={layoutWidth === 'centered' ? t('common.fullWidth') : t('common.webWidth')}
        >
          {layoutWidth === 'centered' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className={layoutWidth === 'centered' ? 'max-w-5xl mx-auto px-4 sm:px-6 py-4' : 'w-full px-4 sm:px-6 py-4'}>
          {!hasFetchedOnce ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Network size={36} className="text-zinc-500" />
              <p className="text-zinc-400 text-sm text-center max-w-sm">
                {language === 'en' ? 'Scan and list all active open TCP/UDP network ports on the system.' : 'Quét và liệt kê tất cả các cổng mạng (Ports) đang hoạt động trên hệ điều hành.'}
              </p>
              <Button
                onClick={fetchPorts}
                disabled={loading}
                className="h-9 px-4 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer"
              >
                {loading ? t('common.loading') : (language === 'en' ? 'Scan Open Ports' : 'Lấy danh sách Port')}
              </Button>
            </div>
          ) : filteredPorts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              {t('ports.noPorts')}
            </div>
          ) : (
            <div
              className={
                columns === 2 ? `${twoColumnListClass} pb-4` : 'space-y-2 pb-4'
              }
            >
              {filteredPorts.map((p) => {
                const isExpanded = expandedPort === p.port
                const info = getPortInfo(p.port)
                const isSystem = info.importance === 'System'

                if (viewMode === 'compact') {
                  return (
                    <div
                      key={`${p.port}-${p.pid}`}
                      className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700/80 hover:bg-zinc-900/90 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Network size={14} className="shrink-0 text-sky-400" />
                        <span className="text-sm font-bold text-zinc-100 font-mono shrink-0">
                          :{p.port}
                        </span>
                        <span className="text-xs text-zinc-300 font-mono truncate">
                          {p.processName}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                          PID {p.pid}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            isSystem
                              ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                              : info.importance === 'Common'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {info.service}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 shrink-0 ${
                          isSystem
                            ? 'text-zinc-600 opacity-40 cursor-not-allowed'
                            : 'text-red-400/80 hover:text-red-300 hover:bg-red-500/15 cursor-pointer'
                        }`}
                        onClick={(e) => {
                          if (!isSystem) handleKill(p.pid, p.port, e)
                          else {
                            e.stopPropagation()
                            toast.error(language === 'en' ? 'System ports cannot be closed for safety reasons.' : 'Không thể đóng các port hệ thống để đảm bảo an toàn.')
                          }
                        }}
                        title={isSystem ? (language === 'en' ? 'System port (protected)' : 'Port hệ thống (Không thể đóng)') : t('ports.killPort')}
                      >
                        <XCircle size={14} />
                      </Button>
                    </div>
                  )
                }

                return (
                  <div
                    key={`${p.port}-${p.pid}`}
                    className="group rounded-xl border border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700/80 hover:bg-zinc-900/90 transition-all duration-150 overflow-hidden shadow-sm"
                  >
                    <div
                      className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 cursor-pointer"
                      onClick={() => setExpandedPort(isExpanded ? null : p.port)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown size={14} className="shrink-0 text-zinc-400" />
                          ) : (
                            <ChevronRight size={14} className="shrink-0 text-zinc-400" />
                          )}
                          <Network size={15} className="shrink-0 text-sky-400" />
                          <span className="text-base font-bold text-zinc-100 font-mono">
                            :{p.port}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                              isSystem
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : info.importance === 'Common'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {info.importance}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400 font-mono truncate mt-1.5 ml-6">
                          <strong className="text-zinc-200">{p.processName}</strong> · PID: {p.pid} · {language === 'en' ? 'Proto:' : 'Giao thức:'} {p.protocol}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 shrink-0 transition-opacity ${
                          isSystem
                            ? 'text-zinc-600 opacity-40 cursor-not-allowed'
                            : 'text-red-400/80 hover:text-red-300 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 cursor-pointer'
                        }`}
                        onClick={(e) => {
                          if (!isSystem) handleKill(p.pid, p.port, e)
                          else {
                            e.stopPropagation()
                            toast.error(
                              language === 'en' ? 'System ports cannot be closed for safety reasons.' : 'Không thể đóng các port hệ thống để đảm bảo an toàn.'
                            )
                          }
                        }}
                        title={
                          isSystem ? (language === 'en' ? 'System port (protected)' : 'Port hệ thống (Không thể đóng)') : t('ports.killPort')
                        }
                      >
                        <XCircle size={16} />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-3.5 pt-2 ml-6 border-t border-zinc-800/60 text-xs sm:text-sm grid grid-cols-[100px_1fr] gap-y-1.5 gap-x-3 bg-zinc-950/40">
                        <span className="text-zinc-500 font-medium">PID</span>
                        <span className="text-zinc-200 font-mono">{p.pid}</span>
                        <span className="text-zinc-500 font-medium">{language === 'en' ? 'Protocol' : 'Giao thức'}</span>
                        <span className="text-zinc-200 font-mono">{p.protocol}</span>
                        <span className="text-zinc-500 font-medium">{language === 'en' ? 'Service' : 'Dịch vụ'}</span>
                        <span className="text-zinc-200">{info.service}</span>
                        <span className="text-zinc-500 font-medium">{language === 'en' ? 'Description' : 'Mô tả'}</span>
                        <span className="text-zinc-300 leading-relaxed">{info.description}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
