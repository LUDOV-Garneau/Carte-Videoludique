// src/components/AddImage.test.js
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import AddImage from './AddImage.vue'

// Mock du composable useLightbox
const mockLightbox = {
  isOpen: { value: false },
  images: { value: [] },
  currentIndex: { value: 0 },
  openLightbox: vi.fn()
}

vi.mock('../composables/useLightbox.js', () => ({
  useLightbox: () => mockLightbox
}))

// Mock URL.createObjectURL et URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  // Réinitialiser le mock lightbox
  mockLightbox.isOpen.value = false
  mockLightbox.images.value = []
  mockLightbox.currentIndex.value = 0
  
  vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('AddImage.vue', () => {
  
  /* --------------------------------- */
  /* Tests du montage et état initial  */
  /* --------------------------------- */
  
  it('monte correctement avec état initial vide', () => {
    const wrapper = mount(AddImage)
    
    expect(wrapper.find('.add-image').exists()).toBe(true)
    expect(wrapper.find('.btn-add').exists()).toBe(true)
    expect(wrapper.find('.btn-add .add-text').text()).toBe('Ajouter une image')
    expect(wrapper.find('.tiles').exists()).toBe(false)
  })

  it('affiche les images initiales', async () => {
    const initialUrls = [
      'http://example.com/img1.jpg',
      'http://example.com/img2.jpg'
    ]
    
    const wrapper = mount(AddImage, {
      props: { initialUrls }
    })
    
    await nextTick()
    
    expect(wrapper.find('.tiles').exists()).toBe(true)
    expect(wrapper.findAll('.tile img')).toHaveLength(2)
    expect(wrapper.find('.btn-add-tile').exists()).toBe(true)
  })

  /* --------------------------------- */
  /* Tests d'ajout de fichiers         */
  /* --------------------------------- */

  it('ouvre le sélecteur de fichiers au clic sur le bouton', () => {
    const wrapper = mount(AddImage)
    const fileInput = wrapper.find('input[type="file"]')
    const clickSpy = vi.spyOn(fileInput.element, 'click')
    
    wrapper.find('.btn-add').trigger('click')
    
    expect(clickSpy).toHaveBeenCalled()
  })

  it('ajoute des fichiers et émet les événements', async () => {
    const wrapper = mount(AddImage)
    
    // Simuler la sélection de fichiers en appelant directement addFiles
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
    
    // Appeler directement addFiles (méthode exposée du composant)
    wrapper.vm.addFiles([file1, file2])
    await nextTick()
    
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(2)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([file1, file2])
    expect(wrapper.emitted('change')).toHaveLength(1)
    expect(wrapper.emitted('change')[0][0]).toEqual([file1, file2])
    
    // Vérifier que l'interface s'adapte
    expect(wrapper.find('.tiles').exists()).toBe(true)
    expect(wrapper.findAll('.thumbnail img')).toHaveLength(2)
  })

  /* --------------------------------- */
  /* Tests de suppression d'images     */
  /* --------------------------------- */

  it('supprime une image et nettoie l\'URL', async () => {
    const wrapper = mount(AddImage)
    
    // Ajouter une image via addFiles
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    wrapper.vm.addFiles([file])
    await nextTick()
    
    expect(wrapper.findAll('.thumbnail img')).toHaveLength(1)
    
    // Supprimer l'image
    const removeBtn = wrapper.find('.btn-delete')
    await removeBtn.trigger('click')
    
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2) // add + remove
    expect(wrapper.emitted('update:modelValue')[1][0]).toEqual([]) // tableau vide
    expect(wrapper.find('.btn-add').exists()).toBe(true) // retour à l'état initial
  })

  it('ne nettoie pas les URLs d\'images externes lors de la suppression', async () => {
    const initialUrls = ['http://example.com/external.jpg']
    const wrapper = mount(AddImage, {
      props: { initialUrls }
    })
    
    await nextTick()
    
    // Supprimer l'image externe
    const removeBtn = wrapper.find('.btn-delete')
    await removeBtn.trigger('click')
    
    expect(mockRevokeObjectURL).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([]) // pas de fichiers
  })

  /* --------------------------------- */
  /* Tests du lightbox                 */
  /* --------------------------------- */

  it('ouvre le lightbox quand on clique sur une image', async () => {
    const initialUrls = ['http://example.com/img1.jpg']
    const wrapper = mount(AddImage, {
      props: { initialUrls }
    })
    
    await nextTick()
    
    // Vérifier que le lightbox est fermé initialement
    expect(mockLightbox.isOpen.value).toBe(false)
    
    // Cliquer sur l'image
    await wrapper.find('.thumbnail').trigger('click')
    
    // Vérifier que openLightbox a été appelée
    expect(mockLightbox.openLightbox).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          url: 'http://example.com/img1.jpg'
        })
      ]),
      0
    )
  })

  /* --------------------------------- */
  /* Tests de nettoyage                */
  /* --------------------------------- */

  it('nettoie les URLs d\'objets à la destruction', async () => {
    const wrapper = mount(AddImage)
    
    // Ajouter des fichiers
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    wrapper.vm.addFiles([file])
    await nextTick()
    
    // Détruire le composant
    wrapper.unmount()
    
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})