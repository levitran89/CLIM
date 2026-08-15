import { contextBridge, ipcRenderer } from 'electron'
import type { IpcApi, CreateTerminalOptions, Command, CommandSequence } from '../shared/types'

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
    getPorts: () => ipcRenderer.invoke('system:getPorts'),
    killPort: (pid: number) => ipcRenderer.invoke('system:killPort', pid)
  },

  sequences: {
    list: () => ipcRenderer.invoke('sequence:list'),
    save: (sequence: CommandSequence) => ipcRenderer.invoke('sequence:save', sequence),
    delete: (id: string) => ipcRenderer.invoke('sequence:delete', id)
  }
}

contextBridge.exposeInMainWorld('api', api)
