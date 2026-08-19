import React, { useState, useEffect } from 'react'
import { useSettingsStore, defaultKeybindings } from '@/stores/settings-store'
import type { KeybindingMap } from '@shared/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Keyboard, RotateCcw, AlertTriangle, Edit3, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/stores/i18n-store'

interface KeybindingDefinition {
  key: keyof KeybindingMap
  titleVi: string
  titleEn: string
  descriptionVi: string
  descriptionEn: string
  category: 'global' | 'terminal' | 'tabs'
}

const KEYBINDING_DEFS: KeybindingDefinition[] = [
  // Global
  {
    key: 'openPalette',
    titleVi: 'Mở Spotlight Search & Chạy Nhanh',
    titleEn: 'Spotlight Search & Quick Run',
    descriptionVi: 'Tìm kiếm mờ toàn bộ lệnh, quy trình, profile, lịch trình',
    descriptionEn: 'Fuzzy search commands, sequences, profiles, and scheduled tasks',
    category: 'global'
  },
  {
    key: 'openAiCopilot',
    titleVi: 'Mở Trợ Lý AI CLI Copilot',
    titleEn: 'Open AI CLI Copilot',
    descriptionVi: 'Tạo lệnh CLI từ tiếng Việt tự nhiên và phân tích lỗi',
    descriptionEn: 'Generate CLI commands from natural language & diagnose errors',
    category: 'global'
  },
  {
    key: 'openSnippetHub',
    titleVi: 'Mở Kho Lệnh Mẫu (Snippet Hub)',
    titleEn: 'Open Snippet Hub',
    descriptionVi: 'Khám phá và cài đặt các gói lệnh Docker, Git, NodeJS 1-click',
    descriptionEn: 'Explore and install 1-click curated command packs for Docker, Git, Node',
    category: 'global'
  },
  {
    key: 'openSettings',
    titleVi: 'Mở Cài Đặt Hệ Thống',
    titleEn: 'Open System Preferences',
    descriptionVi: 'Tùy chỉnh giao diện, terminal, AI provider, phím tắt',
    descriptionEn: 'Customize UI themes, terminal defaults, AI provider, keybindings',
    category: 'global'
  },
  {
    key: 'openGuide',
    titleVi: 'Mở Hướng Dẫn Sử Dụng',
    titleEn: 'Open User Guide',
    descriptionVi: 'Xem tài liệu và mẹo dùng nhanh CLIM',
    descriptionEn: 'View comprehensive documentation and quick tips for CLIM',
    category: 'global'
  },

  // Terminal
  {
    key: 'newTerminal',
    titleVi: 'Mở Terminal Mới',
    titleEn: 'New Terminal Tab',
    descriptionVi: 'Tạo tab terminal mới theo shell mặc định',
    descriptionEn: 'Spawn a new terminal tab using the default shell',
    category: 'terminal'
  },
  {
    key: 'closeTerminal',
    titleVi: 'Đóng Terminal Hiện Tại',
    titleEn: 'Close Active Terminal',
    descriptionVi: 'Dừng phiên terminal đang chọn',
    descriptionEn: 'Terminate the currently active terminal session',
    category: 'terminal'
  },

  // Navigation Tabs
  {
    key: 'tabProfiles',
    titleVi: 'Chuyển Tab: Môi Trường (Profiles)',
    titleEn: 'Switch Tab: Profiles (.env)',
    descriptionVi: 'Quản lý biến môi trường .env',
    descriptionEn: 'Manage environment variable profiles and keys',
    category: 'tabs'
  },
  {
    key: 'tabCommands',
    titleVi: 'Chuyển Tab: Danh Sách Lệnh',
    titleEn: 'Switch Tab: Commands',
    descriptionVi: 'Quản lý kho lệnh CLI cá nhân',
    descriptionEn: 'Manage your personal CLI commands catalog',
    category: 'tabs'
  },
  {
    key: 'tabSequences',
    titleVi: 'Chuyển Tab: Quy Trình (Sequences)',
    titleEn: 'Switch Tab: Pipelines (Sequences)',
    descriptionVi: 'Dãy lệnh tự động hóa tuần tự/đồng thời',
    descriptionEn: 'Automated sequential/parallel execution pipelines',
    category: 'tabs'
  },
  {
    key: 'tabScheduler',
    titleVi: 'Chuyển Tab: Lập Lịch Tự Động',
    titleEn: 'Switch Tab: Scheduler',
    descriptionVi: 'Cron job chạy ngầm & thông báo Webhook',
    descriptionEn: 'Background cron scheduler & webhook alerts',
    category: 'tabs'
  },
  {
    key: 'tabTerminal',
    titleVi: 'Chuyển Tab: Màn Hình Terminal',
    titleEn: 'Switch Tab: Terminal Workspace',
    descriptionVi: 'Khu vực làm việc terminal chính',
    descriptionEn: 'Primary multi-session terminal workspace',
    category: 'tabs'
  },
  {
    key: 'tabMonitor',
    titleVi: 'Chuyển Tab: Tài Nguyên & Mạng (Ports)',
    titleEn: 'Switch Tab: System & Network Monitor',
    descriptionVi: 'Đồng hồ CPU, RAM và chi tiết tiến trình',
    descriptionEn: 'Live CPU, RAM gauges, active ports, and diagnostics',
    category: 'tabs'
  },
  {
    key: 'tabSSH',
    titleVi: 'Chuyển Tab: Quản Lý Máy Chủ SSH',
    titleEn: 'Switch Tab: SSH Servers',
    descriptionVi: 'Danh sách server VPS/Cloud & Tunnels',
    descriptionEn: 'Remote VPS/Cloud servers and SSH tunnels',
    category: 'tabs'
  }
]

export function KeybindingsSettingsTab(): React.JSX.Element {
  const { settings, updateSettings } = useSettingsStore()
  const { t, language } = useTranslation()
  const keybindings: KeybindingMap = settings.keybindings || defaultKeybindings

  const [recordingKey, setRecordingKey] = useState<keyof KeybindingMap | null>(null)
  const [pressedCombo, setPressedCombo] = useState<string>('')

  // Listen for keydown while recording
  useEffect(() => {
    if (!recordingKey) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Ignore single modifier press
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        return
      }

      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
      if (e.altKey) parts.push('Alt')
      if (e.shiftKey) parts.push('Shift')

      // Key name formatting
      let keyName = e.key
      if (keyName === ' ') keyName = 'Space'
      else if (keyName.length === 1) keyName = keyName.toUpperCase()

      parts.push(keyName)
      const combo = parts.join('+')

      setPressedCombo(combo)

      // Save keybinding
      const updated = { ...keybindings, [recordingKey]: combo }
      updateSettings({ keybindings: updated })
      setRecordingKey(null)
      toast.success(language === 'en' ? `Keybinding updated to "${combo}"` : `Đã đổi phím tắt thành "${combo}"`)
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [recordingKey, keybindings, updateSettings, language])

  const handleResetDefault = () => {
    updateSettings({ keybindings: defaultKeybindings })
    toast.success(language === 'en' ? 'All keybindings reset to default' : 'Đã khôi phục toàn bộ phím tắt về mặc định')
  }

  // Detect duplicates
  const valueCounts = Object.entries(keybindings).reduce(
    (acc, [, val]) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const renderCategory = (category: 'global' | 'terminal' | 'tabs', catTitleVi: string, catTitleEn: string) => {
    const list = KEYBINDING_DEFS.filter((d) => d.category === category)

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span>{language === 'en' ? catTitleEn : catTitleVi}</span>
          </h4>
          <span className="text-[11px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {list.length} {language === 'en' ? 'shortcuts' : 'phím tắt'}
          </span>
        </div>

        <div className="space-y-2">
          {list.map((def) => {
            const currentCombo = keybindings[def.key] || defaultKeybindings[def.key]
            const isRecordingThis = recordingKey === def.key
            const isDuplicate = valueCounts[currentCombo] > 1

            return (
              <div
                key={def.key}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850/80 transition-all text-xs shadow-sm"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 text-sm">
                      {language === 'en' ? def.titleEn : def.titleVi}
                    </span>
                    {isDuplicate && (
                      <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/40 gap-1 bg-amber-500/15 font-semibold">
                        <AlertTriangle size={11} />
                        {language === 'en' ? 'Conflict' : 'Trùng phím'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-normal mt-0.5 leading-relaxed">
                    {language === 'en' ? def.descriptionEn : def.descriptionVi}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (isRecordingThis) {
                        setRecordingKey(null)
                      } else {
                        setRecordingKey(def.key)
                        setPressedCombo('')
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-lg font-mono font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      isRecordingThis
                        ? 'bg-amber-500/25 text-amber-300 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse'
                        : 'bg-zinc-800 text-emerald-300 border border-zinc-650 hover:bg-zinc-750 hover:border-emerald-500/60 hover:text-emerald-200 shadow-[0_2px_0_rgba(255,255,255,0.06),0_2px_6px_rgba(0,0,0,0.5)]'
                    }`}
                    title={language === 'en' ? 'Click to record new keybinding' : 'Bấm vào để gán phím tắt mới'}
                  >
                    {isRecordingThis ? (
                      <>
                        <Edit3 size={13} className="animate-spin text-amber-400" />
                        <span>{language === 'en' ? 'Press new shortcut...' : 'Bấm tổ hợp phím mới...'}</span>
                      </>
                    ) : (
                      <>
                        <kbd className="text-emerald-400 font-bold">{currentCombo}</kbd>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Keyboard size={20} />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-zinc-100">
              {language === 'en' ? 'System Keybindings & Shortcuts' : 'Tùy Chỉnh Phím Tắt Hệ Thống'}
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {language === 'en'
                ? 'Click any shortcut button and press your preferred key combination on keyboard to reassign.'
                : 'Nhấp vào nút phím tắt bất kỳ và bấm tổ hợp phím trên bàn phím để gán lại.'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleResetDefault}
          className="border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs h-8 px-3.5 gap-1.5 cursor-pointer shrink-0 shadow-sm"
        >
          <RotateCcw size={13} className="text-emerald-400" />
          <span>{language === 'en' ? 'Reset Defaults' : 'Mặc Định'}</span>
        </Button>
      </div>

      {/* Categories */}
      {renderCategory('global', '🌐 Phím Tắt Toàn Cục & Tiện Ích', '🌐 Global & Utility Shortcuts')}
      {renderCategory('terminal', '⚡ Thao Tác Terminal', '⚡ Terminal Actions')}
      {renderCategory('tabs', '📑 Phím Tắt Chuyển Đổi Tab', '📑 Tab Navigation Shortcuts')}
    </div>
  )
}
