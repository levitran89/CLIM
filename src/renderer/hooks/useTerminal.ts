import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { SearchAddon } from '@xterm/addon-search'
import { CanvasAddon } from '@xterm/addon-canvas'
import { useSettingsStore } from '@/stores/settings-store'
import { registerTerminalInstance, unregisterTerminalInstance } from '@/lib/terminal-buffer-registry'
import { toast } from 'sonner'

interface UseTerminalOptions {
  sessionId: string
  isVisible?: boolean
  onReady?: () => void
  onDataReceived?: (data: string) => void
}

export interface UseTerminalReturn {
  containerRef: React.RefObject<HTMLDivElement>
  terminalRef: React.RefObject<Terminal | null>
  searchAddonRef: React.RefObject<SearchAddon | null>
  isScrolledUp: boolean
  hasSelection: boolean
  findNext: (term: string, options?: { matchCase?: boolean; wholeWord?: boolean; regex?: boolean }) => boolean
  findPrevious: (term: string, options?: { matchCase?: boolean; wholeWord?: boolean; regex?: boolean }) => boolean
  clearSearch: () => void
  scrollToBottom: () => void
  scrollToTop: () => void
  copySelection: () => Promise<boolean>
  pasteClipboard: () => Promise<boolean>
  selectAll: () => void
  clearTerminal: () => void
  linkTooltip: { x: number; y: number; text: string; visible: boolean } | null
}

export function useTerminal({ sessionId, isVisible = true, onReady, onDataReceived }: UseTerminalOptions): UseTerminalReturn {
  const containerRef = useRef<HTMLDivElement>(null!)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)
  const canvasAddonRef = useRef<CanvasAddon | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const lastColsRef = useRef<number>(0)
  const lastRowsRef = useRef<number>(0)
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const [hasSelection, setHasSelection] = useState(false)
  const [linkTooltip, setLinkTooltip] = useState<{ x: number; y: number; text: string; visible: boolean } | null>(null)

  const onDataReceivedRef = useRef(onDataReceived)
  onDataReceivedRef.current = onDataReceived

  const applyFitAndResize = useCallback(() => {
    if (!fitAddonRef.current || !terminalRef.current || !containerRef.current) return

    try {
      // Tránh resize khi container đang ẩn hoặc kích thước quá nhỏ
      if (containerRef.current.clientWidth < 50 || containerRef.current.clientHeight < 50) {
        return
      }

      fitAddonRef.current.fit()
      const { cols, rows } = terminalRef.current

      // Giới hạn an toàn: không bao giờ gửi cols < 20 hoặc rows < 5 để tránh ConPTY làm mất buffer
      if (cols >= 20 && rows >= 5 && (cols !== lastColsRef.current || rows !== lastRowsRef.current)) {
        lastColsRef.current = cols
        lastRowsRef.current = rows
        window.api.terminal.resize(sessionId, cols, rows)
      }
    } catch {
      // ignore resize errors
    }
  }, [sessionId])

  const handleResize = useCallback(() => {
    if (resizeTimerRef.current) {
      clearTimeout(resizeTimerRef.current)
    }
    resizeTimerRef.current = setTimeout(() => {
      applyFitAndResize()
    }, 25)
  }, [applyFitAndResize])

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollToBottom()
      setIsScrolledUp(false)
    }
  }, [])

  const scrollToTop = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollToTop()
      setIsScrolledUp(true)
    }
  }, [])

  const copySelection = useCallback(async (): Promise<boolean> => {
    if (terminalRef.current && terminalRef.current.hasSelection()) {
      const selected = terminalRef.current.getSelection()
      if (selected) {
        try {
          await navigator.clipboard.writeText(selected)
          return true
        } catch {
          // Fallback if clipboard API is restricted
        }
      }
    }
    return false
  }, [])

  const pasteClipboard = useCallback(async (): Promise<boolean> => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && terminalRef.current) {
        window.api.terminal.input(sessionId, text)
        return true
      }
    } catch {
      toast.error('Không thể đọc dữ liệu từ Clipboard')
    }
    return false
  }, [sessionId])

  const selectAll = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.selectAll()
      setHasSelection(true)
    }
  }, [])

  const clearTerminal = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.clear()
      // Also send Ctrl+L to shell if running
      window.api.terminal.input(sessionId, '\x0c')
    }
  }, [sessionId])

  const findNext = useCallback((term: string, options?: { matchCase?: boolean; wholeWord?: boolean; regex?: boolean }) => {
    if (searchAddonRef.current && term) {
      return searchAddonRef.current.findNext(term, {
        caseSensitive: options?.matchCase,
        wholeWord: options?.wholeWord,
        regex: options?.regex,
        decorations: {
          matchOverviewRuler: '#f59e0b',
          activeMatchColorOverviewRuler: '#10b981'
        }
      })
    }
    return false
  }, [])

  const findPrevious = useCallback((term: string, options?: { matchCase?: boolean; wholeWord?: boolean; regex?: boolean }) => {
    if (searchAddonRef.current && term) {
      return searchAddonRef.current.findPrevious(term, {
        caseSensitive: options?.matchCase,
        wholeWord: options?.wholeWord,
        regex: options?.regex,
        decorations: {
          matchOverviewRuler: '#f59e0b',
          activeMatchColorOverviewRuler: '#10b981'
        }
      })
    }
    return false
  }, [])

  const clearSearch = useCallback(() => {
    if (searchAddonRef.current) {
      searchAddonRef.current.clearDecorations()
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const initialSettings = useSettingsStore.getState().settings

    const terminal = new Terminal({
      cursorBlink: initialSettings.cursorBlink ?? true,
      cursorStyle: (initialSettings.cursorStyle as 'block' | 'underline' | 'bar') || 'bar',
      fontSize: initialSettings.fontSize || 14,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
      lineHeight: 1.35,
      letterSpacing: 0.5,
      scrollback: 10000,
      smoothScrollDuration: 0,
      fastScrollSensitivity: 4,
      fastScrollModifier: 'alt',
      convertEol: false,
      theme: {
        background: '#0c0c0f',
        foreground: '#cccccc', // Màu chữ xám trắng dịu mắt chuẩn Windows CMD
        cursor: '#cccccc',
        cursorAccent: '#0c0c0f',
        selectionBackground: '#3b82f640',
        selectionForeground: '#ffffff',
        black: '#0c0c0c',
        red: '#e74856',
        green: '#16c60c',
        yellow: '#f9f1a5',
        blue: '#3b78ff',
        magenta: '#b4009e',
        cyan: '#61d6d6',
        white: '#cccccc',
        brightBlack: '#767676',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff'
      },
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon(
      (event: MouseEvent, uri: string) => {
        // Chỉ mở link khi giữ phím Ctrl hoặc Cmd (Ctrl + Click)
        if (event.ctrlKey || event.metaKey) {
          window.api.system.openExternal(uri)
        } else {
          toast.info('Nhấn giữ phím Ctrl + Click để mở liên kết này trên trình duyệt')
        }
      },
      {
        hover: (event: MouseEvent, text: string) => {
          setLinkTooltip({
            x: event.clientX,
            y: event.clientY,
            text,
            visible: true
          })
        },
        leave: () => {
          setLinkTooltip(null)
        }
      }
    )
    const searchAddon = new SearchAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)
    terminal.loadAddon(searchAddon)

    terminal.open(containerRef.current)

    // Hardware accelerated Canvas renderer (chống giật lag chớp menu TUI/curses)
    try {
      const canvasAddon = new CanvasAddon()
      terminal.loadAddon(canvasAddon)
      canvasAddonRef.current = canvasAddon
    } catch {
      // Fallback nếu môi trường không hỗ trợ HTML5 Canvas
    }

    // Initial fit
    requestAnimationFrame(() => {
      applyFitAndResize()
    })

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon
    searchAddonRef.current = searchAddon
    registerTerminalInstance(sessionId, terminal)

    // Selection & Scroll Listeners
    const selectionDisposable = terminal.onSelectionChange(() => {
      const selected = terminal.hasSelection()
      setHasSelection(selected)
    })

    const scrollDisposable = terminal.onScroll(() => {
      const buffer = terminal.buffer.active
      // If viewport is not at the very bottom line
      const atBottom = buffer.viewportY >= buffer.baseY
      setIsScrolledUp(!atBottom)
    })

    // Custom Key Event Handler for Smart Copy / Paste / Shortcuts
    terminal.attachCustomKeyEventHandler((event: KeyboardEvent) => {
      if (event.type !== 'keydown') return true

      const isCtrlOrCmd = event.ctrlKey || event.metaKey

      // 1. Smart Ctrl+C: If selection exists -> Copy; Else -> Send SIGINT
      if (isCtrlOrCmd && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'c') {
        if (terminal.hasSelection()) {
          copySelection()
          return false // Don't send ^C to PTY
        }
        return true // Send ^C to PTY to cancel command
      }

      // 2. Ctrl+Shift+C: Force Copy
      if (isCtrlOrCmd && event.shiftKey && !event.altKey && event.key.toLowerCase() === 'c') {
        copySelection()
        return false
      }

      // 3. Ctrl+V / Ctrl+Shift+V: Paste from clipboard
      if (isCtrlOrCmd && !event.altKey && event.key.toLowerCase() === 'v') {
        pasteClipboard()
        return false
      }

      // 4. Ctrl+Shift+A: Select All
      if (isCtrlOrCmd && event.shiftKey && event.key.toLowerCase() === 'a') {
        selectAll()
        return false
      }

      // 5. Shift+PageUp / Shift+PageDown: Smooth Scroll
      if (event.shiftKey && event.key === 'PageUp') {
        terminal.scrollLines(-terminal.rows + 2)
        return false
      }
      if (event.shiftKey && event.key === 'PageDown') {
        terminal.scrollLines(terminal.rows - 2)
        return false
      }

      // 6. Shift+Home / Shift+End: Scroll to Top / Bottom
      if (event.shiftKey && event.key === 'Home') {
        terminal.scrollToTop()
        return false
      }
      if (event.shiftKey && event.key === 'End') {
        terminal.scrollToBottom()
        return false
      }

      return true
    })

    // Dynamic settings update listener (cursor style, font size, blink)
    const unsubscribeSettings = useSettingsStore.subscribe((state) => {
      if (terminalRef.current) {
        terminalRef.current.options.cursorStyle = (state.settings.cursorStyle as 'block' | 'underline' | 'bar') || 'bar'
        terminalRef.current.options.cursorBlink = state.settings.cursorBlink ?? true
        terminalRef.current.options.fontSize = state.settings.fontSize || 14
        handleResize()
      }
    })

    // Handle terminal input → send to PTY
    const inputDisposable = terminal.onData((data: string) => {
      window.api.terminal.input(sessionId, data)
    })

    // Handle PTY output → write to terminal
    const removeDataListener = window.api.terminal.onData(
      (sid: string, data: string) => {
        if (sid === sessionId) {
          terminal.write(data)
          onDataReceivedRef.current?.(data)
        }
      }
    )

    // Observe container resize - chỉ trigger khi kích thước thực sự thay đổi >= 4px
    let lastObservedW = 0
    let lastObservedH = 0
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const w = Math.round(entry.contentRect.width)
        const h = Math.round(entry.contentRect.height)
        if (w >= 50 && h >= 50 && (Math.abs(w - lastObservedW) >= 4 || Math.abs(h - lastObservedH) >= 4)) {
          lastObservedW = w
          lastObservedH = h
          handleResize()
        }
      }
    })
    resizeObserver.observe(containerRef.current)

    onReady?.()

    cleanupRef.current = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current)
      }
      unregisterTerminalInstance(sessionId)
      unsubscribeSettings()
      selectionDisposable.dispose()
      scrollDisposable.dispose()
      inputDisposable.dispose()
      removeDataListener()
      resizeObserver.disconnect()
      canvasAddonRef.current?.dispose()
      canvasAddonRef.current = null
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
      searchAddonRef.current = null
    }

    return () => {
      cleanupRef.current?.()
    }
  }, [sessionId, applyFitAndResize, handleResize, copySelection, pasteClipboard, selectAll, onReady])

  // Khi chuyển từ tab khác quay trở lại tab này (isVisible = true)
  useEffect(() => {
    if (isVisible && terminalRef.current && fitAddonRef.current && containerRef.current) {
      // Đảm bảo container đã có kích thước trong DOM
      requestAnimationFrame(() => {
        applyFitAndResize()
        if (terminalRef.current) {
          terminalRef.current.refresh(0, Math.max(terminalRef.current.rows - 1, 0))
          terminalRef.current.focus()
        }
      })
    }
  }, [isVisible, applyFitAndResize])

  return {
    containerRef,
    terminalRef,
    searchAddonRef,
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
  }
}

