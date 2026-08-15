import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCommandStore } from './command-store'

// Mock window.api.commands
beforeEach(() => {
  vi.stubGlobal('window', {
    api: {
      commands: {
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue([]),
        importCommands: vi.fn().mockResolvedValue(undefined),
        exportCommands: vi.fn().mockResolvedValue([]),
      },
    },
  })

  useCommandStore.setState({
    commands: [],
    searchQuery: '',
    selectedCategory: null,
    isLoading: false,
  })
})

describe('useCommandStore', () => {
  it('adds a new command', async () => {
    await useCommandStore.getState().addCommand({
      name: 'Test',
      command: 'echo hello',
      category: 'General',
      tags: [],
    })
    expect(useCommandStore.getState().commands.length).toBe(1)
  })

  it('filters commands by search query', async () => {
    await useCommandStore.getState().addCommand({
      name: 'Build App',
      command: 'npm run build',
      category: 'General',
      tags: [],
    })
    useCommandStore.getState().setSearchQuery('build')
    expect(useCommandStore.getState().filteredCommands().length).toBe(1)
  })
})

