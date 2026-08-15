import { ipcMain, dialog, BrowserWindow } from 'electron'
import Store from 'electron-store'
import { writeFile } from 'fs/promises'
import { ptyManager } from './pty-manager'
import { portManager } from './port-manager'
import type { Command, CommandSequence, CreateTerminalOptions } from '../shared/types'

const store = new Store<{ commands: Command[], sequences: CommandSequence[] }>({
  defaults: {
    commands: [],
    sequences: []
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
        options.cwd || process.env.USERPROFILE || 'C:\\'
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

  ipcMain.handle('system:getPorts', async () => {
    return await portManager.getPorts()
  })

    ipcMain.handle('system:killPort', async (_event, pid: number) => {
    return await portManager.killPort(pid)
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
}
