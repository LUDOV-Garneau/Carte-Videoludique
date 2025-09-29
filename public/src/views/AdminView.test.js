import { mount } from '@vue/test-utils'
import AdminView from './AdminView.vue'
import { describe, it, expect } from 'vitest'

describe('AdminView.vue', () => {
  it('montre correctement l\'accueil', () => {
    const wrapper = mount(AdminView, {
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