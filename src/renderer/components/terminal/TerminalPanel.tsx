import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useTerminal } from '@/hooks/useTerminal'
import { useRecordingStore } from '@/stores/recording-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useAIStore } from '@/stores/ai-store'
import { useTranslation } from '@/stores/i18n-store'
import { getTerminalBufferText, extractCommandAndError } from '@/lib/terminal-buffer-registry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Copy,
  ClipboardPaste,
  Trash2,
  Sparkles,
  ArrowDown,
  Terminal as TerminalIcon,
  RotateCw,
  Check,
  CaseSensitive,
  Regex,
  WholeWord
} from 'lucide-react'
import { toast } from 'sonner'
import '@xterm/xterm/css/xterm.css'

interface TerminalPanelProps {
  sessionId: string
  isVisible?: boolean
}

export function TerminalPanel({ sessionId, isVisible = true }: TerminalPanelProps): React.JSX.Element {
  const { language } = useTranslation()
  const session = useTerminalStore((s) => s.sessions.find((item) => item.id === sessionId))
  const { openErrorFixModal } = useAIStore()

  // Search State
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [hasSearchResult, setHasSearchResult] = useState<boolean | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const lastRightClickTimeRef = useRef<number>(0)
  const rightClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDataReceived = useCallback(
    (data?: string) => {
      if (data) {
        useRecordingStore.getState().recordChunk(sessionId, data)
      }
    },
    [sessionId]
  )

  const {
    containerRef,
    terminalRef,
    isScrolledUp,
    hasSelection,
    findNext,
    findPrevious,
    clearSearch,
    scrollToBottom,
    scrollToTop,
    copySelection,
    pasteClipboard,
    selectAll,
    clearTerminal,
    linkTooltip
  } = useTerminal({
    sessionId,
    isVisible,
    onDataReceived: handleDataReceived
  })

  // Keyboard shortcut Ctrl+F to toggle search within this panel
  useEffect(() => {
    const handlePanelKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        // If this panel is focused or active
        const isChild = containerRef.current?.contains(document.activeElement)
        if (isChild || searchOpen) {
          e.preventDefault()
          e.stopPropagation()
          setSearchOpen((prev) => {
            if (!prev) {
              setTimeout(() => searchInputRef.current?.focus(), 50)
            } else {
              clearSearch()
              terminalRef.current?.focus()
            }
            return !prev
          })
        }
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
        clearSearch()
        terminalRef.current?.focus()
      }
      if (e.key === 'Escape' && contextMenu) {
        setContextMenu(null)
      }
    }

    window.addEventListener('keydown', handlePanelKeyDown)
    return () => window.removeEventListener('keydown', handlePanelKeyDown)
  }, [searchOpen, clearSearch, terminalRef, containerRef, contextMenu])

  // Context Menu Outside Click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu])

  // Xử lý chuột phải: 1 click = Paste ngay lập tức, double click = Mở Context Menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const now = Date.now()
    const diff = now - lastRightClickTimeRef.current

    if (diff < 320 && diff > 0) {
      // Double click chuột phải -> Hủy paste và Mở Menu
      if (rightClickTimerRef.current) {
        clearTimeout(rightClickTimerRef.current)
        rightClickTimerRef.current = null
      }
      lastRightClickTimeRef.current = 0
      setContextMenu({ x: e.clientX, y: e.clientY })
    } else {
      // Single click chuột phải -> Chờ 220ms nếu không click lần 2 thì thực hiện Paste
      lastRightClickTimeRef.current = now
      if (rightClickTimerRef.current) {
        clearTimeout(rightClickTimerRef.current)
      }
      rightClickTimerRef.current = setTimeout(async () => {
        await pasteClipboard()
        rightClickTimerRef.current = null
      }, 220)
    }
  }

  // Search Navigation
  const handleSearchNext = () => {
    if (!searchTerm) return
    const res = findNext(searchTerm, { matchCase, wholeWord, regex: useRegex })
    setHasSearchResult(res)
  }

  const handleSearchPrev = () => {
    if (!searchTerm) return
    const res = findPrevious(searchTerm, { matchCase, wholeWord, regex: useRegex })
    setHasSearchResult(res)
  }

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    if (!val) {
      clearSearch()
      setHasSearchResult(null)
    } else {
      const res = findNext(val, { matchCase, wholeWord, regex: useRegex })
      setHasSearchResult(res)
    }
  }

  const handleCopy = async () => {
    const success = await copySelection()
    if (success) {
      toast.success(language === 'en' ? 'Copied to clipboard' : 'Đã sao chép vào bộ nhớ tạm')
    }
    setContextMenu(null)
  }

  const handlePaste = async () => {
    await pasteClipboard()
    setContextMenu(null)
  }

  const handleSelectAll = () => {
    selectAll()
    setContextMenu(null)
  }

  const handleClear = () => {
    clearTerminal()
    setContextMenu(null)
    toast.info(language === 'en' ? 'Terminal cleared' : 'Đã xóa màn hình terminal')
  }

  const handleCopyAllBuffer = async () => {
    const allText = getTerminalBufferText(sessionId)
    if (allText) {
      await navigator.clipboard.writeText(allText)
      toast.success(language === 'en' ? 'Copied all terminal output' : 'Đã sao chép toàn bộ log terminal')
    }
    setContextMenu(null)
  }

  const handleAskAI = () => {
    const rawBuffer = getTerminalBufferText(sessionId)
    const { lastCommand, errorOutput } = extractCommandAndError(rawBuffer)
    openErrorFixModal({
      errorOutput,
      lastCommand,
      shell: (session?.shell as any) || 'powershell'
    })
    setContextMenu(null)
  }

  return (
    <div
      className="relative h-full w-full bg-[#0c0c0f] rounded-lg overflow-hidden flex flex-col border border-zinc-800/80 group"
      onContextMenu={handleContextMenu}
    >
      {/* Top Mini Header Bar */}
      <div className="h-8 bg-zinc-900/90 border-b border-zinc-800/80 px-2.5 flex items-center justify-between text-xs text-zinc-400 select-none shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon size={13} className="text-zinc-500" />
          <span className="font-semibold text-zinc-300 truncate max-w-[150px]">
            {session?.title || 'Terminal'}
          </span>
          <Badge
            variant="outline"
            className={`px-1.5 py-0 text-[10px] uppercase font-mono tracking-wide border ${
              session?.title?.startsWith('SSH:')
                ? 'bg-purple-950/60 border-purple-700/80 text-purple-300'
                : session?.shell === 'ubuntu'
                  ? 'bg-orange-950/60 border-orange-700/80 text-orange-300'
                  : session?.shell === 'gitbash'
                    ? 'bg-red-950/60 border-red-700/80 text-red-300'
                    : session?.shell === 'wsl'
                      ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'
                      : session?.shell === 'pwsh'
                        ? 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
            }`}
          >
            {session?.title?.startsWith('SSH:')
              ? 'SSH (LINUX)'
              : session?.shell === 'ubuntu'
                ? 'UBUNTU (WSL)'
                : session?.shell === 'gitbash'
                  ? 'GIT BASH'
                  : (session?.shell || 'powershell').toUpperCase()}
          </Badge>
          {session?.pid && (
            <span className="text-[10px] text-zinc-500 font-mono">PID: {session.pid}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Search Button */}
          <button
            onClick={() => {
              setSearchOpen((prev) => {
                if (!prev) setTimeout(() => searchInputRef.current?.focus(), 50)
                else clearSearch()
                return !prev
              })
            }}
            title={language === 'en' ? 'Search buffer (Ctrl+F)' : 'Tìm kiếm trong buffer (Ctrl+F)'}
            className={`p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors ${
              searchOpen ? 'bg-zinc-800 text-emerald-400' : ''
            }`}
          >
            <Search size={13} />
          </button>

          {/* Copy All Button */}
          <button
            onClick={handleCopyAllBuffer}
            title={language === 'en' ? 'Copy all buffer' : 'Sao chép toàn bộ log'}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Copy size={13} />
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            title={language === 'en' ? 'Clear screen (Ctrl+L)' : 'Xóa màn hình (Ctrl+L)'}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Trash2 size={13} />
          </button>

          {/* Ask AI Button */}
          <button
            onClick={handleAskAI}
            title={language === 'en' ? 'Diagnose with AI Copilot' : 'Chẩn đoán lỗi với AI Copilot'}
            className="p-1 rounded hover:bg-zinc-800 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Sparkles size={13} />
          </button>
        </div>
      </div>

      {/* In-Terminal Search Bar Overlay */}
      {searchOpen && (
        <div className="absolute top-9 right-3 z-30 flex items-center gap-1.5 bg-zinc-900/95 border border-zinc-700 shadow-xl rounded-lg p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) handleSearchPrev()
                  else handleSearchNext()
                }
              }}
              placeholder={language === 'en' ? 'Find in terminal...' : 'Tìm trong terminal...'}
              className="pl-7 pr-2 py-1 w-44 bg-zinc-950 border border-zinc-700 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Match status */}
          {searchTerm && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                hasSearchResult === false
                  ? 'bg-red-950/80 text-red-400 border border-red-800'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {hasSearchResult === false
                ? language === 'en'
                  ? 'No match'
                  : 'Không có'
                : language === 'en'
                  ? 'Match'
                  : 'Khớp'}
            </span>
          )}

          {/* Previous / Next */}
          <button
            onClick={handleSearchPrev}
            title={language === 'en' ? 'Previous match (Shift+Enter)' : 'Kết quả trước (Shift+Enter)'}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={handleSearchNext}
            title={language === 'en' ? 'Next match (Enter)' : 'Kết quả kế tiếp (Enter)'}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <ChevronDown size={14} />
          </button>

          <div className="h-4 w-px bg-zinc-700 mx-0.5" />

          {/* Case Sensitive Toggle */}
          <button
            onClick={() => {
              setMatchCase(!matchCase)
              if (searchTerm) findNext(searchTerm, { matchCase: !matchCase, wholeWord, regex: useRegex })
            }}
            title={language === 'en' ? 'Match Case' : 'Phân biệt hoa thường'}
            className={`p-1 rounded text-xs font-semibold ${
              matchCase ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <CaseSensitive size={14} />
          </button>

          {/* Whole Word Toggle */}
          <button
            onClick={() => {
              setWholeWord(!wholeWord)
              if (searchTerm) findNext(searchTerm, { matchCase, wholeWord: !wholeWord, regex: useRegex })
            }}
            title={language === 'en' ? 'Match Whole Word' : 'Khớp nguyên từ'}
            className={`p-1 rounded text-xs font-semibold ${
              wholeWord ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <WholeWord size={14} />
          </button>

          {/* Regex Toggle */}
          <button
            onClick={() => {
              setUseRegex(!useRegex)
              if (searchTerm) findNext(searchTerm, { matchCase, wholeWord, regex: !useRegex })
            }}
            title={language === 'en' ? 'Use Regular Expression' : 'Dùng biểu thức Regex'}
            className={`p-1 rounded text-xs font-semibold ${
              useRegex ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <Regex size={14} />
          </button>

          {/* Close Search */}
          <button
            onClick={() => {
              setSearchOpen(false)
              clearSearch()
              terminalRef.current?.focus()
            }}
            title={language === 'en' ? 'Close (Esc)' : 'Đóng (Esc)'}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 ml-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Terminal Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full min-h-0 min-w-0 overflow-hidden relative"
      />

      {/* Floating "Scroll to Bottom" Indicator */}
      {isScrolledUp && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium shadow-lg hover:shadow-emerald-900/40 backdrop-blur-sm transition-all animate-bounce"
        >
          <ArrowDown size={13} />
          <span>{language === 'en' ? 'Scroll to bottom' : 'Cuộn xuống cuối'}</span>
        </button>
      )}

      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[190px] bg-zinc-900/95 border border-zinc-700/80 shadow-2xl rounded-xl p-1.5 text-xs text-zinc-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-75"
        >
          <button
            onClick={handleCopy}
            disabled={!hasSelection}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Copy size={13} className="text-zinc-400" />
              <span>{language === 'en' ? 'Copy' : 'Sao chép'}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Ctrl+C</span>
          </button>

          <button
            onClick={handlePaste}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ClipboardPaste size={13} className="text-zinc-400" />
              <span>{language === 'en' ? 'Paste' : 'Dán'}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Ctrl+V</span>
          </button>

          <div className="my-1 border-t border-zinc-800" />

          <button
            onClick={() => {
              setSearchOpen(true)
              setContextMenu(null)
              setTimeout(() => searchInputRef.current?.focus(), 50)
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search size={13} className="text-zinc-400" />
              <span>{language === 'en' ? 'Find in Terminal...' : 'Tìm kiếm...'}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Ctrl+F</span>
          </button>

          <button
            onClick={handleSelectAll}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Check size={13} className="text-zinc-400" />
              <span>{language === 'en' ? 'Select All' : 'Chọn tất cả'}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+A</span>
          </button>

          <button
            onClick={handleClear}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Trash2 size={13} className="text-zinc-400" />
              <span>{language === 'en' ? 'Clear Screen' : 'Xóa màn hình'}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Ctrl+L</span>
          </button>

          <div className="my-1 border-t border-zinc-800" />

          <button
            onClick={handleAskAI}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-950/50 text-purple-300 hover:text-purple-200 text-left cursor-pointer"
          >
            <Sparkles size={13} className="text-purple-400" />
            <span>{language === 'en' ? 'Diagnose with AI Copilot' : 'Chẩn đoán lỗi với AI'}</span>
          </button>
        </div>
      )}

      {/* Web Link Hover Tooltip */}
      {linkTooltip?.visible && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(linkTooltip.x + 12, window.innerWidth - 280),
            top: linkTooltip.y + 16,
            zIndex: 9999
          }}
          className="pointer-events-none px-2.5 py-1.5 bg-zinc-900/95 border border-zinc-700/80 rounded-lg shadow-2xl text-[11px] text-zinc-200 backdrop-blur-md flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100"
        >
          <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] text-emerald-400 font-bold">
            Ctrl + Click
          </span>
          <span className="text-zinc-300">
            {language === 'en' ? 'to follow link' : 'để mở liên kết'}
          </span>
        </div>
      )}
    </div>
  )
}
