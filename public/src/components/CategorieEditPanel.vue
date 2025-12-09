<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useCategorieStore } from '../stores/useCategorie.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const categorieStore = useCategorieStore()

// États locaux
const activeTab = ref('liste')
const selectedIconCategory = ref('shapes')
const isDeleting = ref(false)
const deletingCategoryId = ref(null)
const editingCategoryId = ref(null)
const isCreating = ref(false)

// Formulaire
const form = ref({
  nom: '',
  description: '',
  couleur: '#4CAF50',
  image: {
    type: 'predefined',
    filename: 'marker'
  }
})

const selectedIcon = ref('marker')

// Computed
const canDisplayPanel = computed(() => props.isOpen)

const selectedIconUrl = computed(() => {
  return categorieStore.getIconUrl(selectedIcon.value, selectedIconCategory.value)
})



// Méthodes
function closePanel() {
  resetForm()
  activeTab.value = 'liste'
  emit('close')
}

async function showCreateForm() {
  try {
    isCreating.value = true
    
    // Créer une nouvelle catégorie avec des valeurs par défaut
    const nextNumber = categorieStore.categories.length + 1
    const newCategory = {
      nom: `Catégorie ${nextNumber}`,
      description: '',
      couleur: '#4CAF50',
      image: {
        type: 'predefined',
        filename: 'marker'
      }
    }
    
    const createdCategory = await categorieStore.createCategory(newCategory)
    editingCategoryId.value = createdCategory._id
    
    // Remplir le formulaire avec les données de la catégorie créée
    form.value = {
      nom: createdCategory.nom,
      description: createdCategory.description,
      couleur: createdCategory.couleur,
      image: createdCategory.image
    }
    selectedIcon.value = createdCategory.image.filename
    
    activeTab.value = 'creer'
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error)
  } finally {
    isCreating.value = false
  }
}

function backToList() {
  editingCategoryId.value = null
  resetForm()
  activeTab.value = 'liste'
}

// Fonction pour modifier une catégorie existante
function editCategory(category) {
  activeTab.value = 'creer'
  editingCategoryId.value = category._id
  
  // Remplir le formulaire avec les données de la catégorie
  form.value = {
    nom: category.nom || '',
    description: category.description || '',
    couleur: category.couleur || '#3498db',
    image: category.image || { filename: 'marker', size: 14 }
  }
  
  // Mettre à jour l'icône sélectionnée
  if (category.image && category.image.filename) {
    selectedIcon.value = category.image.filename
    
    // Trouver la catégorie de cette icône pour l'affichage
    const iconCategory = categorieStore.findIconCategory(category.image.filename)
    if (iconCategory) {
      selectedIconCategory.value = iconCategory
    }
  }
}

function selectIcon(iconName, category) {
  selectedIcon.value = iconName
  selectedIconCategory.value = category
  form.value.image.filename = iconName
  
  // Sauvegarder automatiquement si on est en train d'éditer
  if (editingCategoryId.value) {
    debouncedSaveChanges()
  }
}

// Fonction pour détecter et sauvegarder les changements avec debounce
const debouncedSaveChanges = debounce(async () => {
  if (editingCategoryId.value) {
    try {
      const currentCategory = categorieStore.categories.find(cat => cat._id === editingCategoryId.value)
      
      if (currentCategory) {
        // Vérifier chaque propriété individuellement et utiliser la fonction PATCH appropriée
        if (form.value.nom !== currentCategory.nom) {
          await categorieStore.updateCategoryNom(editingCategoryId.value, form.value.nom)
        }
        
        if (form.value.description !== currentCategory.description) {
          await categorieStore.updateCategoryDescription(editingCategoryId.value, form.value.description)
        }
        
        if (form.value.couleur !== currentCategory.couleur) {
          await categorieStore.updateCategoryCouleur(editingCategoryId.value, form.value.couleur)
        }
        
        if (form.value.image !== currentCategory.image) {
          await categorieStore.updateCategoryImage(editingCategoryId.value, form.value.image)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }
}, 500)

// Fonction debounce simple
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function resetForm() {
  form.value = {
    nom: '',
    description: '',
    couleur: '#4CAF50',
    image: {
      type: 'predefined',
      filename: 'marker'
    }
  }
  selectedIcon.value = 'marker'
  selectedIconCategory.value = 'shapes'
  editingCategoryId.value = null
}



function confirmDelete(categoryId) {
  isDeleting.value = true
  deletingCategoryId.value = categoryId
}

function cancelDelete() {
  isDeleting.value = false
  deletingCategoryId.value = null
}

async function deleteCategory() {
  if (!deletingCategoryId.value) return
  
  try {
    await categorieStore.deleteCategory(deletingCategoryId.value)
    cancelDelete()
  } catch (error) {
    alert(error.message || 'Erreur lors de la suppression')
  }
}

onMounted(async () => {
  // Charger les catégories dès le montage du composant
  await categorieStore.fetchCategories()
})

// Recharger les catégories quand le panel s'ouvre
watch(() => props.isOpen, async (newValue) => {
  if (newValue) {
    await categorieStore.fetchCategories()
  }
})
</script>

<template>
  <transition name="panel-fade">
    <aside v-if="canDisplayPanel" class="panel" role="dialog" aria-label="Gestion des catégories">
      <div class="panel__close-wrapper">
        <button class="panel__close" @click="closePanel" aria-label="Fermer">×</button>
      </div>
      
      <header class="panel__header">
        <h3>Gestion des catégories</h3>
        <p>{{ categorieStore.categoriesCount }} catégorie(s)</p>
      </header>

      <div class="panel__body">
        <!-- Vue Liste -->
        <div v-if="activeTab === 'liste'" class="panel__content">
          <!-- Bouton Ajouter une catégorie -->
          <div v-if="authStore.isAuthenticated" class="panel__section">
            <button class="btn-add-category" @click="showCreateForm">
              <span class="add-icon">+</span>
              Ajouter une catégorie
            </button>
          </div>
          <div v-if="categorieStore.isLoading" class="panel__section">
            <p>Chargement...</p>
          </div>
          
          <div v-else-if="categorieStore.error" class="panel__section error">
            <p>Erreur: {{ categorieStore.error }}</p>
            <button class="btn-panel1" @click="categorieStore.fetchCategories">
              Réessayer
            </button>
          </div>

          <div v-else-if="categorieStore.categories.length === 0" class="panel__section">
            <p class="no-categories">Aucune catégorie trouvée</p>
          </div>

          <div v-else class="categories-list">
            <div v-for="category in categorieStore.categories" :key="category._id" class="category-item">
              <div class="category-content">
                <div class="category-icon" :style="{ backgroundColor: category.couleur }">
                  <img 
                    v-if="category.image?.filename"
                    :src="categorieStore.getIconUrl(category.image.filename)" 
                    :alt="categorieStore.getIconAltWithSource(category.image.filename)"
                    :title="categorieStore.getIconAltWithSource(category.image.filename)"
                    class="category-icon-img"
                  >
                </div>
                <div class="category-info">
                  <h4>{{ category.nom }}</h4>
                  <p v-if="category.description" class="category-description">
                    {{ category.description }}
                  </p>
                  <span class="category-status" :class="{ inactive: !category.active }">
                    {{ category.active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
              
              <div v-if="authStore.isAuthenticated" class="category-actions">
                <button 
                  class="btn-edit"
                  @click="editCategory(category)"
                  title="Modifier la catégorie"
                >
                  ✏️
                </button>
                <button 
                  class="btn-delete"
                  @click="confirmDelete(category._id)"
                  title="Supprimer la catégorie"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulaire de création -->
        <div v-else-if="activeTab === 'creer'" class="panel__content">
          <!-- En-tête avec bouton retour -->
          <div class="panel__section create-header">
            <button class="back-button" @click="backToList" title="Retour à la liste">
              <span class="back-arrow">←</span>
            </button>
            <div class="header-content">
              <h3 class="create-title">{{ editingCategoryId ? 'Modifier la catégorie' : 'Ajouter une catégorie' }}</h3>
              <span class="save-indicator">Sauvegarde automatique</span>
            </div>
          </div>
          
          <div class="create-form">
            <div class="panel__section">
              <label for="nom">Nom de la catégorie *</label>
              <input 
                id="nom"
                type="text" 
                v-model="form.nom" 
                @input="debouncedSaveChanges"
                placeholder="Ex: Restaurants, Attractions..."
                maxlength="50"
              >
            </div>

            <div class="panel__section">
              <label for="description">Description</label>
              <textarea 
                id="description"
                v-model="form.description" 
                @input="debouncedSaveChanges"
                placeholder="Description optionnelle..."
                maxlength="200"
                rows="3"
              ></textarea>
            </div>

            <div class="panel__section">
              <label>Couleur</label>
              <div class="color-input-group">
                <input 
                  id="couleur"
                  type="color" 
                  v-model="form.couleur"
                  @change="debouncedSaveChanges"
                >
                <input 
                  type="text" 
                  v-model="form.couleur" 
                  @input="debouncedSaveChanges"
                  placeholder="#4CAF50"
                  pattern="^#[0-9A-Fa-f]{6}$"
                >
              </div>
            </div>

            <div class="panel__section">
              <label>Icône sélectionnée</label>
              <div class="selected-icon-display">
                <img :src="selectedIconUrl" :alt="categorieStore.getIconAltWithSource(selectedIcon, selectedIconCategory)" :title="categorieStore.getIconAltWithSource(selectedIcon, selectedIconCategory)" class="selected-icon-img">
                <span class="selected-icon-name">{{ selectedIcon }}</span>
              </div>
              
              <label>Choisir une icône</label>
              <div 
                v-for="(icons, categoryName) in categorieStore.getIconCategories"
                :key="categoryName"
                class="icon-category-section"
              >
                <h5 class="category-title">{{ categoryName }}</h5>
                <div class="icon-grid">
                  <div 
                    v-for="icon in icons" 
                    :key="icon"
                    class="icon-option"
                    @click="selectIcon(icon, categoryName)"
                    :title="categorieStore.getIconAltWithSource(icon, categoryName)"
                    :class="{ selected: selectedIcon === icon }"
                  >
                    <img 
                      :src="categorieStore.getIconUrl(icon, categoryName)" 
                      :alt="categorieStore.getIconAltWithSource(icon, categoryName)"
                      class="icon-img"
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Sauvegarde automatique - pas besoin de bouton -->
          </div>
        </div>
      </div>

      <!-- Confirmation de suppression -->
      <div v-if="isDeleting" class="delete-confirmation">
        <p>Êtes-vous sûr de vouloir supprimer cette catégorie ?</p>
        <button @click="deleteCategory">Supprimer</button>
        <button @click="cancelDelete">Annuler</button>
      </div>
    </aside>
  </transition>
</template>

<style scoped>
/* ---------- Panneau ---------- */
.panel {
  position: absolute;
  top: 12px;
  bottom: 12px;
  width: 320px;
  background: #f2f2f2;
  color: #111;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  right: 12px;
  overflow: hidden;
}

.panel__close-wrapper {
  position: sticky;
  top: 0;
  right: 0;
  height: 0;
  background: #f2f2f2;
  z-index: 1;
}

.panel__close {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid #4CAF50;
  background: white;
  color: #4CAF50;
  line-height: 22px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: absolute;
  right: 12px;
  top: 12px;
}

.panel__close:hover {
  background: #4CAF50;
  color: white;
}

.panel__header {
  display: block;
  padding: 10px 12px;
  font-weight: 700;
  max-width: 90%;
}

.panel__header h3 {
  margin: 0;
  font-size: 24px;
  padding-bottom: 5px;
}

.panel__header p {
  font-weight: 500;
  opacity: 0.5;
  margin: 0;
}

.panel__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel__content {
  flex: 1;
  overflow-y: auto;
}



.panel__section {
  padding: 12px;
}

.panel__section label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.panel__section input,
.panel__section textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.panel__section input:focus,
.panel__section textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

/* ---------- Couleur ---------- */
.color-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.color-input-group input[type="color"] {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-input-group input[type="text"] {
  flex: 1;
}

/* ---------- Sélecteur d'icônes ---------- */
.selected-icon-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 2px solid #4CAF50;
  border-radius: 8px;
  background: #f8fff8;
  margin-bottom: 15px;
}

.selected-icon-img {
  width: 24px;
  height: 24px;
}

.selected-icon-name {
  font-weight: 600;
  color: #2e7d32;
  text-transform: capitalize;
}

.icon-category-section {
  margin-bottom: 16px;
}

.icon-category-section:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  margin: 0 0 6px 0;
  padding: 8px 8px 4px 8px;
  text-transform: capitalize;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
  gap: 1px;
  background: #f0f0f0;
  padding: 4px 8px 8px 8px;
}

.icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
  background: white;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.icon-option:hover {
  background: #e8f5e8;
}

.icon-option.selected {
  background: #4CAF50;
}

.icon-img {
  width: 18px;
  height: 18px;
}

.icon-option.selected .icon-img {
  filter: brightness(0) invert(1);
}

/* ---------- Liste des catégories ---------- */
.categories-list {
  padding: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

.category-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.category-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-icon-img {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

.category-info h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.category-description {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #666;
}

.category-status {
  font-size: 11px;
  color: #4CAF50;
  font-weight: 500;
}

.category-status.inactive {
  color: #999;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-edit {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-right: 4px;
}

.btn-edit:hover {
  background: rgba(52, 152, 219, 0.1);
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-delete:hover {
  background: rgba(220, 53, 69, 0.1);
}

/* ---------- Boutons ---------- */
.btn-panel1 {
  display: block;
  width: auto;
  height: 30px;
  border-radius: 25px;
  padding: 0 12px;
  margin: 12px auto;
  border: 1px solid rgba(67, 160, 71, 0.35);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
  color: #4CAF50;
  cursor: pointer;
  font-weight: 600;
  font-size: small;
  transition: all 0.3s ease;
  background: white;
}

.btn-panel1:hover {
  background: #4CAF50;
  color: white;
}

/* ---------- Bouton Ajouter une catégorie ---------- */
.btn-add-category {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.btn-add-category:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.add-icon {
  font-size: 18px;
  font-weight: bold;
}

/* ---------- En-tête création ---------- */
.create-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px !important;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  color: #666;
}

.back-button:hover {
  background-color: #f0f0f0;
}

.back-arrow {
  font-size: 18px;
  font-weight: bold;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.create-title {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.save-indicator {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 500;
}



.no-categories {
  text-align: center;
  color: #666;
  font-style: italic;
  margin: 20px 0;
}

.error {
  color: #d32f2f;
  text-align: center;
}

/* ---------- Confirmation de suppression ---------- */
.delete-confirmation {
  margin: 20px;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  border: 2px solid #4CAF50;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  box-sizing: border-box;
  background: white;
}

.delete-confirmation p {
  display: block;
  width: 100%;
  padding: 12px;
  text-align: center;
  margin: 0;
}

.delete-confirmation button {
  margin: 0;
  display: block;
  width: 50%;
  height: 36px;
  box-sizing: border-box;
  border: none;
  border-top: 2px solid #4CAF50;
  background: white;
  color: #4CAF50;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-confirmation button:hover {
  background-color: #4CAF50;
  color: white;
}

.delete-confirmation button:first-of-type {
  border-radius: 0 0 0 17px;
}

.delete-confirmation button:last-of-type {
  border-radius: 0 0 17px 0;
}

/* ---------- Transitions ---------- */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

/* ---------- Scrollbar ---------- */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cfcfcf;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #b6b6b6;
}
</style>