import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { EnvProfile } from '../../shared/types'

const ACTIVE_PROFILE_KEY = 'clim-active-profile-id'

interface ProfileStore {
  profiles: EnvProfile[]
  activeProfileId: string | null
  isLoading: boolean

  // Actions
  setActiveProfileId: (id: string | null) => void

  // CRUD
  loadProfiles: () => Promise<void>
  addProfile: (
    data: Omit<EnvProfile, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>
  updateProfile: (id: string, data: Partial<EnvProfile>) => Promise<void>
  deleteProfile: (id: string) => Promise<void>

  // Getters
  getActiveProfile: () => EnvProfile | undefined
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  activeProfileId: localStorage.getItem(ACTIVE_PROFILE_KEY) || null,
  isLoading: false,

  setActiveProfileId: (id) => {
    if (id) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY)
    }
    set({ activeProfileId: id })
  },

  loadProfiles: async () => {
    set({ isLoading: true })
    try {
      const profiles = await window.api.profiles.list()
      let activeId = get().activeProfileId

      // If activeProfileId is no longer valid, or null, check if there's a default
      const exists = profiles.some((p) => p.id === activeId)
      if (!exists) {
        const defaultProfile = profiles.find((p) => p.isDefault)
        activeId = defaultProfile ? defaultProfile.id : (profiles[0]?.id || null)
        if (activeId) {
          localStorage.setItem(ACTIVE_PROFILE_KEY, activeId)
        } else {
          localStorage.removeItem(ACTIVE_PROFILE_KEY)
        }
      }

      set({ profiles, activeProfileId: activeId })
    } finally {
      set({ isLoading: false })
    }
  },

  addProfile: async (data) => {
    const profile: EnvProfile = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await window.api.profiles.save(profile)
    set((state) => {
      let updatedProfiles = [...state.profiles]
      if (profile.isDefault) {
        updatedProfiles = updatedProfiles.map((p) => ({ ...p, isDefault: false }))
      }
      return {
        profiles: [...updatedProfiles, profile],
        activeProfileId: state.activeProfileId || profile.id
      }
    })
  },

  updateProfile: async (id, data) => {
    const profile = get().profiles.find((p) => p.id === id)
    if (!profile) return

    const updated: EnvProfile = {
      ...profile,
      ...data,
      updatedAt: Date.now()
    }

    await window.api.profiles.save(updated)
    set((state) => {
      let updatedProfiles = state.profiles.map((p) => (p.id === id ? updated : p))
      if (data.isDefault) {
        updatedProfiles = updatedProfiles.map((p) =>
          p.id === id ? { ...p, isDefault: true } : { ...p, isDefault: false }
        )
      }
      return { profiles: updatedProfiles }
    })
  },

  deleteProfile: async (id) => {
    await window.api.profiles.delete(id)
    set((state) => {
      const newProfiles = state.profiles.filter((p) => p.id !== id)
      const newActive =
        state.activeProfileId === id ? newProfiles[0]?.id || null : state.activeProfileId
      if (newActive) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, newActive)
      } else {
        localStorage.removeItem(ACTIVE_PROFILE_KEY)
      }
      return {
        profiles: newProfiles,
        activeProfileId: newActive
      }
    })
  },

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get()
    return profiles.find((p) => p.id === activeProfileId)
  }
}))
