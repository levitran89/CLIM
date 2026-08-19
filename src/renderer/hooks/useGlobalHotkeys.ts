import { useEffect } from 'react'
import { useSettingsStore, defaultKeybindings } from '@/stores/settings-store'

interface GlobalHotkeysOptions {
  onTogglePalette: () => void
  onOpenAiCopilot?: () => void
  onOpenSnippetHub?: () => void
  onNewTerminal?: () => void
  onCloseActiveTerminal?: () => void
  onNavigateTab?: (tab: 'profiles' | 'commands' | 'sequences' | 'scheduler' | 'terminal' | 'ports' | 'monitor' | 'ssh') => void
  onOpenSettings?: () => void
  onOpenGuide?: () => void
}

/**
 * Kiểm tra xem KeyboardEvent có khớp với chuỗi combo phím (VD: "Ctrl+K", "Ctrl+Space", "F1", "Ctrl+Shift+T")
 */
function matchesCombo(e: KeyboardEvent, combo?: string): boolean {
  if (!combo) return false

  const parts = combo.toLowerCase().split('+').map((p) => p.trim())
  const hasCtrl = parts.includes('ctrl')
  const hasAlt = parts.includes('alt')
  const hasShift = parts.includes('shift')
  const hasMeta = parts.includes('meta') || parts.includes('cmd')

  const isCtrlOrCmd = e.ctrlKey || e.metaKey
  const isAlt = e.altKey
  const isShift = e.shiftKey

  if (hasCtrl && !isCtrlOrCmd) return false
  if (!hasCtrl && !hasMeta && isCtrlOrCmd) return false

  if (hasAlt && !isAlt) return false
  if (!hasAlt && isAlt) return false

  if (hasShift && !isShift) return false
  if (!hasShift && isShift) return false

  // Main key
  const mainKey = parts.filter((p) => !['ctrl', 'alt', 'shift', 'meta', 'cmd'].includes(p))[0]
  if (!mainKey) return false

  const eventKey = e.key.toLowerCase()
  const eventCode = e.code.toLowerCase()

  if (mainKey === 'space') {
    return eventKey === ' ' || eventCode === 'space'
  }

  return eventKey === mainKey || eventCode === `key${mainKey}` || eventCode === `digit${mainKey}`
}

export function useGlobalHotkeys({
  onTogglePalette,
  onOpenAiCopilot,
  onOpenSnippetHub,
  onNewTerminal,
  onCloseActiveTerminal,
  onNavigateTab,
  onOpenSettings,
  onOpenGuide
}: GlobalHotkeysOptions): void {
  const keybindings = useSettingsStore((s) => s.settings.keybindings) || defaultKeybindings

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // 1. AI Copilot
      if (matchesCombo(e, keybindings.openAiCopilot)) {
        e.preventDefault()
        onOpenAiCopilot?.()
        return
      }

      // 2. Spotlight Command Palette
      if (matchesCombo(e, keybindings.openPalette)) {
        e.preventDefault()
        onTogglePalette()
        return
      }

      // 3. Open Settings
      if (matchesCombo(e, keybindings.openSettings)) {
        e.preventDefault()
        onOpenSettings?.()
        return
      }

      // 4. Open Guide
      if (matchesCombo(e, keybindings.openGuide) || (e.key === 'F1')) {
        e.preventDefault()
        onOpenGuide?.()
        return
      }

      // 5. Open Snippet Hub
      if (matchesCombo(e, keybindings.openSnippetHub)) {
        e.preventDefault()
        onOpenSnippetHub?.()
        return
      }

      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // 6. Navigation Tabs
      if (matchesCombo(e, keybindings.tabProfiles)) {
        e.preventDefault()
        onNavigateTab?.('profiles')
        return
      }
      if (matchesCombo(e, keybindings.tabCommands)) {
        e.preventDefault()
        onNavigateTab?.('commands')
        return
      }
      if (matchesCombo(e, keybindings.tabSequences)) {
        e.preventDefault()
        onNavigateTab?.('sequences')
        return
      }
      if (matchesCombo(e, keybindings.tabScheduler)) {
        e.preventDefault()
        onNavigateTab?.('scheduler')
        return
      }
      if (matchesCombo(e, keybindings.tabTerminal)) {
        e.preventDefault()
        onNavigateTab?.('terminal')
        return
      }
      if (matchesCombo(e, keybindings.tabMonitor)) {
        e.preventDefault()
        onNavigateTab?.('monitor')
        return
      }
      if (matchesCombo(e, keybindings.tabSSH)) {
        e.preventDefault()
        onNavigateTab?.('ssh')
        return
      }

      // 7. Terminal Actions (if not in text input)
      if (!isInput) {
        if (matchesCombo(e, keybindings.newTerminal)) {
          e.preventDefault()
          onNewTerminal?.()
          return
        }
        if (matchesCombo(e, keybindings.closeTerminal)) {
          e.preventDefault()
          onCloseActiveTerminal?.()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    keybindings,
    onTogglePalette,
    onOpenAiCopilot,
    onOpenSnippetHub,
    onNewTerminal,
    onCloseActiveTerminal,
    onNavigateTab,
    onOpenSettings,
    onOpenGuide
  ])
}
