import React, { useEffect, useState, useMemo } from 'react'
import { useDockerStore } from '@/stores/docker-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useTranslation } from '@/stores/i18n-store'
import { confirmAction } from '@/stores/confirm-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Box,
  Play,
  Square,
  RotateCw,
  Trash2,
  Terminal,
  FileText,
  Search,
  RefreshCw,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ExternalLink,
  Cpu,
  HardDrive
} from 'lucide-react'
import { toast } from 'sonner'
import { twoColumnListClass } from '@/lib/utils'
import type { DockerContainer } from '@shared/types'

interface DockerManagerProps {
  onNavigateToTerminal?: () => void
}

export function DockerManager({ onNavigateToTerminal }: DockerManagerProps): React.JSX.Element {
  const {
    isAvailable,
    daemonVersion,
    errorMessage,
    containers,
    loading,
    actionLoading,
    activeLogsContainerId,
    activeLogs,
    logsLoading,
    fetchContainers,
    controlContainer,
    fetchLogs,
    closeLogs
  } = useDockerStore()

  const { createTerminal } = useTerminalStore()
  const { t, language } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterState, setFilterState] = useState<'all' | 'running' | 'stopped'>('all')
  const [copiedLog, setCopiedLog] = useState(false)
  const [layoutWidth, setLayoutWidth] = useState<'centered' | 'full'>(() => {
    const saved = localStorage.getItem('clim-docker-layout-width')
    return saved === 'full' ? 'full' : 'centered'
  })

  const toggleLayoutWidth = () => {
    const next = layoutWidth === 'centered' ? 'full' : 'centered'
    setLayoutWidth(next)
    localStorage.setItem('clim-docker-layout-width', next)
  }

  useEffect(() => {
    fetchContainers()
  }, [])

  // Filtered containers
  const filteredContainers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return containers.filter((c) => {
      if (filterState === 'running' && c.state !== 'running') return false
      if (filterState === 'stopped' && c.state === 'running') return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.image.toLowerCase().includes(q) ||
        c.ports.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      )
    })
  }, [containers, searchQuery, filterState])

  const runningCount = containers.filter((c) => c.state === 'running').length
  const stoppedCount = containers.length - runningCount

  const handleOpenShell = async (container: DockerContainer) => {
    const title = `Docker: ${container.name}`
    const sessionId = await createTerminal({
      shell: 'powershell',
      title
    })
    if (onNavigateToTerminal) onNavigateToTerminal()
    setTimeout(() => {
      // Try bash first, fallback to sh
      window.api.terminal.input(sessionId, `docker exec -it ${container.name} sh\r`)
    }, 500)
    toast.success(
      language === 'en'
        ? `Opening Shell into container "${container.name}"`
        : `Đang mở Shell vào container "${container.name}"`
    )
  }

  const handleDeleteContainer = async (container: DockerContainer) => {
    const ok = await confirmAction({
      title: language === 'en' ? `Delete Container "${container.name}"?` : `Xóa Container "${container.name}"?`,
      description:
        language === 'en'
          ? `This action will permanently delete container ${container.id} (${container.image}). Unmounted volume data might be lost.`
          : `Hành động này sẽ xóa vĩnh viễn container ${container.id} (${container.image}). Dữ liệu chưa mount volume có thể bị mất.`,
      confirmText: language === 'en' ? 'Delete Container' : 'Xác Nhận Xóa',
      variant: 'destructive'
    })
    if (ok) controlContainer('rm', container.id, container.name)
  }

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(activeLogs)
    setCopiedLog(true)
    setTimeout(() => setCopiedLog(false), 2000)
    toast.success(language === 'en' ? 'Logs copied to clipboard' : 'Đã sao chép toàn bộ logs vào clipboard')
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Header Toolbar */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl shrink-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Box size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                  {t('docker.title')}
                </h2>
                {isAvailable ? (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono flex items-center gap-1">
                    <CheckCircle2 size={11} /> {daemonVersion || 'Daemon Active'}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] font-mono flex items-center gap-1">
                    <XCircle size={11} /> Offline
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t('dropdowns.dockerDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchContainers()}
              disabled={loading}
              className="h-8 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-400' : ''} />
              <span>{t('common.refresh')}</span>
            </Button>

            <button
              onClick={toggleLayoutWidth}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title={layoutWidth === 'centered' ? t('common.fullWidth') : t('common.webWidth')}
            >
              {layoutWidth === 'centered' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Filters & Status Counters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('docker.searchPlaceholder')}
              className="pl-9 h-8 bg-zinc-900/80 border-zinc-800 text-xs focus:border-blue-500/50"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 text-xs">
            <button
              onClick={() => setFilterState('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterState === 'all'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t('common.all')} ({containers.length})
            </button>
            <button
              onClick={() => setFilterState('running')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                filterState === 'running'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t('docker.running')} ({runningCount})</span>
            </button>
            <button
              onClick={() => setFilterState('stopped')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                filterState === 'stopped'
                  ? 'bg-zinc-800 text-zinc-200 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>{t('docker.stopped')} ({containers.length - runningCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Containers Content Area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={`p-4 ${layoutWidth === 'centered' ? 'max-w-6xl mx-auto' : 'w-full'}`}>
          {/* Offline Warning Banner */}
          {!isAvailable && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3.5 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-amber-300">
                  {t('docker.notRunning') || (language === 'en' ? 'Docker Engine Offline' : 'Docker Engine Chưa Khởi Chạy')}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {errorMessage || (t('docker.notRunningDesc') || (language === 'en' ? 'Please launch Docker Desktop or execute "systemctl start docker" to manage containers.' : 'Vui lòng mở ứng dụng Docker Desktop hoặc chạy lệnh "systemctl start docker" để quản lý containers.'))}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchContainers()}
                  className="h-7 text-xs border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 mt-1 cursor-pointer"
                >
                  <RefreshCw size={11} className="mr-1" /> {language === 'en' ? 'Retry Connection' : 'Thử Kết Nối Lại'}
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {isAvailable && filteredContainers.length === 0 && (
            <div className="text-center py-16 space-y-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/60 p-8">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-500 mx-auto">
                <Box size={24} />
              </div>
              <h4 className="font-bold text-zinc-300 text-sm">
                {t('docker.noContainers') || (language === 'en' ? 'No containers found' : 'Không tìm thấy container nào')}
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {language === 'en' ? 'No containers running or matching your search filter.' : 'Chưa có container nào đang chạy hoặc không khớp với từ khóa tìm kiếm.'}
              </p>
            </div>
          )}

          {/* Container Cards Grid */}
          {filteredContainers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredContainers.map((container) => {
                const isRunning = container.state === 'running'
                const isBusy = actionLoading[container.id]

                return (
                  <div
                    key={container.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 space-y-3.5 ${
                      isRunning
                        ? 'bg-zinc-900/90 border-zinc-800 hover:border-emerald-500/40 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-750 opacity-90'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${isRunning ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-zinc-600'}`} />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-zinc-100 truncate" title={container.name}>
                            {container.name}
                          </h4>
                          <span className="font-mono text-[11px] text-zinc-400 truncate block" title={container.image}>
                            {container.image}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 shrink-0 ${
                          isRunning
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {container.status || container.state}
                      </Badge>
                    </div>

                    {/* Metadata Specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60 font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase">Container ID</span>
                        <span className="text-zinc-300 font-semibold">{container.id}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase">
                          {language === 'en' ? 'Open Ports' : 'Cổng Mở (Ports)'}
                        </span>
                        <span className="text-emerald-400 truncate block" title={container.ports || (language === 'en' ? 'None' : 'Không có')}>
                          {container.ports || (language === 'en' ? 'None' : 'Không có')}
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1">
                        {isRunning ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => controlContainer('stop', container.id, container.name)}
                            className="h-8 px-2.5 text-xs text-amber-400 hover:bg-amber-500/15 cursor-pointer gap-1"
                            title={language === 'en' ? 'Stop Container' : 'Dừng Container'}
                          >
                            <Square size={13} />
                            <span>{language === 'en' ? 'Stop' : 'Dừng'}</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => controlContainer('start', container.id, container.name)}
                            className="h-8 px-2.5 text-xs text-emerald-400 hover:bg-emerald-500/15 cursor-pointer gap-1"
                            title={language === 'en' ? 'Start Container' : 'Khởi chạy Container'}
                          >
                            <Play size={13} />
                            <span>{language === 'en' ? 'Start' : 'Chạy'}</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => controlContainer('restart', container.id, container.name)}
                          className="h-8 px-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                          title={language === 'en' ? 'Restart Container' : 'Khởi động lại'}
                        >
                          <RotateCw size={13} className={isBusy ? 'animate-spin' : ''} />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => fetchLogs(container.id)}
                          className="h-8 px-2.5 text-xs text-purple-400 hover:bg-purple-500/15 cursor-pointer gap-1"
                          title={language === 'en' ? 'View real-time logs' : 'Xem Logs thời gian thực'}
                        >
                          <FileText size={13} />
                          <span>Logs</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {isRunning && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenShell(container)}
                            className="h-8 px-2.5 text-xs border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 cursor-pointer gap-1"
                            title={language === 'en' ? 'Open interactive container shell' : 'Mở Terminal tương tác bên trong container'}
                          >
                            <Terminal size={12} />
                            <span>Shell</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => handleDeleteContainer(container)}
                          className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/15 cursor-pointer"
                          title={language === 'en' ? 'Delete Container' : 'Xóa Container'}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Live Logs Modal */}
      <Dialog open={Boolean(activeLogsContainerId)} onOpenChange={(open) => !open && closeLogs()}>
        <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-zinc-100 p-0 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b border-zinc-800 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FileText size={16} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-zinc-100">
                  {t('docker.logsTitle') || (language === 'en' ? 'Container Logs' : 'Logs Container')}
                </DialogTitle>
                <span className="text-xs text-zinc-400 font-mono">
                  ID: {activeLogsContainerId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLogs}
                className="h-8 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 gap-1.5 cursor-pointer"
              >
                {copiedLog ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedLog ? (language === 'en' ? 'Copied' : 'Đã chép') : (language === 'en' ? 'Copy' : 'Sao chép')}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={logsLoading}
                onClick={() => activeLogsContainerId && fetchLogs(activeLogsContainerId)}
                className="h-8 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 cursor-pointer"
                title={language === 'en' ? 'Refresh logs' : 'Làm mới log'}
              >
                <RefreshCw size={13} className={logsLoading ? 'animate-spin text-purple-400' : ''} />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 p-4 bg-zinc-950 overflow-hidden flex flex-col">
            <pre className="flex-1 p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl font-mono text-[11px] text-zinc-300 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
              {logsLoading ? (language === 'en' ? 'Loading logs...' : 'Đang tải logs...') : activeLogs || (language === 'en' ? 'No log entries available.' : 'Không có bản ghi log nào.')}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
