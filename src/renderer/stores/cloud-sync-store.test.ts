import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCloudSyncStore } from './cloud-sync-store'

beforeEach(() => {
  vi.stubGlobal('window', {
    api: {
      cloudSync: {
        getConfig: vi.fn().mockResolvedValue({
          githubToken: 'ghp_mock_token_123',
          gistId: 'gist_mock_456',
          lastSyncedAt: 1234567890
        }),
        saveConfig: vi.fn().mockResolvedValue(undefined),
        testToken: vi.fn().mockResolvedValue({ success: true, username: 'octocat' }),
        uploadToGist: vi.fn().mockResolvedValue({
          success: true,
          gistId: 'gist_mock_456',
          htmlUrl: 'https://gist.github.com/gist_mock_456',
          lastSyncedAt: Date.now()
        }),
        downloadFromGist: vi.fn().mockResolvedValue({
          success: true,
          payload: {
            version: '1.2.0',
            exportedAt: '2026-08-18',
            commands: [],
            sequences: [],
            profiles: []
          }
        })
      },
      commands: { save: vi.fn().mockResolvedValue(undefined), list: vi.fn().mockResolvedValue([]) },
      sequences: { save: vi.fn().mockResolvedValue(undefined), list: vi.fn().mockResolvedValue([]) },
      profiles: { save: vi.fn().mockResolvedValue(undefined), list: vi.fn().mockResolvedValue([]) },
      scheduler: { saveTask: vi.fn().mockResolvedValue(undefined), listTasks: vi.fn().mockResolvedValue([]) }
    }
  })

  useCloudSyncStore.setState({
    config: { githubToken: '', gistId: '', lastSyncedAt: 0 },
    githubUsername: null,
    isSyncing: false,
    isTesting: false,
    syncError: null
  })
})

describe('useCloudSyncStore', () => {
  it('loads config and tests token', async () => {
    await useCloudSyncStore.getState().loadConfig()
    expect(useCloudSyncStore.getState().config.githubToken).toBe('ghp_mock_token_123')
    expect(useCloudSyncStore.getState().githubUsername).toBe('octocat')
  })

  it('tests valid token and sets username', async () => {
    const success = await useCloudSyncStore.getState().testToken('ghp_mock_token_123')
    expect(success).toBe(true)
    expect(useCloudSyncStore.getState().githubUsername).toBe('octocat')
  })

  it('uploads backup to gist', async () => {
    useCloudSyncStore.setState({
      config: { githubToken: 'ghp_mock_token_123', gistId: 'gist_mock_456' }
    })
    const success = await useCloudSyncStore.getState().uploadBackupToGist({ password: 'my-secret-pass' })
    expect(success).toBe(true)
    expect(window.api.cloudSync.uploadToGist).toHaveBeenCalled()
  })

  it('downloads backup from gist and restores data', async () => {
    useCloudSyncStore.setState({
      config: { githubToken: 'ghp_mock_token_123', gistId: 'gist_mock_456' }
    })
    const success = await useCloudSyncStore.getState().downloadBackupFromGist({})
    expect(success).toBe(true)
    expect(window.api.cloudSync.downloadFromGist).toHaveBeenCalled()
  })
})
