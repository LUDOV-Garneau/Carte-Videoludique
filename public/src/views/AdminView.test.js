
import { mount } from '@vue/test-utils'
import AdminView from './AdminView.vue'
import { createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach} from 'vitest'
import { defineComponent } from 'vue'
import { useMarqueursStore } from '../stores/useMarqueur'


const LeafletMapStub = defineComponent({
  name: 'LeafletMap',
  template: '<div data-testid="map"></div>',
})

describe('AdminView.vue', () => {
  let wrapper
  let pinia
  beforeEach(() => {
    // Créer une nouvelle instance de Pinia pour chaque test
    pinia = createPinia()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('se monte sans erreur', () => {
    const wrapper = mount(AdminView, {
      global: { 
        plugins: [pinia], 
        stubs: { LeafletMap: LeafletMapStub } 
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('affiche le titre et la section notification', () => {
    const wrapper = mount(AdminView, {
      global: { stubs: { LeafletMap: LeafletMapStub } }
    })
    expect(wrapper.find('h1').text()).toContain('Le jeu vidéo au Québec')
    expect(wrapper.find('h2').text()).toBe('Notifications')
  })

  it('affiche un message vide si aucune offre', () => {
    const wrapper = mount(AdminView, {
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

    const marqueurStore = useMarqueursStore()

    marqueurStore.marqueurs = [{
      properties: {
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
    const wrapper = mount(AdminView, {
      global: { stubs: { LeafletMap: LeafletMapStub } }
    })
    expect(wrapper.get('[data-testid="map"]').exists()).toBe(true)
  })
})
