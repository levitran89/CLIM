import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import path from 'path'
import Store from 'electron-store'
import { writeFile, readFile } from 'fs/promises'
import { ptyManager } from './pty-manager'
import { portManager } from './port-manager'
import { schedulerManager } from './scheduler-manager'
import { resourceMonitor } from './resource-monitor'
import { cloudSyncManager } from './cloud-sync'
import { SSHService } from './services/ssh-service'
import { dockerService } from './services/docker-service'
import { sftpService } from './services/sftp-service'
import { networkService } from './services/network-service'
import type {
  Command,
  CommandSequence,
  CreateTerminalOptions,
  EnvProfile,
  ScheduledTask,
  WebhookConfig,
  CloudSyncConfig,
  FullBackupPayload,
  SSHHost
} from '../shared/types'

const store = new Store<{ commands: Command[]; sequences: CommandSequence[]; profiles: EnvProfile[] }>({
  defaults: {
    commands: [],
    sequences: [],
    profiles: []
  }
})

export function registerIpcHandlers(): void {
  // ─── Terminal Channels ───────────────────────────────────────

  ipcMain.handle(
    'terminal:create',
    async (_event, options: CreateTerminalOptions) => {
      const sessionId = crypto.randomUUID()
      const pid = ptyManager.create(
        sessionId,
        options.shell || 'powershell',
        options.cwd || process.env.USERPROFILE || 'C:\\',
        80,
        24,
        options.env
      )
      return { sessionId, pid }
    }
  )

  ipcMain.on('terminal:input', (_event, sessionId: string, data: string) => {
    ptyManager.write(sessionId, data)
  })

  ipcMain.on(
    'terminal:resize',
    (_event, sessionId: string, cols: number, rows: number) => {
      ptyManager.resize(sessionId, cols, rows)
    }
  )

  ipcMain.handle('terminal:kill', async (_event, sessionId: string) => {
    const success = ptyManager.kill(sessionId)
    return { success }
  })

  // ─── Command Channels ───────────────────────────────────────

  ipcMain.handle('command:list', async () => {
    return store.get('commands', [])
  })

  ipcMain.handle('command:save', async (_event, command: Command) => {
    const commands = store.get('commands', [])
    const index = commands.findIndex((c: Command) => c.id === command.id)
    if (index >= 0) {
      commands[index] = command
    } else {
      commands.push(command)
    }
    store.set('commands', commands)
  })

  ipcMain.handle('command:delete', async (_event, id: string) => {
    const commands = store.get('commands', [])
    store.set(
      'commands',
      commands.filter((c: Command) => c.id !== id)
    )
  })

  ipcMain.handle('command:import', async (_event, newCommands: Command[]) => {
    const commands = store.get('commands', [])
    const merged = [...commands]
    for (const cmd of newCommands) {
      const index = merged.findIndex((c: Command) => c.id === cmd.id)
      if (index >= 0) {
        merged[index] = cmd
      } else {
        merged.push(cmd)
      }
    }
    store.set('commands', merged)
  })

  ipcMain.handle('command:export', async () => {
    return store.get('commands', [])
  })

  // ─── Window Channels ────────────────────────────────────────

  ipcMain.on('window:minimize', (event) => {
    const { BrowserWindow } = require('electron')
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const { BrowserWindow } = require('electron')
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    const { BrowserWindow } = require('electron')
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  // ─── System Channels ────────────────────────────────────────

  ipcMain.handle('system:saveFile', async (event, { content, defaultName }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    const result = await dialog.showSaveDialog(win, {
      title: 'Lưu file script',
      defaultPath: defaultName,
      filters: [
        { name: 'Scripts', extensions: ['bat', 'ps1', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePath) {
      await writeFile(result.filePath, content, 'utf-8')
      return result.filePath
    }
    return null
  })

  ipcMain.handle('system:readFile', async (_event, filePath: string) => {
    try {
      const raw = filePath.replace(/^"|"$/g, '').trim()
      const content = await readFile(raw, 'utf-8')
      return content
    } catch {
      return null
    }
  })

  ipcMain.handle('system:selectFile', async (event, options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      title: options?.title || 'Chọn file',
      properties: ['openFile'],
      filters: options?.filters || [
        { name: 'Private Keys', extensions: ['pem', 'ppk', 'key', 'id_rsa', 'id_ed25519', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('system:getPorts', async () => {
    return await portManager.getPorts()
  })

    ipcMain.handle('system:killPort', async (_event, pid: number) => {
    return await portManager.killPort(pid)
  })

  ipcMain.handle('system:openExternal', async (_event, url: string) => {
    try {
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('file://'))) {
        await shell.openExternal(url)
        return true
      }
    } catch (err) {
      console.error('Failed to open external URL:', err)
    }
    return false
  })

  ipcMain.handle('system:openLicenseStudio', async () => {
    try {
      const studioPath = path.resolve(process.cwd(), 'tools/tmt-license-studio/index.html')
      await shell.openPath(studioPath)
      return true
    } catch (err) {
      console.error('Failed to open License Studio:', err)
      return false
    }
  })

  // ─── Sequence Channels ────────────────────────────────────────

  ipcMain.handle('sequence:list', async () => {
    return store.get('sequences', [])
  })

  ipcMain.handle('sequence:save', async (_event, sequence: CommandSequence) => {
    const sequences = store.get('sequences', [])
    const index = sequences.findIndex((s: CommandSequence) => s.id === sequence.id)
    if (index >= 0) {
      sequences[index] = sequence
    } else {
      sequences.push(sequence)
    }
    store.set('sequences', sequences)
  })

  ipcMain.handle('sequence:delete', async (_event, id: string) => {
    const sequences = store.get('sequences', [])
    store.set(
      'sequences',
      sequences.filter((s: CommandSequence) => s.id !== id)
    )
  })

  // ─── Profile Channels ─────────────────────────────────────────

  ipcMain.handle('profile:list', async () => {
    return store.get('profiles', [])
  })

  ipcMain.handle('profile:save', async (_event, profile: EnvProfile) => {
    const profiles = store.get('profiles', [])
    // If setting as default, unset previous default
    if (profile.isDefault) {
      profiles.forEach((p) => {
        if (p.id !== profile.id) p.isDefault = false
      })
    }
    const index = profiles.findIndex((p: EnvProfile) => p.id === profile.id)
    if (index >= 0) {
      profiles[index] = profile
    } else {
      profiles.push(profile)
    }
    store.set('profiles', profiles)
  })

  ipcMain.handle('profile:delete', async (_event, id: string) => {
    const profiles = store.get('profiles', [])
    store.set(
      'profiles',
      profiles.filter((p: EnvProfile) => p.id !== id)
    )
  })

  // ─── Scheduler Channels ───────────────────────────────────────

  ipcMain.handle('scheduler:listTasks', async () => {
    return schedulerManager.getTasks()
  })

  ipcMain.handle('scheduler:saveTask', async (_event, task: ScheduledTask) => {
    schedulerManager.saveTask(task)
  })

  ipcMain.handle('scheduler:deleteTask', async (_event, id: string) => {
    schedulerManager.deleteTask(id)
  })

  ipcMain.handle('scheduler:toggleTask', async (_event, id: string, enabled: boolean) => {
    schedulerManager.toggleTask(id, enabled)
  })

  ipcMain.handle('scheduler:runTaskNow', async (_event, id: string) => {
    const tasks = schedulerManager.getTasks()
    const task = tasks.find((t) => t.id === id)
    if (!task) {
      throw new Error('Tác vụ không tồn tại')
    }
    const commands = store.get('commands', [])
    const sequences = store.get('sequences', [])
    return await schedulerManager.executeTask(task, commands, sequences)
  })

  ipcMain.handle('scheduler:listLogs', async () => {
    return schedulerManager.getLogs()
  })

  ipcMain.handle('scheduler:clearLogs', async () => {
    schedulerManager.clearLogs()
  })

  ipcMain.handle('scheduler:getWebhookConfig', async () => {
    return schedulerManager.getWebhookConfig()
  })

  ipcMain.handle('scheduler:saveWebhookConfig', async (_event, config: WebhookConfig) => {
    schedulerManager.saveWebhookConfig(config)
  })

  ipcMain.handle('scheduler:testWebhook', async (_event, type: 'discord' | 'telegram', config: WebhookConfig) => {
    return await schedulerManager.testWebhook(type, config)
  })

  ipcMain.handle('scheduler:sendIncidentWebhook', async (_event, type: 'discord' | 'telegram', config: WebhookConfig, incidentData: any) => {
    return await schedulerManager.sendIncidentWebhook(type, config, incidentData)
  })

  ipcMain.handle('scheduler:sendWatchdogAlert', async (_event, data: any) => {
    return await schedulerManager.sendWatchdogAlert(data)
  })

  // ─── Monitor Channels ─────────────────────────────────────────

  ipcMain.handle('monitor:getSystemMetrics', async () => {
    return await resourceMonitor.getSystemMetrics()
  })

  ipcMain.handle('monitor:getProcessMetrics', async (_event, pids: number[]) => {
    return await resourceMonitor.getProcessMetrics(pids)
  })

  ipcMain.handle('monitor:killProcess', async (_event, pid: number) => {
    return await resourceMonitor.killProcess(pid)
  })

  // ─── Cloud Sync Channels ──────────────────────────────────────

  ipcMain.handle('cloudSync:getConfig', async () => {
    return cloudSyncManager.getConfig()
  })

  ipcMain.handle('cloudSync:saveConfig', async (_event, config: CloudSyncConfig) => {
    cloudSyncManager.saveConfig(config)
  })

  ipcMain.handle('cloudSync:testToken', async (_event, token: string) => {
    return await cloudSyncManager.testToken(token)
  })

  ipcMain.handle(
    'cloudSync:uploadToGist',
    async (
      _event,
      payload: FullBackupPayload,
      options: { token: string; gistId?: string; password?: string; isPublic?: boolean }
    ) => {
      return await cloudSyncManager.uploadToGist(payload, options)
    }
  )

  ipcMain.handle(
    'cloudSync:downloadFromGist',
    async (_event, options: { token: string; gistId: string; password?: string }) => {
      return await cloudSyncManager.downloadFromGist(options)
    }
  )

  // ─── Remote SSH Manager Channels ──────────────────────────────

  ipcMain.handle('ssh:list', async () => {
    return SSHService.getHosts()
  })

  ipcMain.handle('ssh:save', async (_event, host: SSHHost) => {
    SSHService.saveHost(host)
  })

  ipcMain.handle('ssh:delete', async (_event, id: string) => {
    SSHService.deleteHost(id)
  })

  ipcMain.handle('ssh:testConnection', async (_event, host: string, port: number) => {
    return await SSHService.testConnection(host, port)
  })

  // ─── Key-Value Store Channels ─────────────────────────────────

  ipcMain.handle('store:get', async (_event, key: string, defaultValue?: any) => {
    return store.get(key as any, defaultValue)
  })

  ipcMain.handle('store:set', async (_event, key: string, value: any) => {
    store.set(key as any, value)
  })

  // ─── Docker Container Channels ────────────────────────────────

  ipcMain.handle('docker:checkAvailability', async () => {
    return await dockerService.checkAvailability()
  })

  ipcMain.handle('docker:listContainers', async (_event, all = true) => {
    return await dockerService.listContainers(all)
  })

  ipcMain.handle('docker:controlContainer', async (_event, action, containerId) => {
    return await dockerService.controlContainer(action, containerId)
  })

  ipcMain.handle('docker:getContainerLogs', async (_event, containerId, tailLines = 150) => {
    return await dockerService.getContainerLogs(containerId, tailLines)
  })

  // ─── SFTP Remote File Channels ────────────────────────────────

  ipcMain.handle('sftp:listDirectory', async (_event, hostId: string, remotePath: string) => {
    return await sftpService.listDirectory(hostId, remotePath)
  })

  ipcMain.handle('sftp:readFile', async (_event, hostId: string, remotePath: string) => {
    return await sftpService.readFile(hostId, remotePath)
  })

  ipcMain.handle('sftp:writeFile', async (_event, hostId: string, remotePath: string, content: string) => {
    return await sftpService.writeFile(hostId, remotePath, content)
  })

  ipcMain.handle('sftp:deleteItem', async (_event, hostId: string, remotePath: string) => {
    return await sftpService.deleteItem(hostId, remotePath)
  })

  ipcMain.handle('sftp:createDirectory', async (_event, hostId: string, remotePath: string) => {
    return await sftpService.createDirectory(hostId, remotePath)
  })

  // ─── Network Diagnostics Channels ─────────────────────────────

  ipcMain.handle('network:ping', async (_event, host: string) => {
    return await networkService.ping(host)
  })

  ipcMain.handle('network:httpCheck', async (_event, url: string) => {
    return await networkService.httpCheck(url)
  })

  ipcMain.handle('network:sslCheck', async (_event, host: string, port = 443) => {
    return await networkService.sslCheck(host, port)
  })

  ipcMain.handle('network:dnsLookup', async (_event, domain: string, type = 'A') => {
    return await networkService.dnsLookup(domain, type)
  })
}
