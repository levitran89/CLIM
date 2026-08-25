import * as pty from 'node-pty'
import { BrowserWindow } from 'electron'
import * as fs from 'fs'

interface PtyInstance {
  process: pty.IPty
  sessionId: string
  lastCols?: number
  lastRows?: number
}

function resolveShell(shell: string): { exe: string; args: string[] } {
  const isWindows = process.platform === 'win32'
  if (!isWindows) {
    if (shell === 'powershell' || shell === 'cmd') {
      return { exe: '/bin/bash', args: [] }
    }
    return { exe: shell || '/bin/bash', args: [] }
  }

  const normalized = (shell || 'powershell').toLowerCase()

  switch (normalized) {
    case 'powershell':
      return { exe: 'powershell.exe', args: ['-NoLogo'] }

    case 'pwsh': {
      const pwshPaths = [
        'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
        'C:\\Program Files\\PowerShell\\7-preview\\pwsh.exe',
        'C:\\Program Files (x86)\\PowerShell\\7\\pwsh.exe',
        `${process.env.LOCALAPPDATA}\\Microsoft\\PowerShell\\7\\pwsh.exe`,
        `${process.env.LOCALAPPDATA}\\Programs\\PowerShell\\7\\pwsh.exe`,
        `${process.env.PROGRAMFILES}\\PowerShell\\7\\pwsh.exe`
      ]
      for (const p of pwshPaths) {
        if (p && fs.existsSync(p)) {
          return { exe: p, args: ['-NoLogo'] }
        }
      }
      // Thử dùng pwsh nếu có trong PATH, nếu không fallback an toàn sang powershell.exe
      return { exe: 'powershell.exe', args: ['-NoLogo'] }
    }

    case 'cmd':
      return { exe: 'cmd.exe', args: [] }

    case 'ubuntu':
      // Direct Ubuntu distro under WSL
      return { exe: 'wsl.exe', args: ['-d', 'Ubuntu'] }

    case 'wsl':
    case 'linux':
      // Default WSL Linux distro
      return { exe: 'wsl.exe', args: [] }

    case 'gitbash':
    case 'bash': {
      const gitPaths = [
        'C:\\Program Files\\Git\\bin\\bash.exe',
        'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
        `${process.env.LOCALAPPDATA}\\Programs\\Git\\bin\\bash.exe`,
        `${process.env.PROGRAMFILES}\\Git\\bin\\bash.exe`
      ]
      for (const p of gitPaths) {
        if (p && fs.existsSync(p)) {
          return { exe: p, args: ['--login', '-i'] }
        }
      }
      return { exe: 'bash.exe', args: ['--login', '-i'] }
    }

    default:
      return { exe: shell.endsWith('.exe') ? shell : `${shell}.exe`, args: [] }
  }
}

export class PtyManager {
  private instances = new Map<string, PtyInstance>()
  private window: BrowserWindow | null = null

  setWindow(win: BrowserWindow): void {
    this.window = win
  }

  create(
    sessionId: string,
    shell: string = 'powershell',
    cwd: string = process.env.USERPROFILE || 'C:\\',
    cols: number = 80,
    rows: number = 24,
    customEnv?: Record<string, string>
  ): number {
    const { exe, args } = resolveShell(shell)

    const mergedEnv: Record<string, string> = {
      ...(process.env as Record<string, string>),
      ...(customEnv || {}),
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor'
    }

    const safeCols = Math.max(cols || 80, 10)
    const safeRows = Math.max(rows || 24, 4)

    const ptyProcess = pty.spawn(exe, args, {
      name: 'xterm-256color',
      cols: safeCols,
      rows: safeRows,
      cwd,
      env: mergedEnv,
      useConpty: true
    })

    ptyProcess.onData((data: string) => {
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('terminal:data', sessionId, data)
      }
    })

    ptyProcess.onExit(({ exitCode }) => {
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('terminal:exit', sessionId, exitCode)
      }
      this.instances.delete(sessionId)
    })

    this.instances.set(sessionId, {
      process: ptyProcess,
      sessionId,
      lastCols: safeCols,
      lastRows: safeRows
    })

    return ptyProcess.pid || 0
  }

  write(sessionId: string, data: string): void {
    const instance = this.instances.get(sessionId)
    if (instance) {
      instance.process.write(data)
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    if (!cols || !rows || cols < 20 || rows < 5) return // Tránh resize thu nhỏ bất thường làm hỏng buffer ConPTY

    const instance = this.instances.get(sessionId)
    if (!instance) return

    const safeCols = Math.max(Math.floor(cols), 20)
    const safeRows = Math.max(Math.floor(rows), 5)

    if (instance.lastCols === safeCols && instance.lastRows === safeRows) {
      return
    }

    try {
      instance.process.resize(safeCols, safeRows)
      instance.lastCols = safeCols
      instance.lastRows = safeRows
    } catch {
      // Handle resize errors gracefully
    }
  }

  kill(sessionId: string): boolean {
    const instance = this.instances.get(sessionId)
    if (instance) {
      try {
        instance.process.kill()
      } catch {
        // Already dead
      }
      this.instances.delete(sessionId)
      return true
    }
    return false
  }

  killAll(): void {
    for (const [id] of this.instances) {
      this.kill(id)
    }
  }

  getActiveCount(): number {
    return this.instances.size
  }
}

export const ptyManager = new PtyManager()
