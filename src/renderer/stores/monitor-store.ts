import { create } from 'zustand'
import type { SystemMetrics, ProcessMetric } from '@shared/types'
import { toast } from 'sonner'

interface MonitorState {
  systemMetrics: SystemMetrics | null
  processMetrics: ProcessMetric[]
  isPolling: boolean
  pollingTimer: NodeJS.Timeout | null
  currentGetPids: (() => number[]) | null

  fetchMetrics: (trackedPids?: number[]) => Promise<void>
  startPolling: (getTrackedPids: () => number[]) => void
  stopPolling: () => void
  killProcess: (pid: number) => Promise<boolean>
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  systemMetrics: null,
  processMetrics: [],
  isPolling: false,
  pollingTimer: null,
  currentGetPids: null,

  fetchMetrics: async (trackedPids) => {
    try {
      const pids = trackedPids ?? (get().currentGetPids ? get().currentGetPids!() : [])
      const sysPromise = window.api.monitor.getSystemMetrics().catch((e) => {
        console.error('getSystemMetrics error:', e)
        return null
      })
      const procsPromise = window.api.monitor.getProcessMetrics(pids).catch((e) => {
        console.error('getProcessMetrics error:', e)
        return []
      })
      const [sys, procs] = await Promise.all([sysPromise, procsPromise])
      set((state) => ({
        systemMetrics: sys || state.systemMetrics,
        processMetrics: procs || state.processMetrics
      }))
    } catch (err) {
      console.error('fetchMetrics failed:', err)
    }
  },

  startPolling: (getTrackedPids: () => number[]) => {
    set({ currentGetPids: getTrackedPids })
    get().fetchMetrics(getTrackedPids())

    if (!get().isPolling) {
      set({ isPolling: true })
      const timer = setInterval(() => {
        const pids = get().currentGetPids ? get().currentGetPids!() : []
        get().fetchMetrics(pids)
      }, 2500)
      set({ pollingTimer: timer })
    }
  },

  stopPolling: () => {
    const timer = get().pollingTimer
    if (timer) {
      clearInterval(timer)
    }
    set({ isPolling: false, pollingTimer: null, currentGetPids: null })
  },

  killProcess: async (pid: number) => {
    try {
      const res = await window.api.monitor.killProcess(pid)
      if (res.success) {
        toast.success(`Đã dừng tiến trình PID: ${pid}`)
        set((state) => ({
          processMetrics: state.processMetrics.filter((p) => p.pid !== pid)
        }))
        return true
      } else {
        toast.error(`Không thể dừng tiến trình: ${res.error}`)
        return false
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Lỗi khi dừng PID ${pid}: ${msg}`)
      return false
    }
  }
}))
