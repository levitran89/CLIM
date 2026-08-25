import React, { useEffect } from 'react'
import { useMonitorStore } from '@/stores/monitor-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useCommandStore } from '@/stores/command-store'
import { useSequenceStore } from '@/stores/sequence-store'
import { useProfileStore } from '@/stores/profile-store'
import { useSchedulerStore } from '@/stores/scheduler-store'
import { useSSHStore } from '@/stores/ssh-store'
import { useDockerStore } from '@/stores/docker-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTranslation } from '@/stores/i18n-store'
import { confirmAction } from '@/stores/confirm-store'
import { toast } from 'sonner'
import { useCommandRunner } from '@/components/providers/CommandRunnerProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Cpu,
  HardDrive,
  Network,
  Terminal,
  Server,
  Play,
  Square,
  SlidersHorizontal,
  Clock,
  Store,
  Sparkles,
  Search,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Box,
  List,
  Globe,
  Radio,
  Star,
  ScrollText,
  SquareTerminal,
  LayoutGrid
} from 'lucide-react'
import type { AppTab } from '@/components/layout/MainContent'
import type { Command } from '@shared/types'
import { cn } from '@/lib/utils'

const shellColors: Record<string, string> = {
  powershell: 'text-blue-400',
  cmd: 'text-amber-400',
  wsl: 'text-orange-400'
}

interface DashboardOverviewProps {
  onNavigateTab: (tab: AppTab) => void
  onOpenSnippetHub: () => void
  onOpenAiCopilot: () => void
  onOpenPalette: () => void
}

export function DashboardOverview({
  onNavigateTab,
  onOpenSnippetHub,
  onOpenAiCopilot,
  onOpenPalette
}: DashboardOverviewProps): React.JSX.Element {
  const { systemMetrics, fetchMetrics } = useMonitorStore()
  const { sessions, killTerminal } = useTerminalStore()
  const { commands } = useCommandStore()
  const { sequences } = useSequenceStore()
  const { profiles, getActiveProfile } = useProfileStore()
  const { tasks } = useSchedulerStore()
  const { hosts } = useSSHStore()
  const { containers, isAvailable: isDockerAvailable, fetchContainers, checkStatus: checkDockerStatus } = useDockerStore()
  const { settings, updateSettings } = useSettingsStore()
  const { t, language } = useTranslation()

  const isCompact = settings.dashboardViewMode === 'compact'
  const isGrouped = settings.dashboardGrouped || false

  useEffect(() => {
    fetchMetrics()
    checkDockerStatus()
    fetchContainers()
    const timer = setInterval(() => {
      fetchMetrics()
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  const cpuPercent = Math.round(systemMetrics?.cpuUsagePercent || 0)
  const ramUsedGb = systemMetrics?.usedMemoryBytes
    ? (systemMetrics.usedMemoryBytes / 1024 / 1024 / 1024).toFixed(1)
    : '0'
  const ramTotalGb = systemMetrics?.totalMemoryBytes
    ? (systemMetrics.totalMemoryBytes / 1024 / 1024 / 1024).toFixed(1)
    : '0'
  const ramPercent = Math.round(systemMetrics?.memoryUsagePercent || 0)

  const formatUptime = (seconds?: number): string => {
    if (!seconds) return language === 'en' ? 'Updating...' : 'Đang cập nhật'
    const days = Math.floor(seconds / (3600 * 24))
    const hours = Math.floor((seconds % (3600 * 24)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (language === 'en') {
      if (days > 0) return `${days}d ${hours}h ${minutes}m`
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    }
    if (days > 0) return `${days} ngày ${hours} giờ ${minutes} phút`
    if (hours > 0) return `${hours} giờ ${minutes} phút`
    return `${minutes} phút`
  }

  const activeProfile = getActiveProfile()
  const favoriteCommands = commands.filter((c) => c.isFavorite)
  const runningContainersCount = containers.filter((c) => c.status === 'running').length

  const { runCommand } = useCommandRunner()

  const handleRunCommand = async (cmd: Command): Promise<void> => {
    await runCommand(cmd, () => onNavigateTab('terminal'))
  }

  const handleStopCommand = async (cmd: Command, sessionId: string): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'Dừng thực thi lệnh',
      description: `Bạn có chắc chắn muốn dừng tiến trình câu lệnh "${cmd.name}" đang chạy không?`,
      confirmText: 'Dừng lệnh',
      cancelText: 'Hủy',
      variant: 'warning'
    })
    if (confirmed) {
      await killTerminal(sessionId)
      toast.success(`Đã dừng câu lệnh "${cmd.name}"`)
    }
  }

  const toggleCompactView = () => {
    updateSettings({ dashboardViewMode: isCompact ? 'full' : 'compact' })
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Banner Header */}
      <div className="px-6 py-3.5 bg-zinc-900/60 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>{t('dashboard.title')}</span>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                CLIM Hub
              </Badge>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t('dashboard.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onOpenPalette}
            className="h-8 text-xs bg-zinc-900 hover:bg-zinc-850 border border-zinc-750 text-zinc-200 gap-1.5 shadow-sm cursor-pointer"
          >
            <Search size={13} className="text-zinc-400" />
            <span>Spotlight</span>
            <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800">
              Ctrl+K
            </kbd>
          </Button>

          <Button
            size="sm"
            onClick={onOpenAiCopilot}
            className="h-8 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold gap-1.5 shadow-sm cursor-pointer"
          >
            <Sparkles size={13} />
            <span>AI Copilot</span>
          </Button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="px-6 py-5 pb-12 space-y-6">
          {/* ═══════════════════════════════════════════════════════════════════
              HÀNG 1: CPU, RAM, THỜI GIAN UPTIME (3 Thẻ Trên Cùng)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. CPU */}
            <div
              onClick={() => onNavigateTab('monitor')}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:bg-gradient-to-br hover:from-emerald-950/50 hover:via-zinc-900/90 hover:to-zinc-900 hover:border-emerald-500/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
            >
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold flex items-center gap-1.5 text-zinc-200 group-hover:text-emerald-300 transition-colors">
                  <Cpu size={15} className="text-emerald-400" />
                  {t('dashboard.cpu')}
                </span>
                <Badge
                  className={`text-[10px] font-mono ${
                    cpuPercent > 80 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  {cpuPercent}%
                </Badge>
              </div>
              <div className="text-2xl font-extrabold font-mono text-zinc-100 mt-2 mb-2 group-hover:text-emerald-200 transition-colors">
                {cpuPercent}%
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(3, cpuPercent))}%` }}
                />
              </div>
            </div>

            {/* 2. RAM */}
            <div
              onClick={() => onNavigateTab('monitor')}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:bg-gradient-to-br hover:from-blue-950/50 hover:via-zinc-900/90 hover:to-zinc-900 hover:border-blue-500/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
            >
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold flex items-center gap-1.5 text-zinc-200 group-hover:text-blue-300 transition-colors">
                  <HardDrive size={15} className="text-blue-400" />
                  {t('dashboard.ram')}
                </span>
                <span className="text-[11px] font-mono text-zinc-300 font-bold">{ramPercent}%</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-zinc-100 mt-2 mb-2 group-hover:text-blue-200 transition-colors">
                {ramUsedGb} <span className="text-sm font-sans font-normal text-zinc-400">/ {ramTotalGb} GB</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(3, ramPercent))}%` }}
                />
              </div>
            </div>

            {/* 3. Uptime */}
            <div
              onClick={() => onNavigateTab('monitor')}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:bg-gradient-to-br hover:from-purple-950/50 hover:via-zinc-900/90 hover:to-zinc-900 hover:border-purple-500/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
            >
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold flex items-center gap-1.5 text-zinc-200 group-hover:text-purple-300 transition-colors">
                  <Clock size={15} className="text-purple-400" />
                  {t('dashboard.uptime')}
                </span>
                <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] font-mono">
                  ONLINE
                </Badge>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-zinc-100 mt-2 mb-2 truncate group-hover:text-purple-200 transition-colors">
                {formatUptime(systemMetrics?.uptimeSeconds)}
              </div>
              <div className="text-xs text-zinc-500 flex items-center gap-1">
                <Activity size={12} className="text-emerald-400 animate-pulse" />
                <span>{t('about.tagline')}</span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              HÀNG 2: TERMINAL, SSH, DOCKER, LATENCY (4 Thẻ Nổi Bật Dưới Hàng 1)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Terminal (Purple Glow) */}
            <div
              onClick={() => onNavigateTab('terminal')}
              className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-zinc-900/90 to-zinc-900/90 border border-purple-500/50 hover:border-purple-400 hover:bg-purple-950/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)] group ring-1 ring-purple-500/20"
            >
              <div className="absolute -bottom-4 -right-4 text-purple-500/10 group-hover:text-purple-500/25 transition-colors pointer-events-none transform group-hover:scale-110 duration-300">
                <Terminal size={80} strokeWidth={1} />
              </div>
              
              <div className="relative z-10 flex items-center justify-between text-xs text-purple-200">
                <span className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Terminal size={15} className="text-purple-400" />
                  Terminal PTY
                </span>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-mono font-bold">
                  SESSIONS
                </Badge>
              </div>
              <div className="relative z-10 text-2xl font-extrabold font-mono text-white mt-2 mb-1">
                {sessions.length}{' '}
                <span className="text-xs font-sans font-normal text-purple-300">{t('common.running').toLowerCase()}</span>
              </div>
              <span className="relative z-10 text-xs text-purple-400 group-hover:text-purple-300 flex items-center gap-1 font-semibold transition-colors mt-2">
                {t('terminal.newTerminal')} <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            {/* 2. Remote SSH & SFTP (Amber Glow) */}
            <div
              onClick={() => onNavigateTab('ssh')}
              className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-zinc-900/90 to-zinc-900/90 border border-amber-500/50 hover:border-amber-400 hover:bg-amber-950/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)] group ring-1 ring-amber-500/20"
            >
              <div className="absolute -bottom-4 -right-4 text-amber-500/10 group-hover:text-amber-500/25 transition-colors pointer-events-none transform group-hover:scale-110 duration-300">
                <Server size={80} strokeWidth={1} />
              </div>

              <div className="relative z-10 flex items-center justify-between text-xs text-amber-200">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Server size={15} className="text-amber-400" />
                  {t('dashboard.sshModule')}
                </span>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-mono font-bold">
                  REMOTE VPS
                </Badge>
              </div>
              <div className="relative z-10 text-2xl font-extrabold font-mono text-white mt-2 mb-1">
                {hosts.length}{' '}
                <span className="text-xs font-sans font-normal text-amber-300">{t('dashboard.sshDesc')}</span>
              </div>
              <span className="relative z-10 text-xs text-amber-400 group-hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors mt-2">
                {t('ssh.connectNow')} <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            {/* 3. Docker Containers (Blue / Cyan Glow - Nổi Bật) */}
            <div
              onClick={() => onNavigateTab('docker')}
              className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-sky-950/40 via-zinc-900/90 to-zinc-900/90 border border-sky-500/50 hover:border-sky-400 hover:bg-sky-950/20 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(14,165,233,0.1)] group ring-1 ring-sky-500/20"
            >
              <div className="absolute -bottom-4 -right-4 text-sky-500/10 group-hover:text-sky-500/25 transition-colors pointer-events-none transform group-hover:scale-110 duration-300">
                <Box size={80} strokeWidth={1} />
              </div>

              <div className="relative z-10 flex items-center justify-between text-xs text-sky-200">
                <span className="font-bold flex items-center gap-1.5 text-sky-300">
                  <Box size={15} className="text-sky-400" />
                  {t('dashboard.dockerModule')}
                </span>
                <Badge className={isDockerAvailable ? 'bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px] font-mono font-bold' : 'bg-zinc-800 text-zinc-500 text-[10px]'}>
                  {isDockerAvailable ? 'ENGINE ACTIVE' : 'DAEMON OFF'}
                </Badge>
              </div>
              <div className="relative z-10 text-2xl font-extrabold font-mono text-white mt-2 mb-1">
                {runningContainersCount}{' '}
                <span className="text-xs font-sans font-normal text-sky-300">/ {containers.length} {t('dashboard.dockerDesc')}</span>
              </div>
              <span className="relative z-10 text-xs text-sky-400 group-hover:text-sky-300 flex items-center gap-1 font-semibold transition-colors mt-2">
                {t('docker.title')} <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            {/* 4. Latency & Network Diagnostics (Emerald / Teal Glow - Nổi Bật) */}
            <div
              onClick={() => onNavigateTab('monitor')}
              className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-900/90 to-zinc-900/90 border border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)] group ring-1 ring-emerald-500/20"
            >
              <div className="absolute -bottom-4 -right-4 text-emerald-500/10 group-hover:text-emerald-500/25 transition-colors pointer-events-none transform group-hover:scale-110 duration-300">
                <Zap size={80} strokeWidth={1} />
              </div>

              <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200">
                <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <Activity size={15} className="text-emerald-400" />
                  {t('dashboard.monitorModule')}
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono font-bold">
                  LIVE PING
                </Badge>
              </div>
              <div className="relative z-10 text-2xl font-extrabold font-mono text-white mt-2 mb-1">
                Latency <span className="text-xs font-sans font-normal text-emerald-300">Real-time</span>
              </div>
              <span className="relative z-10 text-xs text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors mt-2">
                {t('network.pingTest')} <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              TRUNG TÂM LAUNCHPAD ĐIỀU KHIỂN & PHÂN HỆ CLIM
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Zap size={14} />
                <span>{t('dashboard.controlCenter')}</span>
              </h2>

              {/* Chế độ hiển thị: Tất cả vs Theo nhóm */}
              <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => updateSettings({ dashboardGrouped: false })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    !isGrouped ? 'bg-zinc-800 text-zinc-100 shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={t('dashboard.viewAll')}
                >
                  <LayoutGrid size={12} />
                  <span>{t('dashboard.viewAll')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ dashboardGrouped: true })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isGrouped ? 'bg-zinc-800 text-emerald-300 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={t('dashboard.viewGrouped')}
                >
                  <Layers size={12} />
                  <span>{t('dashboard.viewGrouped')}</span>
                </button>
              </div>
            </div>

            {isGrouped ? (
              <div className="space-y-5">
                {/* Nhóm 1: ⚙️ Tự Động Hóa (Automation) */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider px-0.5">
                    <Zap size={14} />
                    <span>{t('tabs.automationGroup')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Module: Hồ Sơ Môi Trường */}
                    <div
                      onClick={() => onNavigateTab('profiles')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-blue-950/40 hover:to-zinc-900 hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold shrink-0">
                          <SlidersHorizontal size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-blue-300 transition-colors truncate">
                            {t('dashboard.profilesModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {profiles.length} {t('dashboard.profilesDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module: Kho Lệnh Cá Nhân */}
                    <div
                      onClick={() => onNavigateTab('commands')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-emerald-950/40 hover:to-zinc-900 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                          <Terminal size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-emerald-300 transition-colors truncate">
                            {t('dashboard.commandsModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {commands.length} {t('dashboard.commandsDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module: Quy Trình Sequences */}
                    <div
                      onClick={() => onNavigateTab('sequences')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-violet-950/40 hover:to-zinc-900 hover:border-violet-500/60 hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center font-bold shrink-0">
                          <Play size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-violet-300 transition-colors truncate">
                            {t('dashboard.sequencesModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {sequences.length} {t('dashboard.sequencesDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module: Lập Lịch Scheduler */}
                    <div
                      onClick={() => onNavigateTab('scheduler')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-amber-950/40 hover:to-zinc-900 hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold shrink-0">
                          <Clock size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                            {t('dashboard.schedulerModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {tasks.length} {t('dashboard.schedulerDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nhóm 2: 🖥️ Terminal & Máy Chủ (Terminal & Servers) */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider px-0.5">
                    <SquareTerminal size={14} />
                    <span>{t('tabs.serversGroup')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Module: Terminal */}
                    <div
                      onClick={() => onNavigateTab('terminal')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-purple-950/40 hover:to-zinc-900 hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold shrink-0">
                          <SquareTerminal size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-purple-300 transition-colors truncate">
                            {t('terminal.newTerminal')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {sessions.length} {t('common.running').toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module: Máy Chủ SSH */}
                    <div
                      onClick={() => onNavigateTab('ssh')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-amber-950/40 hover:to-zinc-900 hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold shrink-0">
                          <Server size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                            {t('dashboard.sshModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {hosts.length} {t('dashboard.sshDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module: Docker */}
                    <div
                      onClick={() => onNavigateTab('docker')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-sky-950/40 hover:to-zinc-900 hover:border-sky-500/60 hover:shadow-[0_0_25px_rgba(14,165,233,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold shrink-0">
                          <Box size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-sky-300 transition-colors truncate">
                            {t('dashboard.dockerModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {containers.length} {t('dashboard.dockerDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nhóm 3: 📊 Hệ Thống & Tài Nguyên (System & Resources) */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider px-0.5">
                    <Activity size={14} />
                    <span>{t('tabs.systemGroup')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Module: Chẩn Đoán Mạng */}
                    <div
                      onClick={() => onNavigateTab('monitor')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-emerald-950/40 hover:to-zinc-900 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                          <Globe size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-emerald-300 transition-colors truncate">
                            {t('dashboard.monitorModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {t('dashboard.monitorDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module: Quản Lý Cổng Mạng */}
                    <div
                      onClick={() => onNavigateTab('monitor')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-purple-950/40 hover:to-zinc-900 hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold shrink-0">
                          <Network size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-purple-300 transition-colors truncate">
                            {t('dashboard.portsModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {t('dashboard.portsDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module: Log Hệ Thống (MỚI) */}
                    <div
                      onClick={() => onNavigateTab('monitor')}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-amber-950/40 hover:to-zinc-900 hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold shrink-0">
                          <ScrollText size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                            {t('dashboard.logsModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {t('dashboard.logsDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module: Kho Lệnh Mẫu Snippet Hub */}
                    <div
                      onClick={onOpenSnippetHub}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:bg-gradient-to-br hover:from-pink-950/40 hover:to-zinc-900 hover:border-pink-500/60 hover:shadow-[0_0_25px_rgba(236,72,153,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center font-bold shrink-0">
                          <Store size={17} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-pink-300 transition-colors truncate">
                            {t('dashboard.snippetHubModule')}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {t('dashboard.snippetHubDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCompact ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3.5`}>
                {/* Module 1: Lệnh CLI */}
                <div
                  onClick={() => onNavigateTab('commands')}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:bg-gradient-to-br hover:from-emerald-950/40 hover:to-zinc-900 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      <Terminal size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-emerald-300 transition-colors truncate">
                        {t('dashboard.commandsModule')}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {commands.length} {t('dashboard.commandsDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Module 2: Quy Trình Sequences */}
                <div
                  onClick={() => onNavigateTab('sequences')}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:bg-gradient-to-br hover:from-violet-950/40 hover:to-zinc-900 hover:border-violet-500/60 hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center font-bold shrink-0">
                      <Play size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-violet-300 transition-colors truncate">
                        {t('dashboard.sequencesModule')}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {sequences.length} {t('dashboard.sequencesDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Module 3: Môi Trường Profiles */}
                <div
                  onClick={() => onNavigateTab('profiles')}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:bg-gradient-to-br hover:from-blue-950/40 hover:to-zinc-900 hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold shrink-0">
                      <SlidersHorizontal size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-blue-300 transition-colors truncate">
                        {t('dashboard.profilesModule')}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {profiles.length} {t('dashboard.profilesDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Module 4: Lập Lịch Scheduler */}
                <div
                  onClick={() => onNavigateTab('scheduler')}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:bg-gradient-to-br hover:from-amber-950/40 hover:to-zinc-900 hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold shrink-0">
                      <Clock size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                        {t('dashboard.schedulerModule')}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {tasks.length} {t('dashboard.schedulerDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Module 5: Máy Chủ SSH */}
                <div
                  onClick={() => onNavigateTab('ssh')}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:bg-gradient-to-br hover:from-amber-950/40 hover:to-zinc-900 hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold shrink-0">
                      <Server size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                        {t('dashboard.sshModule')}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {hosts.length} {t('dashboard.sshDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Module 6: Docker Containers */}
                <div
                  onClick={() => onNavigateTab('docker')}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:bg-gradient-to-br hover:from-sky-950/40 hover:to-zinc-900 hover:border-sky-500/60 hover:shadow-[0_0_25px_rgba(14,165,233,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold shrink-0">
                      <Box size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-sky-300 transition-colors truncate">
                        {t('dashboard.dockerModule')}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {containers.length} {t('dashboard.dockerDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Module 7: Chẩn Đoán Mạng & SSL */}
                <div
                  onClick={() => onNavigateTab('monitor')}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:bg-gradient-to-br hover:from-emerald-950/40 hover:to-zinc-900 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      <Globe size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-emerald-300 transition-colors truncate">
                        {t('dashboard.monitorModule')}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {t('dashboard.monitorDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Module 8: Log Hệ Thống (MỚI) */}
                <div
                  onClick={() => onNavigateTab('monitor')}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:bg-gradient-to-br hover:from-amber-950/40 hover:to-zinc-900 hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold shrink-0">
                      <ScrollText size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                        {t('dashboard.logsModule')}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {t('dashboard.logsDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Module 9: Kho Lệnh Mẫu Snippet Hub */}
                <div
                  onClick={onOpenSnippetHub}
                  className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:bg-gradient-to-br hover:from-pink-950/40 hover:to-zinc-900 hover:border-pink-500/60 hover:shadow-[0_0_25px_rgba(236,72,153,0.25)] transition-all duration-200 cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center font-bold shrink-0">
                      <Store size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-pink-300 transition-colors truncate">
                        {t('dashboard.snippetHubModule')}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {t('dashboard.snippetHubDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              LỆNH YÊU THÍCH CHẠY NHANH (THIẾT KẾ GỌN GÀNG, ĐẦY ĐỦ THÔNG TIN)
          ═══════════════════════════════════════════════════════════════════ */}
          {favoriteCommands.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>{t('dashboard.favoriteCommands')} ({favoriteCommands.length})</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateTab('commands')}
                  className="h-7 text-xs text-zinc-400 hover:text-emerald-300 gap-1 cursor-pointer"
                >
                  <span>{t('dashboard.seeAllCommands')}</span>
                  <ArrowRight size={12} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoriteCommands.map((cmd) => {
                  const runningSession = sessions.find(
                    (s) => (s.commandId === cmd.id || s.title === cmd.name || s.title.includes(cmd.name)) && s.status === 'running'
                  )
                  const isRunning = !!runningSession

                  return (
                    <div
                      key={cmd.id}
                      className={cn(
                        'group p-3 rounded-lg transition-all duration-150 border cursor-pointer relative',
                        isRunning
                          ? 'bg-gradient-to-r from-emerald-950/30 to-zinc-900/90 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                          : 'bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-900/90 hover:border-zinc-700/80 hover:shadow-sm'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0" onClick={() => handleRunCommand(cmd)}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Terminal
                              size={15}
                              className={cn(
                                'shrink-0',
                                isRunning ? 'text-emerald-400' : shellColors[cmd.shell || 'powershell'] || 'text-blue-400'
                              )}
                            />
                            <span
                              className={cn(
                                'text-sm font-bold truncate',
                                isRunning ? 'text-emerald-100' : 'text-zinc-100'
                              )}
                            >
                              {cmd.name}
                            </span>
                            {cmd.category && (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                                {cmd.category}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1.5">
                            {isRunning && (
                              <span
                                className={cn(
                                  'shrink-0 text-xs px-2 py-0.5 rounded-md font-semibold',
                                  runningSession?.isBackground
                                    ? 'bg-amber-500/25 text-amber-300'
                                    : 'bg-emerald-500/30 text-emerald-300'
                                )}
                              >
                                {runningSession?.isBackground
                                  ? (language === 'en' ? 'Background' : 'Chạy ngầm')
                                  : (language === 'en' ? 'Running' : 'Đang chạy')}
                              </span>
                            )}
                            <p
                              className={cn(
                                'text-xs sm:text-sm font-mono truncate flex-1',
                                isRunning ? 'text-emerald-300/80 font-medium' : 'text-zinc-400'
                              )}
                            >
                              {cmd.command}
                            </p>
                          </div>

                          {(cmd.tags || []).length > 0 && (
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              {(cmd.tags || []).slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0.2 h-4.5 bg-zinc-800 text-zinc-300 border-zinc-700/60 font-medium"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          {isRunning ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStopCommand(cmd, runningSession.id)
                              }}
                              className="h-7 px-2.5 text-xs bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white font-semibold border border-rose-500/40 hover:border-rose-400 shadow-sm rounded-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 group/stop"
                              title={t('dashboard.stop')}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
                              <Square size={10} className="fill-current" />
                              <span>{language === 'en' ? 'Stop' : 'Dừng'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRunCommand(cmd)
                              }}
                              className="h-7 px-2.5 text-xs bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-zinc-950 font-semibold border border-emerald-500/35 hover:border-emerald-400 shadow-sm rounded-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 group/run"
                              title={t('dashboard.run')}
                            >
                              <Play size={11} className="fill-current group-hover/run:scale-110 transition-transform" />
                              <span>{language === 'en' ? 'Run' : 'Chạy'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
