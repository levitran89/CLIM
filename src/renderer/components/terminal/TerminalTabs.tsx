import React, { useState, useRef, useEffect } from 'react'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useAIStore } from '@/stores/ai-store'
import { getTerminalBufferText, extractCommandAndError } from '@/lib/terminal-buffer-registry'
import { TerminalRecorderButton } from './TerminalRecorderButton'
import { IncidentReportModal } from './IncidentReportModal'
import { WatchdogModal } from './WatchdogModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Plus,
  X,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Square,
  EyeOff,
  Eye,
  Terminal as TerminalIcon,
  Sparkles,
  FileText,
  Edit2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/stores/i18n-store'

export function TerminalTabs(): React.JSX.Element {
  const { language } = useTranslation()
  const {
    sessions,
    activeSessionId,
    splitMode,
    setActiveSession,
    createTerminal,
    killTerminal,
    renameSession,
    setSplitMode,
    updateSession
  } = useTerminalStore()

  const defaultShell = useSettingsStore((s) => s.settings.defaultShell)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showBgMenu, setShowBgMenu] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [incidentModalOpen, setIncidentModalOpen] = useState(false)
  const [watchdogModalOpen, setWatchdogModalOpen] = useState(false)
  const [selectedWatchdogSessionId, setSelectedWatchdogSessionId] = useState<string | null>(null)
  const bgMenuRef = useRef<HTMLDivElement>(null)
  const addMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bgMenuRef.current && !bgMenuRef.current.contains(e.target as Node)) {
        setShowBgMenu(false)
      }
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDoubleClick = (id: string, title: string): void => {
    setEditingId(id)
    setEditValue(title)
  }

  const handleRenameSubmit = (id: string): void => {
    if (editValue.trim()) {
      renameSession(id, editValue.trim())
    }
    setEditingId(null)
  }

  const handleCloseTab = async (
    e: React.MouseEvent,
    id: string
  ): Promise<void> => {
    e.stopPropagation()
    await killTerminal(id)
  }

  const statusVariant = (
    status: string
  ): 'success' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'running':
        return 'success'
      case 'stopped':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const foregroundSessions = sessions.filter((s) => !s.isBackground)
  const backgroundSessions = sessions.filter((s) => s.isBackground)

  const handleBackground = (): void => {
    if (activeSessionId && foregroundSessions.length > 0) {
      const current = sessions.find((s) => s.id === activeSessionId)
      updateSession(activeSessionId, { isBackground: true })
      const nextSession = foregroundSessions.find((s) => s.id !== activeSessionId)
      setActiveSession(nextSession?.id || null)
      toast.info(
        language === 'en'
          ? `Terminal "${current?.title || 'Terminal'}" sent to background. Click "Background Terminals" to restore.`
          : `Terminal "${current?.title || 'Terminal'}" đã chuyển sang chạy ngầm. Bấm vào "Chạy ngầm" để mở lại.`
      )
    }
  }

  const handleRestoreAllBackground = (): void => {
    backgroundSessions.forEach((s) => {
      updateSession(s.id, { isBackground: false })
    })
    if (backgroundSessions.length > 0) {
      setActiveSession(backgroundSessions[0].id)
    }
    setShowBgMenu(false)
    toast.success(
      language === 'en'
        ? `Restored ${backgroundSessions.length} background terminals`
        : `Đã khôi phục ${backgroundSessions.length} terminal chạy ngầm`
    )
  }

  return (
    <div className="flex items-center gap-1.5 bg-zinc-900/90 border-b border-zinc-800 px-3 h-11">
      {/* Tabs list */}
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-none">
        {foregroundSessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setActiveSession(session.id)}
            onDoubleClick={() =>
              handleDoubleClick(session.id, session.title)
            }
            className={`
              group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer
              transition-all duration-150 select-none min-w-0 shrink-0 border
              ${
                activeSessionId === session.id
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent'
              }
            `}
          >
            <Badge
              variant={statusVariant(session.status)}
              className="h-1.5 w-1.5 p-0 rounded-full shrink-0"
            />

            {editingId === session.id ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleRenameSubmit(session.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(session.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="bg-transparent border-none outline-none text-xs w-24 text-zinc-100 font-semibold"
                autoFocus
              />
            ) : (
              <span className="truncate max-w-[130px]">{session.title}</span>
            )}

            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDoubleClick(session.id, session.title)
                }}
                className="hover:text-emerald-400 cursor-pointer p-0.5 rounded hover:bg-zinc-700/50"
                title={language === 'en' ? 'Rename tab' : 'Đổi tên tab'}
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={(e) => handleCloseTab(e, session.id)}
                className="hover:text-red-400 cursor-pointer p-0.5 rounded hover:bg-zinc-700/50"
                title={language === 'en' ? 'Close terminal tab' : 'Đóng tab terminal'}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Toolbar */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        {/* Nhóm 1: Thêm mới & Ghi hình */}
        <div className="flex items-center gap-1">
          <div className="relative" ref={addMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`h-9 w-9 rounded-lg cursor-pointer transition-all duration-150 active:scale-95 shrink-0 ${
                showAddMenu
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-blue-400 hover:bg-blue-500/15'
              }`}
              title={language === 'en' ? 'New Terminal options (PowerShell, CMD, WSL)' : 'Tùy chọn tạo Terminal mới (PowerShell, CMD, WSL)'}
            >
              <Plus size={20} />
            </Button>

            {showAddMenu && (
              <div className="absolute top-full right-0 mt-1.5 w-52 p-1.5 bg-zinc-900/95 border border-zinc-700/90 rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.9)] z-50 animate-fade-in backdrop-blur-xl space-y-1">
                <div className="px-2.5 py-1 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === 'en' ? 'Select Terminal Type' : 'Chọn loại Terminal'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    createTerminal({ shell: 'powershell', title: 'PowerShell' })
                    setShowAddMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 hover:bg-blue-500/15 hover:text-blue-300 transition-colors text-left cursor-pointer group"
                >
                  <TerminalIcon size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>PowerShell</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    createTerminal({ shell: 'cmd', title: 'CMD' })
                    setShowAddMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 hover:bg-amber-500/15 hover:text-amber-300 transition-colors text-left cursor-pointer group"
                >
                  <TerminalIcon size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Command Prompt (CMD)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    createTerminal({ shell: 'wsl', title: 'WSL' })
                    setShowAddMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 hover:bg-orange-500/15 hover:text-orange-300 transition-colors text-left cursor-pointer group"
                >
                  <TerminalIcon size={14} className="text-orange-400 group-hover:scale-110 transition-transform" />
                  <span>WSL Linux</span>
                </button>
              </div>
            )}
          </div>
          <TerminalRecorderButton
            sessionId={activeSessionId || undefined}
            sessionTitle={sessions.find((s) => s.id === activeSessionId)?.title}
          />
        </div>

        <div className="h-5 w-[1px] bg-zinc-700 mx-1 shrink-0" />

        {/* Nhóm 2: AI Sửa lỗi & Báo cáo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!activeSessionId) {
                toast.info(language === 'en' ? 'Please open a terminal to use this feature' : 'Vui lòng mở một terminal để sử dụng tính năng này')
                return
              }
              const session = sessions.find((s) => s.id === activeSessionId)
              const rawText = getTerminalBufferText(activeSessionId)
              const { lastCommand, errorOutput } = extractCommandAndError(rawText)
              useAIStore.getState().openErrorFixModal({
                errorOutput: errorOutput || (language === 'en' ? 'No detailed error message detected in buffer.' : 'Chưa phát hiện thông báo lỗi chi tiết trong buffer.'),
                lastCommand: lastCommand || session?.title || 'npm run dev',
                shell: (session?.shell as 'powershell' | 'cmd' | 'wsl') || 'powershell'
              })
            }}
            className="h-9 w-9 rounded-lg text-purple-400 hover:bg-purple-500/15 cursor-pointer transition-all duration-150 active:scale-95 shrink-0"
            title={language === 'en' ? '⚡ AI Terminal Error Diagnostics & Fix' : '⚡ AI Chẩn đoán & Sửa lỗi Terminal'}
          >
            <Sparkles size={20} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!activeSessionId) {
                toast.info(language === 'en' ? 'Please open a terminal to generate execution report' : 'Vui lòng mở một terminal để tạo báo cáo thực thi')
                return
              }
              setIncidentModalOpen(true)
            }}
            className="h-9 w-9 rounded-lg text-emerald-400 hover:bg-emerald-500/15 cursor-pointer transition-all duration-150 active:scale-95 shrink-0"
            title={language === 'en' ? '📊 Execution Report & Webhook Dispatch' : '📊 Báo Cáo Thực Thi (Execution Report) & Gửi Webhook'}
          >
            <FileText size={19} />
          </Button>

          {/* Watchdog Process Alert Button */}
          {(() => {
            const activeSession = sessions.find((s) => s.id === activeSessionId)
            const isWatchdogActive = activeSession?.watchdogEnabled ?? false
            return (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!activeSessionId) {
                    toast.info(language === 'en' ? 'Please open a terminal to configure Watchdog monitoring' : 'Vui lòng mở một terminal để cấu hình giám sát Watchdog')
                    return
                  }
                  setSelectedWatchdogSessionId(activeSessionId)
                  setWatchdogModalOpen(true)
                }}
                className={`relative h-9 w-9 rounded-lg cursor-pointer transition-all duration-150 active:scale-95 shrink-0 ${
                  isWatchdogActive
                    ? 'text-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'text-zinc-400 hover:text-amber-400 hover:bg-amber-500/15'
                }`}
                title={
                  isWatchdogActive
                    ? (language === 'en' ? '🛡️ Watchdog: ACTIVE (Telegram alert on crash/exit)' : '🛡️ Watchdog: ĐANG BẬT (Báo động Telegram khi tắt/crash)')
                    : (language === 'en' ? '🛡️ Enable Watchdog Sentinel (Alert Telegram/Discord)' : '🛡️ Bật Giám Sát Sống Còn (Watchdog Alert Telegram/Discord)')
                }
              >
                {isWatchdogActive ? <ShieldCheck size={19} /> : <ShieldAlert size={19} />}
                {isWatchdogActive && (
                  <span className="absolute -top-0.5 -right-0.5 px-1 min-w-[14px] h-[14px] rounded-full bg-amber-500 text-zinc-950 font-extrabold text-[8px] flex items-center justify-center font-mono leading-none shadow-sm">
                    ON
                  </span>
                )}
              </Button>
            )
          })()}
        </div>

        <div className="h-5 w-[1px] bg-zinc-700 mx-1 shrink-0" />

        {/* Nhóm 3: Chạy ngầm & Quản lý chạy ngầm */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-emerald-400 hover:bg-emerald-500/15 cursor-pointer rounded-lg shrink-0 transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            onClick={handleBackground}
            disabled={!activeSessionId || foregroundSessions.length === 0}
            title={language === 'en' ? 'Send current terminal to background' : 'Chuyển tab terminal hiện tại sang chạy ngầm'}
          >
            <EyeOff size={20} />
          </Button>

          <div className="relative" ref={bgMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBgMenu(!showBgMenu)}
              className={`relative h-9 w-9 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ${
                showBgMenu
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-emerald-400 hover:bg-emerald-500/15'
              }`}
              title={language === 'en' ? `Manage ${backgroundSessions.length} background terminals` : `Quản lý ${backgroundSessions.length} terminal đang chạy ngầm`}
            >
              <Eye size={20} />
              {backgroundSessions.length > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 px-1 min-w-[15px] h-[15px] rounded-full bg-emerald-500 text-zinc-950 font-extrabold text-[9px] flex items-center justify-center font-mono leading-none shadow-sm">
                  {backgroundSessions.length}
                </span>
              )}
            </Button>

            {showBgMenu && (
              <div className="absolute top-full right-0 mt-1.5 w-64 p-2 bg-zinc-900/95 border border-zinc-700/90 rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.9)] z-50 animate-fade-in backdrop-blur-xl">
                <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-zinc-800 px-1">
                  <span className="text-xs font-bold text-zinc-300">
                    {language === 'en' ? `Background Terminals (${backgroundSessions.length})` : `Tiến trình ngầm (${backgroundSessions.length})`}
                  </span>
                  {backgroundSessions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRestoreAllBackground}
                      className="text-[10px] font-semibold text-emerald-400 hover:underline cursor-pointer"
                    >
                      {language === 'en' ? 'Restore all' : 'Mở lại tất cả'}
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                  {backgroundSessions.length === 0 ? (
                    <div className="text-center py-4 text-zinc-500 text-xs">
                      {language === 'en' ? 'No background processes' : 'Không có tiến trình ngầm'}
                    </div>
                  ) : (
                    backgroundSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 text-xs transition-all"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-1.5">
                          <Badge
                            variant={statusVariant(session.status)}
                            className="h-1.5 w-1.5 p-0 rounded-full shrink-0"
                          />
                          <span className="font-medium text-zinc-200 truncate max-w-[100px]" title={session.title}>
                            {session.title}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 shrink-0">
                            {session.shell}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWatchdogSessionId(session.id)
                              setWatchdogModalOpen(true)
                            }}
                            className={`p-1 rounded-lg cursor-pointer transition-colors ${
                              session.watchdogEnabled
                                ? 'text-amber-400 bg-amber-500/20'
                                : 'text-zinc-500 hover:text-amber-400 hover:bg-amber-500/15'
                            }`}
                            title={language === 'en' ? 'Configure Watchdog sentinel' : 'Cấu hình giám sát Watchdog'}
                          >
                            {session.watchdogEnabled ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateSession(session.id, { isBackground: false })
                              setActiveSession(session.id)
                              setShowBgMenu(false)
                              toast.success(language === 'en' ? `Restored terminal "${session.title}"` : `Đã khôi phục terminal "${session.title}"`)
                            }}
                            className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded-lg cursor-pointer transition-colors"
                            title={language === 'en' ? 'Restore to view' : 'Khôi phục lại màn hình'}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await killTerminal(session.id)
                              toast.info(language === 'en' ? `Closed terminal "${session.title}"` : `Đã đóng terminal "${session.title}"`)
                            }}
                            className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg cursor-pointer transition-colors"
                            title={language === 'en' ? 'Kill / Terminate session' : 'Tắt / Dừng tiến trình này'}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-5 w-[1px] bg-zinc-700 mx-1 shrink-0" />

        {/* Nhóm 4: Chế độ hiển thị Layout */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 cursor-pointer rounded-lg transition-all duration-150 active:scale-95 shrink-0 ${
              splitMode === 'none'
                ? 'text-zinc-100 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
            onClick={() => setSplitMode('none')}
            title={language === 'en' ? 'Single window mode' : 'Cửa sổ đơn'}
          >
            <Square size={17} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 cursor-pointer rounded-lg transition-all duration-150 active:scale-95 shrink-0 ${
              splitMode === 'vertical'
                ? 'text-zinc-100 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
            onClick={() => setSplitMode('vertical')}
            title={language === 'en' ? 'Split vertically' : 'Chia đôi theo chiều dọc'}
          >
            <SplitSquareVertical size={20} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 cursor-pointer rounded-lg transition-all duration-150 active:scale-95 shrink-0 ${
              splitMode === 'horizontal'
                ? 'text-zinc-100 bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
            onClick={() => setSplitMode('horizontal')}
            title={language === 'en' ? 'Split horizontally' : 'Chia đôi theo chiều ngang'}
          >
            <SplitSquareHorizontal size={20} />
          </Button>
        </div>
      </div>

      {/* Incident Report Modal */}
      <IncidentReportModal
        open={incidentModalOpen}
        onOpenChange={setIncidentModalOpen}
        sessionTitle={sessions.find((s) => s.id === activeSessionId)?.title || 'Terminal'}
        lastCommand={activeSessionId ? extractCommandAndError(getTerminalBufferText(activeSessionId)).lastCommand : undefined}
        logExcerpt={activeSessionId ? getTerminalBufferText(activeSessionId).slice(-1500) : ''}
        rootCause={activeSessionId ? extractCommandAndError(getTerminalBufferText(activeSessionId)).errorOutput : undefined}
      />

      {/* Watchdog Alert & Auto-restart Modal */}
      <WatchdogModal
        open={watchdogModalOpen}
        onOpenChange={setWatchdogModalOpen}
        sessionId={selectedWatchdogSessionId}
      />
    </div>
  )
}

