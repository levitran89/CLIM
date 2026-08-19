import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMonitorStore } from './monitor-store'
import type { SystemMetrics, ProcessMetric } from '@shared/types'

const mockSys: SystemMetrics = {
  cpuUsagePercent: 25,
  cpuCount: 8,
  cpuModel: 'Intel Core i7',
  totalMemoryBytes: 16 * 1024 * 1024 * 1024,
  freeMemoryBytes: 8 * 1024 * 1024 * 1024,
  usedMemoryBytes: 8 * 1024 * 1024 * 1024,
  memoryUsagePercent: 50,
  uptimeSeconds: 3600
}

const mockProc: ProcessMetric = {
  pid: 1234,
  name: 'node.exe',
  type: 'terminal',
  cpuPercent: 5.2,
  memoryBytes: 150 * 1024 * 1024,
  memoryMb: 150
}

beforeEach(() => {
  vi.stubGlobal('window', {
    api: {
      monitor: {
        getSystemMetrics: vi.fn().mockResolvedValue(mockSys),
        getProcessMetrics: vi.fn().mockResolvedValue([mockProc]),
        killProcess: vi.fn().mockResolvedValue({ success: true })
      }
    }
  })

  useMonitorStore.setState({
    systemMetrics: null,
    processMetrics: [],
    isPolling: false,
    pollingTimer: null
  })
})

describe('useMonitorStore', () => {
  it('fetches system metrics and process metrics', async () => {
    await useMonitorStore.getState().fetchMetrics([1234])
    expect(useMonitorStore.getState().systemMetrics?.cpuUsagePercent).toBe(25)
    expect(useMonitorStore.getState().processMetrics.length).toBe(1)
    expect(useMonitorStore.getState().processMetrics[0].name).toBe('node.exe')
  })

  it('kills a process and removes it from state', async () => {
    useMonitorStore.setState({ processMetrics: [mockProc] })
    const success = await useMonitorStore.getState().killProcess(1234)
    expect(success).toBe(true)
    expect(window.api.monitor.killProcess).toHaveBeenCalledWith(1234)
    expect(useMonitorStore.getState().processMetrics.length).toBe(0)
  })
})
