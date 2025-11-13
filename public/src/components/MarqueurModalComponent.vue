<script setup>
import { defineProps, defineEmits, ref, watch, onMounted, nextTick } from 'vue'

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

// Remplit les champs depuis le props en restant défensif
const hydrateFromProps = () => {
  const p = props.marqueur?.properties ?? {}
  titre.value = p.titre ?? ''
  type.value = p.type ?? ''
  adresse.value = p.adresse ?? ''
  description.value = p.description ?? ''
  temoignage.value = p.temoignage ?? ''
  image.value = p.image ?? ''
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

  // ⚠️ Préserver id/geometry/status/tags/etc.
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
    }
  })
}

// Accessibilité clavier: ESC pour fermer
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

      <!-- Image: URL ou fichier + aperçu -->
      <div class="form-control form-col-2">
        <label>Image</label>
        <div class="image-row">
          <input type="text" v-model.trim="image" placeholder="URL de l'image (optionnel)" class="flex-1" />
          <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,image/*" @change="onFileChange" />
        </div>
        <img v-if="imagePreview" :src="imagePreview" alt="Aperçu" class="image-preview" />
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
/* voile plein écran */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(3px);
}

/* conteneur */
.modal-box{ width:min(680px,92vw); max-height:min(85vh,900px); overflow:auto; padding:0; border-radius:18px;}
.modal-header{ position:sticky; top:0; background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);; padding:20px 24px; border-bottom:1px solid #eee; z-index:1 }
.modal-header h2{ margin:0; font-size:1.75rem }
.modal-body{ padding:20px 24px 100px; background:#fff}

/* grille */
.form-grid{ display:grid; grid-template-columns: 1fr 1fr; gap:16px }
.form-col-2{ grid-column: 1 / -1 }

/* champs */
.form-control label{ font-weight:600; margin:6px 0 6px; color:#0f172a }
input, textarea{
  width:100%; padding:.75rem 1rem; border:1px solid #e5e7eb; border-radius:10px; outline:none;
  background:#fff; box-shadow: inset 0 0 0 1px rgba(0,0,0,0); transition: border-color .15s, box-shadow .15s;
}
input:focus, textarea:focus{ border-color:#93c5fd; box-shadow:0 0 0 3px rgba(59,130,246,.18) }
textarea{ resize: vertical; }
.error-message{ color:#dc2626; font-size:.9rem }
.help-row{ display:flex; justify-content:space-between; align-items:center; margin-top:6px }
.char-count{ color:#6b7280; font-size:.85rem }

/* image */
.image-row{ display:flex; gap:10px; align-items:center }
.image-row .flex-1{ flex:1 }
.image-preview{
  margin-top:10px; width:100%; max-height:220px; object-fit:cover; border-radius:10px; border:1px solid #e5e7eb
}

/* barre d’actions collée en bas */
.modal-actions{
  position: sticky; bottom: 0; display:flex; gap:12px; justify-content:flex-end;
  padding:14px 24px; background:linear-gradient(180deg, transparent, #fff 35%);
  border-top:1px solid #eee; margin-top:24px;
}
.btn{ border:none; border-radius:999px; padding:12px 18px; font-weight:700; cursor:pointer }
.btn-muted{ background:#f3f4f6; color:#111827 }
.btn-muted:hover{ filter:brightness(.98) }
.btn-primary{ background:#e8fbef; color:#0f9b63 }
.btn-primary:hover{ filter:brightness(.98) }

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