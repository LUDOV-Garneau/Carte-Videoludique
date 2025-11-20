import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NavBar from '../components/NavBar.vue'

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(), 
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
  },
}))

describe('NavBar.vue', () => {
  it("Affiche le titre du site", () => {
    const wrapper = mount(NavBar, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    expect(wrapper.find('h1').text()).toContain('Le jeu vidéo au Québec')
  })
})