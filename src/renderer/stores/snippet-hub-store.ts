import { create } from 'zustand'
import { BUILTIN_SNIPPET_PACKS } from '@shared/snippet-hub-data'
import type { SnippetPack, Command, CommandSequence } from '@shared/types'
import { toast } from 'sonner'
import { useCommandStore } from './command-store'
import { useSequenceStore } from './sequence-store'

interface SnippetHubState {
  packs: SnippetPack[]
  selectedCategory: string | null
  searchQuery: string
  installedPackIds: string[]

  setSelectedCategory: (cat: string | null) => void
  setSearchQuery: (query: string) => void
  installPack: (packId: string) => Promise<boolean>
  installSingleCommand: (packId: string, cmdIndex: number) => Promise<boolean>
  filteredPacks: () => SnippetPack[]
}

export const useSnippetHubStore = create<SnippetHubState>((set, get) => ({
  packs: BUILTIN_SNIPPET_PACKS,
  selectedCategory: null,
  searchQuery: '',
  installedPackIds: [],

  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  filteredPacks: () => {
    const { packs, selectedCategory, searchQuery } = get()
    const q = searchQuery.toLowerCase().trim()

    return packs.filter((pack) => {
      if (selectedCategory && pack.category !== selectedCategory) {
        return false
      }
      if (!q) return true

      const matchName = pack.name.toLowerCase().includes(q)
      const matchDesc = pack.description.toLowerCase().includes(q)
      const matchTags = pack.tags.some((t) => t.toLowerCase().includes(q))
      const matchCmd = pack.commands.some((c) => c.name.toLowerCase().includes(q) || c.command.toLowerCase().includes(q))
      const matchSeq = pack.sequences?.some((s) => s.name.toLowerCase().includes(q))

      return matchName || matchDesc || matchTags || matchCmd || matchSeq
    })
  },

  installPack: async (packId: string) => {
    const pack = get().packs.find((p) => p.id === packId)
    if (!pack) return false

    try {
      let countCmds = 0
      let countSeqs = 0

      // 1. Cài đặt các câu lệnh trong gói
      for (const cmd of pack.commands) {
        const fullCmd: Command = {
          ...cmd,
          id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        await window.api.commands.save(fullCmd)
        countCmds++
      }

      // 2. Cài đặt các quy trình trong gói
      if (pack.sequences && pack.sequences.length > 0) {
        for (const seq of pack.sequences) {
          const fullSeq: CommandSequence = {
            ...seq,
            id: `seq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            steps: (seq.steps || []).map((step, idx) => ({
              ...step,
              id: `step-${Date.now()}-${idx}`
            })),
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
          await window.api.sequences.save(fullSeq)
          countSeqs++
        }
      }

      // Reload stores
      await useCommandStore.getState().loadCommands()
      await useSequenceStore.getState().loadSequences()

      set((state) => ({
        installedPackIds: [...state.installedPackIds, packId]
      }))

      toast.success(
        `Đã cài đặt gói "${pack.name}" (${countCmds} câu lệnh${countSeqs > 0 ? `, ${countSeqs} quy trình` : ''})!`
      )
      return true
    } catch (err: any) {
      toast.error(`Lỗi khi cài đặt gói lệnh: ${err.message}`)
      return false
    }
  },

  installSingleCommand: async (packId: string, cmdIndex: number) => {
    const pack = get().packs.find((p) => p.id === packId)
    if (!pack || !pack.commands[cmdIndex]) return false

    try {
      const cmd = pack.commands[cmdIndex]
      const fullCmd: Command = {
        ...cmd,
        id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      await window.api.commands.save(fullCmd)
      await useCommandStore.getState().loadCommands()

      toast.success(`Đã thêm lệnh "${cmd.name}" vào danh sách!`)
      return true
    } catch (err: any) {
      toast.error(`Lỗi khi thêm lệnh: ${err.message}`)
      return false
    }
  }
}))
