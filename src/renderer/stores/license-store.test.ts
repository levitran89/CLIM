import { describe, it, expect, beforeEach } from 'vitest'
import { generateLicenseKey, verifyLicenseKey } from '@shared/license-verifier'
import { useLicenseStore, FREE_LIMITS } from './license-store'

describe('License Verifier & Store', () => {
  beforeEach(() => {
    localStorage.clear()
    useLicenseStore.getState().deactivateKey()
  })

  it('should generate and verify a valid lifetime license key', () => {
    const key = generateLicenseKey({
      name: 'Levi Tran',
      plan: 'lifetime',
      issuedAt: '2026-08-25'
    })

    expect(key).toContain('CLIM-PRO-')

    const result = verifyLicenseKey(key)
    expect(result.valid).toBe(true)
    expect(result.isPro).toBe(true)
    expect(result.payload?.name).toBe('Levi Tran')
    expect(result.payload?.plan).toBe('lifetime')
  })

  it('should reject tampered or invalid license key', () => {
    const validKey = generateLicenseKey({
      name: 'Tester',
      plan: 'lifetime',
      issuedAt: '2026-08-25'
    })

    const tamperedKey = validKey.slice(0, -4) + 'XXXX'
    const result = verifyLicenseKey(tamperedKey)
    expect(result.valid).toBe(false)
    expect(result.isPro).toBe(false)
  })

  it('should activate and deactivate in useLicenseStore', () => {
    const store = useLicenseStore.getState()
    expect(store.isPro).toBe(false)

    const key = generateLicenseKey({
      name: 'VIP User',
      plan: 'lifetime',
      issuedAt: '2026-08-25'
    })

    const activationResult = store.activateKey(key)
    expect(activationResult.success).toBe(true)
    expect(useLicenseStore.getState().isPro).toBe(true)
    expect(useLicenseStore.getState().payload?.name).toBe('VIP User')

    // Deactivate
    store.deactivateKey()
    expect(useLicenseStore.getState().isPro).toBe(false)
    expect(useLicenseStore.getState().payload).toBeNull()
  })

  it('should respect feature gating limits for free tier', () => {
    const store = useLicenseStore.getState()
    store.deactivateKey()

    expect(store.canAddCommand(5)).toBe(true)
    expect(store.canAddCommand(FREE_LIMITS.maxCommands)).toBe(false)

    // After Pro activation, unlimited
    const key = generateLicenseKey({
      name: 'VIP User',
      plan: 'lifetime',
      issuedAt: '2026-08-25'
    })
    store.activateKey(key)

    expect(useLicenseStore.getState().canAddCommand(9999)).toBe(true)
    expect(useLicenseStore.getState().canAddSequence(9999)).toBe(true)
  })
})
