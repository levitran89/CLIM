import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSnippetHubStore } from './snippet-hub-store'

beforeEach(() => {
  vi.stubGlobal('window', {
    api: {
      commands: {
        save: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue([])
      },
      sequences: {
        save: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue([])
      }
    }
  })

  useSnippetHubStore.setState({
    selectedCategory: null,
    searchQuery: '',
    installedPackIds: []
  })
})

describe('useSnippetHubStore', () => {
  it('has default packs loaded', () => {
    const packs = useSnippetHubStore.getState().packs
    expect(packs.length).toBeGreaterThan(0)
    expect(packs.some((p) => p.category === 'docker')).toBe(true)
  })

  it('filters packs by category', () => {
    useSnippetHubStore.getState().setSelectedCategory('docker')
    const filtered = useSnippetHubStore.getState().filteredPacks()
    expect(filtered.length).toBe(1)
    expect(filtered[0].category).toBe('docker')
  })

  it('filters packs by search query', () => {
    useSnippetHubStore.getState().setSearchQuery('pytorch')
    const filtered = useSnippetHubStore.getState().filteredPacks()
    expect(filtered.length).toBe(1)
    expect(filtered[0].category).toBe('python')
  })

  it('installs a pack and saves commands and sequences', async () => {
    const pack = useSnippetHubStore.getState().packs[0]
    const success = await useSnippetHubStore.getState().installPack(pack.id)
    expect(success).toBe(true)
    expect(window.api.commands.save).toHaveBeenCalled()
    expect(useSnippetHubStore.getState().installedPackIds).toContain(pack.id)
  })

  it('installs a single command from a pack', async () => {
    const pack = useSnippetHubStore.getState().packs[0]
    const success = await useSnippetHubStore.getState().installSingleCommand(pack.id, 0)
    expect(success).toBe(true)
    expect(window.api.commands.save).toHaveBeenCalled()
  })
})
