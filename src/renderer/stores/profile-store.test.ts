import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProfileStore } from './profile-store'

beforeEach(() => {
  vi.stubGlobal('window', {
    api: {
      profiles: {
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue([])
      }
    }
  })

  localStorage.clear()
  useProfileStore.setState({
    profiles: [],
    activeProfileId: null,
    isLoading: false
  })
})

describe('useProfileStore', () => {
  it('adds a new profile', async () => {
    await useProfileStore.getState().addProfile({
      name: 'Development',
      variables: { NODE_ENV: 'development', PORT: '3000' },
      isDefault: false
    })

    const profiles = useProfileStore.getState().profiles
    expect(profiles.length).toBe(1)
    expect(profiles[0].name).toBe('Development')
    expect(profiles[0].variables.PORT).toBe('3000')
    expect(useProfileStore.getState().activeProfileId).toBe(profiles[0].id)
  })

  it('updates a profile and its variables', async () => {
    await useProfileStore.getState().addProfile({
      name: 'Staging',
      variables: { API_URL: 'https://staging.api.com' }
    })

    const id = useProfileStore.getState().profiles[0].id
    await useProfileStore.getState().updateProfile(id, {
      name: 'Staging V2',
      variables: { API_URL: 'https://staging-v2.api.com' }
    })

    const updated = useProfileStore.getState().profiles[0]
    expect(updated.name).toBe('Staging V2')
    expect(updated.variables.API_URL).toBe('https://staging-v2.api.com')
  })

  it('deletes a profile and handles active profile selection', async () => {
    await useProfileStore.getState().addProfile({
      name: 'Prod',
      variables: {}
    })

    const id = useProfileStore.getState().profiles[0].id
    expect(useProfileStore.getState().activeProfileId).toBe(id)

    await useProfileStore.getState().deleteProfile(id)
    expect(useProfileStore.getState().profiles.length).toBe(0)
    expect(useProfileStore.getState().activeProfileId).toBeNull()
  })

  it('gets active profile correctly', async () => {
    await useProfileStore.getState().addProfile({
      name: 'Local',
      variables: { DEBUG: 'true' }
    })

    const active = useProfileStore.getState().getActiveProfile()
    expect(active).toBeDefined()
    expect(active?.name).toBe('Local')
    expect(active?.variables.DEBUG).toBe('true')
  })
})
