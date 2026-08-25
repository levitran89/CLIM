import { create } from 'zustand'
import type { KeybindingMap, ShellType } from '@shared/types'

export type { ShellType }
export type CursorStyle = 'block' | 'bar' | 'underline'
export type AppTheme = 'dark-zinc' | 'dark-slate' | 'amoled'
export type AccentColor = 'emerald' | 'cyan' | 'violet' | 'rose' | 'amber' | 'blue'

export const defaultKeybindings: KeybindingMap = {
  openPalette: 'Ctrl+K',
  openAiCopilot: 'Ctrl+Space',
  openSettings: 'Ctrl+,',
  openGuide: 'F1',
  openSnippetHub: 'Ctrl+H',
  newTerminal: 'Ctrl+T',
  closeTerminal: 'Ctrl+W',
  tabProfiles: 'Ctrl+1',
  tabCommands: 'Ctrl+2',
  tabSequences: 'Ctrl+3',
  tabScheduler: 'Ctrl+4',
  tabTerminal: 'Ctrl+5',
  tabMonitor: 'Ctrl+6',
  tabSSH: 'Ctrl+7'
}

export interface AppSettings {
  defaultShell: ShellType
  defaultCwd: string
  fontSize: number
  cursorStyle: CursorStyle
  cursorBlink: boolean
  scrollback: number
  theme: AppTheme
  accentColor: AccentColor
  confirmKill: boolean
  keybindings: KeybindingMap
  commandViewMode: 'grid' | 'compact' | 'list'
  commandColumns: 1 | 2 | 3
  sequenceViewMode: 'grid' | 'compact' | 'list'
  sequenceColumns: 1 | 2
  profileColumns: 1 | 2
  schedulerColumns: 1 | 2
  portViewMode: 'grid' | 'compact'
  portColumns: 1 | 2
  portLayoutWidth: 'centered' | 'full'
  processViewMode: 'grid' | 'compact'
  processColumns: 1 | 2
  processLayoutWidth: 'centered' | 'full'
  networkColumns: 1 | 2
  networkLayoutWidth: 'centered' | 'full'
  systemLogColumns: 1 | 2
  systemLogLayoutWidth: 'centered' | 'full'
  dashboardViewMode: 'full' | 'compact'
  dashboardGrouped: boolean
  menuDefaultAutomation: 'profiles' | 'commands' | 'sequences' | 'scheduler'
  menuDefaultTerminal: 'terminal' | 'ssh' | 'docker'
  menuDefaultSystem: 'monitor' | 'hub'
}

const SETTINGS_KEY = 'clim-app-settings'

const defaultSettings: AppSettings = {
  defaultShell: 'powershell',
  defaultCwd: '',
  fontSize: 13,
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 5000,
  theme: 'dark-zinc',
  accentColor: 'emerald',
  confirmKill: true,
  keybindings: defaultKeybindings,
  commandViewMode: 'grid',
  commandColumns: 2,
  sequenceViewMode: 'grid',
  sequenceColumns: 2,
  profileColumns: 2,
  schedulerColumns: 2,
  portViewMode: 'grid',
  portColumns: 2,
  portLayoutWidth: 'full',
  processViewMode: 'grid',
  processColumns: 2,
  processLayoutWidth: 'full',
  networkColumns: 2,
  networkLayoutWidth: 'full',
  systemLogColumns: 1,
  systemLogLayoutWidth: 'full',
  dashboardViewMode: 'full',
  dashboardGrouped: false,
  menuDefaultAutomation: 'commands',
  menuDefaultTerminal: 'terminal',
  menuDefaultSystem: 'monitor'
}

interface SettingsStore {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => {
  return {
    settings: defaultSettings,
    updateSettings: (updates) => {
      set((state) => {
        const newSettings = { ...state.settings, ...updates }
        return { settings: newSettings }
      })
      get().saveSettings()
    },
    resetSettings: () => {
      set({ settings: defaultSettings })
      get().saveSettings()
    },
    loadSettings: async () => {
      try {
        if (window?.api?.store?.get) {
          const saved = await window.api.store.get(SETTINGS_KEY)
          if (saved) {
            set({ settings: { ...defaultSettings, ...saved } })
          } else {
            // Fallback for older localStorage config
            const localSaved = localStorage.getItem(SETTINGS_KEY)
            if (localSaved) {
              set({ settings: { ...defaultSettings, ...JSON.parse(localSaved) } })
              get().saveSettings()
            }
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    },
    saveSettings: async () => {
      try {
        if (window?.api?.store?.set) {
          await window.api.store.set(SETTINGS_KEY, get().settings)
        }
      } catch (e) {
        console.error('Failed to save settings:', e)
      }
    }
  }
})
