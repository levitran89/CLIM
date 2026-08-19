import { create } from 'zustand'
import type { SSHHost } from '@shared/types'
import { logSystemEvent } from '@/lib/system-logger'
import { toast } from 'sonner'

export interface HostConnectionStatus {
  status: 'online' | 'offline' | 'checking'
  latencyMs?: number
  error?: string
  checkedAt?: number
}

const SSH_STORAGE_KEY = 'clim-ssh-hosts-local'

interface SSHStore {
  hosts: SSHHost[]
  loading: boolean
  searchQuery: string
  selectedGroup: string | 'all'
  selectedHostId: string | null
  statusMap: Record<string, HostConnectionStatus>

  setSearchQuery: (query: string) => void
  setSelectedGroup: (group: string | 'all') => void
  setSelectedHostId: (id: string | null) => void

  fetchHosts: () => Promise<void>
  saveHost: (host: SSHHost) => Promise<void>
  deleteHost: (id: string) => Promise<void>
  testHostConnection: (host: SSHHost) => Promise<void>
  testAllHosts: () => Promise<void>
  buildSSHCommand: (host: SSHHost) => string
}

export const buildSSHCommand = (host: SSHHost): string => {
  const parts: string[] = ['ssh']

  if (host.port && host.port !== 22) {
    parts.push(`-p ${host.port}`)
  }

  if (host.authType === 'privateKey' && host.privateKeyPath) {
    const escapedKey = host.privateKeyPath.includes(' ')
      ? `"${host.privateKeyPath}"`
      : host.privateKeyPath
    parts.push(`-i ${escapedKey}`)
  }

  if (host.tunnels && host.tunnels.length > 0) {
    for (const tunnel of host.tunnels) {
      if (tunnel.type === 'local') {
        parts.push(`-L ${tunnel.localPort}:${tunnel.remoteHost || 'localhost'}:${tunnel.remotePort}`)
      } else if (tunnel.type === 'remote') {
        parts.push(`-R ${tunnel.localPort}:${tunnel.remoteHost || 'localhost'}:${tunnel.remotePort}`)
      }
    }
  }

  const userHost = host.username ? `${host.username}@${host.host}` : host.host
  parts.push(userHost)

  return parts.join(' ')
}

const loadLocalHosts = (): SSHHost[] => {
  try {
    const saved = localStorage.getItem(SSH_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export const useSSHStore = create<SSHStore>((set, get) => ({
  hosts: loadLocalHosts(),
  loading: false,
  searchQuery: '',
  selectedGroup: 'all',
  selectedHostId: null,
  statusMap: {},

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
  setSelectedHostId: (selectedHostId) => set({ selectedHostId }),

  fetchHosts: async () => {
    set({ loading: true })
    try {
      if (window.api?.ssh?.list) {
        const hosts = await window.api.ssh.list()
        if (hosts && hosts.length > 0) {
          localStorage.setItem(SSH_STORAGE_KEY, JSON.stringify(hosts))
          set({ hosts, loading: false })
          return
        }
      }
    } catch {
      // fallback to local
    }
    set({ hosts: loadLocalHosts(), loading: false })
  },

  saveHost: async (host: SSHHost) => {
    try {
      if (window.api?.ssh?.save) {
        await window.api.ssh.save(host)
      }
      const existing = get().hosts
      const idx = existing.findIndex((h) => h.id === host.id)
      const updated = idx >= 0
        ? existing.map((h) => (h.id === host.id ? { ...host, updatedAt: Date.now() } : h))
        : [...existing, { ...host, createdAt: host.createdAt || Date.now(), updatedAt: Date.now() }]

      localStorage.setItem(SSH_STORAGE_KEY, JSON.stringify(updated))
      set({ hosts: updated })
      toast.success(`Đã lưu máy chủ "${host.name}"`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu máy chủ'
      toast.error(`Lỗi: ${msg}`)
    }
  },

  deleteHost: async (id: string) => {
    try {
      if (window.api?.ssh?.delete) {
        await window.api.ssh.delete(id)
      }
      const updated = get().hosts.filter((h) => h.id !== id)
      localStorage.setItem(SSH_STORAGE_KEY, JSON.stringify(updated))
      set((state) => ({
        hosts: updated,
        selectedHostId: state.selectedHostId === id ? null : state.selectedHostId
      }))
      toast.success('Đã xóa máy chủ khỏi danh sách')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa máy chủ'
      toast.error(`Lỗi: ${msg}`)
    }
  },

  testHostConnection: async (host: SSHHost) => {
    set((state) => ({
      statusMap: {
        ...state.statusMap,
        [host.id]: { status: 'checking', checkedAt: Date.now() }
      }
    }))

    try {
      if (window.api?.ssh?.testConnection) {
        const res = await window.api.ssh.testConnection(host.host, host.port || 22)
        set((state) => ({
          statusMap: {
            ...state.statusMap,
            [host.id]: {
              status: res.success ? 'online' : 'offline',
              latencyMs: res.latencyMs,
              error: res.error,
              checkedAt: Date.now()
            }
          }
        }))
        logSystemEvent(
          res.success ? 'success' : 'error',
          'ssh',
          host.name,
          res.success
            ? `Máy chủ SSH "${host.name}" (${host.host}:${host.port || 22}) kết nối tốt (${res.latencyMs}ms)`
            : `Máy chủ SSH "${host.name}" (${host.host}:${host.port || 22}) không phản hồi: ${res.error || 'Timeout'}`
        )
        return
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối'
      set((state) => ({
        statusMap: {
          ...state.statusMap,
          [host.id]: { status: 'offline', error: msg, checkedAt: Date.now() }
        }
      }))
      return
    }

    // Mock ping if running in pure browser environment
    setTimeout(() => {
      set((state) => ({
        statusMap: {
          ...state.statusMap,
          [host.id]: {
            status: 'online',
            latencyMs: Math.floor(Math.random() * 45) + 15,
            checkedAt: Date.now()
          }
        }
      }))
    }, 600)
  },

  testAllHosts: async () => {
    const { hosts, testHostConnection } = get()
    await Promise.all(hosts.map((h) => testHostConnection(h)))
  },

  buildSSHCommand: (host: SSHHost) => buildSSHCommand(host)
}))
