import React, { useEffect, useState, useMemo } from 'react'
import { useMonitorStore } from '@/stores/monitor-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { confirmAction } from '@/stores/confirm-store'
import { PortList } from '@/components/ports/PortList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Terminal,
  Radio,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Globe,
  LayoutGrid,
  Table as TableIcon,
  Network,
  Columns2,
  Rows3,
  XCircle,
  ChevronRight,
  ChevronDown,
  Zap,
  Maximize2,
  Minimize2,
  ScrollText
} from 'lucide-react'
import type { PortInfo, ProcessMetric } from '@shared/types'
import { twoColumnListClass } from '@/lib/utils'
import { NetworkDiagnosticsView } from './NetworkDiagnosticsView'
import { SystemLogsView } from './SystemLogsView'
import { useSettingsStore } from '@/stores/settings-store'
import { useSystemLogStore } from '@/stores/system-log-store'
import { useTranslation } from '@/stores/i18n-store'

type SortField = 'cpu' | 'ram' | 'name' | 'pid' | 'network'
type SortDirection = 'asc' | 'desc'
type SubTab = 'system' | 'network' | 'ports' | 'logs'

export function ResourceMonitor(): React.JSX.Element {
  const {
    systemMetrics,
    processMetrics,
    fetchMetrics,
    startPolling,
    stopPolling,
    killProcess
  } = useMonitorStore()
  const { sessions } = useTerminalStore()
  const { settings, updateSettings } = useSettingsStore()
  const systemLogs = useSystemLogStore((s) => s.logs)
  const { t, language } = useTranslation()

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('system')
  const [openPorts, setOpenPorts] = useState<PortInfo[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('cpu')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedPid, setExpandedPid] = useState<number | null>(null)

  const viewMode = settings.processViewMode === 'compact' ? 'table' : 'cards'
  const columns = settings.processColumns || 2
  const layoutWidth = settings.processLayoutWidth || 'full'

  const toggleLayoutWidth = () => {
    updateSettings({ processLayoutWidth: layoutWidth === 'centered' ? 'full' : 'centered' })
  }

  // Gom các PID cần theo dõi từ Terminal Sessions và Open Ports
  const getTrackedPids = (): number[] => {
    const terminalPids = sessions
      .map((s) => s.pid)
      .filter((pid): pid is number => typeof pid === 'number' && pid > 0)

    const portPids = openPorts
      .map((p) => p.pid)
      .filter((pid): pid is number => typeof pid === 'number' && pid > 0)

    return Array.from(new Set([...terminalPids, ...portPids]))
  }

  const loadPorts = async (): Promise<void> => {
    try {
      const ports = await window.api.system.getPorts()
      setOpenPorts(ports || [])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadPorts()
    fetchMetrics(getTrackedPids())
  }, [])

  useEffect(() => {
    startPolling(getTrackedPids)
  }, [sessions, openPorts])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  const handleManualRefresh = async (): Promise<void> => {
    setIsRefreshing(true)
    await loadPorts()
    await fetchMetrics(getTrackedPids())
    setTimeout(() => setIsRefreshing(false), 400)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'name' || field === 'pid' ? 'asc' : 'desc')
    }
  }

  const toggleViewMode = (mode: 'cards' | 'table') => {
    updateSettings({ processViewMode: mode === 'table' ? 'compact' : 'grid' })
  }

  const toggleColumns = () => {
    updateSettings({ processColumns: columns === 1 ? 2 : 1 })
  }

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return language === 'en' ? `${days}d ${hours % 24}h` : `${days} ngày ${hours % 24}h`
    }
    return language === 'en' ? `${hours}h ${minutes}m` : `${hours} giờ ${minutes}m`
  }

  // Filter and Sort processes
  const sortedAndFilteredProcesses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const list = processMetrics.filter((p) => {
      if (!query) return true
      const portInfo = openPorts.find((port) => port.pid === p.pid)
      return (
        p.name.toLowerCase().includes(query) ||
        String(p.pid).includes(query) ||
        (portInfo && String(portInfo.port).includes(query))
      )
    })

    return list.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'cpu':
          comparison = a.cpuPercent - b.cpuPercent
          break
        case 'ram':
          comparison = a.memoryBytes - b.memoryBytes
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'pid':
          comparison = a.pid - b.pid
          break
        case 'network': {
          const aPort = openPorts.find((p) => p.pid === a.pid)?.port || 0
          const bPort = openPorts.find((p) => p.pid === b.pid)?.port || 0
          comparison = aPort - bPort
          break
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [processMetrics, searchQuery, sortField, sortDirection, openPorts])

  const cpuPercent = systemMetrics?.cpuUsagePercent ?? 0
  const ramPercent = systemMetrics?.memoryUsagePercent ?? 0

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-zinc-600 ml-1 inline opacity-70" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="text-emerald-400 ml-1 inline font-bold" />
    ) : (
      <ArrowDown size={12} className="text-emerald-400 ml-1 inline font-bold" />
    )
  }

  const handleKillProc = async (pid: number, name: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const ok = await confirmAction({
      title: language === 'en' ? `Kill process ${name} (PID: ${pid})` : `Dừng tiến trình ${name} (PID: ${pid})`,
      description: language === 'en' ? 'Are you sure you want to force kill this process?' : 'Bạn có chắc chắn muốn buộc dừng (kill) tiến trình này không?',
      confirmText: language === 'en' ? 'Kill Process' : 'Dừng tiến trình',
      variant: 'destructive'
    })
    if (ok) killProcess(pid)
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Header & Sub-Tabs Switcher (Fixed Height & Solid Structure) */}
      <div className="h-13 min-h-[52px] flex items-center justify-between px-4 sm:px-6 border-b border-zinc-800/80 bg-zinc-950/95 shrink-0 gap-3 select-none">
        {/* Left: Sub-tabs Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('system')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap border ${
              activeSubTab === 'system'
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent'
            }`}
          >
            <Activity size={15} className={activeSubTab === 'system' ? 'text-emerald-400' : 'text-zinc-500'} />
            <span>{t('monitor.subtabSystem')}</span>
            <Badge variant="secondary" className="bg-zinc-950 text-zinc-400 text-[10px] px-1.5 py-0 font-mono">
              {processMetrics.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveSubTab('network')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap border ${
              activeSubTab === 'network'
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent'
            }`}
          >
            <Zap size={15} className={activeSubTab === 'network' ? 'text-blue-400' : 'text-zinc-500'} />
            <span>{t('monitor.subtabNetwork')}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap border ${
              activeSubTab === 'ports'
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent'
            }`}
          >
            <Network size={15} className={activeSubTab === 'ports' ? 'text-purple-400' : 'text-zinc-500'} />
            <span>{t('monitor.subtabPorts')}</span>
            <Badge variant="secondary" className="bg-zinc-950 text-zinc-400 text-[10px] px-1.5 py-0 font-mono">
              {openPorts.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap border ${
              activeSubTab === 'logs'
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent'
            }`}
          >
            <ScrollText size={15} className={activeSubTab === 'logs' ? 'text-amber-400' : 'text-zinc-500'} />
            <span>{t('monitor.subtabLogs')}</span>
            <Badge variant="secondary" className="bg-zinc-950 text-zinc-400 text-[10px] px-1.5 py-0 font-mono">
              {systemLogs.length}
            </Badge>
          </button>
        </div>

        {/* Right: Live Polling & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-1 font-mono gap-1.5 whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live (2.5s)
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs h-8 px-3 gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{language === 'en' ? 'Refresh' : 'Làm mới'}</span>
          </Button>
        </div>
      </div>

      {/* Sub-Tab Content Rendering */}
      {activeSubTab === 'network' ? (
        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="px-4 sm:px-6 py-4 pb-8">
            <NetworkDiagnosticsView />
          </div>
        </ScrollArea>
      ) : activeSubTab === 'ports' ? (
        <div className="flex-1 min-h-0 w-full">
          <PortList />
        </div>
      ) : activeSubTab === 'logs' ? (
        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="px-4 sm:px-6 py-4 pb-8">
            <SystemLogsView />
          </div>
        </ScrollArea>
      ) : (
        /* Sub-Tab 1: System Gauges & Process Cards/Table */
        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="px-4 sm:px-6 py-4 space-y-5 pb-8">
            {/* Top System Gauges Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. CPU Usage Card */}
              <div className="p-5 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/90 rounded-2xl relative overflow-hidden shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Cpu size={16} className="text-emerald-400" />
                    {language === 'en' ? 'System CPU' : 'CPU Hệ thống'}
                  </span>
                  <Badge
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md ${
                      cpuPercent > 80
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : cpuPercent > 50
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {cpuPercent}%
                  </Badge>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-100 tracking-tight my-2.5">
                  {cpuPercent}%
                </div>

                <div className="w-full h-2.5 rounded-full bg-zinc-950 overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      cpuPercent > 80 ? 'bg-red-500' : cpuPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, cpuPercent))}%` }}
                  />
                </div>

                <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
                  <span className="font-semibold">{systemMetrics?.cpuCount || 0} Cores</span>
                  <span className="font-mono text-zinc-500 truncate max-w-[200px]" title={systemMetrics?.cpuModel}>
                    {systemMetrics?.cpuModel || 'Generic CPU'}
                  </span>
                </div>
              </div>

              {/* 2. RAM Usage Card */}
              <div className="p-5 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/90 rounded-2xl relative overflow-hidden shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <HardDrive size={16} className="text-blue-400" />
                    {language === 'en' ? 'System Memory' : 'Bộ nhớ RAM'}
                  </span>
                  <Badge
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md ${
                      ramPercent > 85
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : ramPercent > 70
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}
                  >
                    {ramPercent}%
                  </Badge>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-100 tracking-tight my-2.5">
                  {systemMetrics ? formatBytes(systemMetrics.usedMemoryBytes) : '0 GB'}
                  <span className="text-sm font-normal text-zinc-500 ml-1.5 font-sans">
                    / {systemMetrics ? formatBytes(systemMetrics.totalMemoryBytes) : '0 GB'}
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-zinc-950 overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      ramPercent > 85 ? 'bg-red-500' : ramPercent > 70 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, ramPercent))}%` }}
                  />
                </div>

                <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
                  <span>{language === 'en' ? 'Available:' : 'Còn trống:'} <strong className="text-zinc-300 font-mono">{systemMetrics ? formatBytes(systemMetrics.freeMemoryBytes) : '0 GB'}</strong></span>
                  <span className="font-mono text-zinc-500">
                    {Math.round((systemMetrics?.totalMemoryBytes || 0) / (1024 * 1024 * 1024))} GB Total
                  </span>
                </div>
              </div>

              {/* 3. System Stats & Tracked Processes Card */}
              <div className="p-5 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/90 rounded-2xl relative overflow-hidden shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Clock size={16} className="text-purple-400" />
                    {language === 'en' ? 'System Uptime' : 'Thời gian Uptime'}
                  </span>
                  <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300 font-mono px-2 py-0.5">
                    Uptime
                  </Badge>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-100 tracking-tight my-2.5">
                  {systemMetrics ? formatUptime(systemMetrics.uptimeSeconds) : '0h 0m'}
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-zinc-500" />
                    {language === 'en' ? 'Tracked Processes:' : 'Tiến trình theo dõi:'}
                  </span>
                  <span className="font-bold font-mono text-emerald-400 text-sm">
                    {processMetrics.length} PIDs
                  </span>
                </div>
              </div>
            </div>

            {/* Process Toolbar (Search & View Mode Toggles) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/90">
              <div className="flex items-center gap-2.5">
                <Terminal size={16} className="text-emerald-400" />
                <span className="text-sm font-bold text-zinc-100">
                  {language === 'en' ? 'Terminal & Network Processes' : 'Chi Tiết Tiến Trình Terminal & Mạng'}
                </span>
                <Badge variant="secondary" className="bg-zinc-950 text-zinc-300 font-mono text-xs px-2 py-0.5 border border-zinc-800">
                  {sortedAndFilteredProcesses.length} / {processMetrics.length}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'en' ? 'Search by process name, PID, port...' : 'Tìm theo tên tiến trình, PID, cổng...'}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-8.5 pl-9 font-mono"
                  />
                </div>

                {/* View Mode Switcher: Table vs 2-Column Cards */}
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 shrink-0">
                  <button
                    onClick={() => toggleViewMode('table')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'table' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={language === 'en' ? 'Table View' : 'Chế độ Bảng Danh Sách'}
                  >
                    <TableIcon size={15} />
                  </button>
                  <button
                    onClick={() => toggleViewMode('cards')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'cards' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={language === 'en' ? 'Cards View' : 'Chế độ Thẻ Danh Sách như Ports'}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>

                {/* Full Width vs Centered Web Layout Switcher */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8.5 w-8.5 shrink-0 ${
                    layoutWidth === 'centered' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                  onClick={toggleLayoutWidth}
                  title={layoutWidth === 'centered'
                    ? (language === 'en' ? 'Switch to Full Width mode' : 'Chuyển sang chế độ Tràn viền')
                    : (language === 'en' ? 'Switch to Centered Web mode' : 'Chuyển sang chế độ Dạng Web ở giữa')}
                >
                  {layoutWidth === 'centered' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>
              </div>
            </div>

            {/* Process Content Render */}
            <div className={layoutWidth === 'centered' ? 'max-w-5xl mx-auto' : 'w-full'}>
            {processMetrics.length === 0 ? (
              <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
                <Terminal size={36} className="mx-auto text-zinc-600 mb-3" />
                <div className="text-base font-semibold text-zinc-300">
                  {language === 'en' ? 'No active processes running' : 'Không có tiến trình nào đang chạy'}
                </div>
                <p className="text-xs text-zinc-500 mt-1.5">
                  {language === 'en'
                    ? 'Open a new Terminal or start a local server to begin resource monitoring.'
                    : 'Mở một Terminal mới hoặc khởi động một server chiếm port để bắt đầu theo dõi tài nguyên.'}
                </p>
              </div>
            ) : viewMode === 'cards' ? (
              /* ─── 2-COLUMN CARD LIST VIEW ─── */
              <div className={columns === 2 ? `${twoColumnListClass} pb-4` : 'space-y-2.5 pb-4'}>
                {sortedAndFilteredProcesses.map((proc) => {
                  const isExpanded = expandedPid === proc.pid
                  const isHighRam = proc.memoryMb > 500
                  const isHighCpu = proc.cpuPercent > 30
                  const termSession = Object.entries(sessions).find(([, s]) => s.pid === proc.pid)
                  const portInfo = openPorts.find((p) => p.pid === proc.pid)

                  return (
                    <div
                      key={proc.pid}
                      className="group rounded-xl border border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700/80 hover:bg-zinc-900/90 transition-all duration-150 overflow-hidden shadow-sm"
                    >
                      <div
                        className="flex items-center justify-between gap-2.5 px-3.5 py-3 cursor-pointer"
                        onClick={() => setExpandedPid(isExpanded ? null : proc.pid)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown size={14} className="shrink-0 text-zinc-400" />
                            ) : (
                              <ChevronRight size={14} className="shrink-0 text-zinc-400" />
                            )}
                            {termSession ? (
                              <Terminal size={15} className="shrink-0 text-blue-400" />
                            ) : portInfo ? (
                              <Radio size={15} className="shrink-0 text-purple-400" />
                            ) : (
                              <Cpu size={15} className="shrink-0 text-emerald-400" />
                            )}
                            <span className="text-sm font-bold text-zinc-100 truncate">
                              {proc.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                              PID: {proc.pid}
                            </span>
                            {portInfo && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                :{portInfo.port}
                              </span>
                            )}
                            {isHighRam && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                                High RAM
                              </span>
                            )}
                            {isHighCpu && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                                High CPU
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-zinc-400 font-mono truncate mt-1.5 ml-6">
                            <span className={proc.cpuPercent > 30 ? 'text-red-400 font-bold' : ''}>
                              CPU: {proc.cpuPercent}%
                            </span>
                            {' · '}
                            <span className={proc.memoryMb > 500 ? 'text-amber-400 font-bold' : ''}>
                              RAM: {proc.memoryMb.toLocaleString()} MB
                            </span>
                            {' · '}
                            <span className="text-zinc-500">
                              {termSession ? `Terminal (${termSession[1].shell || 'Shell'})` : portInfo ? `Port :${portInfo.port}` : (language === 'en' ? 'Dev Process' : 'Hệ thống dev')}
                            </span>
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-red-400/80 hover:text-red-300 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={(e) => handleKillProc(proc.pid, proc.name, e)}
                          title={language === 'en' ? 'Force kill this process' : 'Buộc dừng tiến trình này (Kill)'}
                        >
                          <XCircle size={17} />
                        </Button>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-4 py-3 border-t border-zinc-800/80 bg-zinc-900/50 space-y-2.5 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800">
                              <span className="text-[10px] text-zinc-500 block">PID</span>
                              <span className="font-mono font-bold text-zinc-200">{proc.pid}</span>
                            </div>
                            <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800">
                              <span className="text-[10px] text-zinc-500 block">
                                {language === 'en' ? 'CPU Usage' : 'CPU sử dụng'}
                              </span>
                              <span className={`font-mono font-bold ${proc.cpuPercent > 30 ? 'text-red-400' : 'text-zinc-200'}`}>
                                {proc.cpuPercent}%
                              </span>
                            </div>
                            <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800">
                              <span className="text-[10px] text-zinc-500 block">
                                {language === 'en' ? 'RAM Usage' : 'RAM sử dụng'}
                              </span>
                              <span className={`font-mono font-bold ${proc.memoryMb > 500 ? 'text-amber-400' : 'text-zinc-200'}`}>
                                {proc.memoryMb.toLocaleString()} MB
                              </span>
                            </div>
                            <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800">
                              <span className="text-[10px] text-zinc-500 block">
                                {language === 'en' ? 'Port / Origin' : 'Cổng / Nguồn gốc'}
                              </span>
                              <span className="font-mono font-bold text-zinc-200">
                                {portInfo ? `Port :${portInfo.port}` : termSession ? `Terminal` : 'System'}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => handleKillProc(proc.pid, proc.name, e)}
                              className="h-8 text-xs px-3.5 font-semibold gap-1.5 cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>{language === 'en' ? 'Kill Process' : 'Buộc dừng tiến trình (Kill)'}</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* ─── COMPACT TABLE VIEW ─── */
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold border-b border-zinc-800 select-none">
                      <tr>
                        <th
                          onClick={() => handleSort('pid')}
                          className="py-3 px-4 w-28 cursor-pointer hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                        >
                          <div className="flex items-center">
                            <span>PID</span>
                            {renderSortIcon('pid')}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('name')}
                          className="py-3 px-4 cursor-pointer hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                        >
                          <div className="flex items-center">
                            <span>{language === 'en' ? 'Process Name' : 'Tên Tiến Trình'}</span>
                            {renderSortIcon('name')}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('network')}
                          className="py-3 px-4 w-48 cursor-pointer hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                        >
                          <div className="flex items-center">
                            <span>{language === 'en' ? 'Network / Port' : 'Mạng / Cổng'}</span>
                            {renderSortIcon('network')}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('cpu')}
                          className="py-3 px-4 w-32 cursor-pointer hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                        >
                          <div className="flex items-center">
                            <span>CPU (%)</span>
                            {renderSortIcon('cpu')}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('ram')}
                          className="py-3 px-4 w-36 cursor-pointer hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                        >
                          <div className="flex items-center">
                            <span>RAM (MB)</span>
                            {renderSortIcon('ram')}
                          </div>
                        </th>
                        <th className="py-3 px-4 w-24 text-right">
                          {language === 'en' ? 'Actions' : 'Thao tác'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {sortedAndFilteredProcesses.map((proc) => {
                        const isHighRam = proc.memoryMb > 500
                        const isHighCpu = proc.cpuPercent > 30
                        const termSession = Object.entries(sessions).find(([, s]) => s.pid === proc.pid)
                        const portInfo = openPorts.find((p) => p.pid === proc.pid)

                        return (
                          <tr key={proc.pid} className="hover:bg-zinc-800/40 transition-colors group">
                            <td className="py-3 px-4 font-mono font-semibold text-zinc-400">
                              {proc.pid}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                                  {proc.name}
                                </span>
                                {isHighRam && (
                                  <Badge className="text-[9px] py-0 px-1 bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono">
                                    High RAM
                                  </Badge>
                                )}
                                {isHighCpu && (
                                  <Badge className="text-[9px] py-0 px-1 bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                                    High CPU
                                  </Badge>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {termSession ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-500/10 text-blue-400 border-blue-500/30 font-mono text-[10px] gap-1"
                                >
                                  <Terminal size={10} />
                                  Terminal ({termSession[1].shell || 'Shell'})
                                </Badge>
                              ) : portInfo ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-purple-500/15 text-purple-300 border-purple-500/40 font-mono text-[10px] gap-1"
                                >
                                  <Globe size={10} className="text-purple-400" />
                                  Port :{portInfo.port}
                                </Badge>
                              ) : (
                                <span className="text-zinc-500 text-[11px]">{language === 'en' ? 'Dev Process' : 'Hệ thống dev'}</span>
                              )}
                            </td>

                            <td className="py-3 px-4 font-mono font-semibold text-zinc-200">
                              <span className={proc.cpuPercent > 30 ? 'text-red-400 font-bold' : proc.cpuPercent > 5 ? 'text-amber-400' : ''}>
                                {proc.cpuPercent}%
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono font-semibold text-zinc-200">
                              <span className={proc.memoryMb > 500 ? 'text-amber-400 font-bold' : ''}>
                                {proc.memoryMb.toLocaleString()} MB
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleKillProc(proc.pid, proc.name, e)}
                                className="h-6.5 px-2.5 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/15 rounded gap-1 cursor-pointer"
                                title={language === 'en' ? 'Force kill this process' : 'Buộc dừng tiến trình'}
                              >
                                <Trash2 size={12} />
                                <span>Kill</span>
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
