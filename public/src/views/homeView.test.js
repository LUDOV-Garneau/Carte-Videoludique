import { mount } from '@vue/test-utils'
import HomeView from './HomeView.vue'
import { describe, it, expect } from 'vitest'


describe('HomeView.vue', () => {
  const LeafletMapStub = {
    template: '<div data-testid="map"></div>'
  }

  const NavBarStub = {
    template: '<nav data-testid="navbar"></nav>'
  }

  it("Se monte sans erreur", () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          LeafletMap: LeafletMapStub,
          NavBar: NavBarStub
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("Affiche la barre de navigation", () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          LeafletMap: LeafletMapStub,
          NavBar: NavBarStub
        }
      }
    })
    expect(wrapper.get('[data-testid="navbar"]').exists()).toBe(true)
  })

  it("Rend la carte dans la page", () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          LeafletMap: LeafletMapStub,
          NavBar: NavBarStub
        }
      }
    })

    expect(wrapper.get('[data-testid="map"]').exists()).toBe(true)
  })
})