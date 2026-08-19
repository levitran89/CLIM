import { create } from 'zustand'
import type { TerminalSession, CreateTerminalOptions } from '../../shared/types'
import { useProfileStore } from './profile-store'
import { logSystemEvent } from '@/lib/system-logger'

interface TerminalStore {
  sessions: TerminalSession[]
  activeSessionId: string | null
  splitMode: 'none' | 'horizontal' | 'vertical'

  // Actions
  addSession: (session: TerminalSession) => void
  removeSession: (id: string) => void
    setActiveSession: (id: string | null) => void
  updateSession: (id: string, updates: Partial<TerminalSession>) => void
  renameSession: (id: string, title: string) => void
  setSplitMode: (mode: 'none' | 'horizontal' | 'vertical') => void

  // Async actions (IPC)
  createTerminal: (options?: CreateTerminalOptions) => Promise<string>
  killTerminal: (id: string) => Promise<void>
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  splitMode: 'none',

  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id
    })),

  removeSession: (id) =>
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id)
      const newActive =
        state.activeSessionId === id
          ? newSessions[newSessions.length - 1]?.id ?? null
          : state.activeSessionId
      return { sessions: newSessions, activeSessionId: newActive }
    }),

     setActiveSession: (id: string | null) => set({ activeSessionId: id }),

  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s))
    })),

  renameSession: (id, title) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, title } : s))
    })),

  setSplitMode: (mode) => set({ splitMode: mode }),

  createTerminal: async (options = {}) => {
    const shell = options.shell || 'powershell'
    const cwd = options.cwd || ''
    const title = options.title || `Terminal ${get().sessions.length + 1}`

    const activeProfile = useProfileStore.getState().getActiveProfile()
    const env = options.env !== undefined ? options.env : activeProfile?.variables

    const result = await window.api.terminal.create({
      shell,
      cwd: cwd || undefined,
      title,
      env
    })

    const session: TerminalSession = {
      id: result.sessionId,
      title,
      shell,
      workingDirectory: cwd || 'C:\\',
      pid: result.pid,
      status: 'running',
      commandId: options.commandId,
      sequenceId: options.sequenceId,
      sequenceStepId: options.sequenceStepId,
      createdAt: Date.now()
    }

    get().addSession(session)
    logSystemEvent(
      'info',
      'terminal',
      title,
      `Khởi tạo phiên terminal ${shell.toUpperCase()} (PID: ${result.pid})`,
      `Thư mục làm việc: ${cwd || 'C:\\'}`
    )
    return result.sessionId
  },

  killTerminal: async (id) => {
    const session = get().sessions.find((s) => s.id === id)
    await window.api.terminal.kill(id)
    get().removeSession(id)
    if (session) {
      logSystemEvent(
        'warning',
        'terminal',
        session.title,
        `Đã đóng phiên terminal "${session.title}" (PID: ${session.pid || 'N/A'})`
      )
    }
  }
}))
