import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock du DOM
const mockScrollTo = vi.fn();
const mockRequestAnimationFrame = vi.fn((cb) => cb());

Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

Object.defineProperty(window, 'scrollY', {
  value: 100,
  writable: true
});

// Mock du document.body
const mockBody = {
  style: {}
};

Object.defineProperty(document, 'body', {
  value: mockBody,
  writable: true
});

describe('useBodyScroll', () => {
  let useBodyScroll;

  beforeEach(async () => {
    // Reset les mocks avant chaque test
    vi.clearAllMocks();
    mockBody.style = {};
    window.scrollY = 100;
    
    // Reset les modules pour obtenir une nouvelle instance
    vi.resetModules();
    
    // Import dynamique pour une nouvelle instance
    const module = await import('./useBodyScroll.js');
    useBodyScroll = module.useBodyScroll;
  });

  afterEach(() => {
    // Nettoyage après chaque test
    mockBody.style = {};
  });

  describe('disableScroll', () => {
    it('should disable body scroll and save position', () => {
      const { disableScroll } = useBodyScroll();
      
      disableScroll();

      expect(mockBody.style.position).toBe('fixed');
      expect(mockBody.style.top).toBe('-100px');
      expect(mockBody.style.left).toBe('0');
      expect(mockBody.style.right).toBe('0');
      expect(mockBody.style.overflow).toBe('hidden');
    });

    it('should increment lock count for multiple calls', () => {
      const { disableScroll, enableScroll } = useBodyScroll();
      
      disableScroll();
      disableScroll(); // Deuxième appel
      
      enableScroll();
      // Le scroll ne devrait pas être restauré car lockCount > 0
      expect(mockBody.style.position).toBe('fixed');
      
      enableScroll(); // Deuxième enableScroll
      // Maintenant le scroll devrait être restauré
      expect(mockBody.style.position).toBe('');
    });
  });

  describe('enableScroll', () => {
    it('should restore body scroll and position', () => {
      const { disableScroll, enableScroll } = useBodyScroll();
      
      disableScroll();
      enableScroll();

      expect(mockBody.style.position).toBe('');
      expect(mockBody.style.top).toBe('');
      expect(mockBody.style.left).toBe('');
      expect(mockBody.style.right).toBe('');
      expect(mockBody.style.overflow).toBe('');
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 100,
        behavior: 'instant'
      });
    });

    it('should not scroll if saved position is 0', () => {
      window.scrollY = 0;
      const { disableScroll, enableScroll } = useBodyScroll();
      
      disableScroll();
      enableScroll();

      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('toggleScroll', () => {
    it('should disable scroll when true', () => {
      const { toggleScroll } = useBodyScroll();
      
      toggleScroll(true);

      expect(mockBody.style.position).toBe('fixed');
    });

    it('should enable scroll when false', () => {
      const { disableScroll, toggleScroll } = useBodyScroll();
      
      disableScroll();
      toggleScroll(false);

      expect(mockBody.style.position).toBe('');
    });
  });

  describe('lockScrollWhen', () => {
    it('should watch reactive condition and toggle scroll', async () => {
      const { lockScrollWhen } = useBodyScroll();
      const { ref } = await import('vue');
      
      const isModalOpen = ref(false);
      lockScrollWhen(isModalOpen);

      // Ouvrir le modal
      isModalOpen.value = true;
      await new Promise(resolve => setTimeout(resolve, 0)); // Attendre le watcher
      
      expect(mockBody.style.position).toBe('fixed');

      // Fermer le modal
      isModalOpen.value = false;
      await new Promise(resolve => setTimeout(resolve, 0)); // Attendre le watcher
      
      expect(mockBody.style.position).toBe('');
    });
  });

  describe('isLocked state', () => {
    it('should reflect the current lock state', () => {
      const { isLocked, disableScroll, enableScroll } = useBodyScroll();
      
      expect(isLocked.value).toBe(false);
      
      disableScroll();
      expect(isLocked.value).toBe(true);
      
      enableScroll();
      expect(isLocked.value).toBe(false);
    });
  });
});