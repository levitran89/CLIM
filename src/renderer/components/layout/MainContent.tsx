import React, { useState, useRef, useEffect } from 'react'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'
import { CommandList } from '@/components/commands/CommandList'
import { PortList } from '@/components/ports/PortList'
import { TerminalGrid } from '@/components/terminal/TerminalGrid'
import { SequenceManager } from '@/components/sequences/SequenceManager'
import { ProfileManager } from '@/components/profiles/ProfileManager'
import { SchedulerManager } from '@/components/scheduler/SchedulerManager'
import { ResourceMonitor } from '@/components/monitor/ResourceMonitor'
import { SnippetHubModal } from '@/components/hub/SnippetHubModal'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { GuideModal, type GuideSection } from '@/components/help/GuideModal'
import { CommandPalette } from '@/components/palette/CommandPalette'
import { AICopilotModal } from '@/components/ai/AICopilotModal'
import { AIErrorFixModal } from '@/components/ai/AIErrorFixModal'
import {
  ParametricCommandModal,
  extractCommandPlaceholders
} from '@/components/common/ParametricCommandModal'
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useAIStore } from '@/stores/ai-store'
import { useTranslation } from '@/stores/i18n-store'
import { SSHManager } from '@/components/ssh/SSHManager'
import { DockerManager } from '@/components/docker/DockerManager'
import {
  LayoutDashboard,
  SlidersHorizontal,
  Terminal,
  ListOrdered,
  SquareTerminal,
  Clock,
  Activity,
  Store,
  Search,
  Sparkles,
  Server,
  ChevronDown,
  Settings,
  HelpCircle,
  Cpu,
  Layers,
  Zap,
  Box
} from 'lucide-react'
import { toast } from 'sonner'
import type { Command, CommandSequence } from '@shared/types'

export type AppTab =
  | 'dashboard'
  | 'profiles'
  | 'commands'
  | 'sequences'
  | 'scheduler'
  | 'terminal'
  | 'ports'
  | 'monitor'
  | 'ssh'
  | 'docker'

export function MainContent(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard')
  const [guideOpen, setGuideOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hubOpen, setHubOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [parametricCmd, setParametricCmd] = useState<Command | null>(null)
  const [parametricOpen, setParametricOpen] = useState(false)
  const { t } = useTranslation()

  // Dropdown menus state
  const [openDropdown, setOpenDropdown] = useState<'automation' | 'terminal' | 'system' | 'settings' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { createTerminal, killTerminal, activeSessionId } = useTerminalStore()
  const defaultShell = useSettingsStore((s) => s.settings.defaultShell)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Global Hotkeys hook (Ctrl+Space, Ctrl+K, Ctrl+T, Ctrl+W, Ctrl+1..7, Ctrl+,, F1)
  useGlobalHotkeys({
    onTogglePalette: () => setPaletteOpen((prev) => !prev),
    onOpenAiCopilot: () => setAiOpen(true),
    onOpenSnippetHub: () => setHubOpen(true),
    onNewTerminal: () => {
      createTerminal({ shell: defaultShell || 'powershell' })
      setActiveTab('terminal')
      toast.success('Đã mở Terminal mới')
    },
    onCloseActiveTerminal: () => {
      if (activeSessionId) {
        killTerminal(activeSessionId)
      }
    },
    onNavigateTab: (tab) => {
      setActiveTab(tab)
      setOpenDropdown(null)
    },
    onOpenSettings: () => setSettingsOpen(true),
    onOpenGuide: () => setGuideOpen(true)
  })

  // Direct terminal execution
  const handleExecuteCommandDirect = async (cmd: Command): Promise<void> => {
    setActiveTab('terminal')
    const sessionId = await createTerminal({
      shell: cmd.shell || defaultShell || 'powershell',
      cwd: cmd.workingDirectory || ''
    })
    setTimeout(() => {
      window.api.terminal.input(sessionId, `${cmd.command}\r`)
    }, 400)
    toast.success(`Đang chạy lệnh: "${cmd.name}"`)
  }

  // Check if command has unfilled placeholders
  const handleRunCommandWithParamCheck = (cmd: Command): void => {
    const placeholders = extractCommandPlaceholders(cmd.command)
    if (placeholders.length > 0) {
      setParametricCmd(cmd)
      setParametricOpen(true)
    } else {
      handleExecuteCommandDirect(cmd)
    }
  }

  // Handle running a sequence from CommandPalette
  const handlePaletteRunSequence = (seq: CommandSequence): void => {
    setActiveTab('sequences')
    toast.info(`Đã chuyển đến Quy trình: "${seq.name}"`)
  }

  const isAutomationActive = ['profiles', 'commands', 'sequences', 'scheduler'].includes(activeTab)
  const isTerminalActive = ['terminal', 'ssh', 'docker'].includes(activeTab)
  const isSystemActive = ['ports', 'monitor'].includes(activeTab)

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950">
      {/* Grouped Dropdown Menu Navigation Header */}
      <div
        ref={dropdownRef}
        className="flex items-center justify-between bg-zinc-900/95 px-3 sm:px-4 py-1.5 border-b border-zinc-800/80 shrink-0 select-none shadow-sm z-30"
      >
        {/* Left: Grouped Dropdown Tabs */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* 1. Dashboard Tab (Đầu tiên) */}
          <button
            onClick={() => {
              setActiveTab('dashboard')
              setOpenDropdown(null)
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
            }`}
          >
            <LayoutDashboard size={14} className={activeTab === 'dashboard' ? 'text-emerald-400' : 'text-zinc-400'} />
            <span>{t('tabs.dashboard')}</span>
          </button>

          {/* 2. Group 1: ⚙️ Tự Động Hóa (Môi trường, Lệnh, Quy trình, Lập lịch) */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'automation' ? null : 'automation')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isAutomationActive
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              <Zap size={14} className={isAutomationActive ? 'text-emerald-400' : 'text-zinc-400'} />
              <span>
                {activeTab === 'profiles'
                  ? t('tabs.profiles')
                  : activeTab === 'commands'
                    ? t('tabs.commands')
                    : activeTab === 'sequences'
                      ? t('tabs.sequences')
                      : activeTab === 'scheduler'
                        ? t('tabs.scheduler')
                        : t('tabs.automationGroup')}
              </span>
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${openDropdown === 'automation' ? 'rotate-180 text-emerald-400' : ''}`} />
            </button>

            {openDropdown === 'automation' && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-zinc-950/98 border border-zinc-700/80 rounded-2xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150 backdrop-blur-xl space-y-0.5">
                <div className="px-2.5 py-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">{t('dropdowns.automationTitle')}</span>
                </div>
                <button
                  onClick={() => { setActiveTab('profiles'); setOpenDropdown(null) }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    activeTab === 'profiles' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0"><SlidersHorizontal size={14} className="text-blue-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('dropdowns.profilesTitle')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('dropdowns.profilesDesc')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Ctrl+1</kbd>
                </button>

                <button
                  onClick={() => { setActiveTab('commands'); setOpenDropdown(null) }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    activeTab === 'commands' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0"><Terminal size={14} className="text-emerald-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('dropdowns.commandsTitle')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('dropdowns.commandsDesc')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Ctrl+2</kbd>
                </button>

                <div className="mx-2 my-1 border-t border-zinc-800/60" />

                <button
                  onClick={() => { setActiveTab('sequences'); setOpenDropdown(null) }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    activeTab === 'sequences' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0"><ListOrdered size={14} className="text-violet-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('dropdowns.sequencesTitle')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('dropdowns.sequencesDesc')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Ctrl+3</kbd>
                </button>

                <button
                  onClick={() => { setActiveTab('scheduler'); setOpenDropdown(null) }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    activeTab === 'scheduler' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0"><Clock size={14} className="text-amber-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('dropdowns.schedulerTitle')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('dropdowns.schedulerDesc')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Ctrl+4</kbd>
                </button>
              </div>
            )}
          </div>

          {/* 3. Group 2: ⚡ Terminal & Máy Chủ (Terminal, Máy chủ SSH) */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'terminal' ? null : 'terminal')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isTerminalActive
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              <SquareTerminal size={14} className={isTerminalActive ? 'text-emerald-400' : 'text-zinc-400'} />
              <span>
                {activeTab === 'ssh'
                  ? t('tabs.ssh')
                  : activeTab === 'docker'
                  ? t('tabs.docker')
                  : t('tabs.terminal')}
              </span>
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${openDropdown === 'terminal' ? 'rotate-180 text-emerald-400' : ''}`} />
            </button>

            {openDropdown === 'terminal' && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-zinc-950/98 border border-zinc-700/80 rounded-2xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150 backdrop-blur-xl space-y-0.5">
                <div className="px-2.5 py-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">{t('dropdowns.serversTitle')}</span>
                </div>
                <button
                  onClick={() => { setActiveTab('terminal'); setOpenDropdown(null) }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    activeTab === 'terminal' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0"><SquareTerminal size={14} className="text-emerald-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('dropdowns.terminalTitle')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('dropdowns.terminalDesc')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Ctrl+5</kbd>
                </button>

                <div className="mx-2 my-1 border-t border-zinc-800/60" />

                <button
                  onClick={() => { setActiveTab('ssh'); setOpenDropdown(null) }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    activeTab === 'ssh' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0"><Server size={14} className="text-purple-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('dropdowns.sshTitle')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('dropdowns.sshDesc')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Ctrl+7</kbd>
                </button>

                <div className="mx-2 my-1 border-t border-zinc-800/60" />

                <button
                  onClick={() => { setActiveTab('docker'); setOpenDropdown(null) }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    activeTab === 'docker' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0"><Box size={14} className="text-blue-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('dropdowns.dockerTitle')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('dropdowns.dockerDesc')}</div></div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 4. Group 3: 📊 Hệ Thống & Tài Nguyên (Tài nguyên, Kho lệnh) */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'system' ? null : 'system')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isSystemActive
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              <Activity size={14} className={isSystemActive ? 'text-emerald-400' : 'text-zinc-400'} />
              <span>{t('tabs.systemGroup')}</span>
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${openDropdown === 'system' ? 'rotate-180 text-emerald-400' : ''}`} />
            </button>

            {openDropdown === 'system' && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-zinc-950/98 border border-zinc-700/80 rounded-2xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150 backdrop-blur-xl space-y-0.5">
                <div className="px-2.5 py-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">{t('dropdowns.systemTitle')}</span>
                </div>
                <button
                  onClick={() => { setActiveTab('monitor'); setOpenDropdown(null) }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    activeTab === 'monitor' || activeTab === 'ports' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0"><Cpu size={14} className="text-emerald-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('dropdowns.monitorTitle')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('dropdowns.monitorDesc')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Ctrl+6</kbd>
                </button>

                <div className="mx-2 my-1 border-t border-zinc-800/60" />

                <button
                  onClick={() => { setHubOpen(true); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center shrink-0"><Store size={14} className="text-pink-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('dropdowns.snippetHubTitle')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('dropdowns.snippetHubDesc')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Ctrl+H</kbd>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cài Đặt (kèm Hướng dẫn), Spotlight & AI Copilot */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Spotlight Search Ctrl+K Button */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 transition-all cursor-pointer shadow-sm whitespace-nowrap"
            title={t('titleBar.quickSearch')}
          >
            <Search size={13} className="text-zinc-400" />
            <span className="hidden lg:inline">{t('common.search')}</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 rounded">
              Ctrl+K
            </kbd>
          </button>

          {/* AI Copilot Button */}
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 transition-all cursor-pointer shadow-sm whitespace-nowrap"
            title="AI CLI Copilot (Ctrl+Space)"
          >
            <Sparkles size={13} className="text-purple-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* 5. Group 4: ⚙️ Cài Đặt (Dropdown chứa Cài đặt & Hướng dẫn) */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'settings' ? null : 'settings')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 transition-all cursor-pointer shadow-sm whitespace-nowrap"
              title={t('titleBar.settings')}
            >
              <Settings size={14} />
              <span className="hidden md:inline">{t('titleBar.settings')}</span>
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${openDropdown === 'settings' ? 'rotate-180 text-emerald-400' : ''}`} />
            </button>

            {openDropdown === 'settings' && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-zinc-950/98 border border-zinc-700/80 rounded-2xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150 backdrop-blur-xl space-y-0.5">
                <div className="px-2.5 py-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">{t('settings.title')}</span>
                </div>
                <button
                  onClick={() => { setSettingsOpen(true); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0"><Settings size={14} className="text-emerald-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('titleBar.settings')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('settings.subtitle')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Ctrl+,</kbd>
                </button>

                <div className="mx-2 my-1 border-t border-zinc-800/60" />

                <button
                  onClick={() => { setGuideOpen(true); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all text-zinc-200 hover:bg-zinc-800/80 hover:text-white border border-transparent"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0"><HelpCircle size={14} className="text-blue-400" /></div>
                    <div className="text-left"><div className="text-xs font-medium">{t('titleBar.guide')}</div><div className="text-[10px] text-zinc-500 font-normal">{t('guide.subtitle')}</div></div>
                  </div>
                  <kbd className="text-[9px] text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">F1</kbd>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col w-full h-full">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSnippetHub={() => setHubOpen(true)}
            onOpenAiCopilot={() => setAiOpen(true)}
            onOpenPalette={() => setPaletteOpen(true)}
          />
        )}
        {activeTab === 'profiles' && <ProfileManager />}
        {activeTab === 'commands' && (
          <CommandList onNavigateToTerminal={() => setActiveTab('terminal')} />
        )}
        {activeTab === 'sequences' && (
          <SequenceManager onNavigateToTerminal={() => setActiveTab('terminal')} />
        )}
        {activeTab === 'scheduler' && <SchedulerManager />}
        {activeTab === 'terminal' && <TerminalGrid />}
        {(activeTab === 'ports' || activeTab === 'monitor') && <ResourceMonitor />}
        {activeTab === 'ssh' && <SSHManager onNavigateToTerminal={() => setActiveTab('terminal')} />}
        {activeTab === 'docker' && <DockerManager onNavigateToTerminal={() => setActiveTab('terminal')} />}
      </div>

      {/* Snippet Hub Modal */}
      <SnippetHubModal
        open={hubOpen}
        onOpenChange={setHubOpen}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      {/* Comprehensive Guide Modal */}
      <GuideModal
        open={guideOpen}
        onOpenChange={setGuideOpen}
      />

      {/* Spotlight Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onRunCommand={(cmd) => handleRunCommandWithParamCheck(cmd)}
        onRunSequence={handlePaletteRunSequence}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenGuide={() => setGuideOpen(true)}
        onOpenHub={() => setHubOpen(true)}
      />

      {/* AI CLI Copilot Modal */}
      <AICopilotModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        onRunCommand={(cmd) => handleRunCommandWithParamCheck(cmd)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Global AI Error Diagnosis & Fix Modal */}
      <AIErrorFixModal
        open={useAIStore((s) => s.errorFixModal.isOpen)}
        onOpenChange={(open) => {
          if (!open) useAIStore.getState().closeErrorFixModal()
        }}
        errorOutput={useAIStore((s) => s.errorFixModal.errorOutput)}
        lastCommand={useAIStore((s) => s.errorFixModal.lastCommand)}
        shell={useAIStore((s) => s.errorFixModal.shell)}
        onRunFixCommand={(fixCmd) => {
          const { activeSessionId, sessions } = useTerminalStore.getState()
          const currentSession = sessions.find((s) => s.id === activeSessionId)
          if (activeSessionId && currentSession) {
            window.api.terminal.input(activeSessionId, fixCmd.command + '\r\n')
            setActiveTab('terminal')
            toast.success('Đã gửi câu lệnh sửa lỗi vào terminal hiện tại!')
          } else {
            handleRunCommandWithParamCheck(fixCmd)
          }
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Parametric Command Prompt Modal */}
      {parametricCmd && (
        <ParametricCommandModal
          open={parametricOpen}
          onOpenChange={(open) => {
            setParametricOpen(open)
            if (!open) setParametricCmd(null)
          }}
          command={parametricCmd}
          onExecuteFinalCommand={(finalCmd) => {
            handleExecuteCommandDirect(finalCmd)
          }}
        />
      )}
    </div>
  )
}
