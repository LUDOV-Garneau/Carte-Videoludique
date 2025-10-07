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
  }

  return { default: L, onHandlers, map }
})

// --- Mock router
const routerPushMock = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerPushMock }) }))

import L, { onHandlers, map as mapApi } from 'leaflet'
import LeafletMap from './LeafletMap.vue'

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
    const wrapper = mount(LeafletMap)

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

/* ------------------------------------- */
/* Tests des fonctions exposées (vm.*)   */
/* ------------------------------------- */

describe('reverseGeocode (exposed)', () => {
  it('retourne address quand HTTP 200 OK', async () => {
    const wrapper = mount(LeafletMap)

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        display_name: '123 Rue Saint-Jean, Québec, Canada',
        address: { road: 'Rue Saint-Jean', city: 'Québec' },
      }),
    })

    const res = await wrapper.vm.reverseGeocode(46.8139, -71.2082)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/reverse'),
      expect.objectContaining({ headers: expect.any(Object) })
    )
    expect(res.full).toContain('Saint-Jean')
  })

  it('jette une erreur si HTTP non OK', async () => {
    const wrapper = mount(LeafletMap)
    fetch.mockResolvedValueOnce({ ok: false })

    await expect(wrapper.vm.reverseGeocode(0, 0))
      .rejects.toThrow('Reverse geocode error')
  })
})

describe('geocodeAddress (exposed)', () => {
  let wrapper
  beforeEach(() => {
    wrapper = mount(LeafletMap)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('retourne null si la chaîne est vide', async () => {
    await expect(wrapper.vm.geocodeAddress('')).resolves.toBeNull()
    await expect(wrapper.vm.geocodeAddress('   ')).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('retourne {lat,lng} pour un résultat', async () => {
    const arr = [{ lat: '46.8129', lon: '-71.2082' }]
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(arr) })

    const res = await wrapper.vm.geocodeAddress('355 Rue Charest Est, Québec, Canada')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/search'),
      expect.objectContaining({ headers: expect.any(Object) })
    )
    expect(res).toEqual({ lat: 46.8129, lng: -71.2082 })
  })

  it('retourne null si aucun résultat', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    await expect(wrapper.vm.geocodeAddress('adresse improbable')).resolves.toBeNull()
  })

  it('jette une erreur si HTTP non OK', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    await expect(wrapper.vm.geocodeAddress('Québec')).rejects.toThrow('Geocode error')
  })
})

describe('locateFromAddress (exposed)', () => {
  let wrapper
  let markerChain

  beforeEach(() => {
    wrapper = mount(LeafletMap)
    // on s'assure que le panneau/clic n'interfère pas
    markerChain = {
      addTo: vi.fn(() => markerChain),
      bindPopup: vi.fn(() => markerChain),
      openPopup: vi.fn(() => markerChain),
    }
    // on force le mock L.marker à retourner notre chain pour ces tests
    L.marker.mockImplementation(() => markerChain)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('place un nouveau marqueur, met à jour lat/lng et centre la carte', async () => {
    
    const btn = document.querySelector('.btn-ajout-marqueur')
    btn.__handlers?.click?.({})
    await wrapper.vm.$nextTick()

    const adresseInput = wrapper.get('#adresse') 
    await adresseInput.setValue('123 Rue Saint-Jean, Québec, Canada')
    await wrapper.vm.$nextTick()

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ lat: '46.8139', lon: '-71.2082' }]),
    })

    await wrapper.vm.locateFromAddress()
    await wrapper.vm.$nextTick()

    expect(L.marker).toHaveBeenCalledWith([46.8139, -71.2082])
    expect(markerChain.addTo).toHaveBeenCalledWith(mapApi)
    expect(markerChain.bindPopup).toHaveBeenCalledWith('Adresse localisée')
    expect(markerChain.openPopup).toHaveBeenCalled()

    expect(wrapper.get('#lat').element.value).toBe('46.8139')
    expect(wrapper.get('#lng').element.value).toBe('-71.2082')
    expect(mapApi.setView).toHaveBeenCalledWith([46.8139, -71.2082], 15)
    expect(mapApi.removeLayer).not.toHaveBeenCalled()
  })

  it('supprime l’ancien marqueur si présent', async () => {
    const btn = document.querySelector('.btn-ajout-marqueur')
    btn.__handlers?.click?.({})
    await wrapper.vm.$nextTick()

    await wrapper.get('#adresse').setValue('addr-1')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ lat: '46.81', lon: '-71.20' }]),
    })
    await wrapper.vm.locateFromAddress()
    await wrapper.vm.$nextTick()

    expect(L.marker).toHaveBeenCalledTimes(1)
    expect(mapApi.removeLayer).toHaveBeenCalledTimes(0)

   
    await wrapper.get('#adresse').setValue('addr-2')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ lat: '46.82', lon: '-71.21' }]),
    })
    await wrapper.vm.locateFromAddress()
    await wrapper.vm.$nextTick()

    expect(L.marker).toHaveBeenCalledTimes(2)   
    expect(mapApi.removeLayer).toHaveBeenCalledTimes(1)   
  })

  it('ne fait rien si adresse vide', async () => {
    // Ouvre le panneau pour rendre le formulaire
    const btn = document.querySelector('.btn-ajout-marqueur')
    btn.__handlers?.click?.({})
    await wrapper.vm.$nextTick()

    // L’input est vide par défaut, mais on le force au cas où
    const adresseInput = wrapper.get('#adresse')
    await adresseInput.setValue('')     // adresse vide

    await wrapper.vm.locateFromAddress()

    // Comme adresse vide → pas d’appel réseau ni de marker
    expect(fetch).not.toHaveBeenCalled()
    expect(L.marker).not.toHaveBeenCalled()
  })
})
