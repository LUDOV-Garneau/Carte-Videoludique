import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AccountsView from '@/views/AccountsView.vue'

// Mock du store Pinia
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    token: 'fake-token',
    decodedToken: { id: '123' },
  }),
}))

// Mock du fichier config
vi.mock('@/config', () => ({
  API_URL: 'http://fake-api.com',
}))

describe('AccountsView', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { id: '123', nom: 'Moi', prenom: 'Test', role: 'Admin', _id: '123' },
              { id: '456', nom: 'Jean', prenom: 'Dupont', role: 'User', _id: '456' },
            ],
          }),
      }),
    )
  })

  it('charge et affiche les utilisateurs', async () => {
    const wrapper = mount(AccountsView)
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(2)

    expect(rows[0].text()).toContain('Moi')
    expect(rows[1].text()).toContain('Jean')
  })

  it('cache les boutons pour l’utilisateur connecté', async () => {
    const wrapper = mount(AccountsView)
    await flushPromises()

    // On prend la 1ère ligne (utilisateur connecté)
    const tds = wrapper.findAll('tbody tr')[0].findAll('td')

    // Le TD des actions est le 4e (index 3)
    const actionTd = tds[3]

    expect(actionTd.text()).toContain('Votre profil')
    expect(actionTd.text()).not.toContain('Modifier')
  })

  it('affiche les boutons pour les autres utilisateurs', async () => {
    const wrapper = mount(AccountsView)
    await flushPromises()

    const secondRow = wrapper.findAll('tbody tr')[1]
    const buttons = secondRow.findAll('button')

    expect(buttons.length).toBe(2)
    expect(buttons[0].text()).toBe('Modifier')
    expect(buttons[1].text()).toBe('Supprimer')
  })

  it('appelle deleteUser lorsqu’on clique sur Supprimer', async () => {
    const wrapper = mount(AccountsView)

    // On espionne la fonction deleteUser du composant
    const deleteSpy = vi.spyOn(wrapper.vm, 'deleteUser')

    await flushPromises()

    const secondRow = wrapper.findAll('tbody tr')[1]
    const deleteButton = secondRow.findAll('button')[1]

    await deleteButton.trigger('click')

    expect(deleteSpy).toHaveBeenCalled()
  })

  it('appelle editUser lorsqu’on clique sur Modifier', async () => {
    const wrapper = mount(AccountsView)

    await flushPromises()

    // espionner la méthode
    const editSpy = vi.spyOn(wrapper.vm, 'editUser')

    const secondRow = wrapper.findAll('tbody tr')[1]
    const editButton = secondRow.findAll('button')[0] // bouton Modifier

    await editButton.trigger('click')

    expect(editSpy).toHaveBeenCalled()
  })
})
