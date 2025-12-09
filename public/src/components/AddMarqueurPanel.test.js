import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import AddMarqueurPanel from './AddMarqueurPanel.vue'

// Mock des fonctions utils
vi.mock('../utils/utils.js', () => ({
  isValidEmail: vi.fn((email) => email.includes('@'))
}))

vi.mock('../utils/cloudinary.js', () => ({
  uploadMultipleImages: vi.fn(() => Promise.resolve([
    { publicId: 'img1', url: 'http://example.com/img1.jpg' },
    { publicId: 'img2', url: 'http://example.com/img2.jpg' }
  ])),
  cleanupImages: vi.fn(() => Promise.resolve())
}))

vi.mock('../utils/geocode.js', () => ({
  geocodeAddress: vi.fn(),
  fetchAdresseSuggestions: vi.fn(() => Promise.resolve([]))
}))

// Mock du store
const mockMarqueurStore = {
  marqueurs: [],
  getMarqueurs: vi.fn(() => Promise.resolve()),
  ajouterMarqueur: vi.fn(() => Promise.resolve({ id: 1, message: 'Marqueur créé' }))
}

vi.mock('../stores/useMarqueur.js', () => ({
  useMarqueurStore: vi.fn(() => mockMarqueurStore)
}))

// Mock du store de catégories
const mockCategorieStore = {
  activeCategories: [
    { _id: 'cat1', nom: 'Restaurant' },
    { _id: 'cat2', nom: 'Hôtel' }
  ],
  fetchCategories: vi.fn(() => Promise.resolve())
}

vi.mock('../stores/useCategorie.js', () => ({
  useCategorieStore: vi.fn(() => mockCategorieStore)
}))


import { uploadMultipleImages, cleanupImages } from '../utils/cloudinary.js'
import { geocodeAddress } from '../utils/geocode.js'
import { useMarqueurStore } from '../stores/useMarqueur.js';

describe('AddMarqueurPanel.vue', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('monte correctement avec les props par défaut', () => {
    wrapper = mount(AddMarqueurPanel, {
      props: {
        isOpen: true,
        coordinates: { lng: '', lat: '' },
        adresse: ''
      },
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.find('.panel').exists()).toBe(true)
    expect(wrapper.find('h3').text()).toBe('Ajouter un lieu')
    expect(wrapper.find('#titre').exists()).toBe(true)
    expect(wrapper.find('#description').exists()).toBe(true)
  })

  it('n\'affiche pas le panel quand isOpen est false', () => {
    wrapper = mount(AddMarqueurPanel, {
      props: {
        isOpen: false,
        coordinates: { lng: '', lat: '' },
        adresse: ''
      },
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.find('.panel').exists()).toBe(false)
  })

  it('met à jour les coordonnées quand les props changent', async () => {
    wrapper = mount(AddMarqueurPanel, {
      props: {
        isOpen: true,
        coordinates: { lng: '-73.56', lat: '45.5' },
        adresse: ''
      },
      global: {
        plugins: [createPinia()]
      }
    })

    await nextTick()

    expect(wrapper.find('#lng').element.value).toBe('-73.56')
    expect(wrapper.find('#lat').element.value).toBe('45.5')
  })

  it('émet close quand le bouton fermer est cliqué', async () => {
    wrapper = mount(AddMarqueurPanel, {
      props: {
        isOpen: true,
        coordinates: { lng: '', lat: '' },
        adresse: ''
      },
      global: {
        plugins: [createPinia()]
      }
    })

    await wrapper.find('.panel__close').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  describe('Validation du formulaire', () => {
    beforeEach(() => {
      wrapper = mount(AddMarqueurPanel, {
        props: {
          isOpen: true,
          coordinates: { lng: '', lat: '' },
          adresse: ''
        },
        global: {
          plugins: [createPinia()]
        }
      })
    })

    it('valide un formulaire correct', async () => {
      await wrapper.find('#titre').setValue('Mon lieu')
      await wrapper.find('#description').setValue('Description du lieu')
      await wrapper.find('#adresse').setValue('123 Rue Test, Québec')

      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(true)
    })

    it('invalide si titre manquant', async () => {
      await wrapper.find('#description').setValue('Description du lieu')
      await wrapper.find('#adresse').setValue('123 Rue Test, Québec')

      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.formErrors.titre).toBe('Le titre est requis.')
    })

    it('invalide si description manquante', async () => {
      await wrapper.find('#titre').setValue('Mon lieu')
      await wrapper.find('#adresse').setValue('123 Rue Test, Québec')

      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.formErrors.description).toBe('La description est requise.')
    })

    it('invalide si ni adresse ni coordonnées', async () => {
      await wrapper.find('#titre').setValue('Mon lieu')
      await wrapper.find('#description').setValue('Description du lieu')

      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.formErrors.error).toBe('Il faut fournir une adresse ou des coordonnées (longitude et latitude).')
    })

    it('invalide si email incorrect', async () => {
      await wrapper.find('#titre').setValue('Mon lieu')
      await wrapper.find('#description').setValue('Description du lieu')
      await wrapper.find('#adresse').setValue('123 Rue Test, Québec')
      await wrapper.find('#email').setValue('email-invalide')

      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.formErrors.email).toBe('Le courriel n\'est pas valide.')
    })

    it('invalide si coordonnées partielles', async () => {
      await wrapper.find('#titre').setValue('Mon lieu')
      await wrapper.find('#description').setValue('Description du lieu')
      await wrapper.find('#lng').setValue('-73.56')
      // lat reste vide

      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.formErrors.lng).toBe('La longitude et la latitude doivent être toutes les deux remplies ou laissées vides.')
      expect(wrapper.vm.formErrors.lat).toBe('La longitude et la latitude doivent être toutes les deux remplies ou laissées vides.')
    })
  })

  describe('locateFromAddress', () => {
    beforeEach(() => {
      wrapper = mount(AddMarqueurPanel, {
        props: {
          isOpen: true,
          coordinates: { lng: '', lat: '' },
          adresse: ''
        },
        global: {
          plugins: [createPinia()]
        }
      })
    })

    it('localise une adresse et émet les coordonnées', async () => {
      await wrapper.find('#adresse').setValue('123 Rue Saint-Jean, Québec, Canada')

      geocodeAddress.mockResolvedValueOnce({
        lat: 46.8139,
        lng: -71.2082
      })

      await wrapper.vm.locateFromAddress()
      await nextTick()

      expect(geocodeAddress).toHaveBeenCalledWith({ address: '123 Rue Saint-Jean, Québec, Canada'})
      expect(wrapper.vm.form.lat).toBe(46.8139)
      expect(wrapper.vm.form.lng).toBe(-71.2082)
      expect(wrapper.emitted('locate-address')).toBeTruthy()
      expect(wrapper.emitted('locate-address')[0]).toEqual([{ lat: 46.8139, lng: -71.2082 }])
    })

    it('ne fait rien si adresse vide', async () => {
      await wrapper.find('#adresse').setValue('')

      await wrapper.vm.locateFromAddress()

      expect(geocodeAddress).not.toHaveBeenCalled()
      expect(wrapper.emitted('locate-address')).toBeFalsy()
    })

    it('gère les erreurs de géocodage', async () => {
      await wrapper.find('#adresse').setValue('Adresse inexistante')

      geocodeAddress.mockRejectedValueOnce(new Error('Geocoding failed'))

      await wrapper.vm.locateFromAddress()
      await nextTick()

      expect(wrapper.vm.formErrors.adresse).toBe('Adresse introuvable.')
    })
  })

  describe('sendRequest', () => {
    beforeEach(() => {
      wrapper = mount(AddMarqueurPanel, {
        props: {
          isOpen: true,
          coordinates: { lng: '', lat: '' },
          adresse: ''
        },
        global: {
          plugins: [createPinia()]
        }
      })

      const marqueurStore = useMarqueurStore()
      vi.spyOn(marqueurStore, 'ajouterMarqueur').mockResolvedValue({
        id: 1,
        message: 'Marqueur créé'
      })
    })

    it('envoie avec succès un formulaire valide sans images', async () => {
      const marqueurStore = useMarqueurStore()

      // Remplir le formulaire correctement
      await wrapper.find('#titre').setValue('Mon lieu')
      await wrapper.find('#description').setValue('Description du lieu')
      await wrapper.find('#adresse').setValue('123 Rue Test, Québec')
      await wrapper.find('#lat').setValue('46.8139')
      await wrapper.find('#lng').setValue('-71.2082')

      await wrapper.vm.sendRequest()

      expect(marqueurStore.ajouterMarqueur).toHaveBeenCalledWith(
        expect.objectContaining({
          titre: 'Mon lieu',
          description: 'Description du lieu',
          adresse: '123 Rue Test, Québec',
        })
      )

      expect(wrapper.emitted('marqueur-added')).toBeTruthy()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('envoie avec succès un formulaire valide avec images', async () => {
      const marqueurStore = useMarqueurStore()

      // Remplir le formulaire
      await wrapper.find('#titre').setValue('Mon lieu avec images')
      await wrapper.find('#description').setValue('Description')
      await wrapper.find('#adresse').setValue('123 Rue Test')

      // Simuler des fichiers - accéder directement à la ref
      const files = [new File([''], 'test1.jpg'), new File([''], 'test2.jpg')]
      wrapper.vm.files.splice(0, wrapper.vm.files.length, ...files)

      // Mock réponses
      uploadMultipleImages.mockResolvedValueOnce([
        { publicId: 'img1', url: 'http://example.com/img1.jpg' },
        { publicId: 'img2', url: 'http://example.com/img2.jpg' }
      ])

      await wrapper.vm.sendRequest()

      expect(uploadMultipleImages).toHaveBeenCalledWith(files)
      expect(marqueurStore.ajouterMarqueur).toHaveBeenCalledWith(
        expect.objectContaining({
          titre: 'Mon lieu avec images',
          images: [
            { publicId: 'img1', url: 'http://example.com/img1.jpg' },
            { publicId: 'img2', url: 'http://example.com/img2.jpg' }
          ]
        })
      )

      expect(wrapper.emitted('marqueur-added')).toBeTruthy()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('ne fait rien si la validation échoue', async () => {
      // Formulaire invalide (pas de titre)
      await wrapper.find('#description').setValue('Description seulement')

      await wrapper.vm.sendRequest()

      expect(uploadMultipleImages).not.toHaveBeenCalled()
      expect(wrapper.emitted('marqueur-added')).toBeFalsy()
      expect(wrapper.emitted('close')).toBeFalsy()
    })

    it('nettoie les images et relance erreur si API échoue', async () => {
      const marqueurStore = useMarqueurStore()

      // Remplir formulaire valide
      await wrapper.find('#titre').setValue('Mon lieu')
      await wrapper.find('#description').setValue('Description')
      await wrapper.find('#adresse').setValue('123 Rue Test')
      await wrapper.find('#lat').setValue('46.8139')
      await wrapper.find('#lng').setValue('-71.2082')

      // Simuler upload d'images réussi
      const files = [new File([''], 'test.jpg')]
      wrapper.vm.files.splice(0, wrapper.vm.files.length, ...files)
      uploadMultipleImages.mockResolvedValueOnce([
        { publicId: 'img1', url: 'http://example.com/img1.jpg' }
      ])

      // Mock échec API
      marqueurStore.ajouterMarqueur.mockRejectedValueOnce(new Error('Erreur serveur'))

      await expect(wrapper.vm.sendRequest()).rejects.toThrow('Erreur serveur')

      expect(cleanupImages).toHaveBeenCalledWith(['img1'])
      expect(wrapper.emitted('close')).toBeFalsy()
    })

    it('gère les erreurs de réseau', async () => {
      const marqueurStore = useMarqueurStore()

      // Remplir formulaire valide
      await wrapper.find('#titre').setValue('Mon lieu')
      await wrapper.find('#description').setValue('Description')
      await wrapper.find('#adresse').setValue('123 Rue Test')
      await wrapper.find('#lat').setValue('46.8139')
      await wrapper.find('#lng').setValue('-71.2082')

      // Mock erreur réseau
      marqueurStore.ajouterMarqueur.mockRejectedValueOnce(new Error('Network error'))

      await expect(wrapper.vm.sendRequest()).rejects.toThrow('Network error')
      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })
})
