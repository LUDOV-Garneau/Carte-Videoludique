import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import { describe, it, expect } from 'vitest'

// un router minimal pour les tests
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Home</div>' } }]
})

describe('App.vue', () => {
  it('montre correctement le routerView', async () => {
    router.push('/')
    await router.isReady()

    const pinia = createPinia()

    const wrapper = mount(App, {
      global: {
        plugins: [router, pinia]
      }
    })
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })
})