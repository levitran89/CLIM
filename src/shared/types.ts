export interface Command {
  id: string
  name: string
  command: string
  description?: string
  category: string
  workingDirectory?: string
  shell?: 'powershell' | 'cmd' | 'wsl'
  tags: string[]
  color?: string
  keybind?: string
  isFavorite?: boolean
  createdAt: number
  updatedAt: number
}

export interface TerminalSession {
  id: string
  title: string
  shell: 'powershell' | 'cmd' | 'wsl'
  workingDirectory: string
  pid?: number
  status: 'running' | 'stopped' | 'error'
  commandId?: string
  isBackground?: boolean
  createdAt: number
}

export interface CreateTerminalOptions {
  shell?: 'powershell' | 'cmd' | 'wsl'
  cwd?: string
  title?: string
  commandId?: string
}

export interface TerminalDataPayload {
  sessionId: string
  data: string
}

export interface TerminalResizePayload {
  sessionId: string
  cols: number
  rows: number
}

export interface TerminalExitPayload {
  sessionId: string
  exitCode: number
}

export interface PortInfo {
  port: number
  pid: number
  processName: string
  protocol: string
}

export type IpcApi = {
  terminal: {
    create: (options: CreateTerminalOptions) => Promise<{ sessionId: string; pid: number }>
    input: (sessionId: string, data: string) => void
    resize: (sessionId: string, cols: number, rows: number) => void
    kill: (sessionId: string) => Promise<{ success: boolean }>
    onData: (callback: (sessionId: string, data: string) => void) => () => void
    onExit: (callback: (sessionId: string, exitCode: number) => void) => () => void
  }
  commands: {
    list: () => Promise<Command[]>
    save: (command: Command) => Promise<void>
    delete: (id: string) => Promise<void>
    importCommands: (commands: Command[]) => Promise<void>
    exportCommands: () => Promise<Command[]>
  }
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
  system: {
    saveFile: (content: string, defaultName: string) => Promise<string | null>
    getPorts: () => Promise<PortInfo[]>
    killPort: (pid: number) => Promise<{ success: boolean; error?: string }>
  }
}
