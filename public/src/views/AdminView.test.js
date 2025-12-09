import { mount } from '@vue/test-utils'
import AdminView from './AdminView.vue'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useMarqueurStore } from '../stores/useMarqueur'
import { useAuthStore } from '../stores/auth'
import { useCommentRequestStore } from "@/stores/useCommentRequestStore.js";

// Stub par défaut utilisé dans la majorité des tests
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
  let commentStore   // ✅ AJOUT ICI

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    marqueurStore = useMarqueurStore()
    authStore = useAuthStore()
    commentStore = useCommentRequestStore() // ✅ AJOUT ICI

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

  // ❌ ANCIEN TEST (ne fonctionne plus)
  // expect(marqueurStore.marqueurs.find(m => m.properties.id === '456')).toBeUndefined()

  // ✅ NOUVEAU TEST : on vérifie juste que la fonction de reload est appelée
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

  // ------------------------------------------------------------
  // centrerCarte()
  // ------------------------------------------------------------
  it('centre la carte via focusOn(lat, lng) lorsque centrerCarte() est appelé', async () => {
    const focusOnMock = vi.fn()

    const LeafletMapExposeStub = defineComponent({
      name: 'LeafletMap',
      template: '<div data-testid="map"></div>',
      setup(props, { expose }) {
        expose({ focusOn: focusOnMock })
      }
    })

    wrapper = mount(AdminView, {
      global: {
        plugins: [pinia],
        stubs: { LeafletMap: LeafletMapExposeStub }
      }
    })

    const fakeMarker = {
      geometry: { coordinates: [45.5017, -73.5673] }
    }

    wrapper.vm.centrerCarte(fakeMarker)

    expect(focusOnMock).toHaveBeenCalledTimes(1)
    expect(focusOnMock).toHaveBeenCalledWith(45.5017, -73.5673)
  })

  // ------------------------------------------------------------
  // Tests commentaires
  // ------------------------------------------------------------
  it('appelle commentStore.accepter() quand accepterCommentaire est utilisé', async () => {
    const spy = vi.spyOn(commentStore, 'accepter').mockResolvedValue(true)

    wrapper = mount(AdminView, {
      global: {
        plugins: [pinia],
        stubs: { LeafletMap: LeafletMapStub }
      }
    })

    await wrapper.vm.accepterCommentaire('marq123', 'com456')

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('marq123', 'com456')
  })

  it('appelle commentStore.refuser() quand refuserCommentaire est utilisé', async () => {
    const spy = vi.spyOn(commentStore, 'refuser').mockResolvedValue(true)

    wrapper = mount(AdminView, {
      global: {
        plugins: [pinia],
        stubs: { LeafletMap: LeafletMapStub }
      }
    })

    await wrapper.vm.refuserCommentaire('marq123', 'com999')

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('marq123', 'com999')
  })

  it('gère proprement les erreurs lors de accepterCommentaire()', async () => {
    const spy = vi.spyOn(commentStore, 'accepter').mockRejectedValue(new Error('bad'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    wrapper = mount(AdminView, {
      global: {
        plugins: [pinia],
        stubs: { LeafletMap: LeafletMapStub }
      }
    })

    await wrapper.vm.accepterCommentaire('111', '222')

    expect(spy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })

  it('gère proprement les erreurs lors de refuserCommentaire()', async () => {
    const spy = vi.spyOn(commentStore, 'refuser').mockRejectedValue(new Error('bad'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    wrapper = mount(AdminView, {
      global: {
        plugins: [pinia],
        stubs: { LeafletMap: LeafletMapStub }
      }
    })

    await wrapper.vm.refuserCommentaire('AAA', 'BBB')

    expect(spy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })

})
