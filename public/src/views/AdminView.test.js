import { mount } from '@vue/test-utils'
import AdminView from './AdminView.vue'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useMarqueursStore } from '../stores/useMarqueur'
import { useAuthStore } from '../stores/auth'

const LeafletMapStub = defineComponent({
  name: 'LeafletMap',
  template: '<div data-testid="map"></div>',
})

describe('AdminView.vue', () => {
  let wrapper
  let pinia
  let marqueurStore
  let authStore

  beforeEach(() => {
    // Nouvelle instance propre de Pinia à chaque test
    pinia = createPinia()
    setActivePinia(pinia)
    marqueurStore = useMarqueursStore()
    authStore = useAuthStore()
    authStore.token = 'faketoken123'
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('se monte sans erreur', () => {
    const wrapper = mount(AdminView, {
      global: {
        plugins: [pinia],
        stubs: { LeafletMap: LeafletMapStub }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  // it('affiche le titre et la section notification', () => {
  //   const wrapper = mount(AdminView, {
  //     global: { stubs: { LeafletMap: LeafletMapStub } }
  //   })
  //   expect(wrapper.find('h2').text()).toBe('Notifications')
  // })
  it('affiche le titre et la section notification', () => {
    const wrapper = mount(AdminView, {
      global: {
        plugins: [createPinia()],
        stubs: { LeafletMap: LeafletMapStub }
      }
    })
    
    const h2 = wrapper.find('h2')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe('Notifications')
  })
})

  it('affiche un message vide si aucune offre', () => {
    const wrapper = mount(AdminView, {
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
    const wrapper = mount(AdminView, {
      global: { stubs: { LeafletMap: LeafletMapStub } }
    })
    expect(wrapper.get('[data-testid="map"]').exists()).toBe(true)
  })

  // --- Test changer statut marqueur ---
  it('met à jour le statut du marqueur en "approved" quand accepterMarqueur() est appelé', async () => {
    wrapper = mount(AdminView, {
      global: { plugins: [pinia], stubs: { LeafletMap: LeafletMapStub } }
    })

    const marqueur = {
      properties: { id: '123', status: 'pending' }
    }

    const updatedMarqueur = { properties: { id: '123', status: 'approved' } }

    const spy = vi
      .spyOn(marqueurStore, 'modifierMarqueurStatus')
      .mockResolvedValue(updatedMarqueur)

    await wrapper.vm.accepterMarqueur(marqueur)

    expect(spy).toHaveBeenCalledWith('123', authStore.token, { status: 'approved' })
    expect(marqueur.properties.status).toBe('approved')
  })

  // 🔹 Nouveau test : refuserMarqueur()
  it('met à jour le statut du marqueur en "rejected" quand refuserMarqueur() est appelé', async () => {
    wrapper = mount(AdminView, {
      global: { plugins: [pinia], stubs: { LeafletMap: LeafletMapStub } }
    })

    const marqueur = {
      properties: { id: '456', status: 'pending' }
    }

    const updatedMarqueur = { properties: { id: '456', status: 'rejected' } }

    const spy = vi
      .spyOn(marqueurStore, 'modifierMarqueurStatus')
      .mockResolvedValue(updatedMarqueur)

    await wrapper.vm.refuserMarqueur(marqueur)

    expect(spy).toHaveBeenCalledWith('456', authStore.token, { status: 'rejected' })
    expect(marqueur.properties.status).toBe('rejected')
  })

  // 🔹 Test d’erreur : token manquant
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
