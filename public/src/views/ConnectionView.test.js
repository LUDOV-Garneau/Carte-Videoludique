import { mount } from '@vue/test-utils'
import ConnectionView from "./ConnectionView.vue";
import {describe, it, expect, beforeEach, vi} from 'vitest';
import flushPromises from 'flush-promises';

const { pushMock, setTokenMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  setTokenMock: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}))

vi.mock('../stores/auth.js', () => ({
  useAuthStore: () => ({ setToken: setTokenMock })
}))

describe('ConnectionView', () => {

    beforeEach(() => {
        vi.restoreAllMocks()
        globalThis.fetch = vi.fn()
    })

    it('Se monte sans erreur', () => {
        const wrapper = mount(ConnectionView, {
            attachTo: document.body
        })
         expect(wrapper.exists()).toBe(true)
         expect(wrapper.find('#email').exists()).toBe(true)
         expect(wrapper.find('#password').exists()).toBe(true)
         expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
         expect(wrapper.find('.error').exists()).toBe(false)
    })

    it('Validation : Champs vides', async() => {
        const wrapper = mount(ConnectionView, {
            attachTo: document.body
        })
        await wrapper.find('form').trigger('submit.prevent')
        const errors = wrapper.findAll('.error').map(e => e.text())
        expect(errors).toContain("L'email est requis.")
        expect(errors).toContain('Le mot de passe est requis.')
        expect(fetch).not.toHaveBeenCalled()
    })

    it('Appel réseau OK -> setToken + redirect /admin', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ data: { token: 'jwt-123' } })
        })
        const wrapper = mount(ConnectionView, {
            attachTo: document.body
        })
        await wrapper.find('#email').setValue('a@b.ca')
        await wrapper.find('#password').setValue('wrong')
        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()
    })

    it('401/échec auth -> affiche erreur, pas de setToken, pas de redirect', async() => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Identifiants invalides' }),
        })

        const wrapper = mount(ConnectionView, { attachTo: document.body })
        await wrapper.find('#email').setValue('a@b.ca')
        await wrapper.find('#password').setValue('bad')
        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(setTokenMock).not.toHaveBeenCalled()
        expect(pushMock).not.toHaveBeenCalled()
       
        expect(wrapper.find('.error').exists()).toBe(true)
    })
    
    it('Erreur réseau (fetch reject) → message générique, pas de setToken, pas de redirect', async () => {
        fetch.mockRejectedValueOnce(new Error('Network down'))

        const wrapper = mount(ConnectionView, { attachTo: document.body })
        await wrapper.find('#email').setValue('a@b.ca')
        await wrapper.find('#password').setValue('okok')
        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(setTokenMock).not.toHaveBeenCalled()
        expect(pushMock).not.toHaveBeenCalled()
        expect(wrapper.find('.error').exists()).toBe(true)
    })
    
})
