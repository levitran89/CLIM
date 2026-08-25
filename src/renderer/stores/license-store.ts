import { create } from 'zustand'
import {
  verifyLicenseKey,
  type LicensePayload,
  type LicenseVerificationResult
} from '@shared/license-verifier'

const LICENSE_STORAGE_KEY = 'clim_license_key'

export interface FreeTierLimits {
  maxCommands: number
  maxSequences: number
  maxTasks: number
  maxSshHosts: number
  maxAiQueriesPerDay: number
  allowCloudSync: boolean
  allowWebhooks: boolean
}

export const FREE_LIMITS: FreeTierLimits = {
  maxCommands: 10,
  maxSequences: 3,
  maxTasks: 2,
  maxSshHosts: 2,
  maxAiQueriesPerDay: 5,
  allowCloudSync: true, // Cho phép sync nhưng có giới hạn dung lượng
  allowWebhooks: false  // Webhooks Discord/Telegram dành riêng cho Pro
}

export interface LicenseState {
  isPro: boolean
  licenseKey: string
  payload: LicensePayload | null
  error: string | null
  
  // Actions
  activateKey: (key: string) => { success: boolean; message: string; payload?: LicensePayload }
  deactivateKey: () => void
  
  // Feature gating checks
  canAddCommand: (currentCount: number) => boolean
  canAddSequence: (currentCount: number) => boolean
  canAddTask: (currentCount: number) => boolean
  canAddSshHost: (currentCount: number) => boolean
  canUseWebhooks: () => boolean
}

function loadInitialLicense(): { isPro: boolean; licenseKey: string; payload: LicensePayload | null } {
  try {
    const savedKey = localStorage.getItem(LICENSE_STORAGE_KEY)
    if (!savedKey) {
      return { isPro: false, licenseKey: '', payload: null }
    }

    const verification = verifyLicenseKey(savedKey)
    if (verification.valid && verification.isPro && verification.payload) {
      return {
        isPro: true,
        licenseKey: savedKey,
        payload: verification.payload
      }
    }
  } catch (err) {
    console.error('Failed to load license from storage:', err)
  }

  return { isPro: false, licenseKey: '', payload: null }
}

const initial = loadInitialLicense()

export const useLicenseStore = create<LicenseState>((set, get) => ({
  isPro: initial.isPro,
  licenseKey: initial.licenseKey,
  payload: initial.payload,
  error: null,

  activateKey: (key: string) => {
    const result: LicenseVerificationResult = verifyLicenseKey(key)

    if (!result.valid || !result.payload) {
      set({ error: result.error || 'Mã bản quyền không hợp lệ' })
      return {
        success: false,
        message: result.error || 'Mã bản quyền không hợp lệ'
      }
    }

    // Lưu vào localStorage
    try {
      localStorage.setItem(LICENSE_STORAGE_KEY, key.trim())
    } catch (err) {
      console.error('Failed to save license key:', err)
    }

    set({
      isPro: true,
      licenseKey: key.trim(),
      payload: result.payload,
      error: null
    })

    return {
      success: true,
      message: `Kích hoạt thành công bản quyền CLIM Pro (${result.payload.plan === 'lifetime' ? 'Vĩnh viễn' : 'Hàng năm'}) cho ${result.payload.name}!`,
      payload: result.payload
    }
  },

  deactivateKey: () => {
    try {
      localStorage.removeItem(LICENSE_STORAGE_KEY)
    } catch (err) {
      console.error('Failed to remove license key:', err)
    }

    set({
      isPro: false,
      licenseKey: '',
      payload: null,
      error: null
    })
  },

  canAddCommand: (currentCount: number) => {
    if (get().isPro) return true
    return currentCount < FREE_LIMITS.maxCommands
  },

  canAddSequence: (currentCount: number) => {
    if (get().isPro) return true
    return currentCount < FREE_LIMITS.maxSequences
  },

  canAddTask: (currentCount: number) => {
    if (get().isPro) return true
    return currentCount < FREE_LIMITS.maxTasks
  },

  canAddSshHost: (currentCount: number) => {
    if (get().isPro) return true
    return currentCount < FREE_LIMITS.maxSshHosts
  },

  canUseWebhooks: () => {
    return get().isPro
  }
}))
