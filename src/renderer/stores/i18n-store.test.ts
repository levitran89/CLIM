import { describe, it, expect, beforeEach } from 'vitest'
import { useI18nStore } from './i18n-store'

describe('i18n-store', () => {
  beforeEach(() => {
    localStorage.clear()
    useI18nStore.setState({ language: 'vi' })
  })

  it('should default to Vietnamese language', () => {
    expect(useI18nStore.getState().language).toBe('vi')
    expect(useI18nStore.getState().t('common.save')).toBe('Lưu')
  })

  it('should switch language to English and translate correctly', () => {
    useI18nStore.getState().setLanguage('en')
    expect(useI18nStore.getState().language).toBe('en')
    expect(useI18nStore.getState().t('common.save')).toBe('Save')
    expect(useI18nStore.getState().t('tabs.terminal')).toBe('Terminal')
    expect(useI18nStore.getState().t('titleBar.title')).toBe('CLIM - CLI System Manager')
  })

  it('should fallback to fallback string or key if translation is missing', () => {
    expect(useI18nStore.getState().t('non.existing.key', 'Default')).toBe('Default')
    expect(useI18nStore.getState().t('another.missing.key')).toBe('another.missing.key')
  })
})
