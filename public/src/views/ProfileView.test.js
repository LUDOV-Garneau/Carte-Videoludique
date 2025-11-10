import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProfileView from '@/views/ProfileView.vue'

// On mocke le store d'authentification
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

const mockAuthStore = {
  token: 'fake-token',
  decodedToken: { id: '123' },
  isAuthenticated: true,
}

describe('ProfileView.vue', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // --- 1️⃣ Cas : Profil chargé avec succès ---
  it('affiche les informations du profil utilisateur quand la requête réussit', async () => {
    const mockResponse = {
      data: {
        nom: 'Dupont',
        prenom: 'Jean',
        courriel: 'jean.dupont@example.com',
        createdAt: '2024-01-01T12:00:00Z',
        updatedAt: '2024-02-01T12:00:00Z',
      },
    }

    const { useAuthStore } = await import('@/stores/auth')
    useAuthStore.mockReturnValue(mockAuthStore)

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    )

    const wrapper = mount(ProfileView)
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Dupont')
    expect(wrapper.text()).toContain('Jean')
    expect(wrapper.text()).toContain('jean.dupont@example.com')
  })

  // --- 2️⃣ Cas : Aucun utilisateur connecté ---
  it("affiche un message quand aucun utilisateur n'est connecté", async () => {
    const { useAuthStore } = await import('@/stores/auth')
    useAuthStore.mockReturnValue({
      token: null,
      decodedToken: null,
      isAuthenticated: false,
    })

    global.fetch = vi.fn()

    const wrapper = mount(ProfileView)
    await flushPromises()

    expect(wrapper.text()).toContain('Aucun utilisateur connecté.')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  // --- 3️⃣ Cas : Erreur API ---
  it("affiche une erreur quand l'API renvoie une erreur", async () => {
    const { useAuthStore } = await import('@/stores/auth')
    useAuthStore.mockReturnValue(mockAuthStore)

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      })
    )

    const wrapper = mount(ProfileView)
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledOnce()
    expect(wrapper.text()).not.toContain('Dupont')
  })
})
