import * as pty from 'node-pty'
import { BrowserWindow } from 'electron'

interface PtyInstance {
  process: pty.IPty
  sessionId: string
}

const shellMap: Record<string, string> = {
  powershell: 'powershell.exe',
  cmd: 'cmd.exe',
  wsl: 'wsl.exe'
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
    const shellExe = shellMap[shell] || 'powershell.exe'

    const mergedEnv: Record<string, string> = {
      ...(process.env as Record<string, string>),
      ...(customEnv || {})
    }

    const ptyProcess = pty.spawn(shellExe, [], {
      name: 'xterm-color',
      cols,
      rows,
      cwd,
      env: mergedEnv
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

    this.instances.set(sessionId, { process: ptyProcess, sessionId })

    return ptyProcess.pid || 0
  }

  write(sessionId: string, data: string): void {
    const instance = this.instances.get(sessionId)
    if (instance) {
      instance.process.write(data)
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const instance = this.instances.get(sessionId)
    if (instance) {
      try {
        instance.process.resize(cols, rows)
      } catch {
        // Handle resize errors gracefully
      }
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
