import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useSettingsStore,
  type ShellType,
  type CursorStyle,
  type AccentColor
} from '@/stores/settings-store'
import { useCommandStore } from '@/stores/command-store'
import { useSequenceStore } from '@/stores/sequence-store'
import { useProfileStore } from '@/stores/profile-store'
import { confirmAction } from '@/stores/confirm-store'
import {
  Sliders,
  Palette,
  Terminal,
  Type,
  ShieldCheck,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Check,
  X,
  Bell,
  Send,
  Cloud,
  KeyRound,
  Lock,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Bot,
  Key,
  Loader2,
  Keyboard,
  Globe,
  type LucideIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { useSchedulerStore } from '@/stores/scheduler-store'
import { useCloudSyncStore } from '@/stores/cloud-sync-store'
import { useAIStore, PROVIDER_DEFAULT_MODELS, type AIProvider } from '@/stores/ai-store'
import { testAIConnection } from '@/services/ai-service'
import { KeybindingsSettingsTab } from './KeybindingsSettingsTab'
import { useTranslation, type Language } from '@/stores/i18n-store'

export type SettingsSection =
  | 'theme'
  | 'terminal'
  | 'display'
  | 'keybindings'
  | 'permissions'
  | 'backup'
  | 'webhooks'
  | 'cloudSync'
  | 'ai'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSection?: SettingsSection
}

export function SettingsModal({
  open,
  onOpenChange,
  initialSection = 'theme'
}: SettingsModalProps): React.JSX.Element {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection)
  const { settings, updateSettings, resetSettings } = useSettingsStore()
  const { language, setLanguage, t } = useTranslation()
  const { commands, loadCommands } = useCommandStore()
  const { sequences, loadSequences } = useSequenceStore()
  const { profiles, loadProfiles } = useProfileStore()
  const { webhookConfig, loadWebhookConfig, saveWebhookConfig, testWebhook } = useSchedulerStore()
  const {
    config: cloudSyncConfig,
    githubUsername,
    isSyncing,
    isTesting: isTestingToken,
    loadConfig: loadCloudSyncConfig,
    saveConfig: saveCloudSyncConfig,
    testToken: testGitHubToken,
    uploadBackupToGist,
    downloadBackupFromGist
  } = useCloudSyncStore()

  const [syncToken, setSyncToken] = useState('')
  const [syncGistId, setSyncGistId] = useState('')
  const [syncPassword, setSyncPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [discordUrl, setDiscordUrl] = useState('')
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [isTestingDiscord, setIsTestingDiscord] = useState(false)
  const [isTestingTelegram, setIsTestingTelegram] = useState(false)

  const { config: aiConfig, setConfig: setAiConfig } = useAIStore()
  const [showAiKey, setShowAiKey] = useState(false)
  const [isTestingAi, setIsTestingAi] = useState(false)

  useEffect(() => {
    loadWebhookConfig()
    loadCloudSyncConfig()
  }, [])

  useEffect(() => {
    if (webhookConfig) {
      setDiscordUrl(webhookConfig.discordUrl || '')
      setTelegramToken(webhookConfig.telegramToken || '')
      setTelegramChatId(webhookConfig.telegramChatId || '')
    }
  }, [webhookConfig])

  useEffect(() => {
    if (cloudSyncConfig) {
      setSyncToken(cloudSyncConfig.githubToken || '')
      setSyncGistId(cloudSyncConfig.gistId || '')
    }
  }, [cloudSyncConfig])

  const handleSaveWebhook = async (): Promise<void> => {
    await saveWebhookConfig({
      discordUrl: discordUrl.trim() || undefined,
      telegramToken: telegramToken.trim() || undefined,
      telegramChatId: telegramChatId.trim() || undefined
    })
  }

  const handleSaveCloudSync = async (): Promise<void> => {
    await saveCloudSyncConfig({
      githubToken: syncToken.trim() || undefined,
      gistId: syncGistId.trim() || undefined
    })
  }

  // Export full backup
  const handleExportAll = (): void => {
    try {
      const backupData = {
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        commands,
        sequences,
        profiles,
        settings
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clim-full-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(language === 'en' ? 'Configuration data exported successfully' : 'Đã xuất toàn bộ dữ liệu cấu hình thành công')
    } catch {
      toast.error(language === 'en' ? 'Failed to export backup data' : 'Lỗi khi xuất dữ liệu dự phòng')
    }
  }

  // Import full backup
  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (!data || typeof data !== 'object') {
          throw new Error('Dữ liệu không hợp lệ')
        }

        if (data.commands && Array.isArray(data.commands)) {
          for (const cmd of data.commands) {
            await window.api.commands.save(cmd)
          }
          await loadCommands()
        }

        if (data.sequences && Array.isArray(data.sequences)) {
          for (const seq of data.sequences) {
            await window.api.sequences.save(seq)
          }
          await loadSequences()
        }

        if (data.profiles && Array.isArray(data.profiles)) {
          for (const prof of data.profiles) {
            await window.api.profiles.save(prof)
          }
          await loadProfiles()
        }

        if (data.settings) {
          updateSettings(data.settings)
        }

        toast.success(language === 'en' ? 'All data restored successfully!' : 'Đã khôi phục toàn bộ dữ liệu thành công!')
      } catch {
        toast.error(language === 'en' ? 'Invalid backup data file' : 'File dữ liệu không hợp lệ')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const sections: { id: SettingsSection; label: string; icon: LucideIcon }[] = [
    { id: 'theme', label: t('settings.themeTab'), icon: Palette },
    { id: 'terminal', label: t('settings.terminalTab'), icon: Terminal },
    { id: 'display', label: t('settings.displayTab'), icon: Type },
    { id: 'keybindings', label: t('settings.keybindingsTab'), icon: Keyboard },
    { id: 'permissions', label: t('settings.permissionsTab'), icon: ShieldCheck },
    { id: 'backup', label: t('settings.backupTab'), icon: HardDrive },
    { id: 'webhooks', label: t('settings.webhooksTab'), icon: Bell },
    { id: 'cloudSync', label: t('settings.cloudSyncTab'), icon: Cloud },
    { id: 'ai', label: t('settings.aiTab'), icon: Sparkles }
  ]

  const shells: { id: ShellType; name: string; desc: string; iconColor: string }[] = [
    {
      id: 'powershell',
      name: 'PowerShell',
      desc: language === 'en' ? 'Powerful default Windows shell (powershell.exe)' : 'Shell mặc định mạnh mẽ trên Windows (powershell.exe)',
      iconColor: 'text-blue-400'
    },
    {
      id: 'cmd',
      name: 'Command Prompt (CMD)',
      desc: language === 'en' ? 'Classic Windows command interpreter (cmd.exe)' : 'Trình thông dịch lệnh chuẩn cổ điển (cmd.exe)',
      iconColor: 'text-amber-400'
    },
    {
      id: 'wsl',
      name: 'WSL Linux',
      desc: language === 'en' ? 'Windows Subsystem for Linux (wsl.exe)' : 'Môi trường Linux Subsystem (wsl.exe)',
      iconColor: 'text-orange-400'
    }
  ]

  const cursorStyles: { id: CursorStyle; name: string }[] = [
    { id: 'block', name: language === 'en' ? 'Block (█)' : 'Block (Khối vuông █)' },
    { id: 'bar', name: language === 'en' ? 'Bar (|)' : 'Bar (Thanh dọc |)' },
    { id: 'underline', name: language === 'en' ? 'Underline (_)' : 'Underline (Gạch dưới _)' }
  ]

  const accentColors: { id: AccentColor; name: string; nameEn: string; color: string; border: string; bg: string }[] = [
    {
      id: 'emerald',
      name: 'Emerald (Ngọc lục bảo)',
      nameEn: 'Emerald Green',
      color: 'bg-emerald-500',
      border: 'border-emerald-500',
      bg: 'bg-emerald-500/15'
    },
    {
      id: 'cyan',
      name: 'Cyan (Xanh đại dương)',
      nameEn: 'Cyan Blue',
      color: 'bg-cyan-500',
      border: 'border-cyan-500',
      bg: 'bg-cyan-500/15'
    },
    {
      id: 'violet',
      name: 'Violet (Tím hoàng gia)',
      nameEn: 'Royal Violet',
      color: 'bg-violet-500',
      border: 'border-violet-500',
      bg: 'bg-violet-500/15'
    },
    {
      id: 'rose',
      name: 'Rose (Đỏ hồng Ruby)',
      nameEn: 'Ruby Rose',
      color: 'bg-rose-500',
      border: 'border-rose-500',
      bg: 'bg-rose-500/15'
    },
    {
      id: 'amber',
      name: 'Amber (Cam hổ phách)',
      nameEn: 'Amber Orange',
      color: 'bg-amber-500',
      border: 'border-amber-500',
      bg: 'bg-amber-500/15'
    },
    {
      id: 'blue',
      name: 'Blue (Xanh lam Electric)',
      nameEn: 'Electric Blue',
      color: 'bg-blue-500',
      border: 'border-blue-500',
      bg: 'bg-blue-500/15'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[92vw] max-w-5xl h-[84vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Sliders size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
                {t('settings.title')}
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs py-0.5 font-mono">
                  Preferences v1.5
                </Badge>
              </DialogTitle>
              <p className="text-sm text-zinc-400 mt-0.5">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>

          {/* Close Button X */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={language === 'en' ? 'Close window (ESC)' : 'Đóng cửa sổ (ESC)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body with Sidebar Navigation */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-60 bg-zinc-950/70 p-4 border-r border-zinc-800/80 space-y-1.5 shrink-0">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-3 py-1">
              {t('settings.categories')}
            </div>
            {sections.map((sec) => {
              const Icon = sec.icon
              const isActive = activeSection === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-zinc-500'} />
                  <span>{sec.label}</span>
                </button>
              )
            })}
          </div>

          {/* Main Content Area */}
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="p-6 text-sm text-zinc-300">
            {/* SECTION 1: MÀU SẮC CHỦ ĐẠO (ACCENT COLOR) */}
            {activeSection === 'theme' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Palette size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Application Accent Color' : 'Màu sắc Chủ đạo của Ứng dụng (Accent Color)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {language === 'en'
                      ? 'The selected color becomes the primary highlight accent across the CLIM UI (buttons, active tabs, glows, badges).'
                      : 'Màu được chọn sẽ trở thành màu điểm nhấn chủ đạo trên toàn bộ giao diện CLIM (nút bấm, active tabs, viền sáng, huy hiệu).'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
                  {accentColors.map((item) => {
                    const isSelected = (settings.accentColor || 'emerald') === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          updateSettings({ accentColor: item.id })
                          toast.success(language === 'en' ? `Accent color set to: ${item.nameEn}` : `Đã chọn màu chủ đạo: ${item.name}`)
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? `${item.border} ${item.bg} shadow-md shadow-zinc-950 ring-1 ring-white/10`
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full ${item.color} shadow-sm shrink-0 flex items-center justify-center text-white font-bold`}
                        >
                          {isSelected && <Check size={15} className="stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-100 truncate">
                            {language === 'en' ? item.nameEn : item.name.split(' ')[0]}
                          </div>
                          <div className="text-xs text-zinc-400 truncate">
                            {language === 'en' ? item.id : (item.name.includes('(') ? item.name.match(/\((.*?)\)/)?.[1] : '')}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Ngôn Ngữ Hiển Thị (Display Language) */}
                <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                      <Globe size={18} className="text-emerald-400" />
                      {t('settings.language') || 'Display Language'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {language === 'en'
                        ? 'Switch between English and Vietnamese instantly without restarting.'
                        : 'Chuyển đổi giao diện song ngữ Tiếng Việt và English lập tức không cần khởi động lại.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('vi')
                        toast.success('Đã chuyển ngôn ngữ sang Tiếng Việt')
                      }}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                        language === 'vi'
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <span className="text-2xl">🇻🇳</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-zinc-100">Tiếng Việt</span>
                          {language === 'vi' && <CheckCircle2 size={16} className="text-emerald-400" />}
                        </div>
                        <span className="text-xs text-zinc-400">Giao diện tiếng Việt chuẩn</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en')
                        toast.success('Language switched to English')
                      }}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                        language === 'en'
                          ? 'bg-blue-500/10 border-blue-500/50 shadow-sm ring-1 ring-blue-500/20'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <span className="text-2xl">🇬🇧</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-zinc-100">English</span>
                          {language === 'en' && <CheckCircle2 size={16} className="text-blue-400" />}
                        </div>
                        <span className="text-xs text-zinc-400">International English UI</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: SHELL MẶC ĐỊNH */}
            {activeSection === 'terminal' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Terminal size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Default Command Shell' : 'Trình thông dịch lệnh mặc định (Default Shell)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {language === 'en'
                      ? 'When opening a new terminal session or pressing Ctrl+T, CLIM will launch this shell by default.'
                      : 'Khi bấm "Mở Terminal" hoặc dùng phím tắt Ctrl+T, CLIM sẽ tự động khởi chạy Shell này.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  {shells.map((sh) => {
                    const isSelected = settings.defaultShell === sh.id
                    return (
                      <div
                        key={sh.id}
                        onClick={() => {
                          updateSettings({ defaultShell: sh.id })
                          toast.success(language === 'en' ? `Default shell set to: ${sh.name}` : `Đã chọn shell mặc định: ${sh.name}`)
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold text-sm ${sh.iconColor}`}>
                            {sh.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{sh.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SECTION 3: HIỂN THỊ & CON TRỎ */}
            {activeSection === 'display' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Type size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Terminal Font & Cursor Display' : 'Hiển thị & Kiểu dáng Con trỏ Terminal'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {language === 'en'
                      ? 'Customize JetBrains Mono font size and cursor appearance in terminal tabs.'
                      : 'Tùy chỉnh cỡ chữ font JetBrains Mono và hình dáng con trỏ trong các cửa sổ terminal.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  {/* Font Size */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-200">
                      {language === 'en' ? 'Terminal Font Size' : 'Cỡ chữ Terminal (Font Size)'}
                    </label>
                    <div className="flex gap-2">
                      {[12, 13, 14, 16].map((size) => (
                        <button
                          key={size}
                          onClick={() => updateSettings({ fontSize: size })}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-mono font-bold transition-all cursor-pointer ${
                            settings.fontSize === size
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                              : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                          }`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cursor Style */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-200">
                      {language === 'en' ? 'Cursor Style' : 'Kiểu con trỏ (Cursor Style)'}
                    </label>
                    <select
                      value={settings.cursorStyle}
                      onChange={(e) =>
                        updateSettings({ cursorStyle: e.target.value as CursorStyle })
                      }
                      className="w-full h-9 px-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                    >
                      {cursorStyles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: PHÍM TẮT TOÀN CỤC */}
            {activeSection === 'keybindings' && <KeybindingsSettingsTab />}

            {/* SECTION 4: QUYỀN HẠN ADMINISTRATOR */}
            {activeSection === 'permissions' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Execution Permissions (User vs Administrator)' : 'Quyền hạn Thực thi (User vs Administrator)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {language === 'en'
                      ? 'Understand CLIM privilege inheritance and how to execute commands with elevated permissions.'
                      : 'Tìm hiểu cách CLIM quản lý phân quyền và cách khởi chạy lệnh với quyền Quản trị cao nhất.'}
                  </p>
                </div>

                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm space-y-3.5 text-zinc-300 leading-relaxed pt-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    <p>
                      <strong>{language === 'en' ? 'Permission Inheritance:' : 'Cơ chế kế thừa quyền:'}</strong>{' '}
                      {language === 'en'
                        ? 'Terminal sessions (PowerShell, CMD, WSL) automatically inherit permissions directly from the CLIM desktop process.'
                        : 'Các cửa sổ Terminal (PowerShell, CMD, WSL) trong CLIM sẽ tự động kế thừa quyền của chính ứng dụng CLIM.'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <p>
                      <strong>{language === 'en' ? 'Standard User Mode (Default):' : 'Chế độ User (Mặc định):'}</strong>{' '}
                      {language === 'en'
                        ? 'When launched normally, all terminals run safely under standard User permissions for daily development.'
                        : 'Khi mở CLIM bình thường, tất cả terminal chạy dưới quyền User an toàn cho các lệnh dev thông thường.'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <p>
                      <strong>{language === 'en' ? 'Elevated Administrator Mode:' : 'Chế độ Administrator:'}</strong>{' '}
                      {language === 'en'
                        ? 'To execute commands requiring root or administrative privileges (installing Windows services, editing Hosts, killing protected ports), simply right-click the CLIM app shortcut and select "Run as administrator".'
                        : 'Để chạy lệnh với quyền Quản trị cao nhất (VD: cài service Windows, đổi IP/Hosts, kill process hệ thống), bạn chỉ cần chuột phải vào icon app CLIM và chọn "Run as administrator".'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: SAO LƯU & DỮ LIỆU */}
            {activeSection === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <HardDrive size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Comprehensive Backup & Data Management' : 'Sao lưu & Quản lý Dữ liệu Toàn diện'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {language === 'en'
                      ? 'Export or import all Commands, Pipelines, Environment Profiles, and Preferences into a single JSON file.'
                      : 'Xuất hoặc nhập toàn bộ Danh sách lệnh, Quy trình, Hồ sơ Môi trường và Cấu hình chỉ với 1 file JSON duy nhất.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 flex-wrap">
                  <Button
                    size="sm"
                    onClick={handleExportAll}
                    className="h-10 text-xs sm:text-sm bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 gap-2 px-4 cursor-pointer"
                  >
                    <Download size={15} />
                    {language === 'en' ? 'Export Full Backup (.json)' : 'Xuất File Sao Lưu (.json)'}
                  </Button>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportAll}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 h-10 px-4 rounded-md text-xs sm:text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors">
                      <Upload size={15} />
                      {language === 'en' ? 'Import Backup (.json)' : 'Nhập File Sao Lưu (.json)'}
                    </span>
                  </label>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const confirmed = await confirmAction({
                        title: language === 'en' ? 'Reset to Default Settings' : 'Khôi phục cài đặt gốc',
                        description: language === 'en' ? 'Are you sure you want to reset all application settings to defaults?' : 'Bạn có chắc chắn muốn đưa toàn bộ cài đặt ứng dụng về mặc định ban đầu không?',
                        confirmText: language === 'en' ? 'Reset Defaults' : 'Khôi phục mặc định',
                        cancelText: t('common.cancel'),
                        variant: 'warning'
                      })
                      if (confirmed) {
                        resetSettings()
                        toast.success(language === 'en' ? 'Application settings reset to default' : 'Đã đặt lại cấu hình mặc định')
                      }
                    }}
                    className="h-10 text-xs sm:text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 ml-auto gap-2 px-3 cursor-pointer"
                  >
                    <RotateCcw size={15} />
                    {language === 'en' ? 'Reset Preferences' : 'Đặt lại Cài đặt'}
                  </Button>
                </div>
              </div>
            )}

            {/* SECTION 6: THÔNG BÁO & WEBHOOK */}
            {activeSection === 'webhooks' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Bell size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Automated Notifications & Webhooks' : 'Cấu hình Thông Báo & Webhook Tự Động'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {language === 'en'
                      ? 'Receive Windows Desktop alerts and dispatch execution reports to Discord or Telegram Bot.'
                      : 'Nhận thông báo Windows Desktop và gửi báo cáo kết quả thực thi sang Discord hoặc Telegram Bot.'}
                  </p>
                </div>

                {/* 1. Discord Webhook */}
                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-zinc-200 text-sm">
                      <Send size={16} className="text-blue-400" />
                      <span>Discord Webhook</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                      Embed Card
                    </Badge>
                  </div>

                  {/* Step-by-step guidance for Discord */}
                  <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs text-zinc-300 space-y-1">
                    <span className="font-semibold text-blue-300">
                      {language === 'en' ? '📖 How to get a Discord Webhook (3 steps):' : '📖 Cách lấy Discord Webhook (3 bước):'}
                    </span>
                    <ol className="list-decimal list-inside text-zinc-400 text-[11px] space-y-0.5 pl-1">
                      <li>{language === 'en' ? 'Open Discord → Go to your Server Settings.' : 'Mở Discord → Vào Server của bạn → Chọn Server Settings.'}</li>
                      <li>{language === 'en' ? 'Click Integrations → Select Webhooks → Create New Webhook.' : 'Chọn Integrations → Nhấn Webhooks → Chọn New Webhook.'}</li>
                      <li>{language === 'en' ? 'Pick a channel and click Copy Webhook URL then paste below.' : 'Chọn kênh (channel) muốn nhận thông báo và bấm Copy Webhook URL rồi dán vào bên dưới.'}</li>
                    </ol>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Discord Webhook URL:</label>
                    <div className="flex gap-2">
                      <Input
                        value={discordUrl}
                        onChange={(e) => setDiscordUrl(e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="bg-zinc-900 border-zinc-800 text-xs font-mono focus:border-emerald-500/50 flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!discordUrl || isTestingDiscord}
                        onClick={async () => {
                          setIsTestingDiscord(true)
                          await handleSaveWebhook()
                          await testWebhook('discord', { discordUrl })
                          setIsTestingDiscord(false)
                        }}
                        className="h-9 px-3.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 cursor-pointer shrink-0"
                      >
                        {isTestingDiscord ? (language === 'en' ? 'Testing...' : 'Đang test...') : (language === 'en' ? 'Send Test' : 'Gửi Thử')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 2. Telegram Bot */}
                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-zinc-200 text-sm">
                      <Send size={16} className="text-sky-400" />
                      <span>Telegram Bot</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20">
                      Markdown Chat
                    </Badge>
                  </div>

                  {/* Step-by-step guidance for Telegram */}
                  <div className="p-2.5 bg-sky-500/5 border border-sky-500/20 rounded-lg text-xs text-zinc-300 space-y-1">
                    <span className="font-semibold text-sky-300">
                      {language === 'en' ? '📖 How to get Telegram Bot Token & Chat ID:' : '📖 Cách lấy Bot Token & Chat ID Telegram:'}
                    </span>
                    <ul className="list-disc list-inside text-zinc-400 text-[11px] space-y-0.5 pl-1">
                      <li><strong>Bot Token</strong>: {language === 'en' ? 'Open Telegram, chat with @BotFather, type /newbot → Copy token (e.g. 123456:ABC-DEF...)' : 'Mở Telegram, tìm @BotFather, gõ /newbot → Copy mã Token dạng 123456:ABC-DEF...'}</li>
                      <li><strong>Chat ID</strong>: {language === 'en' ? 'Find @userinfobot on Telegram to get your user ID, or add Bot to group and get Group ID (-100...).' : 'Tìm @userinfobot trên Telegram để lấy ID của bạn, hoặc thêm Bot vào nhóm và lấy Group ID (dạng -100...).'}</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400">Bot Token:</label>
                      <Input
                        type="password"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        placeholder="123456789:ABCdefGHIjklMNO..."
                        className="bg-zinc-900 border-zinc-800 text-xs font-mono focus:border-emerald-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400">Chat ID:</label>
                      <Input
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        placeholder="-100123456789 / 987654321"
                        className="bg-zinc-900 border-zinc-800 text-xs font-mono focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!telegramToken || !telegramChatId || isTestingTelegram}
                      onClick={async () => {
                        setIsTestingTelegram(true)
                        await handleSaveWebhook()
                        await testWebhook('telegram', { telegramToken, telegramChatId })
                        setIsTestingTelegram(false)
                      }}
                      className="h-9 px-3.5 text-xs bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 cursor-pointer"
                    >
                      {isTestingTelegram ? (language === 'en' ? 'Testing...' : 'Đang test...') : (language === 'en' ? 'Send Test Telegram' : 'Gửi Thử Telegram')}
                    </Button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveWebhook}
                    className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-5 h-9 cursor-pointer"
                  >
                    {language === 'en' ? 'Save Webhook Configuration' : 'Lưu Cấu Hình Webhook'}
                  </Button>
                </div>
              </div>
            )}

            {/* SECTION 7: ĐỒNG BỘ ĐÁM MÂY (GITHUB GIST & E2EE) */}
            {activeSection === 'cloudSync' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Cloud size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Personal Cloud Sync (GitHub Gist)' : 'Đồng Bộ Đám Mây Cá Nhân (GitHub Gist Sync)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {language === 'en'
                      ? 'Automate 2-way sync for Commands, Pipelines, Profiles, and Schedules via GitHub Gist with AES-256-GCM encryption.'
                      : 'Tự động sao lưu và đồng bộ 2 chiều toàn bộ Lệnh, Quy trình, Môi trường và Lịch trình qua GitHub Gist với mã hóa đầu cuối AES-256-GCM.'}
                  </p>
                </div>

                {/* 1. GitHub Token Configuration */}
                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-zinc-200 text-sm">
                      <KeyRound size={16} className="text-emerald-400" />
                      <span>GitHub Personal Access Token</span>
                    </div>
                    {githubUsername ? (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 size={11} /> @{githubUsername}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400 border-zinc-700">
                        {language === 'en' ? 'Not connected' : 'Chưa liên kết'}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-zinc-400">
                        {language === 'en' ? 'Personal Access Token (PAT with "gist" scope):' : 'Personal Access Token (PAT - Quyền "gist"): '}
                      </label>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=gist&description=CLIM-Desktop-Sync"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {language === 'en' ? 'Generate PAT on GitHub' : 'Tạo Token trên GitHub'} <ExternalLink size={11} />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={syncToken}
                        onChange={(e) => setSyncToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="bg-zinc-900 border-zinc-800 text-xs font-mono focus:border-emerald-500/50 flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!syncToken || isTestingToken}
                        onClick={async () => {
                          await handleSaveCloudSync()
                          await testGitHubToken(syncToken)
                        }}
                        className="h-9 px-3.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer shrink-0"
                      >
                        {isTestingToken ? (language === 'en' ? 'Testing...' : 'Đang kiểm tra...') : (language === 'en' ? 'Test Token' : 'Kiểm Tra Token')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs text-zinc-400">
                      {language === 'en' ? 'Gist ID (Leave blank to auto-create):' : 'Gist ID (Để trống nếu muốn tự động tạo mới):'}
                    </label>
                    <Input
                      value={syncGistId}
                      onChange={(e) => setSyncGistId(e.target.value)}
                      placeholder="VD: a1b2c3d4e5f67890abcdef1234567890"
                      className="bg-zinc-900 border-zinc-800 text-xs font-mono focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                {/* 2. End-toEnd Encryption Master Password */}
                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-zinc-200 text-sm">
                      <Lock size={16} className="text-amber-400" />
                      <span>{language === 'en' ? 'End-to-End Encryption (Master Password)' : 'Mã Hóa Đầu Cuối (Master Password - E2EE)'}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                      AES-256-GCM
                    </Badge>
                  </div>

                  <div className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-zinc-300 space-y-1">
                    <span className="font-semibold text-amber-400">
                      {language === 'en' ? '💡 Important note about Master Password:' : '💡 Lưu ý quan trọng về Master Password:'}
                    </span>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {language === 'en'
                        ? 'Master Password is your custom secret passphrase (NOT your GitHub account password). It derives the AES-256-GCM encryption key to secure your backed up data. No one can decrypt your Gist without it.'
                        : 'Master Password là mật khẩu do bạn tự nghĩ ra (hoàn toàn không phải là mật khẩu tài khoản GitHub). Nó dùng làm chìa khóa mã hóa AES-256-GCM cho dữ liệu sao lưu của bạn. Bất kỳ ai xem Gist cũng không thể giải mã nếu không biết mật khẩu này.'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">
                      {language === 'en' ? 'Master Password (Optional E2EE Key):' : 'Master Password (Tùy chọn bảo mật cá nhân):'}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={syncPassword}
                        onChange={(e) => setSyncPassword(e.target.value)}
                        placeholder={language === 'en' ? 'Enter your custom passphrase (e.g. MySecretPass123)...' : 'Nhập mật khẩu tự đặt của bạn (ví dụ: MySecretPass123)...'}
                        className="bg-zinc-900 border-zinc-800 text-xs font-mono focus:border-emerald-500/50 flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        className="h-9 px-3 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                      >
                        {showPassword ? (language === 'en' ? 'Hide' : 'Ẩn') : (language === 'en' ? 'Show' : 'Hiện')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 3. Sync Action Controls */}
                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">
                      {cloudSyncConfig.lastSyncedAt ? (
                        <span>
                          {language === 'en' ? 'Last synced:' : 'Đồng bộ lần cuối:'}{' '}
                          <strong className="text-zinc-200">
                            {new Date(cloudSyncConfig.lastSyncedAt).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')}
                          </strong>
                          {cloudSyncConfig.encrypted && (
                            <span className="text-amber-400 font-bold ml-1.5">• E2EE</span>
                          )}
                        </span>
                      ) : (
                        language === 'en' ? 'Never synced yet' : 'Chưa thực hiện đồng bộ'
                      )}
                    </span>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveCloudSync}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3.5 h-8 font-medium cursor-pointer"
                    >
                      {language === 'en' ? 'Save Config' : 'Lưu Cấu Hình'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!syncToken || isSyncing}
                      onClick={async () => {
                        await handleSaveCloudSync()
                        await uploadBackupToGist({ password: syncPassword })
                      }}
                      className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 gap-2 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>{isSyncing ? (language === 'en' ? 'Uploading...' : 'Đang tải lên...') : (language === 'en' ? 'Push Backup to Gist' : 'Tải Lên Gist (Push Backup)')}</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      disabled={!syncToken || isSyncing}
                      onClick={async () => {
                        await handleSaveCloudSync()
                        await downloadBackupFromGist({ password: syncPassword })
                      }}
                      className="h-10 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 gap-2 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>{isSyncing ? (language === 'en' ? 'Downloading...' : 'Đang tải về...') : (language === 'en' ? 'Pull Backup from Gist' : 'Tải Về Từ Gist (Pull Backup)')}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 8. AI COPILOT SETTINGS */}
            {activeSection === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-400" />
                    {language === 'en' ? 'AI CLI Copilot Assistant Configuration' : 'Cấu Hình Trợ Lý Trí Tuệ Nhân Tạo (AI CLI Copilot)'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {language === 'en'
                      ? 'Configure LLM models to generate CLI scripts from natural language, explain parameters, and diagnose terminal errors.'
                      : 'Cấu hình mô hình AI để sinh câu lệnh từ tiếng Việt, giải thích tham số và tự động chẩn đoán sửa lỗi terminal.'}
                  </p>
                </div>

                {/* Provider Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    {language === 'en' ? 'AI Provider:' : 'Nhà cung cấp AI (Provider):'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'gemini', name: 'Google Gemini', desc: language === 'en' ? 'Fast, free tier & smart' : 'Nhanh, miễn phí & thông minh' },
                      { id: 'openai', name: 'OpenAI (GPT-4o)', desc: 'GPT-4o, GPT-4o mini' },
                      { id: 'claude', name: 'Anthropic Claude', desc: 'Claude 3.5 Sonnet' },
                      { id: 'ollama', name: language === 'en' ? 'Ollama Local' : 'Ollama Cục bộ (Local)', desc: language === 'en' ? '100% Offline & Private' : '100% Offline & Bảo mật' },
                      { id: 'custom', name: language === 'en' ? 'Custom Endpoint' : 'Tùy Chỉnh (OpenAI-compatible)', desc: 'DeepSeek, Groq, v.v.' }
                    ].map((prov) => {
                      const isSelected = aiConfig.provider === prov.id
                      return (
                        <div
                          key={prov.id}
                          onClick={() => {
                            const p = prov.id as AIProvider
                            const defaults = PROVIDER_DEFAULT_MODELS[p]
                            setAiConfig({
                              provider: p,
                              model: defaults.defaultModel,
                              baseUrl: defaults.defaultUrl || ''
                            })
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500 text-purple-300 shadow-sm'
                              : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>{prov.name}</span>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-purple-400" />}
                          </div>
                          <p className="text-[10px] text-zinc-500 line-clamp-1">{prov.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Model Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">
                      {language === 'en' ? 'Model Name:' : 'Tên Mô Hình (Model):'}
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {language === 'en' ? 'Active: ' : 'Đang chọn: '}
                      <strong className="text-purple-300">{aiConfig.model || (language === 'en' ? 'Not configured' : 'Chưa cấu hình')}</strong>
                    </span>
                  </div>
                  <Input
                    type="text"
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig({ model: e.target.value })}
                    placeholder="gemini-2.5-flash, gpt-4o, claude-3-5-sonnet, qwen2.5-coder..."
                    className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs h-9 font-mono"
                  />
                  <p className="text-[10px] text-zinc-500">
                    {language === 'en'
                      ? 'You can enter any model name supported by your provider or API key.'
                      : 'Bạn có thể tự do nhập bất kỳ model nào mà nhà cung cấp hoặc API của bạn hỗ trợ.'}
                  </p>
                </div>

                {/* API Key (for non-ollama) */}
                {aiConfig.provider !== 'ollama' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300">
                        {aiConfig.provider === 'gemini'
                          ? 'Google Gemini API Key'
                          : aiConfig.provider === 'openai'
                          ? 'OpenAI API Key'
                          : aiConfig.provider === 'claude'
                          ? 'Anthropic Claude API Key'
                          : 'API Key'}
                        :
                      </label>
                      {aiConfig.provider === 'gemini' && (
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-purple-400 hover:underline inline-flex items-center gap-1"
                        >
                          {language === 'en' ? 'Get free Gemini Key' : 'Lấy Gemini Key miễn phí'} <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        type={showAiKey ? 'text' : 'password'}
                        value={aiConfig.apiKey}
                        onChange={(e) => setAiConfig({ apiKey: e.target.value })}
                        placeholder={
                          aiConfig.provider === 'gemini'
                            ? 'AIzaSy...'
                            : aiConfig.provider === 'openai'
                            ? 'sk-proj-...'
                            : aiConfig.provider === 'claude'
                            ? 'sk-ant-...'
                            : (language === 'en' ? 'Enter your API key...' : 'Nhập API key của bạn...')
                        }
                        className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs h-9 pr-14 font-mono"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAiKey(!showAiKey)}
                        className="absolute right-1 top-1 h-7 text-[11px] text-zinc-400 hover:text-zinc-200"
                      >
                        {showAiKey ? (language === 'en' ? 'Hide' : 'Ẩn') : (language === 'en' ? 'Show' : 'Hiện')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Base URL (for Ollama or Custom) */}
                {(aiConfig.provider === 'ollama' || aiConfig.provider === 'custom') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300">
                      {aiConfig.provider === 'ollama'
                        ? (language === 'en' ? 'Ollama Server Address (Base URL)' : 'Địa Chỉ Ollama Server (Base URL)')
                        : 'Base URL Endpoint'}
                      :
                    </label>
                    <Input
                      type="text"
                      value={aiConfig.baseUrl || ''}
                      onChange={(e) => setAiConfig({ baseUrl: e.target.value })}
                      placeholder={aiConfig.provider === 'ollama' ? 'http://localhost:11434' : 'https://api.deepseek.com/v1'}
                      className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs h-9 font-mono"
                    />
                    {aiConfig.provider === 'ollama' && (
                      <p className="text-[11px] text-zinc-500">
                        {language === 'en' ? 'Run ' : 'Chạy lệnh '}
                        <code className="text-purple-400 font-mono">ollama run qwen2.5-coder</code>
                        {language === 'en' ? ' on your machine before testing.' : ' trên máy của bạn trước khi thử nghiệm.'}
                      </p>
                    )}
                  </div>
                )}

                {/* Temperature setting */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-zinc-300">
                      {language === 'en' ? 'Creativity (Temperature):' : 'Độ sáng tạo (Temperature):'}
                    </label>
                    <span className="font-mono text-purple-400 font-bold">{aiConfig.temperature ?? 0.2}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={aiConfig.temperature ?? 0.2}
                    onChange={(e) => setAiConfig({ temperature: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="text-[10px] text-zinc-500 block">
                    {language === 'en'
                      ? 'Recommended 0.1 - 0.2 for precise, accurate and hallucination-free CLI code.'
                      : 'Khuyến nghị 0.1 - 0.2 để câu lệnh sinh ra chính xác và ít bị ảo giác (hallucination).'}
                  </span>
                </div>

                {/* Action Buttons: Save Config & Test Connection */}
                <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-500">
                    {language === 'en' ? 'Shortcut to summon AI Copilot anywhere: ' : 'Phím tắt mở AI Copilot mọi lúc: '}
                    <kbd className="font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Ctrl + Space</kbd>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setAiConfig({
                          apiKey: aiConfig.apiKey?.trim(),
                          model: aiConfig.model?.trim(),
                          baseUrl: aiConfig.baseUrl?.trim()
                        })
                        toast.success(language === 'en' ? 'AI configuration saved successfully!' : 'Đã lưu toàn bộ cấu hình AI thành công!', {
                          description: `Provider: ${aiConfig.provider.toUpperCase()} | Model: ${aiConfig.model}`
                        })
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 h-8 gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Check size={14} />
                      {language === 'en' ? 'Save Config' : 'Lưu Cấu Hình'}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      disabled={isTestingAi}
                      onClick={async () => {
                        setIsTestingAi(true)
                        try {
                          const result = await testAIConnection(aiConfig)
                          if (result.success) {
                            toast.success(result.message)
                          } else {
                            toast.error(result.message)
                          }
                        } finally {
                          setIsTestingAi(false)
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 h-8 gap-1.5 cursor-pointer shadow-sm"
                    >
                      {isTestingAi ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          {language === 'en' ? 'Testing...' : 'Đang kiểm tra...'}
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          {language === 'en' ? 'Test AI Connection' : 'Kiểm Tra Kết Nối AI'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-xs text-zinc-500 font-mono">
            {language === 'en' ? 'CLIM - Preferences auto-saved in real-time' : 'CLIM - Tự động lưu cấu hình theo thời gian thực'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                toast.success(language === 'en' ? 'Settings saved and applied successfully!' : 'Đã lưu và áp dụng toàn bộ cài đặt thành công!')
                onOpenChange(false)
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-1.5 h-8 font-semibold cursor-pointer gap-1.5 shadow-sm"
            >
              <Check size={14} />
              {language === 'en' ? 'Save & Apply' : 'Lưu & Áp Dụng'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300 text-xs px-4 py-1.5 h-8 font-medium cursor-pointer"
            >
              {language === 'en' ? 'Close' : 'Đóng'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
