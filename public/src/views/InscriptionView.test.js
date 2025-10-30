import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
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

    const wrapper = mount(InscriptionView, {
      global: { plugins: [router] }
    })

    wrapper.vm.nom = 'Dupont'
    wrapper.vm.prenom = 'Marie'
    wrapper.vm.email = 'marie@example.com'
    wrapper.vm.motdepasse = 'abcdef'
    wrapper.vm.confirmation = 'abcdef'

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.vm.messageSucces).toBe('Compte créé avec succès ! Redirection en cours...')
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

    wrapper.vm.nom = 'Dupont'
    wrapper.vm.prenom = 'Marie'
    wrapper.vm.email = 'marie@example.com'
    wrapper.vm.motdepasse = 'abcdef'
    wrapper.vm.confirmation = 'abcdef'

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.vm.erreurServeur).toBe('Erreur serveur')
    expect(fetch).toHaveBeenCalled()
  })
})
