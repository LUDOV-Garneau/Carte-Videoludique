import { mount } from '@vue/test-utils'
import AdminView from './AdminView.vue'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useMarqueurStore } from '../stores/useMarqueur'
import { useAuthStore } from '../stores/auth'

const LeafletMapStub = defineComponent({
  name: 'LeafletMap',
  template: '<div data-testid="map"></div>',
})

vi.mock('jwt-decode', () => ({
  default: vi.fn(() => ({
    exp: Math.floor(Date.now() / 1000) + 3600,
    nom: 'Admin',
    role: 'Gestionnaire'
  }))
}))
describe('AdminView.vue', () => {
  let wrapper
  let pinia
  let marqueurStore
  let authStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    marqueurStore = useMarqueurStore()
    authStore = useAuthStore()
    authStore.token = 'faketoken123'
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('se monte sans erreur', () => {
    wrapper = mount(AdminView, {
      global: {
        plugins: [pinia],
        stubs: { LeafletMap: LeafletMapStub }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('affiche le titre et la section notification', () => {
    wrapper = mount(AdminView, {
      global: {
        plugins: [createPinia()],
        stubs: { LeafletMap: LeafletMapStub }
      }
    })
    const h2 = wrapper.find('h2')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe('Notifications')
  })

  it('affiche un message vide si aucune offre', () => {
    wrapper = mount(AdminView, {
      global: { stubs: { LeafletMap: LeafletMapStub } },
      data() {
        return { rows: [] }
      }
    })
    expect(wrapper.text()).toContain('Aucune offre pour le moment.')
  })

  it('rend les lignes quand rows est fourni', async () => {
    wrapper = mount(AdminView, {
      global: {
        plugins: [pinia],
        stubs: { LeafletMap: LeafletMapStub }
      }
    })

    marqueurStore.marqueurs = [{
      properties: {
        id: '1',
        titre: 'Vidéotron',
        adresse: '2300 rue X',
        status: 'pending'
      }
    }]

    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.find('.provider').text()).toBe('Vidéotron')
    expect(wrapper.find('.address').text()).toContain('2300 rue X')
  })

  it('affiche la carte (stub)', () => {
    wrapper = mount(AdminView, {
      global: { stubs: { LeafletMap: LeafletMapStub } }
    })
    expect(wrapper.get('[data-testid="map"]').exists()).toBe(true)
  })

  // it('met à jour le statut du marqueur en "approved" quand accepterMarqueur() est appelé', async () => {
  //   wrapper = mount(AdminView, {
  //     global: { plugins: [pinia], stubs: { LeafletMap: LeafletMapStub } }
  //   })

  //   // ⚠️ TRÈS IMPORTANT : on récupère les stores APRÈS le mount,
  //   // pour être sûr d’avoir la même instance que le composant
  //   const marqueurStore = useMarqueurStore()
  //   const authStore = useAuthStore()

  //   authStore.token = null

  //   const marqueur = {
  //     properties: { id: '123', status: 'pending' }
  //   }

  //   const updatedMarqueur = { properties: { id: '123', status: 'approved' } }

  //   // on remplace l’action par un spy
  //   marqueurStore.modifierMarqueurStatus = vi
  //     .fn()
  //     .mockResolvedValue(updatedMarqueur)

  //   await wrapper.vm.accepterMarqueur(marqueur)

  //   expect(marqueurStore.modifierMarqueurStatus).toHaveBeenCalledTimes(1)
  //   expect(marqueurStore.modifierMarqueurStatus).toHaveBeenCalledWith(
  //     '123',
  //     authStore.token,
  //     { status: 'approved' }
  //   )
  //   expect(marqueur.properties.status).toBe('approved')
  // })

  it('supprime le marqueur et rafraîchit la liste quand refuserMarqueur() est appelé', async () => {
  wrapper = mount(AdminView, {
    global: { plugins: [pinia], stubs: { LeafletMap: LeafletMapStub } }
  })
  const marqueur = { properties: { id: '456' } }

  marqueurStore.marqueurs = [
    { properties: { id: '123' } },
    { properties: { id: '456' } },
    { properties: { id: '789' } }
  ]

  const spyDelete = vi
    .spyOn(marqueurStore, 'supprimerMarqueur')
    .mockResolvedValue(true)

  const spyGet = vi
    .spyOn(marqueurStore, 'getMarqueurs')
    .mockResolvedValue([])

  await wrapper.vm.refuserMarqueur(marqueur)

  expect(spyDelete).toHaveBeenCalledWith('456', authStore.token)

  expect(marqueurStore.marqueurs.find(m => m.properties.id === '456')).toBeUndefined()

  expect(spyGet).toHaveBeenCalledTimes(1)
})


  it('affiche une erreur si aucun token n’est disponible', async () => {
    authStore.token = null
    wrapper = mount(AdminView, {
      global: { plugins: [pinia], stubs: { LeafletMap: LeafletMapStub } }
    })

    const marqueur = { properties: { id: '999', status: 'pending' } }
    await wrapper.vm.accepterMarqueur(marqueur)

    expect(wrapper.vm.messageErreur).toContain('Non authentifié')
  })
})
