import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import InscriptionView from '@/views/InscriptionView.vue'

// Création d'un faux router pour tester la redirection
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/connexion', name: 'Connexion' }],
})

// Mock global de fetch
global.fetch = vi.fn()

describe('Inscription.vue', () => {
  beforeEach(() => {
    fetch.mockReset()
  })

  it('affiche des erreurs si les champs sont vides', async () => {
    const wrapper = mount(InscriptionView, {
      global: { plugins: [router] }
    })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Le nom est requis.')
    expect(wrapper.text()).toContain('Le prénom est requis.')
    expect(wrapper.text()).toContain('Le courriel est requis.')
    expect(wrapper.text()).toContain('Mot de passe requis.')
    expect(wrapper.text()).toContain('Une confirmation de mot de passe est requise.')
  })

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    const wrapper = mount(InscriptionView, {
      global: { plugins: [router] }
    })

    wrapper.vm.nom = 'Dupont'
    wrapper.vm.prenom = 'Marie'
    wrapper.vm.email = 'test@example.com'
    wrapper.vm.motdepasse = '123456'
    wrapper.vm.confirmation = '654321'

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Les mots de passe ne correspondent pas.')
  })

  it('affiche un message de succès et redirige après inscription', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Compte créé avec succès' })
    })
    
    await router.push('/')
    await router.isReady()

    const wrapper = mount(InscriptionView, {
      global: { plugins: [router] }
    })

    await wrapper.find('#nom').setValue('Dupont')
    await wrapper.find('#prenom').setValue('Marie')   // <-- existe maintenant
    await wrapper.find('#email').setValue('marie@example.com')
    await wrapper.find('#motdepasse').setValue('abcdef')
    await wrapper.find('#confirmation').setValue('abcdef')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    await nextTick()

    const msg = wrapper.find('.alert.alert-success')
    console.log('msg.exists():', msg.exists())
    console.log('msg.html():', msg.html())
    console.log('wrapper.html():', wrapper.html())
    expect(msg.exists()).toBe(true)
    expect(msg.text()).toBe('Compte créé avec succès ! Redirection en cours...')

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('affiche une erreur serveur si l’API échoue', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Erreur serveur' })
    })

    const wrapper = mount(InscriptionView, {
      global: { plugins: [router] }
    })

    await wrapper.find('#nom').setValue('Dupont')
    await wrapper.find('#prenom').setValue('Marie')   // <-- existe maintenant
    await wrapper.find('#email').setValue('marie@example.com')
    await wrapper.find('#motdepasse').setValue('abcdef')
    await wrapper.find('#confirmation').setValue('abcdef')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.vm.erreurServeur).toBe('Erreur de connexion au serveur')
    expect(fetch).toHaveBeenCalledTimes(0)
  })
})
