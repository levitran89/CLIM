import { describe, it, expect, beforeEach } from 'vitest'
import { useSystemLogStore } from './system-log-store'

describe('useSystemLogStore', () => {
  beforeEach(() => {
    useSystemLogStore.getState().clearLogs()
  })

  it('adds a system log entry and prepends to list', () => {
    const store = useSystemLogStore.getState()
    const log = store.addLog({
      level: 'info',
      category: 'terminal',
      source: 'Terminal 1',
      message: 'Khởi tạo terminal mới',
      details: 'shell: powershell'
    })

    expect(log.id).toBeDefined()
    expect(log.level).toBe('info')
    expect(log.category).toBe('terminal')
    expect(log.source).toBe('Terminal 1')
    expect(log.message).toBe('Khởi tạo terminal mới')

    const currentLogs = useSystemLogStore.getState().logs
    expect(currentLogs.length).toBe(1)
    expect(currentLogs[0].id).toBe(log.id)
  })

  it('updates filters correctly', () => {
    const store = useSystemLogStore.getState()
    store.setFilter({ search: '9router', level: 'error', category: 'watchdog' })

    const { filter } = useSystemLogStore.getState()
    expect(filter.search).toBe('9router')
    expect(filter.level).toBe('error')
    expect(filter.category).toBe('watchdog')
  })

  it('clears all logs', () => {
    const store = useSystemLogStore.getState()
    store.addLog({
      level: 'success',
      category: 'scheduler',
      source: 'Task 1',
      message: 'Done'
    })
    expect(useSystemLogStore.getState().logs.length).toBe(1)

    store.clearLogs()
    expect(useSystemLogStore.getState().logs.length).toBe(0)
  })
})
