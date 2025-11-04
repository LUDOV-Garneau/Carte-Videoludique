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
    getZoom: vi.fn(() => 13),
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

/* ----------------------------------------- */
/* Tests de sendRequest (exposed)            */
/* ----------------------------------------- */

// Mock des fonctions utils
vi.mock('../utils/utils.js', () => ({
  isValidEmail: vi.fn((email) => email.includes('@'))
}));
vi.mock('../utils/cloudinary.js', () => ({
  uploadMultipleImages: vi.fn(() => Promise.resolve([
    { publicId: 'img1', url: 'http://example.com/img1.jpg' },
    { publicId: 'img2', url: 'http://example.com/img2.jpg' }
  ])),
  cleanupImages: vi.fn(() => Promise.resolve())
}));

// Mock du store
const mockMarqueurStore = {
  marqueurs: [],
  getMarqueurs: vi.fn(() => Promise.resolve()),
  ajouterMarqueur: vi.fn(() => Promise.resolve({ id: 1, message: 'Marqueur créé' }))
}

vi.mock('../stores/useMarqueur.js', () => ({
  useMarqueursStore: vi.fn(() => mockMarqueurStore)
}))

import { uploadMultipleImages, cleanupImages } from '../utils/cloudinary.js'
import { createPinia } from 'pinia'
import { useMarqueursStore } from '../stores/useMarqueur'

describe('sendRequest (exposed)', () => {
  let wrapper

  beforeEach(() => {
   // 👇 mock fetch avant tout
    globalThis.fetch = vi.fn()

    const pinia = createPinia()
    wrapper = mount(LeafletMap, {
      global: { plugins: [pinia] },
    })

    const marqueurStore = useMarqueursStore()
    vi.spyOn(marqueurStore, 'ajouterMarqueur').mockResolvedValue({
      id: 1,
      message: 'Marqueur créé'
    })

    // ouvrir le panneau si nécessaire (adapte si tu as une autre API)
    const btn = document.querySelector('.btn-ajout-marqueur')
    btn?.__handlers?.click?.({})
    console.log('📋 Form initial dans beforeEach:', wrapper.vm.form)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('envoie avec succès un formulaire valide sans images', async () => {
    const marqueurStore = useMarqueursStore()
  
    // Remplir le formulaire correctement
    await wrapper.get('#titre').setValue('Mon lieu')
    await wrapper.get('#description').setValue('Description du lieu')
    await wrapper.get('#adresse').setValue('123 Rue Test, Québec')
    await wrapper.get('#lat').setValue('46.8139')
    await wrapper.get('#lng').setValue('-71.2082')

    await wrapper.vm.$nextTick()
    
    await wrapper.vm.sendRequest()

    expect(marqueurStore.ajouterMarqueur).toHaveBeenCalledWith(
      expect.objectContaining({
        titre: 'Mon lieu',
        description: 'Description du lieu',
        adresse: '123 Rue Test, Québec',
      })
    )
    expect(wrapper.vm.panelOpen).toBe(false)
  })

  it('envoie avec succès un formulaire valide avec images', async () => {
    const marqueurStore = useMarqueursStore()

    // Remplir le formulaire
    await wrapper.get('#titre').setValue('Mon lieu avec images')
    await wrapper.get('#description').setValue('Description')
    await wrapper.get('#adresse').setValue('123 Rue Test')
    
    // Simuler des fichiers
    wrapper.vm.files = [new File([''], 'test1.jpg'), new File([''], 'test2.jpg')]
    
    // Mock réponses
    uploadMultipleImages.mockResolvedValueOnce([
      { publicId: 'img1', url: 'http://example.com/img1.jpg' },
      { publicId: 'img2', url: 'http://example.com/img2.jpg' }
    ])

    await wrapper.vm.sendRequest()

    expect(uploadMultipleImages).toHaveBeenCalledWith(wrapper.vm.files)
    expect(marqueurStore.ajouterMarqueur).toHaveBeenCalledWith(
     expect.objectContaining({
       titre: 'Mon lieu avec images',
       images: [
         { publicId: 'img1', url: 'http://example.com/img1.jpg' },
         { publicId: 'img2', url: 'http://example.com/img2.jpg' }
       ]
     })
  )
    expect(wrapper.vm.panelOpen).toBe(false)
  })

  it('ne fait rien si la validation échoue', async () => {
    // Formulaire invalide (pas de titre)
    await wrapper.get('#description').setValue('Description seulement')
    
    await wrapper.vm.sendRequest()

    expect(fetch).not.toHaveBeenCalled()
    expect(uploadMultipleImages).not.toHaveBeenCalled()
    expect(wrapper.vm.panelOpen).toBe(true) // Panneau reste ouvert
  })

  it('nettoie les images et relance erreur si API échoue', async () => {
    const marqueurStore = useMarqueursStore()
    // Remplir formulaire valide
    await wrapper.get('#titre').setValue('Mon lieu')
    await wrapper.get('#description').setValue('Description')
    await wrapper.get('#adresse').setValue('123 Rue Test')
    await wrapper.get('#lat').setValue('46.8139')
    await wrapper.get('#lng').setValue('-71.2082')
    
    // Simuler upload d'images réussi
    wrapper.vm.files = [new File([''], 'test.jpg')]
    uploadMultipleImages.mockResolvedValueOnce([
      { publicId: 'img1', url: 'http://example.com/img1.jpg' }
    ])
    
    // Mock échec API
    marqueurStore.ajouterMarqueur.mockRejectedValueOnce(new Error('Erreur serveur'))

    await expect(wrapper.vm.sendRequest()).rejects.toThrow('Erreur serveur')
    
    expect(cleanupImages).toHaveBeenCalledWith(['img1'])
    expect(wrapper.vm.panelOpen).toBe(true) // Panneau reste ouvert
  })

  it('gère les erreurs de réseau', async () => {
    const marqueurStore = useMarqueursStore()
    // Remplir formulaire valide
    await wrapper.get('#titre').setValue('Mon lieu')
    await wrapper.get('#description').setValue('Description')
    await wrapper.get('#adresse').setValue('123 Rue Test')
    await wrapper.get('#lat').setValue('46.8139')
    await wrapper.get('#lng').setValue('-71.2082')
    
    // Mock erreur réseau
    marqueurStore.ajouterMarqueur.mockRejectedValueOnce(new Error('Network error'))

    await expect(wrapper.vm.sendRequest()).rejects.toThrow('Network error')
    expect(wrapper.vm.panelOpen).toBe(true)
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
    wrapper.unmount()
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
    expect(wrapper.vm.imageWindowOpen).toBe(true)
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
