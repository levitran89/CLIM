import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSchedulerStore } from './scheduler-store'
import type { ScheduledTask, TaskExecutionLog } from '@shared/types'

const mockTask: ScheduledTask = {
  id: 'task-1',
  name: 'Backup DB',
  targetType: 'command',
  targetId: 'cmd-1',
  scheduleType: 'interval',
  intervalMinutes: 15,
  enabled: true,
  notifyOnComplete: true,
  webhookEnabled: false,
  createdAt: Date.now()
}

const mockLog: TaskExecutionLog = {
  id: 'log-1',
  taskId: 'task-1',
  taskName: 'Backup DB',
  targetType: 'command',
  targetName: 'Backup DB Cmd',
  startedAt: Date.now() - 5000,
  finishedAt: Date.now(),
  durationMs: 5000,
  status: 'success'
}

beforeEach(() => {
  vi.stubGlobal('window', {
    api: {
      scheduler: {
        listTasks: vi.fn().mockResolvedValue([mockTask]),
        saveTask: vi.fn().mockResolvedValue(undefined),
        deleteTask: vi.fn().mockResolvedValue(undefined),
        toggleTask: vi.fn().mockResolvedValue(undefined),
        runTaskNow: vi.fn().mockResolvedValue({ success: true, log: mockLog }),
        listLogs: vi.fn().mockResolvedValue([mockLog]),
        clearLogs: vi.fn().mockResolvedValue(undefined),
        getWebhookConfig: vi.fn().mockResolvedValue({ discordUrl: 'https://discord.com' }),
        saveWebhookConfig: vi.fn().mockResolvedValue(undefined),
        testWebhook: vi.fn().mockResolvedValue({ success: true })
      }
    }
  })

  useSchedulerStore.setState({
    tasks: [],
    logs: [],
    webhookConfig: {},
    loading: false,
    runningTaskIds: []
  })
})

describe('useSchedulerStore', () => {
  it('loads tasks from api', async () => {
    await useSchedulerStore.getState().loadTasks()
    expect(useSchedulerStore.getState().tasks.length).toBe(1)
    expect(useSchedulerStore.getState().tasks[0].name).toBe('Backup DB')
  })

  it('saves task and reloads list', async () => {
    await useSchedulerStore.getState().saveTask(mockTask)
    expect(window.api.scheduler.saveTask).toHaveBeenCalledWith(mockTask)
    expect(useSchedulerStore.getState().tasks.length).toBe(1)
  })

  it('deletes task by id', async () => {
    useSchedulerStore.setState({ tasks: [mockTask] })
    await useSchedulerStore.getState().deleteTask('task-1')
    expect(useSchedulerStore.getState().tasks.length).toBe(0)
  })

  it('toggles task enabled status', async () => {
    useSchedulerStore.setState({ tasks: [mockTask] })
    await useSchedulerStore.getState().toggleTask('task-1', false)
    expect(useSchedulerStore.getState().tasks[0].enabled).toBe(false)
  })

  it('runs task now and records running state', async () => {
    useSchedulerStore.setState({ tasks: [mockTask] })
    await useSchedulerStore.getState().runTaskNow('task-1')
    expect(window.api.scheduler.runTaskNow).toHaveBeenCalledWith('task-1')
  })

  it('loads logs from api', async () => {
    await useSchedulerStore.getState().loadLogs()
    expect(useSchedulerStore.getState().logs.length).toBe(1)
    expect(useSchedulerStore.getState().logs[0].status).toBe('success')
  })
})
