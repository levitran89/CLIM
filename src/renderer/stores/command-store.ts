import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Command } from '../../shared/types'

interface CommandStore {
  commands: Command[]
  searchQuery: string
  selectedCategory: string | null
  isLoading: boolean

  // Actions
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string | null) => void

  // CRUD
  loadCommands: () => Promise<void>
  addCommand: (
    data: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>
  updateCommand: (id: string, data: Partial<Command>) => Promise<void>
  deleteCommand: (id: string) => Promise<void>
  importCommands: (commands: Command[]) => Promise<void>
  exportCommands: () => Promise<Command[]>

  // Computed
  filteredCommands: () => Command[]
  categories: () => string[]
}

export const useCommandStore = create<CommandStore>((set, get) => ({
  commands: [],
  searchQuery: '',
  selectedCategory: null,
  isLoading: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  loadCommands: async () => {
    set({ isLoading: true })
    try {
      const commands = await window.api.commands.list()
      set({ commands })
    } finally {
      set({ isLoading: false })
    }
  },

  addCommand: async (data) => {
    const command: Command = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await window.api.commands.save(command)
    set((state) => ({ commands: [...state.commands, command] }))
  },

  updateCommand: async (id, data) => {
    const commands = get().commands
    const existing = commands.find((c) => c.id === id)
    if (!existing) return

    const updated = { ...existing, ...data, updatedAt: Date.now() }
    await window.api.commands.save(updated)
    set((state) => ({
      commands: state.commands.map((c) => (c.id === id ? updated : c))
    }))
  },

  deleteCommand: async (id) => {
    await window.api.commands.delete(id)
    set((state) => ({
      commands: state.commands.filter((c) => c.id !== id)
    }))
  },

  importCommands: async (commands) => {
    await window.api.commands.importCommands(commands)
    await get().loadCommands()
  },

  exportCommands: async () => {
    return window.api.commands.exportCommands()
  },

  filteredCommands: () => {
    const { commands, searchQuery, selectedCategory } = get()
    return commands.filter((cmd) => {
      const matchesSearch =
        !searchQuery ||
        cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cmd.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        !selectedCategory || cmd.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  },

  categories: () => {
    const cats = new Set(get().commands.map((c) => c.category))
    return Array.from(cats).sort()
  }
}))
