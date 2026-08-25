import { contextBridge, ipcRenderer } from 'electron'
import type { IpcApi, CreateTerminalOptions, Command, CommandSequence, EnvProfile } from '../shared/types'

const api: IpcApi = {
  terminal: {
    create: (options: CreateTerminalOptions) =>
      ipcRenderer.invoke('terminal:create', options),

    input: (sessionId: string, data: string) =>
      ipcRenderer.send('terminal:input', sessionId, data),

    resize: (sessionId: string, cols: number, rows: number) =>
      ipcRenderer.send('terminal:resize', sessionId, cols, rows),

    kill: (sessionId: string) =>
      ipcRenderer.invoke('terminal:kill', sessionId),

    onData: (callback: (sessionId: string, data: string) => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        sessionId: string,
        data: string
      ): void => {
        callback(sessionId, data)
      }
      ipcRenderer.on('terminal:data', handler)
      return () => {
        ipcRenderer.removeListener('terminal:data', handler)
      }
    },

    onExit: (callback: (sessionId: string, exitCode: number) => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        sessionId: string,
        exitCode: number
      ): void => {
        callback(sessionId, exitCode)
      }
      ipcRenderer.on('terminal:exit', handler)
      return () => {
        ipcRenderer.removeListener('terminal:exit', handler)
      }
    }
  },

  commands: {
    list: () => ipcRenderer.invoke('command:list'),
    save: (command: Command) => ipcRenderer.invoke('command:save', command),
    delete: (id: string) => ipcRenderer.invoke('command:delete', id),
    importCommands: (commands: Command[]) =>
      ipcRenderer.invoke('command:import', commands),
    exportCommands: () => ipcRenderer.invoke('command:export')
  },

  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },

  system: {
    saveFile: (content: string, defaultName: string) =>
      ipcRenderer.invoke('system:saveFile', { content, defaultName }),
    readFile: (filePath: string) =>
      ipcRenderer.invoke('system:readFile', filePath),
    selectFile: (options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) =>
      ipcRenderer.invoke('system:selectFile', options),
    getPorts: () => ipcRenderer.invoke('system:getPorts'),
    killPort: (pid: number) => ipcRenderer.invoke('system:killPort', pid),
    openExternal: (url: string) => ipcRenderer.invoke('system:openExternal', url),
    openLicenseStudio: () => ipcRenderer.invoke('system:openLicenseStudio')
  },

  sequences: {
    list: () => ipcRenderer.invoke('sequence:list'),
    save: (sequence: CommandSequence) => ipcRenderer.invoke('sequence:save', sequence),
    delete: (id: string) => ipcRenderer.invoke('sequence:delete', id)
  },

  profiles: {
    list: () => ipcRenderer.invoke('profile:list'),
    save: (profile: EnvProfile) => ipcRenderer.invoke('profile:save', profile),
    delete: (id: string) => ipcRenderer.invoke('profile:delete', id)
  },

  scheduler: {
    listTasks: () => ipcRenderer.invoke('scheduler:listTasks'),
    saveTask: (task) => ipcRenderer.invoke('scheduler:saveTask', task),
    deleteTask: (id) => ipcRenderer.invoke('scheduler:deleteTask', id),
    toggleTask: (id, enabled) => ipcRenderer.invoke('scheduler:toggleTask', id, enabled),
    runTaskNow: (id) => ipcRenderer.invoke('scheduler:runTaskNow', id),
    listLogs: () => ipcRenderer.invoke('scheduler:listLogs'),
    clearLogs: () => ipcRenderer.invoke('scheduler:clearLogs'),
    getWebhookConfig: () => ipcRenderer.invoke('scheduler:getWebhookConfig'),
    saveWebhookConfig: (config) => ipcRenderer.invoke('scheduler:saveWebhookConfig', config),
    testWebhook: (type, config) => ipcRenderer.invoke('scheduler:testWebhook', type, config),
    sendIncidentWebhook: (type, config, incidentData) => ipcRenderer.invoke('scheduler:sendIncidentWebhook', type, config, incidentData),
    sendWatchdogAlert: (data) => ipcRenderer.invoke('scheduler:sendWatchdogAlert', data)
  },

  monitor: {
    getSystemMetrics: () => ipcRenderer.invoke('monitor:getSystemMetrics'),
    getProcessMetrics: (pids) => ipcRenderer.invoke('monitor:getProcessMetrics', pids),
    killProcess: (pid) => ipcRenderer.invoke('monitor:killProcess', pid)
  },

  cloudSync: {
    getConfig: () => ipcRenderer.invoke('cloudSync:getConfig'),
    saveConfig: (config) => ipcRenderer.invoke('cloudSync:saveConfig', config),
    testToken: (token) => ipcRenderer.invoke('cloudSync:testToken', token),
    uploadToGist: (payload, options) => ipcRenderer.invoke('cloudSync:uploadToGist', payload, options),
    downloadFromGist: (options) => ipcRenderer.invoke('cloudSync:downloadFromGist', options)
  },

  ssh: {
    list: () => ipcRenderer.invoke('ssh:list'),
    save: (host) => ipcRenderer.invoke('ssh:save', host),
    delete: (id) => ipcRenderer.invoke('ssh:delete', id),
    testConnection: (host, port) => ipcRenderer.invoke('ssh:testConnection', host, port)
  },

  store: {
    get: (key, defaultValue) => ipcRenderer.invoke('store:get', key, defaultValue),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value)
  },

  docker: {
    checkAvailability: () => ipcRenderer.invoke('docker:checkAvailability'),
    listContainers: (all) => ipcRenderer.invoke('docker:listContainers', all),
    controlContainer: (action, containerId) => ipcRenderer.invoke('docker:controlContainer', action, containerId),
    getContainerLogs: (containerId, tailLines) => ipcRenderer.invoke('docker:getContainerLogs', containerId, tailLines)
  },

  sftp: {
    listDirectory: (hostId, remotePath) => ipcRenderer.invoke('sftp:listDirectory', hostId, remotePath),
    readFile: (hostId, remotePath) => ipcRenderer.invoke('sftp:readFile', hostId, remotePath),
    writeFile: (hostId, remotePath, content) => ipcRenderer.invoke('sftp:writeFile', hostId, remotePath, content),
    deleteItem: (hostId, remotePath, isDirectory) => ipcRenderer.invoke('sftp:deleteItem', hostId, remotePath, isDirectory),
    createDirectory: (hostId, remotePath) => ipcRenderer.invoke('sftp:createDirectory', hostId, remotePath)
  },

  network: {
    ping: (host) => ipcRenderer.invoke('network:ping', host),
    httpCheck: (url) => ipcRenderer.invoke('network:httpCheck', url),
    sslCheck: (host, port) => ipcRenderer.invoke('network:sslCheck', host, port),
    dnsLookup: (domain, type) => ipcRenderer.invoke('network:dnsLookup', domain, type)
  }
}

contextBridge.exposeInMainWorld('api', api)
