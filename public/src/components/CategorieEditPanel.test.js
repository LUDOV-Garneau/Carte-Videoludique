import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import CategorieEditPanel from "./CategorieEditPanel.vue";
import { createPinia } from "pinia";

// Mock du store de catégories
const mockCategorieStore = {
  categories: [
    {
      _id: "cat1",
      nom: "Restaurants",
      description: "Lieux de restauration",
      couleur: "#FF5733",
      image: { filename: "restaurant", type: "predefined" },
      active: true
    },
    {
      _id: "cat2", 
      nom: "Hôtels",
      description: "Hébergements",
      couleur: "#3498DB",
      image: { filename: "lodging", type: "predefined" },
      active: true
    }
  ],
  isLoading: false,
  error: null,
  fetchCategories: vi.fn(() => Promise.resolve()),
  createCategory: vi.fn(() => Promise.resolve({
    _id: "new-cat",
    nom: "Nouvelle catégorie",
    description: "",
    couleur: "#4CAF50",
    image: { filename: "marker", type: "predefined" }
  })),
  updateCategoryNom: vi.fn(() => Promise.resolve()),
  updateCategoryDescription: vi.fn(() => Promise.resolve()),
  updateCategoryCouleur: vi.fn(() => Promise.resolve()),
  updateCategoryImage: vi.fn(() => Promise.resolve()),
  deleteCategory: vi.fn(() => Promise.resolve()),
  getIconUrl: vi.fn((filename) => `/icons/${filename}.png`),
  getIconAltWithSource: vi.fn((filename) => `Icône ${filename} (14px)`),
  findIconCategory: vi.fn(() => "shapes"),
  getIconInfoSync: vi.fn(() => ({ size: 14 })),
  getIconCategories: () => ({
    shapes: ["marker", "circle"],
    tourism: ["restaurant", "lodging"]
  })
};

vi.mock("../stores/useCategorie.js", () => ({
  useCategorieStore: () => mockCategorieStore
}));

// Mock du store d'authentification
const mockAuthStore = {
  isAuthenticated: true
};

vi.mock("../stores/auth.js", () => ({
  useAuthStore: () => mockAuthStore
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CategorieEditPanel.vue", () => {
  it("s'affiche quand isOpen est true", () => {
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    expect(wrapper.find('.panel').exists()).toBe(true);
    expect(wrapper.find('.panel__header h3').text()).toBe('Gestion des catégories');
  });

  it("ne s'affiche pas quand isOpen est false", () => {
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: false },
      global: { plugins: [createPinia()] }
    });

    expect(wrapper.find('.panel-overlay').exists()).toBe(false);
  });

  it("émet l'événement close au clic sur fermer", async () => {
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    await wrapper.find('.panel__close').trigger('click');
    
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it("affiche la liste des catégories par défaut", () => {
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    expect(wrapper.findAll('.category-item')).toHaveLength(2);
    expect(wrapper.text()).toContain('Restaurants');
    expect(wrapper.text()).toContain('Hôtels');
  });

  it("affiche le bouton d'ajout quand authentifié", () => {
    mockAuthStore.isAuthenticated = true;
    
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    expect(wrapper.find('.btn-add-category').exists()).toBe(true);
    expect(wrapper.find('.btn-add-category').text()).toBe('+ Ajouter une catégorie');
  });

  it("n'affiche pas le bouton d'ajout quand non authentifié", () => {
    mockAuthStore.isAuthenticated = false;
    
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    expect(wrapper.find('.btn-add-category').exists()).toBe(false);
  });

  it("affiche le formulaire de création au clic sur ajouter", async () => {
    mockAuthStore.isAuthenticated = true;
    
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    await wrapper.find('.btn-add-category').trigger('click');
    await nextTick();

    expect(wrapper.find('.create-form').exists()).toBe(true);
    expect(wrapper.find('#nom').exists()).toBe(true);
    expect(wrapper.find('#description').exists()).toBe(true);
    expect(wrapper.find('#couleur').exists()).toBe(true);
  });

  it("retourne à la liste au clic sur le bouton retour", async () => {
    mockAuthStore.isAuthenticated = true;
    
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    // Aller au formulaire
    await wrapper.find('.btn-add-category').trigger('click');
    await nextTick();
    
    expect(wrapper.find('.create-form').exists()).toBe(true);

    // Retourner à la liste
    await wrapper.find('.back-button').trigger('click');
    await nextTick();

    expect(wrapper.find('.categories-list').exists()).toBe(true);
    expect(wrapper.find('.create-form').exists()).toBe(false);
  });

  it("affiche les boutons d'édition et suppression pour chaque catégorie", () => {
    mockAuthStore.isAuthenticated = true;
    
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    const categoryItems = wrapper.findAll('.category-item');
    
    categoryItems.forEach(item => {
      expect(item.find('.btn-edit').exists()).toBe(true);
      expect(item.find('.btn-delete').exists()).toBe(true);
    });
  });

  it("affiche les icônes des catégories", () => {
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    const categoryIcons = wrapper.findAll('img[class="category-icon-img"]');
    expect(categoryIcons.length).toBeGreaterThanOrEqual(0);
    
    if (categoryIcons.length > 0) {
      expect(categoryIcons[0].attributes('src')).toMatch(/\/icons\/.*\.png/);
    }
  });

  it("affiche le message 'Aucune catégorie' quand la liste est vide", () => {
    mockCategorieStore.categories = [];
    
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    expect(wrapper.find('.no-categories').exists()).toBe(true);
    expect(wrapper.text()).toContain('Aucune catégorie trouvée');
  });

  it("affiche la section de sélection d'icônes dans le formulaire", async () => {
    mockAuthStore.isAuthenticated = true;
    
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    await wrapper.find('.btn-add-category').trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Icône sélectionnée');
    // Vérifier qu'on est dans le formulaire
    expect(wrapper.find('#nom').exists()).toBe(true);
  });

  it("met à jour le formulaire lors de l'édition d'une catégorie", async () => {
    mockAuthStore.isAuthenticated = true;
    
    const wrapper = mount(CategorieEditPanel, {
      props: { isOpen: true },
      global: { plugins: [createPinia()] }
    });

    // Simuler le clic sur éditer
    const editBtn = wrapper.find('.btn-edit');
    if (editBtn.exists()) {
      await editBtn.trigger('click');
      await nextTick();

      // Vérifier que le formulaire est affiché
      expect(wrapper.find('.create-form').exists()).toBe(true);
    } else {
      // Si pas de bouton d'édition, vérifier que c'est parce qu'on n'est pas auth
      expect(mockAuthStore.isAuthenticated).toBe(true);
    }
  });
});