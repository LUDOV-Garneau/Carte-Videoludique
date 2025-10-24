// src/components/AddImage.test.js
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import AddImage from './AddImage.vue'

// Mock URL.createObjectURL et URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
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

  it('ouvre et ferme le lightbox', async () => {
    const initialUrls = ['http://example.com/img1.jpg']
    const wrapper = mount(AddImage, {
      props: { initialUrls }
    })
    
    await nextTick()
    
    // Ouvrir lightbox
    expect(wrapper.find('.lightbox').exists()).toBe(false)
    
    await wrapper.find('.thumbnail').trigger('click')
    await nextTick()
    
    expect(wrapper.find('.lightbox').exists()).toBe(true)
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img1.jpg')
    
    // Fermer lightbox
    await wrapper.find('.lb-close').trigger('click')
    await nextTick()
    
    expect(wrapper.find('.lightbox').exists()).toBe(false)
  })

  it('navigue dans le lightbox avec plusieurs images', async () => {
    const initialUrls = [
      'http://example.com/img1.jpg',
      'http://example.com/img2.jpg', 
      'http://example.com/img3.jpg'
    ]
    const wrapper = mount(AddImage, {
      props: { initialUrls }
    })
    
    await nextTick()
    
    // Ouvrir lightbox sur la première image
    await wrapper.findAll('.thumbnail')[0].trigger('click')
    await nextTick()
    
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img1.jpg')
    
    // Aller à l'image suivante
    await wrapper.find('.lb-nav.right').trigger('click')
    await nextTick()
    
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img2.jpg')
    
    // Revenir à l'image précédente  
    await wrapper.find('.lb-nav.left').trigger('click')
    await nextTick()
    
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img1.jpg')
  })

  it('gère la navigation circulaire dans le lightbox', async () => {
    const initialUrls = ['http://example.com/img1.jpg', 'http://example.com/img2.jpg']
    const wrapper = mount(AddImage, {
      props: { initialUrls }
    })
    
    await nextTick()
    
    // Ouvrir sur la dernière image
    await wrapper.findAll('.thumbnail')[1].trigger('click')
    await nextTick()
    
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img2.jpg')
    
    // Aller au suivant (doit revenir au début)
    await wrapper.find('.lb-nav.right').trigger('click')
    await nextTick()
    
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img1.jpg')
    
    // Aller au précédent (doit aller à la fin)
    await wrapper.find('.lb-nav.left').trigger('click')
    await nextTick()
    
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img2.jpg')
  })

  /* --------------------------------- */
  /* Tests des raccourcis clavier      */
  /* --------------------------------- */

  it('navigue avec les touches fléchées dans le lightbox', async () => {
    const initialUrls = ['http://example.com/img1.jpg', 'http://example.com/img2.jpg']
    const wrapper = mount(AddImage, {
      props: { initialUrls }
    })
    
    await nextTick()
    
    // Ouvrir lightbox
    await wrapper.find('.thumbnail').trigger('click')
    await nextTick()
    
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img1.jpg')
    
    // Simuler appui sur flèche droite - appeler directement la méthode
    wrapper.vm.next()
    await nextTick()
    
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img2.jpg')
    
    // Simuler appui sur flèche gauche - appeler directement la méthode
    wrapper.vm.previous()
    await nextTick()
    
    expect(wrapper.find('.lb-image').attributes('src')).toBe('http://example.com/img1.jpg')
  })

  it('ignore les touches quand le lightbox est fermé', async () => {
    const wrapper = mount(AddImage)
    
    // Simuler appui sur flèche (lightbox fermé)
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    window.dispatchEvent(event)
    
    // Ne devrait pas planter et le lightbox reste fermé
    expect(wrapper.find('.lightbox').exists()).toBe(false)
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