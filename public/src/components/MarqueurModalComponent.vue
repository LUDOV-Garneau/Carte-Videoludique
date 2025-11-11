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
    <div class="modal-box" role="document">
      <h2>Modifier le marqueur</h2>

      <form @submit.prevent="valider" novalidate>
        <div class="form-control" :class="{ invalid: titreValidation }">
          <input
            ref="titreEl"
            id="titreMarqueur"
            name="titreMarqueur"
            type="text"
            v-model.trim="titre"
            placeholder="Titre du marqueur"
            @input="titreValidation = false"
            :aria-invalid="typeValidation ? 'true' : 'false'"
            :aria-describedby="titreValidation ? 'err-titre' : undefined"
          />
          <p id="err-titre" class="error-message" v-if="titreValidation">{{ titreMessage }}</p>
        </div>

        <div class="form-control" :class="{ invalid: typeValidation }">
          <input
            ref="typeEl"
            id="typeMarqueur"
            name="typeMarqueur"
            type="text"
            v-model.trim="type"
            placeholder="Type du marqueur"
            @input="typeValidation = false"
            :aria-invalid="typeValidation ? 'true' : 'false'"
            :aria-describedby="typeValidation ? 'err-type' : undefined"
          />
          <p id="err-type" class="error-message" v-if="typeValidation">{{ typeMessage }}</p>
        </div>

        <div class="form-control" :class="{ invalid: adresseValidation }">
          <input
            ref="adresseEl"
            id="adresseMarqueur"
            name="adresseMarqueur"
            type="text"
            v-model.trim="adresse"
            placeholder="Adresse du marqueur"
            @input="adresseValidation = false"
            :aria-invalid="adresseValidation ? 'true' : 'false'"
            :aria-describedby="adresseValidation ? 'err-adresse' : undefined"
          />
          <p id="err-adresse" class="error-message" v-if="adresseValidation">{{ adresseMessage }}</p>
        </div>

        <div class="form-control" :class="{ invalid: descriptionValidation }">
          <textarea
            ref="descriptionEl"
            id="descriptionMarqueur"
            name="descriptionMarqueur"
            v-model.trim="description"
            placeholder="Description du marqueur"
            @input="descriptionValidation = false"
            :aria-invalid="descriptionValidation ? 'true' : 'false'"
            :aria-describedby="descriptionValidation ? 'err-description' : undefined"
          ></textarea>
          <p id="err-description" class="error-message" v-if="descriptionValidation">{{ descriptionMessage }}</p>
        </div>

        <div class="form-control">
          <textarea
            id="temoignageMarqueur"
            name="temoignageMarqueur"
            v-model.trim="temoignage"
            placeholder="Témoignage (optionnel)"
          ></textarea>
        </div>

        <div class="form-control">
          <input
            id="imageMarqueur"
            name="imageMarqueur"
            type="text"
            v-model.trim="image"
            placeholder="URL de l'image (optionnel)"
          />
        </div>

        <div class="form-actions">
          <button type="button" @click="close">Annuler</button>
          <button type="submit">Valider</button>
        </div>
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

/* boîte centrée par le flex du parent */
.modal-box {
  position: relative;
  width: min(560px, 92vw);
  max-height: min(80vh, 900px);
  overflow: auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  padding: 24px;
  animation: fadeScale .15s ease-out;
}

.modal * { color: #111; }

/* Champs et erreurs */
.form-control {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  margin-bottom: 1rem;
}
input, textarea {
  padding: .75rem 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  outline: none;
}
input:focus, textarea:focus {
  border-color: #007bff;
}
.form-control.invalid input,
.form-control.invalid textarea {
  border-color: #e74c3c;
  background: #fff5f5;
}
.error-message {
  color: #e74c3c;
  font-size: .9rem;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Animation d’apparition */
@keyframes fadeScale {
  from { opacity: 0; transform: scale(.97); }
  to { opacity: 1; transform: scale(1); }
}
</style>