import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  CommandSequence,
  SequenceStep,
  SequenceRunMode,
  SequenceActiveRun
} from '../../shared/types'
import { useTerminalStore } from './terminal-store'

export type SequenceInput = Omit<CommandSequence, 'id' | 'createdAt' | 'updatedAt'>

interface SequenceState {
  sequences: CommandSequence[]
  isLoading: boolean
  activeRun: SequenceActiveRun | null

  loadSequences: () => Promise<void>
  addSequence: (data: SequenceInput) => Promise<CommandSequence>
  updateSequence: (id: string, data: Partial<CommandSequence>) => Promise<void>
  deleteSequence: (id: string) => Promise<void>

  /** Bắt đầu chạy dãy lệnh theo runMode đã lưu */
  startSequence: (sequence: CommandSequence) => Promise<void>
  /** Chạy một bước cụ thể (mode none/first dùng chung 1 terminal) */
  runStep: (stepId: string, overrideCommand?: string) => Promise<void>
  /** Dừng/pause một bước đang chạy */
  pauseStep: (stepId: string) => Promise<void>
  /** Focus terminal tương ứng bước (đặc biệt mode all) */
  focusStep: (stepId: string) => void
  /** Kết thúc quy trình — dừng các bước quy trình nhưng giữ nguyên cửa sổ terminal */
  finishSequence: () => void
  /** Đóng quy trình — dừng toàn bộ process và đóng tất cả terminal liên quan */
  stopSequence: () => Promise<void>
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/** Chờ PTY sẵn sàng trước khi gửi lệnh (0 khi chạy test) */
const PTY_READY_MS =
  typeof process !== 'undefined' && process.env.VITEST ? 0 : 400

const sendCommand = async (sessionId: string, command: string): Promise<void> => {
  if (PTY_READY_MS > 0) await delay(PTY_READY_MS)
  window.api.terminal.input(sessionId, command + '\r\n')
}

export const useSequenceStore = create<SequenceState>((set, get) => ({
  sequences: [],
  isLoading: false,
  activeRun: null,

  loadSequences: async () => {
    set({ isLoading: true })
    try {
      const sequences = await window.api.sequences.list()
      set({ sequences })
    } finally {
      set({ isLoading: false })
    }
  },

  addSequence: async (data) => {
    const sequence: CommandSequence = {
      id: uuidv4(),
      name: data.name,
      category: data.category,
      steps: data.steps,
      description: data.description,
      workingDirectory: data.workingDirectory,
      shell: data.shell,
      tags: data.tags || [],
      runMode: data.runMode || 'first',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await window.api.sequences.save(sequence)
    set((state) => ({ sequences: [...state.sequences, sequence] }))
    return sequence
  },

  updateSequence: async (id, data) => {
    const sequences = get().sequences
    const existing = sequences.find((s) => s.id === id)
    if (!existing) return

    const updated = { ...existing, ...data, updatedAt: Date.now() }
    await window.api.sequences.save(updated)
    set((state) => ({
      sequences: state.sequences.map((s) => (s.id === id ? updated : s))
    }))
  },

  deleteSequence: async (id) => {
    await window.api.sequences.delete(id)
    set((state) => ({
      sequences: state.sequences.filter((s) => s.id !== id),
      activeRun: state.activeRun?.sequenceId === id ? null : state.activeRun
    }))
  },

  startSequence: async (sequence) => {
    if (sequence.steps.length === 0) return

    const runMode: SequenceRunMode = sequence.runMode || 'first'
    const { createTerminal, setActiveSession } = useTerminalStore.getState()

    if (runMode === 'all') {
      const stepSessionIds: Record<string, string> = {}
      const runningStepIds: string[] = []

      for (let i = 0; i < sequence.steps.length; i++) {
        const step = sequence.steps[i]
        const sessionId = await createTerminal({
          shell: sequence.shell || 'powershell',
          cwd: sequence.workingDirectory,
          title: `${sequence.name} · ${step.name || `Bước ${i + 1}`}`,
          sequenceId: sequence.id,
          sequenceStepId: step.id
        })
        stepSessionIds[step.id] = sessionId
        runningStepIds.push(step.id)
        await sendCommand(sessionId, step.command)
      }

      const firstStep = sequence.steps[0]
      setActiveSession(stepSessionIds[firstStep.id])

      set({
        activeRun: {
          sequenceId: sequence.id,
          runMode,
          sharedSessionId: null,
          stepSessionIds,
          completedStepIds: [],
          runningStepIds,
          activeStepId: firstStep.id
        }
      })
      return
    }

    // mode none | first → cùng 1 cửa sổ terminal
    const sharedSessionId = await createTerminal({
      shell: sequence.shell || 'powershell',
      cwd: sequence.workingDirectory,
      title: sequence.name,
      sequenceId: sequence.id
    })
    setActiveSession(sharedSessionId)

    const firstStep = sequence.steps[0]
    if (runMode === 'first') {
      await sendCommand(sharedSessionId, firstStep.command)
      set({
        activeRun: {
          sequenceId: sequence.id,
          runMode,
          sharedSessionId,
          stepSessionIds: {},
          completedStepIds: [],
          runningStepIds: [firstStep.id],
          activeStepId: firstStep.id
        }
      })
    } else {
      set({
        activeRun: {
          sequenceId: sequence.id,
          runMode,
          sharedSessionId,
          stepSessionIds: {},
          completedStepIds: [],
          runningStepIds: [],
          activeStepId: null
        }
      })
    }
  },

  runStep: async (stepId, overrideCommand) => {
    const { activeRun, sequences } = get()
    if (!activeRun) return

    const sequence = sequences.find((s) => s.id === activeRun.sequenceId)
    if (!sequence) return

    const step = sequence.steps.find((s) => s.id === stepId)
    if (!step) return

    const stepIndex = sequence.steps.findIndex((s) => s.id === stepId)
    const { createTerminal, setActiveSession } = useTerminalStore.getState()

    if (activeRun.runMode === 'all') {
      let sessionId = activeRun.stepSessionIds[stepId]
      if (!sessionId) {
        sessionId = await createTerminal({
          shell: sequence.shell || 'powershell',
          cwd: sequence.workingDirectory,
          title: `${sequence.name} · ${step.name || `Bước ${stepIndex + 1}`}`,
          sequenceId: sequence.id,
          sequenceStepId: step.id
        })
      }
      setActiveSession(sessionId)
      const cmdToRun = overrideCommand || step.command
      await sendCommand(sessionId, cmdToRun)

      set({
        activeRun: {
          ...activeRun,
          stepSessionIds: { ...activeRun.stepSessionIds, [stepId]: sessionId },
          completedStepIds: activeRun.completedStepIds.filter((id) => id !== stepId),
          runningStepIds: [
            ...activeRun.runningStepIds.filter((id) => id !== stepId),
            stepId
          ],
          activeStepId: stepId
        }
      })
      return
    }

    // none / first: cùng 1 terminal
    let sessionId = activeRun.sharedSessionId
    if (!sessionId) {
      sessionId = await createTerminal({
        shell: sequence.shell || 'powershell',
        cwd: sequence.workingDirectory,
        title: sequence.name,
        sequenceId: sequence.id
      })
    }

    setActiveSession(sessionId)

    // Đánh dấu các bước đang chạy trước đó là hoàn thành khi chuyển sang bước mới
    const prevRunning = activeRun.runningStepIds
    const completedStepIds = [
      ...new Set([
        ...activeRun.completedStepIds,
        ...prevRunning.filter((id) => id !== stepId)
      ])
    ]

    const cmdToRun2 = overrideCommand || step.command
    await sendCommand(sessionId, cmdToRun2)

    set({
      activeRun: {
        ...activeRun,
        sharedSessionId: sessionId,
        completedStepIds,
        runningStepIds: [stepId],
        activeStepId: stepId
      }
    })
  },

  focusStep: (stepId) => {
    const { activeRun } = get()
    if (!activeRun) return

    const { setActiveSession } = useTerminalStore.getState()

    if (activeRun.runMode === 'all') {
      const sessionId = activeRun.stepSessionIds[stepId]
      if (sessionId) setActiveSession(sessionId)
    } else if (activeRun.sharedSessionId) {
      setActiveSession(activeRun.sharedSessionId)
    }

    set({
      activeRun: { ...activeRun, activeStepId: stepId }
    })
  },

  pauseStep: async (stepId) => {
    const { activeRun } = get()
    if (!activeRun || !activeRun.runningStepIds.includes(stepId)) return

    const { killTerminal, setActiveSession } = useTerminalStore.getState()

    if (activeRun.runMode === 'all') {
      const sessionId = activeRun.stepSessionIds[stepId]
      if (sessionId) {
        try {
          await killTerminal(sessionId)
        } catch {
          // session có thể đã đóng
        }
      }
      const { [stepId]: _removed, ...restSessions } = activeRun.stepSessionIds
      set({
        activeRun: {
          ...activeRun,
          stepSessionIds: restSessions,
          runningStepIds: activeRun.runningStepIds.filter((id) => id !== stepId),
          completedStepIds: activeRun.completedStepIds.includes(stepId)
            ? activeRun.completedStepIds
            : [...activeRun.completedStepIds, stepId],
          activeStepId:
            activeRun.activeStepId === stepId ? null : activeRun.activeStepId
        }
      })
      return
    }

    // none / first: gửi Ctrl+C vào terminal chung
    if (activeRun.sharedSessionId) {
      window.api.terminal.input(activeRun.sharedSessionId, '\x03')
      setActiveSession(activeRun.sharedSessionId)
    }

    set({
      activeRun: {
        ...activeRun,
        runningStepIds: activeRun.runningStepIds.filter((id) => id !== stepId),
        completedStepIds: activeRun.completedStepIds.includes(stepId)
          ? activeRun.completedStepIds
          : [...activeRun.completedStepIds, stepId]
      }
    })
  },

  finishSequence: () => {
    set({ activeRun: null })
  },

  stopSequence: async () => {
    const { activeRun } = get()
    if (!activeRun) return

    const { killTerminal } = useTerminalStore.getState()
    const sessionIds = new Set<string>()

    if (activeRun.sharedSessionId) {
      sessionIds.add(activeRun.sharedSessionId)
    }
    for (const id of Object.values(activeRun.stepSessionIds)) {
      sessionIds.add(id)
    }

    // Dừng process đang chạy: Ctrl+C trước, rồi đóng terminal của dãy
    for (const sessionId of sessionIds) {
      try {
        window.api.terminal.input(sessionId, '\x03')
      } catch {
        // ignore
      }
    }

    await Promise.all(
      [...sessionIds].map(async (sessionId) => {
        try {
          await killTerminal(sessionId)
        } catch {
          // session có thể đã đóng
        }
      })
    )

    set({ activeRun: null })
  }
}))
