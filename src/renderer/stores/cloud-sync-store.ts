import { create } from 'zustand'
import type { CloudSyncConfig, FullBackupPayload } from '@shared/types'
import { toast } from 'sonner'
import { useCommandStore } from './command-store'
import { useSequenceStore } from './sequence-store'
import { useProfileStore } from './profile-store'
import { useSchedulerStore } from './scheduler-store'
import { useSettingsStore } from './settings-store'
import { logSystemEvent } from '@/lib/system-logger'

interface CloudSyncState {
  config: CloudSyncConfig
  githubUsername: string | null
  isSyncing: boolean
  isTesting: boolean
  syncError: string | null

  loadConfig: () => Promise<void>
  saveConfig: (config: Partial<CloudSyncConfig>) => Promise<void>
  testToken: (token: string) => Promise<boolean>
  uploadBackupToGist: (options: { password?: string; isPublic?: boolean }) => Promise<boolean>
  downloadBackupFromGist: (options: { password?: string }) => Promise<boolean>
}

export const useCloudSyncStore = create<CloudSyncState>((set, get) => ({
  config: {
    githubToken: '',
    gistId: '',
    lastSyncedAt: 0,
    encrypted: false,
    autoSync: false
  },
  githubUsername: null,
  isSyncing: false,
  isTesting: false,
  syncError: null,

  loadConfig: async () => {
    try {
      if (!window?.api?.cloudSync?.getConfig) return
      const cfg = await window.api.cloudSync.getConfig()
      set({ config: cfg || {} })
      if (cfg?.githubToken) {
        get().testToken(cfg.githubToken)
      }
    } catch (err: any) {
      console.error('Failed to load cloud sync config:', err)
    }
  },

  saveConfig: async (partial) => {
    try {
      const updated = { ...get().config, ...partial }
      set({ config: updated })
      if (window?.api?.cloudSync?.saveConfig) {
        await window.api.cloudSync.saveConfig(updated)
      }
      toast.success('Đã lưu cấu hình Đồng bộ Đám mây')
    } catch (err: any) {
      toast.error('Lỗi khi lưu cấu hình đồng bộ')
    }
  },

  testToken: async (token) => {
    if (!token?.trim()) {
      toast.error('Vui lòng nhập GitHub Personal Access Token')
      return false
    }

    set({ isTesting: true, syncError: null })
    try {
      const res = await window.api.cloudSync.testToken(token)
      if (res.success && res.username) {
        set({ githubUsername: res.username })
        toast.success(`Đã xác thực tài khoản GitHub: @${res.username}`)
        return true
      } else {
        set({ githubUsername: null, syncError: res.error || 'Token không hợp lệ' })
        toast.error(res.error || 'Token không hợp lệ hoặc đã hết hạn')
        return false
      }
    } catch (err: any) {
      set({ githubUsername: null, syncError: err.message })
      toast.error(err.message || 'Lỗi khi kiểm tra GitHub Token')
      return false
    } finally {
      set({ isTesting: false })
    }
  },

  uploadBackupToGist: async ({ password, isPublic }) => {
    const { config } = get()
    if (!config.githubToken?.trim()) {
      toast.error('Vui lòng cấu hình GitHub Personal Access Token trước')
      return false
    }

    set({ isSyncing: true, syncError: null })
    try {
      // Thu thập toàn bộ dữ liệu ứng dụng hiện tại
      const payload: FullBackupPayload = {
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        commands: useCommandStore.getState().commands,
        sequences: useSequenceStore.getState().sequences,
        profiles: useProfileStore.getState().profiles,
        settings: useSettingsStore.getState().settings,
        tasks: useSchedulerStore.getState().tasks
      }

      const res = await window.api.cloudSync.uploadToGist(payload, {
        token: config.githubToken,
        gistId: config.gistId,
        password,
        isPublic
      })

      if (res.success) {
        const updatedConfig: CloudSyncConfig = {
          ...config,
          gistId: res.gistId,
          lastSyncedAt: res.lastSyncedAt,
          encrypted: Boolean(password?.trim())
        }
        set({ config: updatedConfig })
        toast.success(
          password?.trim()
            ? 'Đã tải dữ liệu lên GitHub Gist (Được mã hóa E2EE an toàn)!'
            : 'Đã tải dữ liệu lên GitHub Gist thành công!'
        )
        logSystemEvent(
          'success',
          'cloud',
          'GitHub Gist',
          `Đã sao lưu toàn bộ cấu hình lên GitHub Gist ${password?.trim() ? '(Mã hóa E2EE)' : ''}`,
          `Gist ID: ${res.gistId}`
        )
        return true
      } else {
        set({ syncError: res.error || 'Lỗi khi tải lên Gist' })
        toast.error(res.error || 'Lỗi khi tải dữ liệu lên Gist')
        logSystemEvent(
          'error',
          'cloud',
          'GitHub Gist',
          `Lỗi khi tải bản sao lưu lên Gist: ${res.error || 'Không xác định'}`
        )
        return false
      }
    } catch (err: any) {
      set({ syncError: err.message })
      toast.error(err.message || 'Lỗi khi đồng bộ lên GitHub Gist')
      return false
    } finally {
      set({ isSyncing: false })
    }
  },

  downloadBackupFromGist: async ({ password }) => {
    const { config } = get()
    if (!config.githubToken?.trim()) {
      toast.error('Vui lòng cấu hình GitHub Personal Access Token')
      return false
    }
    if (!config.gistId?.trim()) {
      toast.error('Chưa có Gist ID để tải về. Vui lòng nhập Gist ID hoặc thực hiện Tải Lên trước.')
      return false
    }

    set({ isSyncing: true, syncError: null })
    try {
      const res = await window.api.cloudSync.downloadFromGist({
        token: config.githubToken,
        gistId: config.gistId,
        password
      })

      if (res.success && res.payload) {
        const payload = res.payload

        // Nạp và lưu dữ liệu vào các stores
        if (Array.isArray(payload.commands)) {
          for (const cmd of payload.commands) {
            await window.api.commands.save(cmd)
          }
          await useCommandStore.getState().loadCommands()
        }

        if (Array.isArray(payload.sequences)) {
          for (const seq of payload.sequences) {
            await window.api.sequences.save(seq)
          }
          await useSequenceStore.getState().loadSequences()
        }

        if (Array.isArray(payload.profiles)) {
          for (const prof of payload.profiles) {
            await window.api.profiles.save(prof)
          }
          await useProfileStore.getState().loadProfiles()
        }

        if (Array.isArray(payload.tasks)) {
          for (const task of payload.tasks) {
            await window.api.scheduler.saveTask(task)
          }
          await useSchedulerStore.getState().loadTasks()
        }

        if (payload.settings) {
          useSettingsStore.getState().updateSettings(payload.settings)
        }

        const now = Date.now()
        const updatedConfig: CloudSyncConfig = {
          ...config,
          lastSyncedAt: now,
          encrypted: res.isEncrypted ?? false
        }
        set({ config: updatedConfig })
        await window.api.cloudSync.saveConfig(updatedConfig)

        toast.success('Đã tải và khôi phục toàn bộ cấu hình từ GitHub Gist!')
        return true
      } else {
        set({ syncError: res.error || 'Lỗi khi tải về' })
        toast.error(res.error || 'Không thể khôi phục dữ liệu từ Gist')
        return false
      }
    } catch (err: any) {
      set({ syncError: err.message })
      toast.error(err.message || 'Lỗi khi tải dữ liệu từ GitHub Gist')
      return false
    } finally {
      set({ isSyncing: false })
    }
  }
}))
