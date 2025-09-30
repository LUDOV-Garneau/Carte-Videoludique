import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'
import HomeView from '../views/HomeView.vue'
import AdminView from '../views/AdminView.vue'


const routes = [
    { path: '/', name: 'home', component: HomeView },
    { path: '/admin', name: 'admin', component: AdminView },
]

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes
  })
}

describe('router', () => {
    it('Rend HomeView sur /', async () => {
        const router = makeRouter()
        router.push('/')
        await router.isReady()

        const wrapper = mount(App, { global: { plugins: [router]}})
        expect(wrapper.find('h1').text()).toContain('Le jeu vidéo au Québec')
    })

    it('rend AdminView sur /admin', async () => {
        const router = makeRouter()
        router.push('/admin')
        await router.isReady()

        const wrapper = mount(App, { global: { plugins: [router] } })
        expect(wrapper.find('h2').text()).toBe('Notification')
    })

    it('génère les bonnes URLs par name', async () => {
        const router = makeRouter()
        const homeLink = router.resolve({ name: 'home' })
        const adminLink = router.resolve({ name: 'admin' })

        expect(homeLink.href).toBe('/')
        expect(adminLink.href).toBe('/admin')
    })
})