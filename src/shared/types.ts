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
  sequenceId?: string
  sequenceStepId?: string
  isBackground?: boolean
  createdAt: number
}

export interface CreateTerminalOptions {
  shell?: 'powershell' | 'cmd' | 'wsl'
  cwd?: string
  title?: string
  commandId?: string
  sequenceId?: string
  sequenceStepId?: string
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

export interface SequenceStep {
  id: string
  name?: string
  command: string
}

/** Cách chạy khi nhấn Play trên dãy lệnh */
export type SequenceRunMode = 'none' | 'first' | 'all'

export interface CommandSequence {
  id: string
  name: string
  description?: string
  category: string
  steps: SequenceStep[]
  workingDirectory?: string
  shell?: 'powershell' | 'cmd' | 'wsl'
  tags: string[]
  /** none = không chạy; first = chạy lệnh đầu; all = chạy tất cả (mỗi lệnh 1 terminal) */
  runMode?: SequenceRunMode
  createdAt: number
  updatedAt: number
}

/** Trạng thái runtime khi đang chạy một dãy lệnh */
export interface SequenceActiveRun {
  sequenceId: string
  runMode: SequenceRunMode
  /** Terminal dùng chung (mode none / first) */
  sharedSessionId: string | null
  /** Terminal theo từng bước (mode all) */
  stepSessionIds: Record<string, string>
  completedStepIds: string[]
  runningStepIds: string[]
  activeStepId: string | null
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
    killPort: (pid: number) => Promise<{ success: boolean; error?: string; requiresAdmin?: boolean }>
  }
  sequences: {
    list: () => Promise<CommandSequence[]>
    save: (sequence: CommandSequence) => Promise<void>
    delete: (id: string) => Promise<void>
  }
}
