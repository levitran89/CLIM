export type ShellType = 'powershell' | 'pwsh' | 'cmd' | 'wsl' | 'ubuntu' | 'gitbash' | string

export interface Command {
  id: string
  name: string
  command: string
  description?: string
  category: string
  workingDirectory?: string
  shell?: ShellType
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
  shell: ShellType
  workingDirectory: string
  pid?: number
  status: 'running' | 'stopped' | 'error'
  commandId?: string
  sequenceId?: string
  sequenceStepId?: string
  isBackground?: boolean
  watchdogEnabled?: boolean
  watchdogPort?: number
  autoRestart?: boolean
  lastExecutedCommand?: string
  createdAt: number
}

export interface CreateTerminalOptions {
  shell?: ShellType
  cwd?: string
  title?: string
  commandId?: string
  sequenceId?: string
  sequenceStepId?: string
  env?: Record<string, string>
}

export interface EnvProfile {
  id: string
  name: string
  description?: string
  variables: Record<string, string>
  isDefault?: boolean
  createdAt: number
  updatedAt: number
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
  delaySeconds?: number
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
  shell?: ShellType
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

// ─── Scheduler & Webhook Types ─────────────────────────────────────

export type ScheduleType = 'interval' | 'daily' | 'startup'
export type ScheduleTargetType = 'command' | 'sequence'

export interface ScheduledTask {
  id: string
  name: string
  description?: string
  targetType: ScheduleTargetType
  targetId: string
  scheduleType: ScheduleType
  intervalMinutes?: number // Ví dụ: 5, 15, 30, 60, 120
  dailyTime?: string // Format HH:mm (VD: "02:00", "08:30")
  enabled: boolean
  lastRunAt?: number
  nextRunAt?: number
  lastStatus?: 'success' | 'failed' | 'running'
  notifyOnComplete: boolean
  webhookEnabled: boolean
  customCommand?: string // Mã lệnh thực thi riêng cho lịch tự động này (không làm đổi lệnh gốc)
  createdAt: number
}

export interface TaskExecutionLog {
  id: string
  taskId: string
  taskName: string
  targetType: ScheduleTargetType
  targetName: string
  startedAt: number
  finishedAt: number
  durationMs: number
  status: 'success' | 'failed'
  outputPreview?: string
  exitCode?: number
}

export interface WebhookConfig {
  discordUrl?: string
  telegramToken?: string
  telegramChatId?: string
}

// ─── Live Resource Monitor Types ───────────────────────────────────

export interface SystemMetrics {
  cpuUsagePercent: number
  cpuCount: number
  cpuModel: string
  totalMemoryBytes: number
  freeMemoryBytes: number
  usedMemoryBytes: number
  memoryUsagePercent: number
  uptimeSeconds: number
}

export interface ProcessMetric {
  pid: number
  name: string
  type: 'terminal' | 'port' | 'system'
  cpuPercent: number
  memoryBytes: number
  memoryMb: number
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
    readFile: (filePath: string) => Promise<string | null>
    selectFile: (options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>
    getPorts: () => Promise<PortInfo[]>
    killPort: (pid: number) => Promise<{ success: boolean; error?: string; requiresAdmin?: boolean }>
    openExternal: (url: string) => Promise<boolean>
    openLicenseStudio: () => Promise<boolean>
  }
  sequences: {
    list: () => Promise<CommandSequence[]>
    save: (sequence: CommandSequence) => Promise<void>
    delete: (id: string) => Promise<void>
  }
  profiles: {
    list: () => Promise<EnvProfile[]>
    save: (profile: EnvProfile) => Promise<void>
    delete: (id: string) => Promise<void>
  }
  scheduler: {
    listTasks: () => Promise<ScheduledTask[]>
    saveTask: (task: ScheduledTask) => Promise<void>
    deleteTask: (id: string) => Promise<void>
    toggleTask: (id: string, enabled: boolean) => Promise<void>
    runTaskNow: (id: string) => Promise<{ success: boolean; log: TaskExecutionLog }>
    listLogs: () => Promise<TaskExecutionLog[]>
    clearLogs: () => Promise<void>
    getWebhookConfig: () => Promise<WebhookConfig>
    saveWebhookConfig: (config: WebhookConfig) => Promise<void>
    testWebhook: (type: 'discord' | 'telegram', config: WebhookConfig) => Promise<{ success: boolean; error?: string }>
    sendIncidentWebhook: (type: 'discord' | 'telegram', config: WebhookConfig, incidentData: { title: string; sessionTitle: string; command: string; summary: string; logExcerpt: string; rootCause?: string; recommendedFix?: string }) => Promise<{ success: boolean; error?: string }>
    sendWatchdogAlert: (data: { sessionTitle: string; command?: string; exitCode?: number; recentOutput?: string; autoRestarted?: boolean }) => Promise<{ success: boolean; error?: string }>
  }
  monitor: {
    getSystemMetrics: () => Promise<SystemMetrics>
    getProcessMetrics: (pids: number[]) => Promise<ProcessMetric[]>
    killProcess: (pid: number) => Promise<{ success: boolean; error?: string }>
  }
  cloudSync: {
    getConfig: () => Promise<CloudSyncConfig>
    saveConfig: (config: CloudSyncConfig) => Promise<void>
    testToken: (token: string) => Promise<{ success: boolean; username?: string; error?: string }>
    uploadToGist: (
      payload: FullBackupPayload,
      options: { token: string; gistId?: string; password?: string; isPublic?: boolean }
    ) => Promise<{ success: boolean; gistId: string; htmlUrl: string; lastSyncedAt: number; error?: string }>
    downloadFromGist: (
      options: { token: string; gistId: string; password?: string }
    ) => Promise<{ success: boolean; payload?: FullBackupPayload; isEncrypted?: boolean; error?: string }>
  }
  ssh: {
    list: () => Promise<SSHHost[]>
    save: (host: SSHHost) => Promise<void>
    delete: (id: string) => Promise<void>
    testConnection: (host: string, port: number) => Promise<{ success: boolean; latencyMs?: number; error?: string }>
  }
  store: {
    get: (key: string, defaultValue?: any) => Promise<any>
    set: (key: string, value: any) => Promise<void>
  }
  docker: {
    checkAvailability: () => Promise<{ isAvailable: boolean; version?: string; error?: string }>
    listContainers: (all?: boolean) => Promise<{ success: boolean; containers: DockerContainer[]; error?: string }>
    controlContainer: (action: 'start' | 'stop' | 'restart' | 'kill' | 'rm', containerId: string) => Promise<{ success: boolean; error?: string }>
    getContainerLogs: (containerId: string, tailLines?: number) => Promise<{ success: boolean; logs: string; error?: string }>
  }
  sftp: {
    listDirectory: (hostId: string, remotePath: string) => Promise<{ success: boolean; items: SFTPItem[]; currentPath: string; error?: string }>
    readFile: (hostId: string, remotePath: string) => Promise<{ success: boolean; content: string; isBinary?: boolean; error?: string }>
    writeFile: (hostId: string, remotePath: string, content: string) => Promise<{ success: boolean; error?: string }>
    deleteItem: (hostId: string, remotePath: string, isDirectory?: boolean) => Promise<{ success: boolean; error?: string }>
    createDirectory: (hostId: string, remotePath: string) => Promise<{ success: boolean; error?: string }>
  }
  network: {
    ping: (host: string) => Promise<PingResult>
    httpCheck: (url: string) => Promise<HTTPCheckResult>
    sslCheck: (host: string, port?: number) => Promise<SSLCheckResult>
    dnsLookup: (domain: string, type?: 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME') => Promise<DNSLookupResult>
  }
}

/** Cấu hình đồng bộ Cloud Sync (GitHub Gist) */
export interface CloudSyncConfig {
  githubToken?: string
  gistId?: string
  lastSyncedAt?: number
  encrypted?: boolean
  masterPassword?: string
  autoSync?: boolean
}

/** Envelope mã hóa an toàn dữ liệu đầu cuối (AES-256-GCM + PBKDF2) */
export interface EncryptedBackupEnvelope {
  isEncrypted: true
  version: '1.0'
  salt: string
  iv: string
  authTag: string
  ciphertext: string
  createdAt: string
}

/** Toàn bộ dữ liệu sao lưu của CLIM */
export interface FullBackupPayload {
  version: string
  exportedAt: string
  commands: Command[]
  sequences: CommandSequence[]
  profiles: EnvProfile[]
  settings?: any
  tasks?: ScheduledTask[]
  sshHosts?: SSHHost[]
}

/** Gói mẫu trong Kho Lệnh Mẫu (Snippet Hub) */
export interface SnippetPack {
  id: string
  name: string
  nameEn?: string
  description: string
  descriptionEn?: string
  category: 'docker' | 'nodejs' | 'python' | 'windows' | 'git' | 'pipelines'
  icon: string
  tags: string[]
  author: string
  toolRequirements?: string
  toolRequirementsEn?: string
  commands: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>[]
  sequences?: Omit<CommandSequence, 'id' | 'createdAt' | 'updatedAt'>[]
}

// ─── Remote SSH Manager Types ───────────────────────────────────────

export interface SSHTunnel {
  id: string
  name: string
  localPort: number
  remoteHost: string
  remotePort: number
  type: 'local' | 'remote'
}

export interface SSHHost {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: 'password' | 'privateKey'
  password?: string
  privateKeyPath?: string
  passphrase?: string
  group?: string
  tags: string[]
  tunnels?: SSHTunnel[]
  lastConnectedAt?: number
  createdAt: number
  updatedAt: number
}

// ─── Terminal Session Recording & Bookmarks ──────────────────────────

export interface TerminalRecordingEvent {
  time: number // offset in ms from startedAt
  data: string
}

export interface TerminalRecording {
  id: string
  sessionId: string
  title: string
  startedAt: number
  endedAt?: number
  durationMs: number
  events: TerminalRecordingEvent[]
}

export interface LogBookmark {
  id: string
  sessionId: string
  sessionTitle: string
  timestamp: number
  note?: string
  content: string
  category?: 'error' | 'warning' | 'info' | 'critical'
}

export interface IncidentReport {
  id: string
  title: string
  createdAt: number
  sessionId?: string
  sessionTitle?: string
  command?: string
  environment?: string
  summary: string
  rootCause?: string
  recommendedFix?: string
  logExcerpt: string
  status: 'open' | 'investigating' | 'resolved'
}

// ─── Custom Keybinding Map ──────────────────────────────────────────

export interface KeybindingMap {
  openPalette: string // 'Ctrl+K'
  openAiCopilot: string // 'Ctrl+Space'
  openSettings: string // 'Ctrl+,'
  openGuide: string // 'F1'
  openSnippetHub: string // 'Ctrl+H'
  newTerminal: string // 'Ctrl+T'
  closeTerminal: string // 'Ctrl+W'
  tabProfiles: string // 'Ctrl+1'
  tabCommands: string // 'Ctrl+2'
  tabSequences: string // 'Ctrl+3'
  tabScheduler: string // 'Ctrl+4'
  tabTerminal: string // 'Ctrl+5'
  tabMonitor: string // 'Ctrl+6'
  tabSSH: string // 'Ctrl+7'
}

// ─── Docker Container Management Types ──────────────────────────────

export interface DockerContainer {
  id: string
  name: string
  image: string
  command: string
  createdAt: string
  status: string
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'dead'
  ports: string
  size?: string
}

// ─── SFTP Remote File Explorer Types ────────────────────────────────

export interface SFTPItem {
  name: string
  path: string
  type: 'file' | 'directory' | 'symlink'
  size: number
  modifyTime: number
  permissions: string
}

// ─── Network Diagnostics Suite Types ────────────────────────────────

export interface PingResult {
  host: string
  ip?: string
  timeMs: number
  status: 'success' | 'timeout' | 'error'
  error?: string
}

export interface HTTPCheckResult {
  url: string
  statusCode?: number
  statusText?: string
  timeMs: number
  success: boolean
  error?: string
}

export interface SSLCheckResult {
  host: string
  port: number
  valid: boolean
  validFrom?: string
  validTo?: string
  daysRemaining?: number
  issuer?: string
  subject?: string
  tlsVersion?: string
  error?: string
}

export interface DNSLookupResult {
  domain: string
  recordType: 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME'
  records: string[]
  timeMs: number
  error?: string
}

// ─── System Event Logs Types ────────────────────────────────────────

export type SystemLogLevel = 'info' | 'success' | 'warning' | 'error'

export type SystemLogCategory =
  | 'terminal'
  | 'watchdog'
  | 'scheduler'
  | 'ssh'
  | 'sftp'
  | 'docker'
  | 'network'
  | 'ports'
  | 'cloud'
  | 'system'
  | 'settings'

export interface SystemLogEntry {
  id: string
  timestamp: number
  level: SystemLogLevel
  category: SystemLogCategory
  source: string
  message: string
  details?: string
  metadata?: Record<string, any>
}



