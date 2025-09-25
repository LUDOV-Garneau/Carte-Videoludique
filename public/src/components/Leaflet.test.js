import { mount } from '@vue/test-utils'
import LeafletMap from './LeafletMap.vue'
import { describe, it, expect } from 'vitest'

describe('LeafletMap.vue', () => {
  it('monte correctement le composant', () => {
    const wrapper = mount(LeafletMap)
    expect(wrapper.exists()).toBe(true)
  })
})