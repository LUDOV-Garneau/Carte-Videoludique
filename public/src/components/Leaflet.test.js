// src/components/Leaflet.test.js
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'



// --- Mocks d'assets Leaflet
vi.mock('leaflet/dist/images/marker-icon.png',   () => ({ default: 'marker-icon.png' }),   { virtual: true })
vi.mock('leaflet/dist/images/marker-icon-2x.png',() => ({ default: 'marker-icon-2x.png' }),{ virtual: true })
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: 'marker-shadow.png' }), { virtual: true })

// --- Mock complet Leaflet
vi.mock('leaflet', () => {
  const onHandlers = {}

  const latLngBounds = vi.fn((sw, ne) => ({
    _southWest: sw,
    _northEast: ne,
    // si tu utilises bounds.contains(latlng) dans ton composant
    contains: vi.fn(() => true)
  }))

  const map = {
    setView: vi.fn(() => map),
    on: vi.fn((evt, cb) => { onHandlers[evt] = cb; return map }),
    off: vi.fn((evt) => { delete onHandlers[evt]; return map }),
    addControl: vi.fn((ctrl) => {
      if (ctrl && typeof ctrl.onAdd === 'function') {
        const el = ctrl.onAdd(map)
        if (el && el.nodeType === 1) document.body.appendChild(el)
      }
      return map
    }),
    removeControl: vi.fn(() => map),
    removeLayer: vi.fn(() => map),
    remove: vi.fn(),
    getContainer: vi.fn(() => ({ style: {} })),
    getZoom: vi.fn(() => 13),
    flyTo: vi.fn(() => map)     // <---- AJOUT POUR TESTER focusOn()
  }

  const tileLayerChain = { addTo: vi.fn(() => tileLayerChain) }
  const markerChain = {
    addTo: vi.fn(() => markerChain),
    bindPopup: vi.fn(() => markerChain),
    openPopup: vi.fn(() => markerChain),
  }

  const Control = {
    extend(def) {
      function C() {
        this.options = def?.options ?? {}
        this.onAdd = def?.onAdd ?? (() => document.createElement('div'))
      }
      return C
    },
  }

  const DomUtil = {
    create: (tag, className, parent) => {
      const el = document.createElement(tag)
      if (className) el.className = className
      if (parent?.appendChild) parent.appendChild(el)
      return el
    },
  }

  const DomEvent = {
    disableClickPropagation: vi.fn(),
    disableScrollPropagation: vi.fn(),
    on: vi.fn((el, type, handler) => {
      el.__handlers ||= {}
      el.__handlers[type] = handler
    }),
    preventDefault: vi.fn(),
  }

  function Marker() {}
  Marker.prototype.options = {}

  const L = {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => tileLayerChain),
    marker: vi.fn(() => markerChain),
    icon: vi.fn(() => ({})),
    Control,
    DomUtil,
    DomEvent,
    Marker,
    latLngBounds,
  }

  return { default: L, onHandlers, map }
})

// --- Mock router
const routerPushMock = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerPushMock }) }))

import L, { onHandlers, map as mapApi } from 'leaflet'
import LeafletMap from './LeafletMap.vue'

// Mock du store pour les tests restants
const mockMarqueurStore = {
  marqueurs: [],
  getMarqueurs: vi.fn(() => Promise.resolve()),
  getMarqueur: vi.fn(() => Promise.resolve()),
  ajouterMarqueur: vi.fn(() => Promise.resolve({ id: 1, message: 'Marqueur créé' }))
}

vi.mock('../stores/useMarqueur.js', () => ({
  useMarqueurStore: vi.fn(() => mockMarqueurStore)
}))

import { createPinia } from 'pinia'

// Espions window listeners
const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

beforeEach(() => {
  vi.clearAllMocks()
  document.body.innerHTML = ''
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

/* -------------------------------------------------- */
/* Tests du montage du composant + interactions carte */
/* -------------------------------------------------- */

describe('LeafletMap.vue', () => {
  it('monte et initialise la carte', async () => {
    const wrapper = mount(LeafletMap, {
      global:{
        plugins: [createPinia()]
      }
    })

    expect(wrapper.find('.map').exists()).toBe(true)
    expect(L.map).toHaveBeenCalledTimes(1)
    expect(L.tileLayer).toHaveBeenCalledTimes(1)
    expect(L.marker).toHaveBeenCalledTimes(0)

    expect(mapApi.addControl).toHaveBeenCalledTimes(1)

    const ajoutBtn = document.querySelector('.btn-ajout-marqueur')
    expect(ajoutBtn).toBeTruthy()
    expect(ajoutBtn.getAttribute('role')).toBe('button')
    expect(ajoutBtn.getAttribute('aria-label')).toBe('Ajouter un marqueur')

    expect(L.DomEvent.disableClickPropagation).toHaveBeenCalled()
    expect(L.DomEvent.disableScrollPropagation).toHaveBeenCalled()

    expect(wrapper.find('aside.panel').exists()).toBe(false)
    ajoutBtn.__handlers?.click?.({})
    await nextTick()
    expect(wrapper.find('aside.panel').exists()).toBe(true)

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    wrapper.unmount()
    expect(mapApi.removeControl).toHaveBeenCalledTimes(1)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(mapApi.remove).toHaveBeenCalledTimes(1)
  })

  it('ajoute un marqueur au clic carte et met à jour les coordonnées', async () => {
    const wrapper = mount(LeafletMap)

    // Ouvre le panneau (la garde panelOpen bloque sinon)
    const ajoutBtn = document.querySelector('.btn-ajout-marqueur')
    ajoutBtn.__handlers?.click?.({})
    await nextTick()

    onHandlers.click?.({ latlng: { lat: 45.5, lng: -73.56 } })
    await nextTick()

    expect(L.marker).toHaveBeenCalledTimes(1)
    expect(mapApi.removeLayer).toHaveBeenCalledTimes(0)

    const latInput = wrapper.find('#lat').element
    const lngInput = wrapper.find('#lng').element
    expect(latInput.value).not.toBe('')
    expect(lngInput.value).not.toBe('')

    onHandlers.click?.({ latlng: { lat: 45.6, lng: -73.57 } })
    await nextTick()

    expect(L.marker).toHaveBeenCalledTimes(2)
    expect(mapApi.removeLayer).toHaveBeenCalledTimes(1)
  })
})

/* ----------------------------------------- */
/* Tests de handlelocateFromAddress (exposed) */
/* ----------------------------------------- */

describe('handlelocateFromAddress (exposed)', () => {
  let wrapper
  let markerChain

  beforeEach(() => {
    wrapper = mount(LeafletMap, {
      global: {
        plugins: [createPinia()]
      }
    })

    // Mock de marqueur
    markerChain = {
      addTo: vi.fn(() => markerChain),
      bindPopup: vi.fn(() => markerChain),
      openPopup: vi.fn(() => markerChain),
    }
    L.marker.mockImplementation(() => markerChain)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('place un nouveau marqueur et met à jour les coordonnées', async () => {
    const coordinates = { lat: 46.8139, lng: -71.2082 }

    await wrapper.vm.handlelocateFromAddress(coordinates)

    expect(L.marker).toHaveBeenCalledWith(coordinates)
    expect(markerChain.addTo).toHaveBeenCalledWith(mapApi)
    expect(markerChain.bindPopup).toHaveBeenCalledWith('Adresse localisée')
    expect(markerChain.openPopup).toHaveBeenCalled()

    expect(wrapper.vm.latitude).toBe('46.81390')
    expect(wrapper.vm.longitude).toBe('-71.20820')
    expect(mapApi.setView).toHaveBeenCalledWith(coordinates, 15)
    expect(wrapper.vm.currentMarqueur).toStrictEqual(markerChain)
  })

  it('supprime l\'ancien marqueur avant d\'ajouter le nouveau', async () => {
    const oldMarker = { id: 'old' }
    wrapper.vm.currentMarqueur = oldMarker

    const coordinates = { lat: 46.8139, lng: -71.2082 }
    await wrapper.vm.handlelocateFromAddress(coordinates)

    expect(mapApi.removeLayer).toHaveBeenCalledWith(oldMarker)
    expect(wrapper.vm.currentMarqueur).toStrictEqual(markerChain)
  })

  it('ne supprime rien si aucun marqueur actuel', async () => {
    wrapper.vm.currentMarqueur = null

    const coordinates = { lat: 46.8139, lng: -71.2082 }
    await wrapper.vm.handlelocateFromAddress(coordinates)

    expect(mapApi.removeLayer).not.toHaveBeenCalled()
    expect(wrapper.vm.currentMarqueur).toStrictEqual(markerChain)
  })

  it('formate correctement les coordonnées avec 5 décimales', async () => {
    const coordinates = { lat: 46.123456789, lng: -71.987654321 }

    await wrapper.vm.handlelocateFromAddress(coordinates)

    expect(wrapper.vm.latitude).toBe('46.12346')
    expect(wrapper.vm.longitude).toBe('-71.98765')
  })
})

/* ----------------------------------------- */
/* Tests de afficherMarqueurs (exposed)      */
/* ----------------------------------------- */

describe('afficherMarqueurs (exposed)', () => {
  let wrapper
  let defaultMarkerChain

  beforeEach(() => {
    // Créer un mock de marqueur standard
    defaultMarkerChain = {
      addTo: vi.fn(() => defaultMarkerChain),
      bindPopup: vi.fn(() => defaultMarkerChain),
      openPopup: vi.fn(() => defaultMarkerChain),
      on: vi.fn(() => defaultMarkerChain),
      properties: {},
      comments: []
    }

    // S'assurer que L.marker retourne toujours notre mock
    L.marker.mockImplementation(() => defaultMarkerChain)

    // Reset the mock store data
    mockMarqueurStore.marqueurs = [
      {
        geometry: { coordinates: [-73.56, 45.5] },
        properties: {
          titre: 'Marqueur 1',
          type: 'Boutiques spécialisées',
          description: 'Description 1',
          images: [{ url: 'http://example.com/img1.jpg' }]
        },
        comments: []
      },
      {
        geometry: { coordinates: [-73.57, 45.51] },
        properties: {
          titre: 'Marqueur 2',
          type: 'Arcades et salles de jeux',
          description: 'Description 2'
        },
        comments: ['Commentaire test']
      }
    ]

    // Reset mocks
    mockMarqueurStore.getMarqueurs.mockResolvedValue()
    vi.clearAllMocks()

    globalThis.fetch = vi.fn()

    const pinia = createPinia()
    wrapper = mount(LeafletMap, {
      global: { plugins: [pinia] },
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('charge et affiche tous les marqueurs depuis le store', async () => {
    // Réinitialiser les mocks car afficherMarqueurs est appelé au montage
    vi.clearAllMocks()
    L.marker.mockImplementation(() => defaultMarkerChain)

    await wrapper.vm.afficherMarqueurs()

    expect(mockMarqueurStore.getMarqueurs).toHaveBeenCalledTimes(1)
    expect(L.marker).toHaveBeenCalledTimes(2)
    expect(L.marker).toHaveBeenCalledWith([45.5, -73.56])
    expect(L.marker).toHaveBeenCalledWith([45.51, -73.57])

    expect(wrapper.vm.marqueurs).toHaveLength(2)
  })

  it('nettoie les anciens marqueurs avant d\'ajouter les nouveaux', async () => {
    // Réinitialiser les mocks car afficherMarqueurs est appelé au montage
    vi.clearAllMocks()
    L.marker.mockImplementation(() => defaultMarkerChain)

    // Ajouter des marqueurs existants
    const oldMarker = { properties: { titre: 'Ancien' } }
    wrapper.vm.marqueurs.push(oldMarker)

    await wrapper.vm.afficherMarqueurs()

    expect(mapApi.removeLayer).toHaveBeenCalledWith(oldMarker)
    expect(wrapper.vm.marqueurs).toHaveLength(2) // Nouveaux marqueurs seulement
  })

  it('configure les événements click sur chaque marqueur', async () => {
    // Réinitialiser les mocks car afficherMarqueurs est appelé au montage
    vi.clearAllMocks()

    const markerChain = {
      addTo: vi.fn(() => markerChain),
      bindPopup: vi.fn(() => markerChain),
      openPopup: vi.fn(() => markerChain),
      on: vi.fn((event, callback) => {
        if (event === 'click') {
          markerChain.clickHandler = callback
        }
        return markerChain
      }),
      properties: {},
      comments: []
    }

    L.marker.mockImplementation(() => markerChain)

    await wrapper.vm.afficherMarqueurs()

    expect(markerChain.on).toHaveBeenCalledWith('click', expect.any(Function))

    // Simuler un clic sur le marqueur (assigner les propriétés d'abord)
    markerChain.properties = { titre: 'Test' }
    markerChain.clickHandler()

    expect(wrapper.vm.selectedMarqueur).toStrictEqual(markerChain)
  })

  it('ignore les marqueurs sans coordonnées', async () => {
    // Réinitialiser les mocks car afficherMarqueurs est appelé au montage
    vi.clearAllMocks()
    L.marker.mockImplementation(() => defaultMarkerChain)

    mockMarqueurStore.marqueurs = [
      {
        // Pas de geometry
        properties: { titre: 'Marqueur invalide' }
      },
      {
        geometry: { coordinates: [-73.56, 45.5] },
        properties: { titre: 'Marqueur valide' }
      }
    ]

    await wrapper.vm.afficherMarqueurs()

    expect(L.marker).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.marqueurs).toHaveLength(1)
  })

  it('gère les erreurs du store gracieusement', async () => {
    // Vider la liste de marqueurs d'abord
    wrapper.vm.marqueurs.splice(0)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockMarqueurStore.getMarqueurs.mockRejectedValueOnce(new Error('Erreur réseau'))

    await wrapper.vm.afficherMarqueurs()

    expect(consoleErrorSpy).toHaveBeenCalledWith('afficherMarqueurs error:', expect.any(Error))
    expect(wrapper.vm.marqueurs).toHaveLength(0)

    consoleErrorSpy.mockRestore()
  })
})

/* -------------------------------------------------- */
/* 🟢 TESTS AJOUTÉS POUR focusOn() + BOUNDS.contains */
/* -------------------------------------------------- */

describe('focusOn (exposed)', () => {
  let wrapper

  beforeEach(() => {
    const pinia = createPinia()
    wrapper = mount(LeafletMap, {
      global: { plugins: [pinia] }
    })
    mapApi.flyTo.mockClear()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('appelle map.flyTo() avec les bonnes coordonnées', () => {
    wrapper.vm.focusOn(45.5, -73.5)

    expect(mapApi.flyTo).toHaveBeenCalledTimes(1)
    expect(mapApi.flyTo).toHaveBeenCalledWith([45.5, -73.5], 16)
  })

  it("n'appelle PAS flyTo si la map n'est pas définie", () => {
    wrapper.vm.map = null

    wrapper.vm.focusOn(45.5, -73.5)

    expect(mapApi.flyTo).not.toHaveBeenCalled()
  })
})
