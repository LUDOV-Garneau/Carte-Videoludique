import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

// --- Mocks d'assets (sinon Vitest râle sur les .png)
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: 'marker-icon.png' }), { virtual: true })
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: 'marker-icon-2x.png' }), { virtual: true })
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: 'marker-shadow.png' }), { virtual: true })

// --- Mock de Leaflet (namespace L exporté en default)
const mapApi = {
  setView: vi.fn().mockReturnThis(),
  on: vi.fn(),
  addControl: vi.fn(),
  removeControl: vi.fn(),
  remove: vi.fn(),
}
const tileLayerApi = { addTo: vi.fn() }
const markerApi = { addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis() }

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
    create: (tag, className) => {
      const el = document.createElement(tag)
      if (className) el.className = className
      return el
    },
  }
  const DomEvent = {
    disableClickPropagation: vi.fn(),
    disableScrollPropagation: vi.fn(),
    on: vi.fn(),
    preventDefault: vi.fn(),
  }
  // Simuler le prototype de L.Marker accédé dans ton composant
  function Marker() {}
  Marker.prototype.options = {}

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

import LeafletMap from './LeafletMap.vue'

describe('LeafletMap.vue', () => {
  it('monte correctement le composant et initialise la carte', async () => {
    const wrapper = mount(LeafletMap)

    // Le conteneur existe
    expect(wrapper.find('.map').exists()).toBe(true)

    // La carte a été initialisée et configurée
    const L = (await import('leaflet')).default
    expect(L.map).toHaveBeenCalledTimes(1)
    expect(L.tileLayer).toHaveBeenCalledTimes(1)
    expect(L.marker).toHaveBeenCalledTimes(1)

    // Le control custom a été ajouté
    expect(mapApi.addControl).toHaveBeenCalledTimes(1)

    // Unmount => nettoyage
    wrapper.unmount()
    expect(mapApi.removeControl).toHaveBeenCalledTimes(1)
    expect(mapApi.remove).toHaveBeenCalledTimes(1)
  })
})