import { mount } from '@vue/test-utils'
import HomeView from './HomeView.vue'
import { describe, it, expect } from 'vitest'
import { defineComponent } from 'vue'



const LeafletMapStub = defineComponent({
  name: 'LeafletMap',
  template: '<div data-testid="map"></div>',
})

describe('HomeView.vue', () => {
  it("Se monte sans erreur", () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { LeafletMap: LeafletMapStub} }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it("Affiche le titre et la marque vertical", () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { LeafletMap: LeafletMapStub} }
    })
    expect(wrapper.find('h1').text()).toContain("Le jeu vidéo au Québec")
  })

  it("Rend la carte dans la page", () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { LeafletMap: LeafletMapStub} }
    })
    expect(wrapper.get('[data-testid="map"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'LeafletMap' }).exists()).toBe(true)
  })
})