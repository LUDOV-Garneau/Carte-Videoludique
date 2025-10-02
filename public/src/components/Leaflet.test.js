import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// --- Mocks d'assets (sinon Vitest râle sur les .png)
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: 'marker-icon.png' }), { virtual: true })
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: 'marker-icon-2x.png' }), { virtual: true })
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: 'marker-shadow.png' }), { virtual: true })

// --- Mocks globaux pour window.add/removeEventListener
const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

let createdElements = []

// --- Mock de Leaflet (namespace L exporté en default)
const mapApi = {
  setView: vi.fn().mockReturnThis(),
  on: vi.fn(),
  addControl: vi.fn((ctrl) => {
    // ⬅️ Simuler le vrai comportement de Leaflet
    if (ctrl && typeof ctrl.onAdd === 'function') {
      const el = ctrl.onAdd(mapApi)
      if (el) createdElements.push(el)
    }
    return mapApi
  }),
  removeControl: vi.fn(),
  remove: vi.fn(),
}

vi.mock('leaflet', () => {
  // Simuler L.Control.extend(...) qui retourne une "classe" contrôleur
  const Control = {
    extend(def) {
      function C() {
        this.options = def?.options ?? {}
        this.onAdd = def?.onAdd ?? (() => document.createElement('div'))
      }
      return C
    },
  }
  // Simuler L.DomUtil / L.DomEvent utilisés par ton control
  const DomUtil = {
    create: (tag, className, parent) => {
      const el = document.createElement(tag)
      if (className) el.className = className
      if (parent && parent.appendChild) parent.appendChild(el)
      createdElements.push(el)
      return el
    },
  }
  const DomEvent = {
    disableClickPropagation: vi.fn(),
    disableScrollPropagation: vi.fn(),
    on: vi.fn((el, type, handler) => {
      el.__handlers = el.__handlers || {}
      el.__handlers[type] = handler
    }),
    preventDefault: vi.fn(),
  }
  // Simuler le prototype de L.Marker accédé dans ton composant
  function Marker() {}
  Marker.prototype.options = {}

  const tileLayerApi = { addTo: vi.fn() }
  const markerApi = { addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis() }

  return {
    default: {
      map: vi.fn(() => mapApi),
      tileLayer: vi.fn(() => tileLayerApi),
      marker: vi.fn(() => markerApi),
      icon: vi.fn(() => ({})),
      Control,
      DomUtil,
      DomEvent,
      Marker,
    },
  }
})

// Mock vue-router
const routerPushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPushMock }),
}))

import LeafletMap from './LeafletMap.vue'

describe('LeafletMap.vue', () => {
  it('monte correctement le composant et initialise la carte', async () => {
    beforeEach(() => {
      createdElements = []
      mapApi.addControl.mockClear()
      mapApi.removeControl.mockClear()
      mapApi.remove.mockClear()
      addEventListenerSpy.mockClear()
      removeEventListenerSpy.mockClear()
    })
    afterEach(() => {
      vi.clearAllMocks()
    })
    const wrapper = mount(LeafletMap)

    // Le conteneur existe
    expect(wrapper.find('.map').exists()).toBe(true)

    // La carte a été initialisée et configurée
    const L = (await import('leaflet')).default
    expect(L.map).toHaveBeenCalledTimes(1)
    expect(L.tileLayer).toHaveBeenCalledTimes(1)
    expect(L.marker).toHaveBeenCalledTimes(1)

    // Le control custom a été ajouté
    expect(mapApi.addControl).toHaveBeenCalledTimes(2)

    // onAdd => containers + boutons créés
    const ajoutBtn = createdElements.find(el => el.className.includes('btn-ajout-marqueur'))
    const adminBtn = createdElements.find(el => el.className.includes('btn-admin'))
    expect(ajoutBtn).toBeTruthy()
    expect(adminBtn).toBeTruthy()
    expect(ajoutBtn.getAttribute('role')).toBe('button')
    expect(ajoutBtn.getAttribute('aria-label')).toBe('Ajouter un marqueur')
    expect(adminBtn.getAttribute('role')).toBe('button')
    expect(adminBtn.getAttribute('aria-label')).toBe('Admin')

    // Propagation désactivée sur le container
    const ajoutContainer = ajoutBtn.parentElement
    const adminContainer = adminBtn.parentElement
    expect(L.DomEvent.disableClickPropagation).toHaveBeenCalledWith(ajoutContainer)
    expect(L.DomEvent.disableScrollPropagation).toHaveBeenCalledWith(ajoutContainer)
    expect(L.DomEvent.disableClickPropagation).toHaveBeenCalledWith(adminContainer)
    expect(L.DomEvent.disableScrollPropagation).toHaveBeenCalledWith(adminContainer)

    // Panneau fermé au départ
    expect(wrapper.find('aside.panel').exists()).toBe(false)

    // Clic sur "Ajouter un marqueur" => ouverture du panneau (panelOpen = true)
    ajoutBtn.__handlers.click({})
    await wrapper.vm.$nextTick()
    expect(wrapper.find('aside.panel').exists()).toBe(true)

    // Listener clavier enregistré
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    // Clic Admin → preventDefault + router.push('/admin')
    const evt = {}
    adminBtn.__handlers.click(evt)
    expect(L.DomEvent.preventDefault).toHaveBeenCalled() // ou .toHaveBeenCalledWith(evt)
    expect(routerPushMock).toHaveBeenCalled()
    const arg = routerPushMock.mock.calls[0][0]
    if (typeof arg === 'string') {
      expect(arg).toBe('/connexion')
    } else if (arg && typeof arg === 'object') {
      if ('path' in arg) expect(arg.path).toBe('/connexion')
      else if ('name' in arg) expect(String(arg.name).toLowerCase()).toBe('connexion')
      else throw new Error('router.push doit cibler "/admin" (path ou name).')
    } else {
      throw new Error('router.push argument inattendu')
    }

    // Unmount => nettoyage
    wrapper.unmount()
    expect(mapApi.removeControl).toHaveBeenCalledTimes(2)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(mapApi.remove).toHaveBeenCalledTimes(1)
  })
})
