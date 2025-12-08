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
    flyTo: vi.fn(() => map)
  }

  const tileLayerChain = { addTo: vi.fn(() => tileLayerChain) }

  const markerChain = {
    addTo: vi.fn(() => markerChain),
    bindPopup: vi.fn(() => markerChain),
    openPopup: vi.fn(() => markerChain),
    on: vi.fn(() => markerChain),
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

// ---- Mock STORE
const mockMarqueurStore = {
  marqueurs: [],
  getMarqueurs: vi.fn(() => Promise.resolve()),
  getMarqueur: vi.fn(() => Promise.resolve()),
  ajouterMarqueur: vi.fn(() => Promise.resolve({ id: 1 }))
}

vi.mock('../stores/useMarqueur.js', () => ({
  useMarqueurStore: vi.fn(() => mockMarqueurStore)
}))

const mockAuthStore = {
  isAuthenticated: false
}

vi.mock('../stores/auth.js', () => ({
  useAuthStore: vi.fn(() => mockAuthStore)
}))

// --- Mock geocode
vi.mock('../utils/geocode.js', () => ({
  reverseGeocode: vi.fn().mockResolvedValue({
    address: {
      city: 'Québec',
      state: 'Québec',
      country: 'Canada'
    }
  }),
  isAddressInQuebecProvince: vi.fn().mockReturnValue(true)
}))

import { createPinia } from 'pinia'

// Espions
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
/* Test montage + interactions carte */
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

    const ajoutBtn = document.querySelector('.btn-ajout-marqueur')
    expect(ajoutBtn).toBeTruthy()

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    wrapper.unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(mapApi.remove).toHaveBeenCalled()
  })

  it('affiche le contrôle d\'édition des catégories quand l\'utilisateur est connecté', async () => {
    mockAuthStore.isAuthenticated = true

    const wrapper = mount(LeafletMap, {
      global: {
        plugins: [createPinia()]
      }
    })

    // Vérifier que les deux contrôles sont ajoutés
    expect(mapApi.addControl).toHaveBeenCalledTimes(2)

    // Vérifier que le bouton d'édition des catégories existe
    const editBtn = document.querySelector('.btn-edit-categorie')
    expect(editBtn).toBeTruthy()
    expect(editBtn.getAttribute('role')).toBe('button')
    expect(editBtn.getAttribute('aria-label')).toBe('Gérer les catégories')

    wrapper.unmount()
    
    // Vérifier que les deux contrôles sont supprimés
    expect(mapApi.removeControl).toHaveBeenCalledTimes(2)

    // Reset pour les autres tests
    mockAuthStore.isAuthenticated = false
  })

  it('ajoute un marqueur au clic carte et met à jour les coordonnées', async () => {
    const wrapper = mount(LeafletMap)

    const ajoutBtn = document.querySelector('.btn-ajout-marqueur')
    ajoutBtn.__handlers?.click?.({})
    await nextTick()

    onHandlers.click?.({ latlng: { lat: 45.5, lng: -73.56 } })
    await nextTick()

    onHandlers.click?.({ latlng: { lat: 45.6, lng: -73.57 } })
    await nextTick()

    expect(L.marker).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.latitude).not.toBe('')
  })
})

/* -------------------------------------------------- */
/* Tests handlelocateFromAddress */
/* -------------------------------------------------- */

describe('handlelocateFromAddress', () => {
  let wrapper
  let markerChain

  beforeEach(() => {
    wrapper = mount(LeafletMap, {
      global: { plugins: [createPinia()] }
    })

    markerChain = {
      addTo: vi.fn(() => markerChain),
      bindPopup: vi.fn(() => markerChain),
      openPopup: vi.fn(() => markerChain),
    }
    L.marker.mockImplementation(() => markerChain)
  })

  it('met à jour le marqueur et les coords', async () => {
    const coords = { lat: 46.81, lng: -71.20 }
    await wrapper.vm.handlelocateFromAddress(coords)

    expect(wrapper.vm.latitude).toBe('46.81000')
    expect(wrapper.vm.longitude).toBe('-71.20000')
  })
})

/* -------------------------------------------------- */
/* Tests afficherMarqueurs */
/* -------------------------------------------------- */

describe('afficherMarqueurs', () => {
  let wrapper
  let defaultMarkerChain

  beforeEach(() => {
    defaultMarkerChain = {
      addTo: vi.fn(() => defaultMarkerChain),
      bindPopup: vi.fn(() => defaultMarkerChain),
      openPopup: vi.fn(() => defaultMarkerChain),
      on: vi.fn(() => defaultMarkerChain),
      properties: {}
    }

    L.marker.mockImplementation(() => defaultMarkerChain)

    mockMarqueurStore.marqueurs = [
      {
        geometry: { coordinates: [-73.56, 45.5] },
        properties: { type: "A", id: 1 }
      },
      {
        geometry: { coordinates: [-73.57, 45.51] },
        properties: { type: "B", id: 2 }
      }
    ]

    wrapper = mount(LeafletMap, {
      global: { plugins: [createPinia()] }
    })
  })

  it('affiche tous les marqueurs', async () => {
    vi.clearAllMocks()

    await wrapper.vm.afficherMarqueurs()

    expect(L.marker).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.noResults).toBe(false)
  })

  it('met noResults = true si aucun marqueur après filtrage', async () => {
  wrapper.vm.applyFilters(["Z"]) // Aucun type "Z"

  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick() // nécessaire car afficherMarqueurs() est async

  expect(wrapper.vm.noResults).toBe(true)
  expect(wrapper.find('.no-results').exists()).toBe(true)
})


  it('resetFilters réaffiche tous les marqueurs', async () => {
    wrapper.vm.applyFilters(["Z"])
    await nextTick()

    expect(wrapper.vm.noResults).toBe(true)

    wrapper.vm.resetFilters()
    await nextTick()

    expect(wrapper.vm.noResults).toBe(false)
    expect(wrapper.vm.marqueurs.length).toBe(2)
  })
})

/* -------------------------------------------------- */
/* Tests focusOn() */
/* -------------------------------------------------- */

describe('focusOn', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(LeafletMap, {
      global: { plugins: [createPinia()] }
    })
    mapApi.flyTo.mockClear()
  })

  it('appelle flyTo()', () => {
    wrapper.vm.focusOn(45, -73)
    expect(mapApi.flyTo).toHaveBeenCalledWith([45, -73], 16)
  })

  it("n'appelle pas flyTo si map null", () => {
    wrapper.vm.map = null
    wrapper.vm.focusOn(45, -73)
    expect(mapApi.flyTo).not.toHaveBeenCalled()
  })
})
