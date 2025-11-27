import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ImageLightBox from './ImageLightbox.vue';

// Mock du composable useBodyScroll
const mockLockScrollWhen = vi.fn();
vi.mock('../composables/useBodyScroll.js', () => ({
  useBodyScroll: () => ({
    lockScrollWhen: mockLockScrollWhen
  })
}));

// Mock des event listeners
const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

describe('ImageLightBox', () => {
  const mockImages = [
    { id: 1, url: 'image1.jpg' },
    { id: 2, url: 'image2.jpg' },
    { id: 3, url: 'image3.jpg' }
  ];

  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    addEventListenerSpy.mockClear();
    removeEventListenerSpy.mockClear();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('props et état initial', () => {
    it('should render when images are provided', () => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 0
        }
      });

      expect(wrapper.find('.lightbox').exists()).toBe(true);
      expect(wrapper.find('.lb-image').attributes('src')).toBe('image1.jpg');
    });

    it('should not render when images array is empty', () => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: [],
          currentIndex: 0
        }
      });

      expect(wrapper.find('.lightbox').exists()).toBe(false);
    });

    it('should display correct image based on currentIndex', () => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 1
        }
      });

      expect(wrapper.find('.lb-image').attributes('src')).toBe('image2.jpg');
      expect(wrapper.find('.lb-image').attributes('alt')).toBe('Image 2');
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 1
        }
      });
    });

    it('should navigate between images with buttons', async () => {
      // Navigation précédente
      await wrapper.find('.lb-nav.left').trigger('click');
      expect(wrapper.emitted('update:currentIndex')[0]).toEqual([0]);
      
      // Navigation suivante
      await wrapper.find('.lb-nav.right').trigger('click');
      expect(wrapper.emitted('update:currentIndex')[1]).toEqual([2]);
    });

    it('should wrap around at boundaries', async () => {
      // Test wrap around à la fin
      await wrapper.setProps({ currentIndex: 2 });
      await wrapper.find('.lb-nav.right').trigger('click');
      expect(wrapper.emitted('update:currentIndex')[0]).toEqual([0]);
      
      // Test wrap around au début
      await wrapper.setProps({ currentIndex: 0 });
      await wrapper.find('.lb-nav.left').trigger('click');
      expect(wrapper.emitted('update:currentIndex')[1]).toEqual([2]);
    });
  });

  describe('dots navigation', () => {
    it('should render dots, highlight active one, and navigate on click', async () => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 1
        }
      });
      
      const dots = wrapper.findAll('.dot');
      
      // Vérifie le nombre de dots
      expect(dots).toHaveLength(3);
      
      // Vérifie que le bon dot est actif
      expect(dots[1].classes()).toContain('active');
      expect(dots[0].classes()).not.toContain('active');
      
      // Vérifie la navigation par clic
      await dots[2].trigger('click');
      expect(wrapper.emitted('update:currentIndex')[0]).toEqual([2]);
    });
  });

  describe('closing', () => {
    beforeEach(() => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 0
        }
      });
    });

    it('should emit close when close button is clicked', async () => {
      await wrapper.find('.lb-close').trigger('click');
      
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close when clicking outside image', async () => {
      await wrapper.find('.lightbox').trigger('click');
      
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should not close when clicking on image', async () => {
      await wrapper.find('.lb-image').trigger('click');
      
      expect(wrapper.emitted('close')).toBeFalsy();
    });
  });

  describe('keyboard navigation', () => {
    it('should setup and cleanup keyboard listeners', () => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 1
        }
      });
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      wrapper.unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should handle keyboard events for navigation and closing', () => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 1
        }
      });
      
      // Test Escape pour fermer
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(wrapper.emitted('close')).toBeTruthy();
      
      // Test ArrowLeft pour image précédente
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      expect(wrapper.emitted('update:currentIndex')[0]).toEqual([0]);
      
      // Test ArrowRight pour image suivante
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(wrapper.emitted('update:currentIndex')[1]).toEqual([2]);
    });
  });

  describe('body scroll integration', () => {
    it('should call lockScrollWhen with canDisplayLightbox', () => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 0
        }
      });

      expect(mockLockScrollWhen).toHaveBeenCalled();
    });
  });

  describe('reactive props', () => {
    it('should react to prop changes correctly', async () => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 0
        }
      });
      
      // Test changement d'index
      expect(wrapper.find('.lb-image').attributes('src')).toBe('image1.jpg');
      await wrapper.setProps({ currentIndex: 2 });
      expect(wrapper.find('.lb-image').attributes('src')).toBe('image3.jpg');
      
      // Test masquage/affichage selon images
      expect(wrapper.find('.lightbox').exists()).toBe(true);
      await wrapper.setProps({ images: [] });
      expect(wrapper.find('.lightbox').exists()).toBe(false);
      await wrapper.setProps({ images: mockImages });
      expect(wrapper.find('.lightbox').exists()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility attributes', () => {
      wrapper = mount(ImageLightBox, {
        props: {
          images: mockImages,
          currentIndex: 0
        }
      });
      
      // Vérification des labels ARIA des boutons
      expect(wrapper.find('.lb-close').attributes('aria-label')).toBe('Fermer');
      expect(wrapper.find('.lb-nav.left').attributes('aria-label')).toBe('Suivante');
      expect(wrapper.find('.lb-nav.right').attributes('aria-label')).toBe('Précédente');
      
      // Vérification des labels des dots
      const dots = wrapper.findAll('.dot');
      expect(dots[0].attributes('aria-label')).toContain('image 1');
      expect(dots[1].attributes('aria-label')).toContain('image 2');
      
      // Vérification du tabindex
      expect(wrapper.find('.lightbox').attributes('tabindex')).toBe('0');
    });
  });
});