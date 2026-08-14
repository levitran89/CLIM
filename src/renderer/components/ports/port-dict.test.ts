import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getPortInfo } from './port-dict'

describe('getPortInfo', () => {
  it('should return known port info', () => {
    const info = getPortInfo(8080)
    expect(info.service).toBe('HTTP Alt')
    expect(info.importance).toBe('Development')
  })

  it('should return Unknown for unregistered port', () => {
    const info = getPortInfo(99999)
    expect(info.service).toBe('Unknown')
  })
})

