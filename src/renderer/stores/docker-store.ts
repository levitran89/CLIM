import { create } from 'zustand'
import type { DockerContainer } from '@shared/types'
import { logSystemEvent } from '@/lib/system-logger'
import { toast } from 'sonner'

interface DockerStore {
  isAvailable: boolean
  daemonVersion: string
  errorMessage: string | null
  containers: DockerContainer[]
  loading: boolean
  actionLoading: Record<string, boolean>
  activeLogsContainerId: string | null
  activeLogs: string
  logsLoading: boolean

  checkStatus: () => Promise<void>
  fetchContainers: () => Promise<void>
  controlContainer: (action: 'start' | 'stop' | 'restart' | 'kill' | 'rm', id: string, name: string) => Promise<void>
  fetchLogs: (id: string, tail?: number) => Promise<void>
  closeLogs: () => void
}

export const useDockerStore = create<DockerStore>((set, get) => {
  return {
    isAvailable: false,
    daemonVersion: '',
    errorMessage: null,
    containers: [],
    loading: false,
    actionLoading: {},
    activeLogsContainerId: null,
    activeLogs: '',
    logsLoading: false,

    checkStatus: async () => {
      try {
        if (!window?.api?.docker?.checkAvailability) return
        const res = await window.api.docker.checkAvailability()
        set({
          isAvailable: res.isAvailable,
          daemonVersion: res.version || '',
          errorMessage: res.error || null
        })
      } catch (e: any) {
        set({ isAvailable: false, errorMessage: e.message })
      }
    },

    fetchContainers: async () => {
      set({ loading: true })
      try {
        await get().checkStatus()
        if (window?.api?.docker?.listContainers) {
          const res = await window.api.docker.listContainers(true)
          if (res.success) {
            set({ containers: res.containers, loading: false })
          } else {
            set({ containers: [], loading: false, errorMessage: res.error || null })
          }
        }
      } catch (e: any) {
        set({ loading: false, errorMessage: e.message })
      }
    },

    controlContainer: async (action, id, name) => {
      set((state) => ({ actionLoading: { ...state.actionLoading, [id]: true } }))
      try {
        if (window?.api?.docker?.controlContainer) {
          const res = await window.api.docker.controlContainer(action, id)
          if (res.success) {
            const actionText = {
              start: 'khởi chạy',
              stop: 'dừng',
              restart: 'khởi động lại',
              kill: 'buộc dừng',
              rm: 'xóa'
            }[action]
            toast.success(`Đã ${actionText} container "${name}"`)
            logSystemEvent(
              'info',
              'docker',
              name,
              `Đã ${actionText} container "${name}" (ID: ${id.slice(0, 12)})`
            )
            await get().fetchContainers()
          } else {
            toast.error(`Thao tác thất bại: ${res.error || 'Lỗi không xác định'}`)
            logSystemEvent(
              'error',
              'docker',
              name,
              `Không thể thực hiện thao tác ${action} trên container "${name}": ${res.error || 'Lỗi không xác định'}`
            )
          }
        }
      } catch (e: any) {
        toast.error(`Lỗi: ${e.message}`)
      } finally {
        set((state) => ({ actionLoading: { ...state.actionLoading, [id]: false } }))
      }
    },

    fetchLogs: async (id, tail = 150) => {
      set({ activeLogsContainerId: id, logsLoading: true, activeLogs: '' })
      try {
        if (window?.api?.docker?.getContainerLogs) {
          const res = await window.api.docker.getContainerLogs(id, tail)
          if (res.success) {
            set({ activeLogs: res.logs, logsLoading: false })
          } else {
            set({ activeLogs: `Lỗi tải log: ${res.error || ''}`, logsLoading: false })
          }
        }
      } catch (e: any) {
        set({ activeLogs: `Lỗi: ${e.message}`, logsLoading: false })
      }
    },

    closeLogs: () => {
      set({ activeLogsContainerId: null, activeLogs: '', logsLoading: false })
    }
  }
})
