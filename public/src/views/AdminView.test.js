import { mount } from '@vue/test-utils'
import AdminView from './AdminView.vue'
import { describe, it, expect } from 'vitest'
import { defineComponent } from 'vue'

const LeafletMapStub = defineComponent({
  name: 'LeafletMap',
  template: '<div data-testid="map"></div>',
})

describe('AdminView.vue', () => {
  it('se monte sans erreur', () => {
    const wrapper = mount(AdminView, {
      global: { stubs: { LeafletMap: LeafletMapStub } }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('affiche le titre et la section notification', () => {
    const wrapper = mount(AdminView, {
      global: { stubs: { LeafletMap: LeafletMapStub } }
    })
    expect(wrapper.find('h1').text()).toContain('Le jeu vidéo au Québec')
    expect(wrapper.find('h2').text()).toBe('Notification')
  })

  it('affiche un message vide si aucune offre', () => {
    const wrapper = mount(AdminView, {
      global: { stubs: { LeafletMap: LeafletMapStub } },
      data() {
        return { rows: [] }
      }
    })
    expect(wrapper.text()).toContain('Aucune offre pour le moment.')
    expect(wrapper.find('.clear-btn').exists()).toBe(true)
  })

  it('rend les lignes quand rows est fourni', () => {
    const wrapper = mount(AdminView, {
      global: { stubs: { LeafletMap: LeafletMapStub } },
      data() {
        return { rows: [{ id: 1, provider: 'Vidéotron', address: '2300 rue X' }] }
      }
    })
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
})
