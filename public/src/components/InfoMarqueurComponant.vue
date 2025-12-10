<script setup>
import { defineProps, defineEmits, watch, onMounted, onUnmounted } from 'vue'
import { useBodyScroll } from '../composables/useBodyScroll.js'
import { useLightbox } from '../composables/useLightbox.js'
import ImageLightbox from './ImageLightbox.vue'

const props = defineProps({
  marqueur: {
    type: Object,
    required: true
  }
})

const lightbox = useLightbox()
const emit = defineEmits(['fermer'])

const { disableScroll, enableScroll } = useBodyScroll()

const getImageUrl = (image) => {
  if (!image) return ''
  if (typeof image === 'string') return image
  return image.url || image.secure_url || image.imageUrl || image.src || ''
}

const openLightboxAt = (index) => {
  const urls = (props.marqueur.properties.images || []).map(getImageUrl)
  lightbox.openLightbox(urls, index)
}

watch(
    () => props.marqueur
)

onMounted(() => {
  disableScroll()
})

onUnmounted(() => {
  enableScroll()
})

const fermer = () => {
  emit('fermer')
}
const onKeydown = (event) => {
  if (event.key === 'Escape') {
    fermer()
  }
}

</script>

<template>
  <div
    class="overlay"
    @keydown="onKeydown"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-box" role="document" aria-labelledby="dlg-title">
      <header class="modal-header">
        <h2 id="dlg-title">Informations du marqueur</h2>
      </header>

      <section class="modal-body">
        <div class="form-grid">
          <!-- Titre -->
          <div class="form-control">
            <label>Titre</label>
            <p class="field-value">
              {{ marqueur.properties.titre || '—' }}
            </p>
          </div>

          <!-- Type -->
          <div class="form-control">
            <label>Type</label>
            <p class="field-value">
              {{ marqueur.properties.type || '—' }}
            </p>
          </div>

          <!-- Adresse -->
          <div class="form-control form-col-2">
            <label>Adresse</label>
            <p class="field-value">
              {{ marqueur.properties.adresse || '—' }}
            </p>
          </div>

          <!-- Description -->
          <div class="form-control form-col-2">
            <label>Description</label>
            <p class="field-value multiline">
              {{ marqueur.properties.description || '—' }}
            </p>
          </div>

          <!-- Témoignage -->
          <div class="form-control form-col-2">
            <label>Témoignage</label>
            <p class="field-value multiline">
              {{ marqueur.properties.temoignage || '—' }}
            </p>
          </div>

           <!-- Images (lecture seule + lightbox) -->
          <div
            class="form-control form-col-2"
            v-if="marqueur.properties.images && marqueur.properties.images.length"
          >
            <label>Images</label>
            <div class="images-gallery">
              <div
                v-for="(image, index) in marqueur.properties.images"
                :key="index"
                class="image-thumb"
                @click="openLightboxAt(index)"
              >
                <img
                  :src="getImageUrl(image)"
                  :alt="`Image ${index + 1} de ${marqueur.properties.titre}`"
                />
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-actions">
          <button type="button" class="btn btn-primary" @click="fermer">
            Fermer
          </button>
        </footer>
      </section>
    </div>
    <ImageLightbox
      v-if="lightbox.isOpen"
      :images="lightbox.images"
      v-model:currentIndex="lightbox.currentIndex"
      @close="lightbox.closeLightbox"
    />
  </div>
</template>

<style scoped>
/* voile plein écran */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(3px);
}

/* conteneur */
.modal-box { 
  width: min(680px, 92vw); 
  max-height: min(85vh, 900px); 
  overflow: auto; 
  padding: 0; 
  border-radius: 18px;
  background: var(--bg-page);
  animation: fadeScale .16s ease-out;
}

.modal-header { 
  position: sticky; 
  top: 0; 
  background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
  padding: 20px 24px; 
  border-bottom: 1px solid #eee; 
  z-index: 1;
}

.modal-header h2 { 
  margin: 0; 
  font-size: 1.75rem;
  color: var(--text-main);
}

.modal-body {
  padding: 20px 24px 100px;
  background: #FFFFFF;
  color: var(--text-main);
}

/* grille */
.form-grid { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 16px;
}

.form-col-2 { 
  grid-column: 1 / -1;
}

/* bloc de champ en lecture seule */
.form-control {
  background-color: var(--card-bg);
  border: none;
  padding: 14px 16px;
}

.form-control label { 
  font-weight: 600; 
  margin: 6px 0 6px;
  color: #0f172a;
  font-size: 0.95rem;
}

.field-value {
  margin: 0;
  margin-top: 4px;
  font-size: 0.95rem;
  color: var(--text-main);
}

.field-value.multiline {
  white-space: pre-line;
}

/* images */
.images-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.images-gallery img {
  width: 160px;
  height: 110px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

/* barre d’actions collée en bas */
.modal-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 14px 24px;
  background: linear-gradient(180deg, transparent, #fff 35%);
  border-top: 1px solid #eee;
  margin-top: 24px;
}

.btn { 
  border: none; 
  border-radius: 999px; 
  padding: 12px 18px; 
  font-weight: 700; 
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-primary { 
  background: var(--accent); 
  color: #ffffff;
}

.btn-primary:hover { 
  background: var(--accent-dark);
}

/* SCROLLBAR */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent; 
}

::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.25); 
  border-radius: 8px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.35);
}

/* responsive */
@media (max-width: 640px) {
  .form-grid { 
    grid-template-columns: 1fr; 
  }
}

/* Animation d’apparition */
@keyframes fadeScale {
  from { opacity: 0; transform: scale(.97); }
  to { opacity: 1; transform: scale(1); }
}

</style>