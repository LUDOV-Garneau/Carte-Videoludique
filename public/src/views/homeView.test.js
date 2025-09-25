import { mount } from '@vue/test-utils'
import HomeView from './HomeView.vue'
import { describe, it, expect } from 'vitest'

describe('HomeView.vue', () => {
  it('montre correctement l\'accueil', () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          LeafletMap: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'LeafletMap' }).exists()).toBe(true)
  })
})