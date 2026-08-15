import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSequenceStore } from './sequence-store'
import type { CommandSequence, SequenceStep } from '../../shared/types'

const mockCreate = vi.fn()
const mockInput = vi.fn()
const mockSetActiveSession = vi.fn()
const mockKillTerminal = vi.fn()

vi.mock('./terminal-store', () => ({
  useTerminalStore: {
    getState: () => ({
      createTerminal: mockCreate,
      setActiveSession: mockSetActiveSession,
      killTerminal: mockKillTerminal
    })
  }
}))

const mockSequences = {
  list: vi.fn(),
  save: vi.fn(),
  delete: vi.fn()
}
;((window as unknown as { api: { sequences: typeof mockSequences; terminal: { input: typeof mockInput } } }).api = {
  sequences: mockSequences,
  terminal: { input: mockInput }
})

const step1: SequenceStep = { id: 'step-1', name: 'Hello', command: 'echo hello' }
const step2: SequenceStep = { id: 'step-2', name: 'World', command: 'echo world' }

const testSequences: CommandSequence[] = [
  {
    id: 'seq-1',
    name: 'Test Sequence 1',
    category: 'General',
    steps: [step1, step2],
    tags: [],
    runMode: 'first',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
]

describe('sequence-store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue('session-1')
    useSequenceStore.setState({
      sequences: [],
      isLoading: false,
      activeRun: null
    })
  })

  it('loads sequences from API', async () => {
    mockSequences.list.mockResolvedValue(testSequences)

    const { result } = renderHook(() => useSequenceStore())

    await act(async () => {
      await result.current.loadSequences()
    })

    expect(result.current.sequences).toHaveLength(1)
    expect(result.current.sequences[0].name).toBe('Test Sequence 1')
  })

  it('adds a new sequence with runMode', async () => {
    mockSequences.save.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSequenceStore())

    await act(async () => {
      await result.current.addSequence({
        name: 'New Sequence',
        category: 'General',
        steps: [step1],
        tags: [],
        runMode: 'all'
      })
    })

    expect(result.current.sequences).toHaveLength(1)
    expect(result.current.sequences[0].name).toBe('New Sequence')
    expect(result.current.sequences[0].runMode).toBe('all')
    expect(mockSequences.save).toHaveBeenCalledTimes(1)
  })

  it('deletes a sequence', async () => {
    mockSequences.delete.mockResolvedValue(undefined)
    useSequenceStore.setState({ sequences: [...testSequences] })

    const { result } = renderHook(() => useSequenceStore())

    await act(async () => {
      await result.current.deleteSequence('seq-1')
    })

    expect(result.current.sequences).toHaveLength(0)
    expect(mockSequences.delete).toHaveBeenCalledWith('seq-1')
  })

  it('starts sequence in first mode with shared terminal', async () => {
    useSequenceStore.setState({ sequences: [...testSequences] })
    const { result } = renderHook(() => useSequenceStore())

    await act(async () => {
      await result.current.startSequence(testSequences[0])
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(result.current.activeRun?.runMode).toBe('first')
    expect(result.current.activeRun?.sharedSessionId).toBe('session-1')
    expect(result.current.activeRun?.runningStepIds).toEqual(['step-1'])
  })

  it('starts sequence in none mode without running steps', async () => {
    const seq = { ...testSequences[0], runMode: 'none' as const }
    useSequenceStore.setState({ sequences: [seq] })
    const { result } = renderHook(() => useSequenceStore())

    await act(async () => {
      await result.current.startSequence(seq)
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(result.current.activeRun?.runningStepIds).toEqual([])
    expect(mockInput).not.toHaveBeenCalled()
  })

  it('starts sequence in all mode with one terminal per step', async () => {
    mockCreate
      .mockResolvedValueOnce('session-a')
      .mockResolvedValueOnce('session-b')
    const seq = { ...testSequences[0], runMode: 'all' as const }
    useSequenceStore.setState({ sequences: [seq] })
    const { result } = renderHook(() => useSequenceStore())

    await act(async () => {
      await result.current.startSequence(seq)
    })

    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(result.current.activeRun?.stepSessionIds['step-1']).toBe('session-a')
    expect(result.current.activeRun?.stepSessionIds['step-2']).toBe('session-b')
    expect(result.current.activeRun?.runningStepIds).toHaveLength(2)
  })

  it('stops sequence run and kills related terminals', async () => {
    mockKillTerminal.mockResolvedValue(undefined)
    useSequenceStore.setState({
      sequences: [...testSequences],
      activeRun: {
        sequenceId: 'seq-1',
        runMode: 'first',
        sharedSessionId: 'session-1',
        stepSessionIds: {},
        completedStepIds: [],
        runningStepIds: ['step-1'],
        activeStepId: 'step-1'
      }
    })

    const { result } = renderHook(() => useSequenceStore())

    await act(async () => {
      await result.current.stopSequence()
    })

    expect(mockInput).toHaveBeenCalledWith('session-1', '\x03')
    expect(mockKillTerminal).toHaveBeenCalledWith('session-1')
    expect(result.current.activeRun).toBe(null)
  })
})
