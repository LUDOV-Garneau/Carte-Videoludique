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
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(4px);
}

/* conteneur */
.modal-box { 
  width: min(720px, 94vw); 
  max-height: min(88vh, 900px); 
  overflow: auto; 
  padding: 0; 
  border-radius: 20px;
  background: radial-gradient(circle at top left, #f9fafb 0, #ffffff 45%, #f3f4f6 100%);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.35);
  animation: fadeScale .18s ease-out;
}

/* entête */
.modal-header { 
  position: sticky; 
  top: 0; 
  background: linear-gradient(135deg, #eef2ff 0%, #ffffff 45%, #f9fafb 100%);
  padding: 20px 24px 16px; 
  border-bottom: 1px solid #e5e7eb; 
  z-index: 1;
}

.modal-header h2 { 
  margin: 0; 
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 0.01em;
}

/* corps */
.modal-body {
  padding: 20px 24px 80px;
  background: transparent;
  color: var(--text-main);
}

/* grille */
.form-grid { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 16px 18px;
}

.form-col-2 { 
  grid-column: 1 / -1;
}

/* bloc de champ en lecture seule */
.form-control {
  background: rgba(248, 250, 252, 0.95);
  border-radius: 14px;
  padding: 12px 14px 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

/* labels */
.form-control label { 
  font-weight: 600; 
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* valeur */
.field-value {
  margin: 0;
  font-size: 0.97rem;
  color: var(--text-main);
  line-height: 1.45;
}

.field-value.multiline {
  white-space: pre-line;
}

/* images */
.images-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}

.image-thumb {
  width: 170px;
  height: 115px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  position: relative;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.image-thumb::after {
  content: "Cliquer pour agrandir";
  position: absolute;
  left: 8px;
  bottom: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.75);
  color: #e5e7eb;
  font-size: 0.7rem;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.16s ease, transform 0.16s ease;
  pointer-events: none;
}

.image-thumb:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  border-color: var(--accent, #0ea5e9);
}

.image-thumb:hover::after {
  opacity: 1;
  transform: translateY(0);
}

.images-gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* barre d’actions collée en bas */
.modal-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 14px 24px 18px;
  background: linear-gradient(180deg, transparent, #f9fafb 40%, #ffffff 100%);
  border-top: 1px solid #e5e7eb;
  margin-top: 24px;
}

/* boutons */
.btn { 
  border: none; 
  border-radius: 999px; 
  padding: 10px 20px; 
  font-weight: 600; 
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-primary { 
  background: var(--accent); 
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.4);
  transition: background 0.18s ease, transform 0.1s ease, box-shadow 0.18s ease;
}

.btn-primary:hover { 
  background: var(--accent-dark);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(14, 165, 233, 0.45);
}

/* SCROLLBAR */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent; 
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.7); 
  border-radius: 8px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.9);
}

/* responsive */
@media (max-width: 640px) {
  .modal-box {
    width: 94vw;
  }

  .form-grid { 
    grid-template-columns: 1fr; 
  }

  .modal-body {
    padding: 18px 16px 70px;
  }

  .image-thumb {
    width: 100%;
    height: 180px;
  }
}

/* Animation d’apparition */
@keyframes fadeScale {
  from { opacity: 0; transform: scale(.97) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

</style>