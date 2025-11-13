<script setup>
import { defineProps, defineEmits, ref, watch, onMounted, nextTick, computed} from 'vue'
import AddImage from './AddImage.vue'


const props = defineProps({
  marqueur: { type: Object, required: true }
})
const emit = defineEmits(['fermer', 'valider'])

const titre = ref('')
const type = ref('')
const adresse = ref('')
const description = ref('')
const temoignage = ref('')
const image = ref('')

// pour AddImage
const files = ref([])    
const imagePreview = ref('')  

const descCount = ref(0)
function updateDescCount() {
  descCount.value = description.value.length
}

// Refs pour focus
const titreEl = ref(null)
const typeEl = ref(null)
const adresseEl = ref(null)
const descriptionEl = ref(null)

// États de validation
const titreValidation = ref(false)
const typeValidation = ref(false)
const adresseValidation = ref(false)
const descriptionValidation = ref(false)

const titreMessage = ref('')
const typeMessage = ref('')
const adresseMessage = ref('')
const descriptionMessage = ref('')

const initialImageUrls = computed(() => {
  const images = props.marqueur?.properties?.images ?? []
  return images
    .filter(img => img && img.url)
    .map(img => img.url)
})

// Remplit les champs depuis le props en restant défensif
const hydrateFromProps = () => {
  const p = props.marqueur?.properties ?? {}
  titre.value = p.titre ?? ''
  type.value = p.type ?? ''
  adresse.value = p.adresse ?? ''
  description.value = p.description ?? ''
  temoignage.value = p.temoignage ?? ''

  image.value = p.images?.[0]?.url ?? ''

}
hydrateFromProps()

watch(
  () => props.marqueur,
  () => { hydrateFromProps(); resetErrors(); },
  { immediate: true }
)

function resetErrors() {
  titreValidation.value = false
  typeValidation.value = false
  adresseValidation.value = false
  descriptionValidation.value = false
  titreMessage.value = ''
  typeMessage.value = ''
  adresseMessage.value = ''
  descriptionMessage.value = ''
}

function close() {
  resetErrors()
  emit('fermer')
}

/**
 * Gère le changement des images sélectionnées dans le composant.
 *
 * - Met à jour la liste des fichiers sélectionnés (`files`).
 * - Si aucun fichier n'est choisi, conserve l'aperçu existant.
 * - Sinon, génère une URL temporaire avec `URL.createObjectURL`
 *   pour afficher un aperçu de l'image.
 * - Met également à jour le champ `image` avec le nom du fichier choisi.
 *
 * @param allFiles Liste de fichiers sélectionnés (généralement depuis <input type="file">)
 * 
 */
function onImagesChange(allFiles) {
  files.value = allFiles

  if (!allFiles.length) {
    // aucun fichier choisi → garder l’URL existante
    imagePreview.value = image.value || ''
    return
  }

  const file = allFiles[0]
  const url = URL.createObjectURL(file)
  imagePreview.value = url

  // ici tu peux éventuellement mettre juste le nom dans le champ readonly :
  image.value = file.name
}

// Valide tout d’un coup et focus le premier invalide
async function valider() {
  resetErrors()
  const invalid = []

  if (!titre.value.trim()) {
    titreValidation.value = true
    titreMessage.value = 'Le titre est obligatoire.'
    invalid.push(titreEl)
  }
  if (!type.value.trim()) {
    typeValidation.value = true
    typeMessage.value = 'Le type est obligatoire.'
    invalid.push(typeEl)
  }
  if (!adresse.value.trim()) {
    adresseValidation.value = true
    adresseMessage.value = "L'adresse est obligatoire."
    invalid.push(adresseEl)
  }
  if (!description.value.trim()) {
    descriptionValidation.value = true
    descriptionMessage.value = 'La description est obligatoire.'
    invalid.push(descriptionEl)
  }

  if (invalid.length) {
    await nextTick()
    invalid[0]?.value?.focus?.()
    return
  }

  const original = props.marqueur ?? {}
  const originalProps = original.properties ?? {}

  emit('valider', {
    ...original,
    properties: {
      ...originalProps,
      titre: titre.value.trim(),
      type: type.value.trim(),
      adresse: adresse.value.trim(),
      description: description.value.trim(),
      temoignage: temoignage.value.trim(),
      image: image.value.trim()
    },

    files: files.value
  })
}

/**
 * Ferme la fenêtre modale lorsqu'une touche du clavier est pressée.
 *
 * - Vérifie si la touche pressée est `Escape`.
 * - Si oui, déclenche la fonction `close()` pour fermer la modale.
 *
 * @param e Événement clavier déclenché lors de l'appui d'une touche
 * 
 */
function onKeydown(e) {
  if (e.key === 'Escape') close()
}

// Focus initial
onMounted(async () => {
  await nextTick()
  titreEl.value?.focus?.()
})
</script>

<template>
  <div class="overlay" @click.self="close" @keydown="onKeydown" tabindex="-1" role="dialog" aria-modal="true">
    <div class="modal-box" role="document" aria-labelledby="dlg-title">
      <header class="modal-header">
        <h2 id="dlg-title">Modifier le marqueur</h2>
      </header>

      <form class="modal-body" @submit.prevent="valider" novalidate>
        <div class="form-grid">
          <div class="form-control" :class="{ invalid: titreValidation }">
            <label for="titreMarqueur">Titre</label>
            <input id="titreMarqueur" v-model.trim="titre" type="text" placeholder="Ex: Badibadibibu"
               :aria-invalid="titreValidation ? 'true':'false'"
               @input="titreValidation=false" />
            <p v-if="titreValidation" class="error-message">{{ titreMessage }}</p>
          </div>

          <div class="form-control" :class="{ invalid: typeValidation }">
            <label for="typeMarqueur">Type</label>
              <input id="typeMarqueur" v-model.trim="type" type="text" placeholder="Ex: Clubs vidéo"
                :aria-invalid="typeValidation ? 'true':'false'"
                @input="typeValidation=false" />
            <p v-if="typeValidation" class="error-message">{{ typeMessage }}</p>
          </div>

          <div class="form-control form-col-2" :class="{ invalid: adresseValidation }">
            <label for="adresseMarqueur">Adresse</label>
              <input id="adresseMarqueur" v-model.trim="adresse" type="text" placeholder="Ex: 897 Avenue Painchaud"
                :aria-invalid="adresseValidation ? 'true':'false'"
                @input="adresseValidation=false" />
            <p v-if="adresseValidation" class="error-message">{{ adresseMessage }}</p>
          </div>

          <div class="form-control form-col-2" :class="{ invalid: descriptionValidation }">
            <label for="descriptionMarqueur">Description</label>
              <textarea id="descriptionMarqueur" v-model.trim="description" rows="4"
                  placeholder="Décris le point d’intérêt…"
                  :aria-invalid="descriptionValidation ? 'true':'false'"
                  @input="descriptionValidation=false; updateDescCount()"></textarea>
            <div class="help-row">
              <p v-if="descriptionValidation" class="error-message">{{ descriptionMessage }}</p>
              <span class="char-count">{{ descCount }}/280</span>
            </div>
        </div>

        <div class="form-control form-col-2">
          <label for="temoignageMarqueur">Témoignage</label>
          <textarea id="temoignageMarqueur" v-model.trim="temoignage" rows="3" placeholder="Témoignage (optionnel)"></textarea>
        </div>

        <div class="form-control form-col-2">
          <label>Image</label>
          <div class="image-row">
            <input type="text" v-model.trim="image" placeholder="URL de l'image (optionnel)" class="flex-1" readonly />
            <AddImage
              v-model="files"
              :initial-urls="initialImageUrls"
              @change="onImagesChange"
            />
          </div>
          <img
            v-if="imagePreview"
            :src="imagePreview"
            alt="Aperçu"
            class="image-preview"/>
          </div>
        </div>

        <footer class="modal-actions">
          <button type="button" class="btn btn-muted" @click="close">Annuler</button>
          <button type="submit" class="btn btn-primary">Valider</button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>

:global(:root)  {
  --bg-page:   #E6E6E6;  /* fond gris de la page */
  --card-bg:   #FFFFFF;  /* blocs de contenu */
  --border:    #D4D4D4;  /* lignes/bordures douces */
  --text-main: #333333;  /* texte principal */
  --text-soft: #666666;  /* texte secondaire */
  --accent:    #00D8E0;  /* turquoise comme l’onglet Accueil */
  --accent-dark: #00AEB5;
}

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
.modal-box{ 
  width:min(680px,92vw); 
  max-height:min(85vh,900px); 
  overflow:auto; 
  padding:0; 
  border-radius:18px;
  background: var(--bg-page);
  animation: fadeScale .16s ease-out;
}
.modal-header{ 
  position:sticky; 
  top:0; 
  background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
  padding:20px 24px; 
  border-bottom:1px solid #eee; 
  z-index:1;
}
.modal-header h2{ 
  margin:0; 
  font-size:1.75rem;
  color: var(--text-main);
}
.modal-body {
  padding:20px 24px 100px;
  background: #FFFFFF; /* fond blanc */
  color: var(--text-main);
}

/* grille */
.form-grid{ 
  display:grid; 
  grid-template-columns: 1fr 1fr; 
  gap:16px 
}
.form-col-2{ 
  grid-column: 1 / -1 
}

.form-control {
  background-color: var(--card-bg);
  border: none;
  padding: 14px 16px;
}
/* champs */
.form-control label{ 
  font-weight:600; 
  margin:6px 0 6px;
  color:#0f172a;
  font-size: 0.95rem;
}
input,
textarea{
  width:100%; 
  padding:.75rem 1rem; 
  border:1px solid #e5e7eb; 
  border-radius:10px; 
  outline:none;
  background:#fff; 
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0); 
  transition: border-color .15s, box-shadow .15s;
  font-size: 0.95rem;
  color: var(--text-main);
}
input::placeholder,
textarea::placeholder {
  color: var(--text-soft);
}

input:focus,
textarea:focus{
  border-color: var(--accent); 
  box-shadow:0 0 0 3px rgba(0,216,224,.25);
}
textarea{ 
  resize: vertical; 
}
.error-message{ 
  color:#dc2626; 
  font-size:.9rem 
}
.help-row{ 
  display:flex; 
  justify-content:space-between; 
  align-items:center; 
  margin-top:6px 
}
.char-count{ 
  color:#6b7280; 
  font-size:.85rem 
}

/* image */
.image-row{ 
  gap:10px; 
  align-items:center 
}
.image-row .flex-1{ 
  flex:1; 
  margin-bottom: 10px;
  border: none;
  padding:12px 18px; 
  cursor:pointer;
  font-size: 0.95rem;

}
.image-preview{
  margin-top:10px;
  width:100%; 
  max-height:220px; 
  object-fit:cover; 
  border-radius:10px; 
  /* border:1px solid #e5e7eb; */
  padding: 5px;
}

/* barre d’actions collée en bas */
.modal-actions{
  position: sticky;
  bottom: 0;
  display:flex;
  gap:12px;
  justify-content:flex-end;
  padding:14px 24px;
  background:linear-gradient(180deg, transparent, #fff 35%);
  border-top:1px solid #eee;
  margin-top:24px;
}
.btn{ 
  border:none; 
  border-radius:999px; 
  padding:12px 18px; 
  font-weight:700; 
  cursor:pointer;
  font-size: 0.95rem;
}
.btn-muted{ 
  background:#f3f4f6; 
  color:#111827;
  border: 1px solid #e5e7eb;
}
.btn-muted:hover{ 
  filter:brightness(.98) 
}
input[type="file"]::file-selector-button {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #111827;
  cursor: pointer;
  font-weight: 600;
  margin-right: 12px;
  transition: background 0.2s, border-color 0.2s;
}

input[type="file"]::file-selector-button:hover {
  background: #eef2f7;
  border-color: #c4cbd4;
}


.btn-primary{ 
  background: var( --accent); 
  color:#ffffff;
}
.btn-primary:hover{ 
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
@media (max-width: 640px){
  .form-grid{ grid-template-columns: 1fr }
}
/* Animation d’apparition */
@keyframes fadeScale {
  from { opacity: 0; transform: scale(.97); }
  to { opacity: 1; transform: scale(1); }
}
</style>