import { create } from 'zustand'

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'ollama' | 'custom'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
  baseUrl?: string
  temperature: number
}

export interface AISuggestion {
  id: string
  prompt: string
  command: string
  explanation: string
  shell: 'powershell' | 'cmd' | 'wsl'
  isDangerous?: boolean
  createdAt: number
}

export interface ErrorFixModalState {
  isOpen: boolean
  errorOutput: string
  lastCommand: string
  shell: 'powershell' | 'cmd' | 'wsl'
}

export interface AIState {
  config: AIConfig
  history: AISuggestion[]
  customModels: Record<AIProvider, string[]>
  errorFixModal: ErrorFixModalState

  setConfig: (cfg: Partial<AIConfig>) => void
  addSuggestion: (item: Omit<AISuggestion, 'id' | 'createdAt'>) => AISuggestion
  removeSuggestion: (id: string) => void
  clearHistory: () => void
  addCustomModel: (provider: AIProvider, modelName: string) => void
  openErrorFixModal: (params: { errorOutput: string; lastCommand?: string; shell?: 'powershell' | 'cmd' | 'wsl' }) => void
  closeErrorFixModal: () => void
  loadStorage: () => Promise<void>
  saveStorage: () => Promise<void>
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.5-flash',
  baseUrl: '',
  temperature: 0.2
}

export const PROVIDER_DEFAULT_MODELS: Record<AIProvider, { defaultModel: string; models: string[]; defaultUrl?: string }> = {
  gemini: {
    defaultModel: 'gemini-2.5-flash',
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ]
  },
  openai: {
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini']
  },
  claude: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']
  },
  ollama: {
    defaultModel: 'qwen2.5-coder',
    models: ['qwen2.5-coder', 'deepseek-coder-v2', 'llama3.3', 'codellama', 'mistral'],
    defaultUrl: 'http://localhost:11434'
  },
  custom: {
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    defaultUrl: 'https://api.deepseek.com/v1'
  }
}

export const useAIStore = create<AIState>()((set, get) => ({
  config: DEFAULT_AI_CONFIG,
  history: [],
      customModels: {
        gemini: [],
        openai: [],
        claude: [],
        ollama: [],
        custom: []
      },
      errorFixModal: {
        isOpen: false,
        errorOutput: '',
        lastCommand: '',
        shell: 'powershell'
      },

      setConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig }
        }))
        get().saveStorage()
      },

      addSuggestion: (item) => {
        const newSuggestion: AISuggestion = {
          ...item,
          id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now()
        }
        set((state) => ({
          history: [newSuggestion, ...state.history].slice(0, 50)
        }))
        get().saveStorage()
        return newSuggestion
      },

      removeSuggestion: (id) => {
        set((state) => ({
          history: state.history.filter((h) => h.id !== id)
        }))
        get().saveStorage()
      },

      clearHistory: () => {
        set({ history: [] })
        get().saveStorage()
      },

      addCustomModel: (provider, modelName) => {
        const trimmed = modelName.trim()
        if (!trimmed) return
        set((state) => {
          const current = state.customModels?.[provider] || []
          if (current.includes(trimmed)) return state
          return {
            customModels: {
              ...state.customModels,
              [provider]: [...current, trimmed]
            }
          }
        })
        get().saveStorage()
      },

      openErrorFixModal: (params) => {
        set({
          errorFixModal: {
            isOpen: true,
            errorOutput: params.errorOutput,
            lastCommand: params.lastCommand || 'Lệnh thất bại',
            shell: params.shell || 'powershell'
          }
        })
      },

      closeErrorFixModal: () => {
        set((state) => ({
          errorFixModal: {
            ...state.errorFixModal,
            isOpen: false
          }
        }))
      },

      loadStorage: async () => {
        try {
          if (window?.api?.store?.get) {
            const saved = await window.api.store.get('clim-ai-storage')
            if (saved) {
              set({
                config: { ...DEFAULT_AI_CONFIG, ...saved.config },
                history: saved.history || [],
                customModels: saved.customModels || { gemini: [], openai: [], claude: [], ollama: [], custom: [] }
              })
            }
          }
        } catch (e) {
          console.error('Failed to load AI storage:', e)
        }
      },

      saveStorage: async () => {
        try {
          if (window?.api?.store?.set) {
            const { config, history, customModels } = get()
            await window.api.store.set('clim-ai-storage', { config, history, customModels })
          }
        } catch (e) {
          console.error('Failed to save AI storage:', e)
        }
      }
    }))
