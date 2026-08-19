import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDockerStore } from './docker-store'

describe('docker-store', () => {
  beforeEach(() => {
    useDockerStore.setState({
      isAvailable: false,
      daemonVersion: '',
      errorMessage: null,
      containers: [],
      loading: false,
      actionLoading: {},
      activeLogsContainerId: null,
      activeLogs: '',
      logsLoading: false
    })
  })

  it('should initialize with default states', () => {
    const state = useDockerStore.getState()
    expect(state.isAvailable).toBe(false)
    expect(state.containers).toEqual([])
    expect(state.activeLogsContainerId).toBeNull()
  })

  it('should handle checkStatus when API is present', async () => {
    window.api = {
      ...window.api,
      docker: {
        checkAvailability: vi.fn().mockResolvedValue({ isAvailable: true, version: '24.0.5' }),
        listContainers: vi.fn().mockResolvedValue({ success: true, containers: [] }),
        controlContainer: vi.fn().mockResolvedValue({ success: true }),
        getContainerLogs: vi.fn().mockResolvedValue({ success: true, logs: 'hello log' })
      }
    } as any

    await useDockerStore.getState().checkStatus()
    expect(useDockerStore.getState().isAvailable).toBe(true)
    expect(useDockerStore.getState().daemonVersion).toBe('24.0.5')
  })

  it('should fetch and update container list', async () => {
    const mockContainers = [
      {
        id: 'c12345678901',
        name: 'nginx-web',
        image: 'nginx:alpine',
        command: 'nginx -g "daemon off;"',
        createdAt: '2 hours ago',
        status: 'Up 2 hours',
        state: 'running' as const,
        ports: '0.0.0.0:80->80/tcp'
      }
    ]

    window.api.docker.listContainers = vi.fn().mockResolvedValue({
      success: true,
      containers: mockContainers
    })

    await useDockerStore.getState().fetchContainers()
    expect(useDockerStore.getState().containers).toHaveLength(1)
    expect(useDockerStore.getState().containers[0].name).toBe('nginx-web')
  })
})
