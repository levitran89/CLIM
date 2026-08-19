import { create } from 'zustand'
import { vi } from '@/locales/vi'
import { en } from '@/locales/en'

export type Language = 'vi' | 'en'

const dictionaries: Record<Language, typeof vi> = {
  vi,
  en: en as unknown as typeof vi
}

const LANGUAGE_KEY = 'clim-app-language'

interface I18nStore {
  language: Language
  setLanguage: (lang: Language) => void
  loadLanguage: () => Promise<void>
  t: (path: string, fallback?: string) => string
}

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  return path.split('.').reduce<any>((acc, part) => {
    return acc && typeof acc === 'object' ? acc[part] : undefined
  }, obj)
}

export const useI18nStore = create<I18nStore>((set, get) => {
  return {
    language: 'vi',
    
    setLanguage: (lang: Language) => {
      set({ language: lang })
      try {
        if (window?.api?.store?.set) {
          window.api.store.set(LANGUAGE_KEY, lang)
        } else {
          localStorage.setItem(LANGUAGE_KEY, lang)
        }
      } catch (e) {
        console.error('Failed to save language:', e)
      }
    },

    loadLanguage: async () => {
      try {
        let saved: Language | null = null
        if (window?.api?.store?.get) {
          saved = (await window.api.store.get(LANGUAGE_KEY)) as Language
        }
        if (!saved) {
          saved = localStorage.getItem(LANGUAGE_KEY) as Language
        }
        if (saved === 'vi' || saved === 'en') {
          set({ language: saved })
        }
      } catch (e) {
        console.error('Failed to load language:', e)
      }
    },

    t: (path: string, fallback?: string): string => {
      const currentLang = get().language
      const dict = dictionaries[currentLang] || dictionaries.vi
      const val = getNestedValue(dict, path)
      if (val !== undefined && typeof val === 'string') {
        return val
      }
      // Fallback to vi dictionary
      const viVal = getNestedValue(dictionaries.vi, path)
      if (viVal !== undefined && typeof viVal === 'string') {
        return viVal
      }
      return fallback || path
    }
  }
})

export function useTranslation() {
  const language = useI18nStore((s) => s.language)
  const setLanguage = useI18nStore((s) => s.setLanguage)
  const t = useI18nStore((s) => s.t)

  return { language, setLanguage, t }
}
