import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MarqueurModal from '@/components/MarqueurModalComponent.vue'


vi.mock('../utils/geocode', () => ({
  fetchAdresseSuggestions: vi.fn(() => Promise.resolve()),
  geocodeAddress: vi.fn(() =>
    Promise.resolve({ lat: 45.5121273, lng: -73.6023346 })
  ),
}))

vi.mock('../components/AddImage.vue', () => ({
  default: {
    name: 'AddImage',
    template: '<div></div>',
  }
}))

import { fetchAdresseSuggestions, geocodeAddress } from '@/utils/geocode'

const baseMarqueur = {
  _id: 'marq-123',
  properties: {
    id: 'marq-123',
    titre: '172, avenue Pagnuelo',
    type: 'Autres',
    adresse: '172, avenue Pagnuelo, Montréal, QC',
    description: 'Desc initiale',
    temoignage: '',
    images: [],
    status: 'pending',
  },
}

describe('MarqueurModalComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hydrate les champs à partir des props', async () => {
    const wrapper = mount(MarqueurModal, {
      props: {
        attachTo: document.body,
        marqueur: baseMarqueur,
      },
    })

    const titreInput = wrapper.get('#titreMarqueur')
    const typeSelect = wrapper.get('#typeMarqueur')
    const adresseInput = wrapper.get('#adresseMarqueur')
    const descTextarea = wrapper.get('#descriptionMarqueur')

    expect(titreInput.element.value).toBe(baseMarqueur.properties.titre)
    expect(typeSelect.element.value).toBe(baseMarqueur.properties.type)
    expect(adresseInput.element.value).toBe(baseMarqueur.properties.adresse)
    expect(descTextarea.element.value).toBe(baseMarqueur.properties.description)
  })

  it("appelle geocode et émet 'locate-from-address' quand on tape une adresse", async () => {
    const wrapper = mount(MarqueurModal, {
      attachTo: document.body,  
      props: {
        marqueur: baseMarqueur,
      },
    })

    const adresseInput = wrapper.get('#adresseMarqueur')

    await adresseInput.setValue('1304 Boulevard du Mont-Royal')
    await adresseInput.trigger('input')

    await flushPromises()

    expect(fetchAdresseSuggestions).toHaveBeenCalled()
    expect(geocodeAddress).toHaveBeenCalledWith(
      '1304 Boulevard du Mont-Royal'
    )

    const emits = wrapper.emitted('locate-from-address')
    expect(emits).toBeTruthy()
    expect(emits[0][0]).toEqual({
      lat: 45.5121273,
      lng: -73.6023346,
    })
  })

  it("émet 'valider' avec les champs mis à jour et lat/lng", async () => {
    const wrapper = mount(MarqueurModal, {
      props: {
        marqueur: baseMarqueur,
      },
    })

    // on change quelques champs
    await wrapper.get('#titreMarqueur').setValue('Nouveau titre')
    await wrapper
      .get('#adresseMarqueur')
      .setValue('1304 Boulevard du Mont-Royal')
    await wrapper.get('#descriptionMarqueur').setValue('Nouvelle description')

    // submit du formulaire
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(geocodeAddress).toHaveBeenCalled() // si latitude/lng null, valider() géocode

    const emits = wrapper.emitted('valider')
    expect(emits).toBeTruthy()

    const payload = emits[0][0]

    // id
    expect(payload._id).toBe(baseMarqueur._id)

    // propriétés modifiées
    expect(payload.properties.titre).toBe('Nouveau titre')
    expect(payload.properties.adresse).toBe('1304 Boulevard du Mont-Royal')
    expect(payload.properties.description).toBe('Nouvelle description')

    // lat/lng envoyés
    expect(payload.lat).toBe(45.5121273)
    expect(payload.lng).toBe(-73.6023346)
  })
})