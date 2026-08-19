import { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { useSettingsStore } from '@/stores/settings-store'
import { registerTerminalInstance, unregisterTerminalInstance } from '@/lib/terminal-buffer-registry'

interface UseTerminalOptions {
  sessionId: string
  onReady?: () => void
  onDataReceived?: (data: string) => void
}

interface UseTerminalReturn {
  containerRef: React.RefObject<HTMLDivElement>
  terminalRef: React.RefObject<Terminal | null>
}

export function useTerminal({ sessionId, onReady, onDataReceived }: UseTerminalOptions): UseTerminalReturn {
  const containerRef = useRef<HTMLDivElement>(null!)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && terminalRef.current) {
      try {
        fitAddonRef.current.fit()
        const { cols, rows } = terminalRef.current
        window.api.terminal.resize(sessionId, cols, rows)
      } catch {
        // ignore fit errors during teardown
      }
    }
  }, [sessionId])

  const onDataReceivedRef = useRef(onDataReceived)
  onDataReceivedRef.current = onDataReceived

  useEffect(() => {
    if (!containerRef.current) return

    const initialSettings = useSettingsStore.getState().settings

    const terminal = new Terminal({
      cursorBlink: initialSettings.cursorBlink ?? true,
      cursorStyle: (initialSettings.cursorStyle as 'block' | 'underline' | 'bar') || 'bar',
      fontSize: initialSettings.fontSize || 14,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
      lineHeight: 1.4,
      letterSpacing: 0.5,
      scrollback: 5000,
      theme: {
        background: '#0c0c0f',
        foreground: '#e4e4e7',
        cursor: '#10b981',
        cursorAccent: '#0c0c0f',
        selectionBackground: '#27272a',
        selectionForeground: '#e4e4e7',
        black: '#18181b',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e4e4e7',
        brightBlack: '#52525b',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#fafafa'
      },
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)

    terminal.open(containerRef.current)

    // Initial fit
    requestAnimationFrame(() => {
      fitAddon.fit()
      const { cols, rows } = terminal
      window.api.terminal.resize(sessionId, cols, rows)
    })

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon
    registerTerminalInstance(sessionId, terminal)

    // Dynamic settings update listener (cursor style, font size, blink)
    const unsubscribeSettings = useSettingsStore.subscribe((state) => {
      if (terminalRef.current) {
        terminalRef.current.options.cursorStyle = (state.settings.cursorStyle as 'block' | 'underline' | 'bar') || 'bar'
        terminalRef.current.options.cursorBlink = state.settings.cursorBlink ?? true
        terminalRef.current.options.fontSize = state.settings.fontSize || 14
        fitAddonRef.current?.fit()
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

    // Observe container resize
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(containerRef.current)

    onReady?.()

    cleanupRef.current = () => {
      unregisterTerminalInstance(sessionId)
      unsubscribeSettings()
      inputDisposable.dispose()
      removeDataListener()
      resizeObserver.disconnect()
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }

    return () => {
      cleanupRef.current?.()
    }
  }, [sessionId, handleResize, onReady])

  return { containerRef, terminalRef }
}
