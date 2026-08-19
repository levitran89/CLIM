import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCommandStore } from '@/stores/command-store'
import { useSequenceStore } from '@/stores/sequence-store'
import { useProfileStore } from '@/stores/profile-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSchedulerStore } from '@/stores/scheduler-store'
import {
  Search,
  Terminal,
  ListOrdered,
  Layers,
  SquareTerminal,
  Network,
  Sliders,
  HelpCircle,
  Play,
  CornerDownLeft,
  ArrowUpDown,
  Clock,
  Activity,
  Store,
  X,
  type LucideIcon
} from 'lucide-react'
import { toast } from 'sonner'
import type { Command, CommandSequence, ScheduledTask } from '@shared/types'
import type { AppTab } from '@/components/layout/MainContent'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateTab: (tab: AppTab) => void
  onOpenSettings: () => void
  onOpenGuide: () => void
  onOpenHub?: () => void
  onRunCommand: (command: Command) => void
  onRunSequence: (sequence: CommandSequence) => void
}

type PaletteItem = {
  id: string
  type: 'command' | 'sequence' | 'profile' | 'task' | 'nav'
  title: string
  subtitle?: string
  badge?: string
  icon: LucideIcon
  iconColor?: string
  action: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigateTab,
  onOpenSettings,
  onOpenGuide,
  onOpenHub,
  onRunCommand,
  onRunSequence
}: CommandPaletteProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedCommandPreview, setSelectedCommandPreview] = useState<Command | null>(null)
  const [selectedSequencePreview, setSelectedSequencePreview] = useState<CommandSequence | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { commands } = useCommandStore()
  const { sequences } = useSequenceStore()
  const { profiles, activeProfileId, setActiveProfileId } = useProfileStore()
  const { tasks, runTaskNow } = useSchedulerStore()
  const activeProfile = useProfileStore((s) => s.getActiveProfile())

  // Reset query and selected index on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setSelectedCommandPreview(null)
      setSelectedSequencePreview(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Build items based on query
  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase()
    const result: PaletteItem[] = []

    // 1. Navigation items
    const navItems: PaletteItem[] = [
      {
        id: 'nav-commands',
        type: 'nav',
        title: 'Chuyển sang tab Lệnh',
        subtitle: 'Quản lý và thực thi danh sách lệnh',
        badge: 'Tab',
        icon: Terminal,
        iconColor: 'text-emerald-400',
        action: () => {
          onNavigateTab('commands')
          onOpenChange(false)
        }
      },
      {
        id: 'nav-sequences',
        type: 'nav',
        title: 'Chuyển sang tab Quy trình',
        subtitle: 'Tự động hóa chuỗi quy trình nhiều bước',
        badge: 'Tab',
        icon: ListOrdered,
        iconColor: 'text-violet-400',
        action: () => {
          onNavigateTab('sequences')
          onOpenChange(false)
        }
      },
      {
        id: 'nav-terminal',
        type: 'nav',
        title: 'Mở cửa sổ Terminal',
        subtitle: 'Khởi chạy terminal tương tác trực tiếp',
        badge: 'Tab',
        icon: SquareTerminal,
        iconColor: 'text-emerald-400',
        action: () => {
          onNavigateTab('terminal')
          onOpenChange(false)
        }
      },
      {
        id: 'nav-ports',
        type: 'nav',
        title: 'Chuyển sang tab Quản lý Ports',
        subtitle: 'Kiểm tra và đóng port mạng',
        badge: 'Tab',
        icon: Network,
        iconColor: 'text-cyan-400',
        action: () => {
          onNavigateTab('ports')
          onOpenChange(false)
        }
      },
      {
        id: 'nav-scheduler',
        type: 'nav',
        title: 'Chuyển sang tab Lập lịch (Scheduler)',
        subtitle: 'Quản lý các tác vụ tự động hóa định kỳ',
        badge: 'Tab',
        icon: Clock,
        iconColor: 'text-emerald-400',
        action: () => {
          onNavigateTab('scheduler')
          onOpenChange(false)
        }
      },
      {
        id: 'nav-monitor',
        type: 'nav',
        title: 'Chuyển sang tab Tài nguyên (Resource Monitor)',
        subtitle: 'Giám sát CPU, RAM và tiến trình thời gian thực',
        badge: 'Tab',
        icon: Activity,
        iconColor: 'text-emerald-400',
        action: () => {
          onNavigateTab('monitor')
          onOpenChange(false)
        }
      },
      {
        id: 'nav-profiles',
        type: 'nav',
        title: 'Chuyển sang tab Môi trường',
        subtitle: 'Quản lý biến môi trường theo dự án',
        badge: 'Tab',
        icon: Layers,
        iconColor: 'text-emerald-400',
        action: () => {
          onNavigateTab('profiles')
          onOpenChange(false)
        }
      },
      {
        id: 'nav-hub',
        type: 'nav',
        title: 'Mở Kho Lệnh Mẫu (Snippet Hub)',
        subtitle: 'Cài đặt nhanh các gói lệnh Docker, Node.js, Python, DevOps',
        badge: 'Hub',
        icon: Store,
        iconColor: 'text-emerald-400',
        action: () => {
          onOpenChange(false)
          onOpenHub?.()
        }
      },
      {
        id: 'nav-settings',
        type: 'nav',
        title: 'Mở Cài đặt Ứng dụng',
        subtitle: 'Tùy chỉnh màu sắc, shell mặc định, webhook, cloud sync, sao lưu',
        badge: 'Modal',
        icon: Sliders,
        iconColor: 'text-zinc-300',
        action: () => {
          onOpenChange(false)
          onOpenSettings()
        }
      },
      {
        id: 'nav-guide',
        type: 'nav',
        title: 'Xem Hướng dẫn Sử dụng',
        subtitle: 'Tài liệu hướng dẫn, phím tắt và tra cứu biến',
        badge: 'Docs',
        icon: HelpCircle,
        iconColor: 'text-emerald-400',
        action: () => {
          onOpenChange(false)
          onOpenGuide()
        }
      }
    ]

    // Filter tasks
    const taskItems: PaletteItem[] = tasks
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      )
      .map((t) => ({
        id: `task-${t.id}`,
        type: 'task',
        title: `Lập lịch: ${t.name}`,
        subtitle: t.scheduleType === 'interval' ? `Lặp lại mỗi ${t.intervalMinutes} phút` : t.scheduleType === 'daily' ? `Hàng ngày lúc ${t.dailyTime}` : 'Khi mở app',
        badge: t.enabled ? 'Lịch Bật' : 'Lịch Tắt',
        icon: Clock,
        iconColor: 'text-emerald-400',
        action: () => {
          onOpenChange(false)
          onNavigateTab('scheduler')
          runTaskNow(t.id)
        }
      }))

    // Filter commands
    const commandItems: PaletteItem[] = commands
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.command.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
      .map((c) => ({
        id: `cmd-${c.id}`,
        type: 'command',
        title: c.name,
        subtitle: c.command,
        badge: c.category || c.shell || 'Lệnh',
        icon: Terminal,
        iconColor: c.shell === 'cmd' ? 'text-amber-400' : c.shell === 'wsl' ? 'text-orange-400' : 'text-blue-400',
        action: () => {
          setSelectedCommandPreview(c)
        }
      }))

    // Filter sequences
    const sequenceItems: PaletteItem[] = sequences
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      )
      .map((s) => ({
        id: `seq-${s.id}`,
        type: 'sequence',
        title: s.name,
        subtitle: `${s.steps.length} bước • ${s.description || 'Chạy chuỗi quy trình'}`,
        badge: 'Quy trình',
        icon: ListOrdered,
        iconColor: 'text-violet-400',
        action: () => {
          setSelectedSequencePreview(s)
        }
      }))

    // Filter profiles
    const profileItems: PaletteItem[] = profiles
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .map((p) => ({
        id: `prof-${p.id}`,
        type: 'profile',
        title: `Môi trường: ${p.name}`,
        subtitle: `${Object.keys(p.variables || {}).length} biến • ${
          activeProfileId === p.id ? 'Đang kích hoạt' : 'Nhấn để kích hoạt'
        }`,
        badge: activeProfileId === p.id ? 'Active' : 'Env',
        icon: Layers,
        iconColor: 'text-emerald-400',
        action: () => {
          setActiveProfileId(p.id)
          toast.success(`Đã kích hoạt môi trường "${p.name}"`)
          onOpenChange(false)
        }
      }))

    // Matching nav items
    const filteredNav = navItems.filter(
      (n) => !q || n.title.toLowerCase().includes(q) || n.subtitle?.toLowerCase().includes(q)
    )

    if (q) {
      result.push(...commandItems, ...sequenceItems, ...taskItems, ...profileItems, ...filteredNav)
    } else {
      // Default initial view: Commands + Sequences + Tasks + Quick Nav
      result.push(...commandItems.slice(0, 5), ...sequenceItems.slice(0, 3), ...taskItems.slice(0, 3), ...filteredNav)
    }

    return result
  }, [query, commands, sequences, tasks, profiles, activeProfileId, onNavigateTab, onOpenSettings, onOpenGuide, onOpenHub, onRunCommand, onRunSequence, onOpenChange, setActiveProfileId, runTaskNow])

  // Handle keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (items.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + items.length) % (items.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[selectedIndex]) {
        items[selectedIndex].action()
      }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-zinc-900/95 border-zinc-750 text-zinc-100 w-[92vw] max-w-3xl p-0 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] rounded-3xl gap-0 backdrop-blur-2xl">
          <DialogTitle className="sr-only">Command Palette Spotlight Search</DialogTitle>

          {/* Search Input Bar (Enlarged & Prominent) */}
          <div className="flex items-center px-5 h-16 sm:h-18 border-b border-zinc-800 bg-zinc-950/80">
            <Search size={22} className="text-emerald-400 shrink-0 mr-3.5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tìm lệnh, quy trình, môi trường, hoặc hành động nhanh..."
              className="w-full h-full bg-transparent text-base sm:text-lg font-medium text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold text-zinc-400 bg-zinc-800/90 border border-zinc-700 rounded-lg shadow-sm">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[420px] overflow-y-auto p-2.5 space-y-1.5">
            {items.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-sm">
                Không tìm thấy lệnh hoặc thao tác nào khớp với từ khóa "{query}"
              </div>
            ) : (
              items.map((item, idx) => {
                const isSelected = selectedIndex === idx
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-zinc-700/80 text-white' : 'bg-zinc-950/60 text-zinc-400'
                        }`}
                      >
                        <Icon size={16} className={item.iconColor} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate flex items-center gap-2">
                          <span>{item.title}</span>
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-zinc-400 truncate font-mono mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-700/60 text-zinc-400 font-mono">
                          {item.badge}
                        </span>
                      )}
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-700/80 px-2 py-0.5 rounded-md font-sans">
                          <span>Xem / Chạy</span>
                          <CornerDownLeft size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer info bar */}
          <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between text-[11px] text-zinc-500">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <ArrowUpDown size={11} /> Di chuyển
              </span>
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft size={11} /> Xem chi tiết / Chạy
              </span>
            </div>
            <span>CLIM Spotlight Search (Ctrl+K)</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* POPUP XÁC NHẬN CHẠY CÂU LỆNH (COMMAND CONFIRMATION PREVIEW) */}
      {selectedCommandPreview && (
        <Dialog
          open={Boolean(selectedCommandPreview)}
          onOpenChange={(open) => !open && setSelectedCommandPreview(null)}
        >
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[90vw] max-w-lg p-0 overflow-hidden shadow-2xl rounded-2xl">
            <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Terminal size={18} />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-zinc-100">
                    Xác Nhận Chạy Lệnh
                  </DialogTitle>
                  <p className="text-xs text-zinc-400">Xem chi tiết câu lệnh trước khi thực thi vào Terminal</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCommandPreview(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-100 text-sm">{selectedCommandPreview.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className="text-[10px] bg-zinc-800 border-zinc-700 text-zinc-300 font-mono">
                      {selectedCommandPreview.shell || 'powershell'}
                    </Badge>
                    {selectedCommandPreview.category && (
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {selectedCommandPreview.category}
                      </Badge>
                    )}
                  </div>
                </div>

                {selectedCommandPreview.description && (
                  <p className="text-xs text-zinc-400 mt-1">{selectedCommandPreview.description}</p>
                )}
              </div>

              {/* Command Code Preview */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-medium">Nội dung lệnh thực thi:</label>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-emerald-400 select-all overflow-x-auto leading-relaxed">
                  {selectedCommandPreview.command}
                </div>
              </div>

              {/* Working Directory info */}
              <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
                <span>Thư mục chạy (CWD):</span>
                <span className="font-mono text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[220px]">
                  {selectedCommandPreview.workingDirectory || 'Thư mục mặc định'}
                </span>
              </div>

              {/* Active Profile Info */}
              {activeProfile && (
                <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
                  <span>Môi trường áp dụng:</span>
                  <strong className="font-bold">{activeProfile.name}</strong>
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCommandPreview(null)}
                className="text-zinc-400 hover:text-zinc-200 text-xs px-4 h-9"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const cmd = selectedCommandPreview
                  setSelectedCommandPreview(null)
                  onOpenChange(false)
                  onRunCommand(cmd)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-5 h-9 gap-1.5 cursor-pointer shadow-sm"
              >
                <Play size={14} className="fill-zinc-950" />
                <span>Chạy Lệnh Ngay</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* POPUP XÁC NHẬN CHẠY QUY TRÌNH (SEQUENCE CONFIRMATION PREVIEW) */}
      {selectedSequencePreview && (
        <Dialog
          open={Boolean(selectedSequencePreview)}
          onOpenChange={(open) => !open && setSelectedSequencePreview(null)}
        >
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[90vw] max-w-lg p-0 overflow-hidden shadow-2xl rounded-2xl">
            <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ListOrdered size={18} />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-zinc-100">
                    Xác Nhận Chạy Quy Trình
                  </DialogTitle>
                  <p className="text-xs text-zinc-400">Xem trước các bước trong chuỗi quy trình</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSequencePreview(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-100 text-sm">{selectedSequencePreview.name}</span>
                <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                  {selectedSequencePreview.steps.length} bước thực thi
                </Badge>
              </div>

              {selectedSequencePreview.description && (
                <p className="text-xs text-zinc-400">{selectedSequencePreview.description}</p>
              )}

              {/* Steps list preview */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-medium">Danh sách các bước:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedSequencePreview.steps.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2.5 text-xs font-mono"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-zinc-200 truncate">{step.name || step.command}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedSequencePreview(null)}
                className="text-zinc-400 hover:text-zinc-200 text-xs px-4 h-9"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const seq = selectedSequencePreview
                  setSelectedSequencePreview(null)
                  onOpenChange(false)
                  onRunSequence(seq)
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 h-9 gap-1.5 cursor-pointer shadow-sm"
              >
                <Play size={14} className="fill-white" />
                <span>Bắt Đầu Quy Trình</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
