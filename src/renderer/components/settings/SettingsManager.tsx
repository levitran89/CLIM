import React from 'react'
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
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Terminal,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Sliders,
  Type,
  CheckCircle2,
  HardDrive,
  Palette,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

export function SettingsManager(): React.JSX.Element {
  const { settings, updateSettings, resetSettings } = useSettingsStore()
  const { commands, loadCommands } = useCommandStore()
  const { sequences, loadSequences } = useSequenceStore()
  const { profiles, loadProfiles } = useProfileStore()

  // Export full backup
  const handleExportAll = (): void => {
    try {
      const backupData = {
        version: '1.1.0',
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
      toast.success('Đã xuất toàn bộ dữ liệu cấu hình thành công')
    } catch {
      toast.error('Lỗi khi xuất dữ liệu dự phòng')
    }
  }

  // Import full backup
  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string
        const data = JSON.parse(text)

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

        toast.success('Đã khôi phục toàn bộ dữ liệu thành công!')
      } catch {
        toast.error('File dữ liệu không hợp lệ')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const shells: { id: ShellType; name: string; desc: string; iconColor: string }[] = [
    {
      id: 'powershell',
      name: 'PowerShell',
      desc: 'Shell mặc định mạnh mẽ trên Windows (powershell.exe)',
      iconColor: 'text-blue-400'
    },
    {
      id: 'cmd',
      name: 'Command Prompt (CMD)',
      desc: 'Trình thông dịch lệnh chuẩn cổ điển (cmd.exe)',
      iconColor: 'text-amber-400'
    },
    {
      id: 'wsl',
      name: 'WSL Linux',
      desc: 'Môi trường Linux Subsystem (wsl.exe)',
      iconColor: 'text-orange-400'
    }
  ]

  const cursorStyles: { id: CursorStyle; name: string }[] = [
    { id: 'block', name: 'Block (Khối vuông █)' },
    { id: 'bar', name: 'Bar (Thanh dọc |)' },
    { id: 'underline', name: 'Underline (Gạch dưới _)' }
  ]

  const accentColors: { id: AccentColor; name: string; color: string; border: string; bg: string }[] = [
    {
      id: 'emerald',
      name: 'Emerald (Ngọc lục bảo)',
      color: 'bg-emerald-500',
      border: 'border-emerald-500',
      bg: 'bg-emerald-500/15'
    },
    {
      id: 'cyan',
      name: 'Cyan (Xanh đại dương)',
      color: 'bg-cyan-500',
      border: 'border-cyan-500',
      bg: 'bg-cyan-500/15'
    },
    {
      id: 'violet',
      name: 'Violet (Tím hoàng gia)',
      color: 'bg-violet-500',
      border: 'border-violet-500',
      bg: 'bg-violet-500/15'
    },
    {
      id: 'rose',
      name: 'Rose (Đỏ hồng Ruby)',
      color: 'bg-rose-500',
      border: 'border-rose-500',
      bg: 'bg-rose-500/15'
    },
    {
      id: 'amber',
      name: 'Amber (Cam hổ phách)',
      color: 'bg-amber-500',
      border: 'border-amber-500',
      bg: 'bg-amber-500/15'
    },
    {
      id: 'blue',
      name: 'Blue (Xanh lam Electric)',
      color: 'bg-blue-500',
      border: 'border-blue-500',
      bg: 'bg-blue-500/15'
    }
  ]

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 md:px-8 xl:px-12 py-1">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="p-3 flex items-center gap-3 border-b border-zinc-800/80 mb-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Cài đặt Hệ thống & Tùy biến
            </h2>
            <p className="text-xs text-zinc-400">
              Quản lý Shell mặc định, màu sắc chủ đạo, font chữ, quyền hạn thực thi và sao lưu dữ liệu
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-1">
          <div className="space-y-5 pb-8">
            {/* SECTION 1: Màu sắc chủ đạo (Accent Color Theme) */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm uppercase tracking-wider">
                <Palette size={17} className="text-emerald-400" />
                <span>Màu sắc Chủ đạo (Accent Color)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {accentColors.map((item) => {
                  const isSelected = (settings.accentColor || 'emerald') === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSettings({ accentColor: item.id })
                        toast.success(`Đã đổi màu chủ đạo: ${item.name}`)
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? `${item.border} ${item.bg} shadow-md shadow-zinc-950`
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${item.color} shadow-sm shrink-0 flex items-center justify-center text-white`}
                      >
                        {isSelected && <Check size={14} className="stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
                          {item.name.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {item.name.includes('(') ? item.name.match(/\((.*?)\)/)?.[1] : ''}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SECTION 2: Shell Mặc Định */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm uppercase tracking-wider">
                <Terminal size={17} className="text-emerald-400" />
                <span>Trình thông dịch lệnh mặc định (Default Shell)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {shells.map((sh) => {
                  const isSelected = settings.defaultShell === sh.id
                  return (
                    <div
                      key={sh.id}
                      onClick={() => updateSettings({ defaultShell: sh.id })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/60 shadow-sm'
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

            {/* SECTION 3: Hiển thị & Kiểu chữ Terminal */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm uppercase tracking-wider">
                <Type size={17} className="text-emerald-400" />
                <span>Hiển thị & Kiểu dáng Con trỏ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Font Size */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-200">
                    Cỡ chữ Terminal (Font Size)
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
                    Kiểu con trỏ (Cursor Style)
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

            {/* SECTION 4: Quyền hạn Thực thi (Permissions & Administrator) */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm uppercase tracking-wider">
                <ShieldCheck size={17} className="text-emerald-400" />
                <span>Quyền hạn Thực thi (User vs Administrator)</span>
              </div>

              <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm space-y-3 text-zinc-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <p>
                    <strong>Cơ chế kế thừa quyền:</strong> Các cửa sổ Terminal (PowerShell, CMD, WSL) trong CLIM sẽ tự động kế thừa quyền của chính ứng dụng CLIM.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <p>
                    <strong>Chế độ User (Mặc định):</strong> Khi mở CLIM bình thường, tất cả terminal chạy dưới quyền User an toàn cho các lệnh dev thông thường.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <p>
                    <strong>Chế độ Administrator:</strong> Để chạy lệnh với quyền Quản trị cao nhất (VD: cài service Windows, đổi IP/Hosts, kill process hệ thống), bạn chỉ cần chuột phải vào icon app CLIM và chọn <span className="text-amber-300 font-bold">"Run as administrator"</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 5: Sao lưu & Khôi phục Dữ liệu */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm uppercase tracking-wider">
                <HardDrive size={17} className="text-emerald-400" />
                <span>Sao lưu & Quản lý Dữ liệu Toàn diện</span>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed">
                Sao lưu hoặc đồng bộ toàn bộ Danh sách lệnh, Quy trình, Hồ sơ Môi trường và Cấu hình sang máy tính khác chỉ với 1 file JSON duy nhất.
              </p>

              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <Button
                  size="sm"
                  onClick={handleExportAll}
                  className="h-9 text-xs sm:text-sm bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 gap-2 px-4 cursor-pointer"
                >
                  <Download size={15} />
                  Xuất File Sao Lưu (.json)
                </Button>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportAll}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-xs sm:text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors">
                    <Upload size={15} />
                    Nhập File Sao Lưu (.json)
                  </span>
                </label>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const confirmed = await confirmAction({
                      title: 'Khôi phục cài đặt gốc',
                      description: 'Bạn có chắc chắn muốn đưa toàn bộ cài đặt ứng dụng về mặc định ban đầu không?',
                      confirmText: 'Khôi phục mặc định',
                      cancelText: 'Hủy',
                      variant: 'warning'
                    })
                    if (confirmed) {
                      resetSettings()
                      toast.success('Đã đặt lại cấu hình mặc định')
                    }
                  }}
                  className="h-9 text-xs sm:text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 ml-auto gap-2 px-3 cursor-pointer"
                >
                  <RotateCcw size={15} />
                  Đặt lại Cài đặt
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
