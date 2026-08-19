import React, { useState, useMemo } from 'react'
import { useSystemLogStore } from '@/stores/system-log-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTranslation } from '@/stores/i18n-store'
import type { SystemLogEntry, SystemLogLevel, SystemLogCategory } from '@shared/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ScrollText,
  Search,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Terminal,
  ShieldAlert,
  Clock,
  Globe,
  FolderSync,
  Container,
  Zap,
  Network,
  Cloud,
  Laptop,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Columns2,
  Rows3,
  RefreshCw,
  FileJson,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

export function SystemLogsView(): React.JSX.Element {
  const { logs, filter, setFilter, clearLogs, exportLogs } = useSystemLogStore()
  const { settings, updateSettings } = useSettingsStore()
  const { t, language } = useTranslation()

  const columns = settings.systemLogColumns || 1
  const layoutWidth = settings.systemLogLayoutWidth || 'full'

  const toggleColumns = () => {
    updateSettings({ systemLogColumns: columns === 1 ? 2 : 1 })
  }

  const toggleLayoutWidth = () => {
    updateSettings({ systemLogLayoutWidth: layoutWidth === 'centered' ? 'full' : 'centered' })
  }

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Copy log content helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(language === 'en' ? 'Log content copied to clipboard!' : 'Đã sao chép nội dung log!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search text match
      if (filter.search.trim()) {
        const query = filter.search.toLowerCase()
        const matchMsg = log.message.toLowerCase().includes(query)
        const matchSrc = log.source.toLowerCase().includes(query)
        const matchDet = log.details?.toLowerCase().includes(query)
        if (!matchMsg && !matchSrc && !matchDet) return false
      }

      // Level match
      if (filter.level !== 'all' && log.level !== filter.level) {
        return false
      }

      // Category match
      if (filter.category !== 'all' && log.category !== filter.category) {
        return false
      }

      return true
    })
  }, [logs, filter])

  // Statistics
  const stats = useMemo(() => {
    let info = 0
    let success = 0
    let warning = 0
    let error = 0
    for (const l of logs) {
      if (l.level === 'info') info++
      else if (l.level === 'success') success++
      else if (l.level === 'warning') warning++
      else if (l.level === 'error') error++
    }
    return { total: logs.length, info, success, warning, error }
  }, [logs])

  // Category Icon & Color
  const getCategoryMeta = (cat: SystemLogCategory) => {
    switch (cat) {
      case 'terminal':
        return { label: 'Terminal', icon: Terminal, color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' }
      case 'watchdog':
        return { label: 'Watchdog', icon: ShieldAlert, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' }
      case 'scheduler':
        return { label: language === 'en' ? 'Scheduler' : 'Lập Lịch', icon: Clock, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' }
      case 'ssh':
        return { label: language === 'en' ? 'SSH Host' : 'Máy Chủ SSH', icon: Globe, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' }
      case 'sftp':
        return { label: language === 'en' ? 'SFTP File' : 'SFTP File', icon: FolderSync, color: 'text-sky-400 bg-sky-500/15 border-sky-500/30' }
      case 'docker':
        return { label: 'Docker', icon: Container, color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' }
      case 'network':
        return { label: language === 'en' ? 'Network' : 'Mạng', icon: Zap, color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' }
      case 'ports':
        return { label: language === 'en' ? 'Ports' : 'Cổng Mạng', icon: Network, color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' }
      case 'cloud':
        return { label: 'Cloud Sync', icon: Cloud, color: 'text-teal-400 bg-teal-500/15 border-teal-500/30' }
      default:
        return { label: language === 'en' ? 'System' : 'Hệ Thống', icon: Laptop, color: 'text-zinc-400 bg-zinc-800 border-zinc-700' }
    }
  }

  // Level Meta
  const getLevelMeta = (level: SystemLogLevel) => {
    switch (level) {
      case 'success':
        return { label: 'SUCCESS', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
      case 'warning':
        return { label: 'WARN', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
      case 'error':
        return { label: 'ERROR', icon: AlertOctagon, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' }
      default:
        return { label: 'INFO', icon: Info, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' }
    }
  }

  const containerClasses =
    layoutWidth === 'centered'
      ? 'max-w-6xl mx-auto w-full transition-all duration-300'
      : 'w-full transition-all duration-300'

  return (
    <div className={`${containerClasses} space-y-4`}>
      {/* 1. Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-md flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{t('systemLogs.totalEvents')}</span>
            <div className="text-xl font-bold font-mono text-zinc-100">{stats.total}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
            <ScrollText size={16} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-md flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">{t('systemLogs.success')}</span>
            <div className="text-xl font-bold font-mono text-emerald-400">{stats.success}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={16} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-md flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">{t('systemLogs.info')}</span>
            <div className="text-xl font-bold font-mono text-blue-400">{stats.info}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <Info size={16} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-md flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">{t('systemLogs.warning')}</span>
            <div className="text-xl font-bold font-mono text-amber-400">{stats.warning}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <AlertTriangle size={16} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-md flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">{t('systemLogs.error')}</span>
            <div className="text-xl font-bold font-mono text-rose-400">{stats.error}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
            <AlertOctagon size={16} />
          </div>
        </div>
      </div>

      {/* 2. Filter & Controls Toolbar */}
      <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder={t('systemLogs.searchPlaceholder')}
              value={filter.search}
              onChange={(e) => setFilter({ search: e.target.value })}
              className="pl-8.5 h-8.5 bg-zinc-950/80 border-zinc-750 text-xs text-zinc-100 rounded-xl"
            />
          </div>

          {/* Level Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-950 border border-zinc-800 rounded-xl">
            {(['all', 'info', 'success', 'warning', 'error'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter({ level: lvl })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  filter.level === lvl
                    ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lvl === 'all' ? t('systemLogs.allLevels') : lvl}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={filter.category}
            onChange={(e) => setFilter({ category: e.target.value as any })}
            className="h-8.5 px-2.5 bg-zinc-950 border border-zinc-750 text-zinc-300 text-xs rounded-xl focus:outline-none focus:border-amber-500 cursor-pointer font-sans"
          >
            <option value="all">{language === 'en' ? '🌐 All Subsystems' : '🌐 Tất cả phân hệ'}</option>
            <option value="terminal">🟣 Terminal</option>
            <option value="watchdog">🛡️ Watchdog</option>
            <option value="scheduler">{language === 'en' ? '⏰ Scheduler' : '⏰ Lập Lịch'}</option>
            <option value="ssh">{language === 'en' ? '🌐 SSH Host' : '🌐 Máy Chủ SSH'}</option>
            <option value="sftp">{language === 'en' ? '📁 SFTP Manager' : '📁 Quản Lý SFTP'}</option>
            <option value="docker">🐳 Docker</option>
            <option value="network">{language === 'en' ? '⚡ Network' : '⚡ Mạng'}</option>
            <option value="ports">{language === 'en' ? '🔌 Network Ports' : '🔌 Cổng Mạng'}</option>
            <option value="cloud">☁️ Cloud Sync</option>
            <option value="system">{language === 'en' ? '💻 System' : '💻 Hệ Thống'}</option>
          </select>
        </div>

        {/* Right: Layout Switchers & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Export Dropdown buttons */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportLogs('txt')}
            className="h-8 px-2.5 text-xs border-zinc-750 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 gap-1.5 cursor-pointer rounded-xl"
            title={language === 'en' ? 'Export log in text format (.txt)' : 'Xuất log định dạng text (.txt)'}
          >
            <FileText size={13} className="text-amber-400" />
            <span>TXT</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => exportLogs('json')}
            className="h-8 px-2.5 text-xs border-zinc-750 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 gap-1.5 cursor-pointer rounded-xl"
            title={language === 'en' ? 'Export log in JSON format (.json)' : 'Xuất log định dạng JSON (.json)'}
          >
            <FileJson size={13} className="text-cyan-400" />
            <span>JSON</span>
          </Button>

          <div className="h-4 w-[1px] bg-zinc-700 mx-0.5" />

          {/* 1 Col / 2 Col toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleColumns}
            className="h-8 w-8 p-0 border-zinc-750 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 cursor-pointer rounded-xl"
            title={columns === 1 ? t('common.twoColumns') : t('common.oneColumn')}
          >
            {columns === 1 ? <Columns2 size={14} /> : <Rows3 size={14} />}
          </Button>

          {/* Full-width / Centered layout toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleLayoutWidth}
            className="h-8 w-8 p-0 border-zinc-750 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 cursor-pointer rounded-xl"
            title={layoutWidth === 'centered' ? t('common.fullWidth') : t('common.webWidth')}
          >
            {layoutWidth === 'centered' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </Button>

          {/* Clear Logs */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (logs.length === 0) return
              if (confirm(language === 'en' ? 'Are you sure you want to clear all system logs history?' : 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử log hệ thống không?')) {
                clearLogs()
                toast.success(language === 'en' ? 'System log history cleared' : 'Đã xóa sạch lịch sử log hệ thống')
              }
            }}
            disabled={logs.length === 0}
            className="h-8 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer rounded-xl disabled:opacity-30"
            title={t('systemLogs.clearLogs')}
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">{t('systemLogs.clearLogs')}</span>
          </Button>
        </div>
      </div>

      {/* 3. Log Entries List */}
      {filteredLogs.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800/80 border-dashed space-y-2">
          <ScrollText size={36} className="mx-auto text-zinc-600 animate-pulse" />
          <p className="text-sm font-semibold text-zinc-400">{t('systemLogs.noLogs')}</p>
        </div>
      ) : (
        <div className={columns === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5' : 'space-y-2'}>
          {filteredLogs.map((log) => {
            const catMeta = getCategoryMeta(log.category)
            const lvlMeta = getLevelMeta(log.level)
            const CatIcon = catMeta.icon
            const LvlIcon = lvlMeta.icon
            const isExpanded = expandedLogId === log.id

            return (
              <div
                key={log.id}
                className={`p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700/90 transition-all duration-200 shadow-sm hover:shadow-[0_0_25px_rgba(245,158,11,0.06)] group ${
                  log.level === 'error'
                    ? 'hover:border-rose-500/40 bg-rose-950/10'
                    : log.level === 'warning'
                      ? 'hover:border-amber-500/40 bg-amber-950/10'
                      : ''
                }`}
              >
                {/* Header: Timestamp, Category & Level */}
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 gap-1 font-semibold ${catMeta.color}`}>
                      <CatIcon size={11} />
                      <span>{catMeta.label}</span>
                    </Badge>

                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 gap-1 font-mono font-bold ${lvlMeta.color}`}>
                      <LvlIcon size={11} />
                      <span>{lvlMeta.label}</span>
                    </Badge>

                    <span className="text-xs font-mono font-bold text-zinc-300 truncate" title={log.source}>
                      {log.source}
                    </span>
                  </div>

                  {/* Timestamp & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-zinc-500">
                      {new Date(log.timestamp).toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN')}
                    </span>
                    <button
                      onClick={() => handleCopy(log.id, `${log.source}: ${log.message}${log.details ? `\nDetails:\n${log.details}` : ''}`)}
                      className="p-1 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                      title={language === 'en' ? 'Copy this log entry' : 'Sao chép log này'}
                    >
                      {copiedId === log.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="pt-2 text-xs text-zinc-200 leading-relaxed font-sans select-text">
                  {log.message}
                </div>

                {/* Optional Details Expandable */}
                {log.details && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/40">
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-zinc-400 hover:text-amber-300 cursor-pointer transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span>{isExpanded ? (language === 'en' ? 'Hide log details' : 'Ẩn chi tiết log') : (language === 'en' ? 'View log details / payload' : 'Xem chi tiết log / payload')}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-60 scrollbar-thin whitespace-pre-wrap select-text">
                        {log.details}
                      </div>
                    )}
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
