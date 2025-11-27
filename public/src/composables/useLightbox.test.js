import { describe, it, expect, beforeEach } from 'vitest';
import { useLightbox } from './useLightbox.js';

describe('useLightbox', () => {
  let lightbox;

  beforeEach(() => {
    lightbox = useLightbox();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      expect(lightbox.isOpen.value).toBe(false);
      expect(lightbox.currentIndex.value).toBe(0);
      expect(lightbox.images.value).toEqual([]);
    });
  });

  describe('openLightbox', () => {
    const mockImages = [
      { id: 1, url: 'image1.jpg' },
      { id: 2, url: 'image2.jpg' },
      { id: 3, url: 'image3.jpg' }
    ];

    it('should open lightbox with images and default index', () => {
      lightbox.openLightbox(mockImages);

      expect(lightbox.isOpen.value).toBe(true);
      expect(lightbox.currentIndex.value).toBe(0);
      expect(lightbox.images.value).toEqual(mockImages);
    });

    it('should open lightbox with specific start index', () => {
      lightbox.openLightbox(mockImages, 2);

      expect(lightbox.isOpen.value).toBe(true);
      expect(lightbox.currentIndex.value).toBe(2);
      expect(lightbox.images.value).toEqual(mockImages);
    });

    it('should handle empty images array', () => {
      lightbox.openLightbox([]);

      expect(lightbox.isOpen.value).toBe(true);
      expect(lightbox.currentIndex.value).toBe(0);
      expect(lightbox.images.value).toEqual([]);
    });

    it('should handle null/undefined images', () => {
      lightbox.openLightbox(null);

      expect(lightbox.isOpen.value).toBe(true);
      expect(lightbox.currentIndex.value).toBe(0);
      expect(lightbox.images.value).toEqual([]);
    });

    it('should handle negative start index', () => {
      lightbox.openLightbox(mockImages, -1);

      expect(lightbox.isOpen.value).toBe(true);
      expect(lightbox.currentIndex.value).toBe(-1); // Garde la valeur passée
      expect(lightbox.images.value).toEqual(mockImages);
    });

    it('should handle start index beyond array length', () => {
      lightbox.openLightbox(mockImages, 10);

      expect(lightbox.isOpen.value).toBe(true);
      expect(lightbox.currentIndex.value).toBe(10); // Garde la valeur passée
      expect(lightbox.images.value).toEqual(mockImages);
    });
  });

  describe('closeLightbox', () => {
    const mockImages = [
      { id: 1, url: 'image1.jpg' },
      { id: 2, url: 'image2.jpg' }
    ];

    it('should close lightbox and reset state', () => {
      // Ouvrir d'abord
      lightbox.openLightbox(mockImages, 1);
      expect(lightbox.isOpen.value).toBe(true);

      // Fermer
      lightbox.closeLightbox();

      expect(lightbox.isOpen.value).toBe(false);
      expect(lightbox.currentIndex.value).toBe(0);
      expect(lightbox.images.value).toEqual([]);
    });

    it('should be safe to call when already closed', () => {
      expect(lightbox.isOpen.value).toBe(false);
      
      // Ne devrait pas lever d'erreur
      expect(() => lightbox.closeLightbox()).not.toThrow();
      
      expect(lightbox.isOpen.value).toBe(false);
      expect(lightbox.currentIndex.value).toBe(0);
      expect(lightbox.images.value).toEqual([]);
    });
  });

  describe('multiple instances', () => {
    it('should create independent instances', () => {
      const lightbox1 = useLightbox();
      const lightbox2 = useLightbox();

      const images1 = [{ id: 1, url: 'image1.jpg' }];
      const images2 = [{ id: 2, url: 'image2.jpg' }];

      lightbox1.openLightbox(images1, 0);
      lightbox2.openLightbox(images2, 0);

      expect(lightbox1.isOpen.value).toBe(true);
      expect(lightbox2.isOpen.value).toBe(true);
      expect(lightbox1.images.value).toEqual(images1);
      expect(lightbox2.images.value).toEqual(images2);

      lightbox1.closeLightbox();

      expect(lightbox1.isOpen.value).toBe(false);
      expect(lightbox2.isOpen.value).toBe(true); // Pas affecté
    });
  });

  describe('reactivity', () => {
    it('should have reactive properties', () => {
      const mockImages = [{ id: 1, url: 'image1.jpg' }];
      
      // Watchers pour tester la réactivité (simulation)
      const originalIsOpen = lightbox.isOpen.value;
      const originalImages = lightbox.images.value;

      lightbox.openLightbox(mockImages, 0);

      // Vérifier que les valeurs ont changé
      expect(lightbox.isOpen.value).not.toBe(originalIsOpen);
      expect(lightbox.images.value).not.toBe(originalImages);
    });
  });
});