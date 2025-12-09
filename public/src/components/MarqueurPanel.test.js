import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MarqueurPanel from './MarqueurPanel.vue'

// Mock des API globales
globalThis.fetch = vi.fn()
globalThis.navigator = {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
}

// Créer les mocks des stores
const mockMarqueurStore = {
  marqueurActif: {
    properties: {
      id: '1',
      titre: 'Titre de test',
      type: 'Studio',
      description: 'Description de test',
      adresse: '123 Rue Test, Québec',
      temoignage: 'Témoignage de test',
      createdByName: 'Utilisateur Test',
      images: [{ url: 'https://example.com/image.jpg' }],
      comments: [
        { auteur: 'Auteur 1', contenu: 'Commentaire 1' },
        { auteur: 'Auteur 2', contenu: 'Commentaire 2' }
      ]
    },
    geometry: {
      coordinates: [-71.2082, 46.8139]
    }
  },
  supprimerMarqueur: vi.fn()
}

const mockAuthStore = {
  isAuthenticated: false,
  token: null
}

const mockEditRequestStore = {
  createEditRequest: vi.fn()
}

// Mock des modules avec des chemins relatifs
vi.mock('../stores/useMarqueur.js', () => ({
  useMarqueurStore: () => mockMarqueurStore
}))

vi.mock('../stores/auth.js', () => ({
  useAuthStore: () => mockAuthStore
}))

vi.mock('../stores/useEditRequest.js', () => ({
  useEditRequestStore: () => mockEditRequestStore
}))

vi.mock('../config.js', () => ({
  API_URL: 'http://localhost:3000'
}))

// Mock du composable useLightbox
const mockLightbox = {
  isOpen: false,
  currentIndex: 0,
  images: [],
  openLightbox: vi.fn((imgs, index) => {
    mockLightbox.isOpen = true
    mockLightbox.currentIndex = index
    mockLightbox.images = imgs
  }),
  closeLightbox: vi.fn(() => {
    mockLightbox.isOpen = false
    mockLightbox.currentIndex = 0
    mockLightbox.images = []
  })
}

vi.mock('../composables/useLightbox.js', () => ({
  useLightbox: () => mockLightbox
}))

describe('MarqueurPanel.vue', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Reset des mocks
    vi.clearAllMocks()
    mockLightbox.isOpen = false
    mockLightbox.currentIndex = 0
    mockLightbox.images = []
    
    // Reset des mocks
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = false
    mockAuthStore.token = null
    
    // Reset du marqueur actif
    mockMarqueurStore.marqueurActif = {
      properties: {
        id: '1',
        titre: 'Titre de test',
        type: 'Studio',
        description: 'Description de test',
        adresse: '123 Rue Test, Québec',
        temoignage: 'Témoignage de test',
        createdByName: 'Utilisateur Test',
        images: [{ url: 'https://example.com/image.jpg' }],
        comments: [
          { auteur: 'Auteur 1', contenu: 'Commentaire 1' },
          { auteur: 'Auteur 2', contenu: 'Commentaire 2' }
        ]
      },
      geometry: {
        coordinates: [-71.2082, 46.8139]
      }
    }
  })

  const mountComponent = (props = {}) => {
    return mount(MarqueurPanel, {
      props: {
        isOpen: true,
        ...props
      },
      global: {
        plugins: [pinia],
        stubs: {
          MarqueurModal: true
        }
      }
    })
  }

  describe('Affichage du panneau', () => {
    it('affiche le panneau quand isOpen est true et qu\'il y a un marqueur actif', () => {
      wrapper = mountComponent()
      
      expect(wrapper.find('.panel').exists()).toBe(true)
      expect(wrapper.find('.panel__header h3').text()).toBe('Titre de test')
      expect(wrapper.find('.panel__header p').text()).toBe('Catégorie : Studio')
    })

    it('n\'affiche pas le panneau quand isOpen est false', () => {
      wrapper = mountComponent({ isOpen: false })
      
      expect(wrapper.find('.panel').exists()).toBe(false)
    })

    it('n\'affiche pas le panneau quand il n\'y a pas de marqueur actif', () => {
      mockMarqueurStore.marqueurActif = null
      wrapper = mountComponent()
      
      expect(wrapper.find('.panel').exists()).toBe(false)
    })

    it('affiche les informations du marqueur', () => {
      wrapper = mountComponent()
      
      expect(wrapper.text()).toContain('Description de test')
      expect(wrapper.text()).toContain('Créé par : Utilisateur Test')
      expect(wrapper.text()).toContain('123 Rue Test, Québec')
      expect(wrapper.text()).toContain('-71.2082, 46.8139')
    })
  })

  describe('Fermeture du panneau', () => {
    it('émet l\'événement close quand on clique sur le bouton fermer', async () => {
      wrapper = mountComponent()
      
      await wrapper.find('.panel__close').trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('Bouton de demande de modification', () => {
    it('affiche le bouton de demande de modification', () => {
      wrapper = mountComponent()
      
      const buttons = wrapper.findAll('button')
      const modifyButton = buttons.find(btn => 
        btn.text().includes('Demander une modification')
      )
      expect(modifyButton).toBeTruthy()
    })

    it('ouvre la modal de modification quand on clique sur le bouton', async () => {
      wrapper = mountComponent()
      
      const buttons = wrapper.findAll('button')
      const modifyButton = buttons.find(btn => 
        btn.text().includes('Demander une modification')
      )
      await modifyButton.trigger('click')
      
      expect(wrapper.vm.isEditModalOpen).toBe(true)
    })
  })

  describe('Fonctionnalités d\'administration', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.token = 'fake-token'
    })

    it('affiche le bouton de suppression quand l\'utilisateur est authentifié', () => {
      wrapper = mountComponent()
      
      const buttons = wrapper.findAll('button')
      const deleteButton = buttons.find(btn => 
        btn.text().includes('Supprimer le marqueur')
      )
      expect(deleteButton).toBeTruthy()
    })

    it('affiche la confirmation de suppression quand on clique sur supprimer', async () => {
      wrapper = mountComponent()
      
      const buttons = wrapper.findAll('button')
      const deleteButton = buttons.find(btn => 
        btn.text().includes('Supprimer le marqueur')
      )
      await deleteButton.trigger('click')
      
      expect(wrapper.find('.delete-confirmation').exists()).toBe(true)
      expect(wrapper.text()).toContain('Êtes-vous sûr de vouloir supprimer ce marqueur')
    })

    it('appelle la fonction de suppression quand on confirme', async () => {
      wrapper = mountComponent()
      
      // Ouvrir la confirmation
      const buttons = wrapper.findAll('button')
      const deleteButton = buttons.find(btn => 
        btn.text().includes('Supprimer le marqueur')
      )
      await deleteButton.trigger('click')
      
      // Confirmer la suppression
      const confirmButton = wrapper.find('.delete-confirmation button')
      await confirmButton.trigger('click')
      
      expect(mockMarqueurStore.supprimerMarqueur).toHaveBeenCalledWith('1', 'fake-token')
      expect(wrapper.emitted('marqueur-deleted')).toBeTruthy()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

  })

  describe('Système de commentaires', () => {
    it('affiche "Aucun témoignage" quand il n\'y a pas de commentaires', () => {
      mockMarqueurStore.marqueurActif.properties.comments = []
      wrapper = mountComponent()
      
      expect(wrapper.text()).toContain('Aucun témoignage')
    })

    it('affiche le bouton pour ajouter un témoignage', () => {
      wrapper = mountComponent()
      
      const buttons = wrapper.findAll('button')
      const addButton = buttons.find(btn => 
        btn.text().includes('Ajouter un témoignage')
      )
      expect(addButton).toBeTruthy()
    })

    it('valide le formulaire de commentaire correctement', async () => {
      wrapper = mountComponent()
      
      // Ouvrir le formulaire
      const buttons = wrapper.findAll('button')
      const addButton = buttons.find(btn => 
        btn.text().includes('Ajouter un témoignage')
      )
      await addButton.trigger('click')
      
      // Remplir avec des données invalides
      await wrapper.find('#auteur').setValue('a'.repeat(51)) // Trop long
      await wrapper.find('#contenu').setValue('') // Vide
      
      const result = wrapper.vm.validateCommentForm()
      
      expect(result).toBe(false)
      expect(wrapper.vm.formErrors.auteur).toContain('50 caractères')
      expect(wrapper.vm.formErrors.contenu).toContain('ne peut pas être vide')
    })

    it('envoie un commentaire valide', async () => {
      // Mock de la réponse fetch
      globalThis.fetch.mockResolvedValueOnce({
        status: 201,
        json: () => Promise.resolve({
          data: { auteur: 'Test User', contenu: 'Test comment' }
        })
      })
      
      wrapper = mountComponent()
      
      // Ouvrir le formulaire
      const buttons = wrapper.findAll('button')
      const addButton = buttons.find(btn => 
        btn.text().includes('Ajouter un témoignage')
      )
      await addButton.trigger('click')
      
      // Remplir le formulaire
      await wrapper.find('#auteur').setValue('Test User')
      await wrapper.find('#contenu').setValue('Test comment')
      
      // Soumettre
      await wrapper.find('.add-comment-form').trigger('submit')
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/marqueurs/1/commentaires',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auteur: 'Test User', texte: 'Test comment' })
        })
      )
    })

  })

  describe('Demandes de modification', () => {
    it('soumet une demande de modification', async () => {
      mockEditRequestStore.createEditRequest.mockResolvedValue({})
      
      wrapper = mountComponent()
      
      const mockPayload = {
        properties: {
          titre: 'Nouveau titre',
          categorie: 'cat1',
          adresse: 'Nouvelle adresse',
          description: 'Nouvelle description',
          temoignage: 'Nouveau témoignage'
        }
      }
      
      await wrapper.vm.handleEditRequestSubmit(mockPayload)
      
      expect(mockEditRequestStore.createEditRequest).toHaveBeenCalledWith('1', {
        titre: 'Nouveau titre',
        categorie: 'cat1',
        adresse: 'Nouvelle adresse',
        description: 'Nouvelle description',
        temoignage: 'Nouveau témoignage'
      })
      
      expect(wrapper.vm.isEditModalOpen).toBe(false)
    })

  })

  describe('Onglets du menu', () => {
    it('affiche l\'onglet Aperçu par défaut', () => {
      wrapper = mountComponent()
      
      const buttons = wrapper.findAll('.panel__menu button')
      const apercuButton = buttons[0] // Premier bouton
      const imagesButton = buttons[1] // Deuxième bouton
      
      expect(apercuButton.classes()).toContain('active')
      expect(imagesButton.classes()).not.toContain('active')
      expect(wrapper.vm.activeTab).toBe('apercu')
    })

    it('change vers l\'onglet Images', async () => {
      wrapper = mountComponent()
      
      const buttons = wrapper.findAll('.panel__menu button')
      const imagesButton = buttons[1] // Deuxième bouton (Images)
      await imagesButton.trigger('click')
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.activeTab).toBe('images')
      expect(imagesButton.classes()).toContain('active')
      
      const apercuButton = buttons[0] // Premier bouton (Aperçu)
      expect(apercuButton.classes()).not.toContain('active')
    })

    it('affiche le contenu approprié selon l\'onglet sélectionné', async () => {
      wrapper = mountComponent()
      
      // Vérifier le contenu de l'onglet Aperçu (div qui contient panel__section)
      expect(wrapper.find('.panel__section').exists()).toBe(true)
      expect(wrapper.findAll('.panel__images')).toHaveLength(0)
      
      // Changer vers l'onglet Images
      const buttons = wrapper.findAll('.panel__menu button')
      const imagesButton = buttons[1]
      await imagesButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Vérifier le contenu de l'onglet Images
      expect(wrapper.find('.panel__section').exists()).toBe(false)
      expect(wrapper.findAll('.panel__images').length).toBeGreaterThan(0)
    })
  })

  describe('Galerie d\'images et lightbox', () => {
    beforeEach(() => {
      mockMarqueurStore.marqueurActif = {
        properties: {
          id: '1',
          titre: 'Titre de test',
          type: 'Studio',
          description: 'Description de test',
          adresse: '123 Rue Test, Québec',
          temoignage: 'Témoignage de test',
          createdByName: 'Utilisateur Test',
          images: [
            { publicId: 'img1', url: 'https://example.com/image1.jpg' },
            { publicId: 'img2', url: 'https://example.com/image2.jpg' },
            { publicId: 'img3', url: 'https://example.com/image3.jpg' }
          ],
          comments: []
        },
        geometry: {
          coordinates: [-71.2082, 46.8139]
        }
      }
    })

    it('affiche les images dans l\'onglet Images', async () => {
      wrapper = mountComponent()
      
      // Changer vers l'onglet Images
      const buttons = wrapper.findAll('.panel__menu button')
      const imagesButton = buttons[1]
      await imagesButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      const images = wrapper.findAll('.panel__images')
      expect(images).toHaveLength(3)
      
      // Vérifier que les images ont les bonnes sources
      expect(images[0].attributes('src')).toBe('https://example.com/image1.jpg')
      expect(images[1].attributes('src')).toBe('https://example.com/image2.jpg')
      expect(images[2].attributes('src')).toBe('https://example.com/image3.jpg')
    })

    it('ouvre la lightbox au clic sur une image', async () => {
      wrapper = mountComponent()
      
      // Changer vers l'onglet Images
      const buttons = wrapper.findAll('.panel__menu button')
      const imagesButton = buttons[1]
      await imagesButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Cliquer sur la deuxième image (index 1)
      const secondImage = wrapper.findAll('.panel__images')[1]
      await secondImage.trigger('click')
      
      // Vérifier que la lightbox est ouverte avec la bonne image
      expect(mockLightbox.openLightbox).toHaveBeenCalledWith([
        { publicId: 'img1', url: 'https://example.com/image1.jpg' },
        { publicId: 'img2', url: 'https://example.com/image2.jpg' },
        { publicId: 'img3', url: 'https://example.com/image3.jpg' }
      ], 1)
      expect(mockLightbox.isOpen).toBe(true)
      expect(mockLightbox.currentIndex).toBe(1)
    })

    it('affiche aucune image quand il n\'y a pas d\'images', async () => {
      mockMarqueurStore.marqueurActif.properties.images = []
      wrapper = mountComponent()
      
      // Changer vers l'onglet Images
      const buttons = wrapper.findAll('.panel__menu button')
      const imagesButton = buttons[1]
      await imagesButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.findAll('.panel__images')).toHaveLength(0)
    })

    it('gère le cas où la propriété images est undefined', async () => {
      mockMarqueurStore.marqueurActif.properties.images = undefined
      wrapper = mountComponent()
      
      // Changer vers l'onglet Images
      const buttons = wrapper.findAll('.panel__menu button')
      const imagesButton = buttons[1]
      await imagesButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.findAll('.panel__images')).toHaveLength(0)
    })

    it('ferme la lightbox correctement', async () => {
      wrapper = mountComponent()
      
      // Changer vers l'onglet Images et ouvrir la lightbox
      const buttons = wrapper.findAll('.panel__menu button')
      const imagesButton = buttons[1]
      await imagesButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      const firstImage = wrapper.findAll('.panel__images')[0]
      await firstImage.trigger('click')
      
      expect(mockLightbox.isOpen).toBe(true)
      
      // Fermer la lightbox
      mockLightbox.closeLightbox()
      
      expect(mockLightbox.isOpen).toBe(false)
    })
  })

  describe('Cas de limite et erreurs', () => {
    it('gère le cas où marqueurActif est null dans openModificationRequest', () => {
      mockMarqueurStore.marqueurActif = null
      wrapper = mountComponent({ isOpen: false }) // Le panneau ne s'affichera pas
      
      // Cette fonction devrait ne rien faire si marqueurActif est null
      expect(() => wrapper.vm.openModificationRequest()).not.toThrow()
      expect(wrapper.vm.isEditModalOpen).toBe(false)
    })

    it('gère les erreurs lors de l\'envoi de commentaires', async () => {
      globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))
      
      wrapper = mountComponent()
      
      // Ouvrir le formulaire
      const buttons = wrapper.findAll('button')
      const addButton = buttons.find(btn => 
        btn.text().includes('Ajouter un témoignage')
      )
      await addButton.trigger('click')
      
      // Remplir le formulaire
      await wrapper.find('#auteur').setValue('Test User')
      await wrapper.find('#contenu').setValue('Test comment')
      
      // Soumettre et vérifier que l'erreur est gérée
      await expect(wrapper.vm.sendComment()).rejects.toThrow('Network error')
    })

  })
})