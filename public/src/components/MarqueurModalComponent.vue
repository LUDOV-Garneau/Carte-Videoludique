<script setup>
import { defineProps, defineEmits, ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import AddImage from './AddImage.vue'
import { fetchAdresseSuggestions, geocodeAddress } from '../utils/geocode'
import { useCategorieStore } from '../stores/useCategorie.js'
import { useBodyScroll } from '../composables/useBodyScroll.js'

const props = defineProps({
  marqueur: { type: Object, required: true },
  isOpen: { type: Boolean, required: true }
})

const emit = defineEmits(['fermer', 'valider', 'locate-from-address'])

const categorieStore = useCategorieStore()

const titre = ref('')
const categorie = ref(null)
const adresse = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)
const description = ref('')
const temoignage = ref('')
const latitude = ref(null)
const longitude = ref(null)

const files = ref([])

const descCount = ref(0)

/**
 * Met à jour le compteur de caractères de la description.
 *
 * Cette fonction calcule la longueur actuelle du texte
 * saisi dans le champ `description` et met à jour la
 * valeur réactive `descCount` en conséquence.
 *
 * Elle est généralement appelée :
 *  - Lors d’un événement `input` sur le champ description.
 *  - Pour afficher en temps réel le nombre de caractères restants ou utilisés.
 *
 * @function updateDescCount
 * @returns {void}
 */
function updateDescCount() {
  descCount.value = description.value.length
}

const titreEl = ref(null)
const categorieEl = ref(null)
const adresseEl = ref(null)
const descriptionEl = ref(null)

const titreValidation = ref(false)
const categorieValidation = ref(false)
const adresseValidation = ref(false)
const descriptionValidation = ref(false)

const titreMessage = ref('')
const categorieMessage = ref('')
const adresseMessage = ref('')
const descriptionMessage = ref('')

const initialImageUrls = computed(() => {
  const images = props.marqueur?.properties?.images ?? []
  return images
    .filter(img => img && img.url)
    .map(img => img.url)
})

// Utilisation du composable pour gérer le scroll
const { disableScroll, enableScroll } = useBodyScroll()

const hydrateFromProps = () => {
  const p = props.marqueur?.properties ?? {}
  titre.value = p.titre ?? ''
  categorie.value = p.categorie ?? null
  adresse.value = p.adresse ?? ''
  description.value = p.description ?? ''
  temoignage.value = p.temoignage ?? ''
}
hydrateFromProps()

watch(
  () => props.marqueur,
  () => { hydrateFromProps(); resetErrors() },
  { immediate: true }
)

watch(() => props.isOpen, (newVal) => {
  if (newVal && newVal === true) {
    categorieStore.fetchCategories();
  }
})

/**
 * Réinitialise tous les indicateurs et messages d’erreur de validation du formulaire.
 *
 * Cette fonction :
 *  - Réinitialise les indicateurs de validation (`titreValidation`, `typeValidation`, etc.) à `false`,
 *  - Vide les messages d’erreur associés (`titreMessage`, `typeMessage`, etc.),
 *  - Sert à nettoyer l’état du formulaire avant une nouvelle validation ou lors de la fermeture de la fenêtre.
 *
 * Elle est généralement appelée :
 *  - Avant une nouvelle validation (`valider()`),
 *  - Lors de la fermeture de la modale (`close()`),
 *  - Ou lors du rechargement d’un marqueur (`watch(props.marqueur)`).
 *
 * @function resetErrors
 * @returns {void}
 */
function resetErrors() {
  titreValidation.value = false
  categorieValidation.value = false
  adresseValidation.value = false
  descriptionValidation.value = false
  titreMessage.value = ''
  categorieMessage.value = ''
  adresseMessage.value = ''
  descriptionMessage.value = ''
}

/**
 * Ferme la fenêtre modale d’édition ou d’ajout de marqueur.
 *
 * Cette fonction :
 *  - Réinitialise les erreurs de validation via {@link resetErrors},
 *  - Émet l’événement `fermer` vers le composant parent pour indiquer
 *    que la fenêtre doit être fermée.
 *
 * Elle est généralement appelée :
 *  - Lors du clic sur le bouton « Fermer »,
 *  - Ou lorsqu’une touche `Escape` est pressée (via `onKeydown`).
 *
 * @function close
 * @returns {void}
 */
function confirmClose() {
  if(confirm("Toutes modifications seront perdues, voulez-vous continuer ?")) {
    resetErrors()
    emit('fermer')
  }
}

/**
* Gère le changement des images sélectionnées dans le composant.
*
* - Met à jour la liste des fichiers sélectionnés (`files`).
* - Si aucun fichier n'est choisi, conserve l’URL existante.
* - Met également à jour le champ `image` avec le nom du fichier choisi.
*
* @param allFiles Liste de fichiers sélectionnés (généralement depuis <input type="file">)
*/
function onImagesChange(allFiles) {
  files.value = allFiles
}

/**
 * Valide le formulaire d’édition ou d’ajout d’un marqueur avant envoi.
 *
 * Cette fonction :
 *  - Réinitialise les erreurs précédentes via {@link resetErrors},
 *  - Vérifie que tous les champs obligatoires sont remplis (`titre`, `type`, `adresse`, `description`),
 *  - Met en évidence les champs invalides et positionne le focus sur le premier champ en erreur,
 *  - Si la latitude/longitude sont absentes, tente de les obtenir via {@link geocodeAddress},
 *  - Prépare un objet complet du marqueur (avec coordonnées, fichiers et propriétés),
 *  - Émet l’événement `valider` vers le parent avec les données du marqueur validé.
 *
 * Elle est généralement appelée :
 *  - Lors du clic sur le bouton **Valider / Sauvegarder** d’un panneau d’édition de marqueur.
 *
 * @async
 * @function valider
 * @returns {Promise<void>} Ne retourne rien, mais émet l’événement `valider` avec le contenu validé.
 *
 * @emits valider
 */
async function valider() {
  resetErrors()
  const invalid = []

  if (!titre.value.trim()) {
    titreValidation.value = true
    titreMessage.value = 'Le titre est obligatoire.'
    invalid.push(titreEl)
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

  let lat = latitude.value
  let lng = longitude.value

  if (lat == null || lng == null) {
    try {
      const coords = await geocodeAddress(adresse.value.trim())
      console.log('Coords depuis valider() :', coords)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
        latitude.value  = coords.lat
        longitude.value = coords.lng
      }
    } catch (e) {
      console.error('Erreur geocode dans valider():', e)
    }
  }

  const original = props.marqueur ?? {}
  const originalProps = original.properties ?? {}

  console.log('Dans valider(), lat/lng envoyés :', lat, lng)

  emit('valider', {
    _id: original._id,
    properties: {
      ...originalProps,
      titre: titre.value.trim(),
      categorie: categorie.value,
      adresse: adresse.value.trim(),
      description: description.value.trim(),
      temoignage: temoignage.value.trim(),   
    },

    lat: latitude.value,
    lng: longitude.value,

    files: files.value
  })
}

/**
 * Gère la saisie d’une adresse dans le champ de formulaire et propose des suggestions en temps réel.
 *
 * Cette fonction :
 *  - Met à jour la valeur de l’adresse saisie,
 *  - Lance une recherche de suggestions via {@link fetchAdresseSuggestions} lorsque la saisie contient au moins 3 caractères,
 *  - Met à jour la liste `suggestions` et le booléen `showSuggestions` selon les résultats,
 *  - Vide les suggestions si la saisie est trop courte ou en cas d’erreur réseau.
 *
 * Elle est appelée à chaque changement dans le champ d’adresse (`@input` ou `v-model`).
 *
 * @async
 * @function onAdresseInput
 * @param {string} value - La valeur actuelle du champ d’adresse saisie par l’utilisateur.
 * @returns {Promise<void>} Ne retourne rien, mais met à jour les réactifs `suggestions` et `showSuggestions`.
 */
async function onAdresseInput(value) {
  adresse.value = value

  if (!value || value.length < 3) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  try {
    const results = await fetchAdresseSuggestions(adresse.value)
    suggestions.value = results
    showSuggestions.value = results.length > 0
  } catch (err) {
    console.error('Erreur fetchAdresseSuggestions :', err)
    suggestions.value = []
    showSuggestions.value = false
  }
}

/**
 * Gère la sélection d’une suggestion d’adresse.
 * - Met à jour le champ d’adresse.
 * - Met à jour les coordonnées.
 * - Émet un événement pour centrer la carte.
 * - Ferme immédiatement la liste des suggestions.
 */
function selectSuggestion(item) {
  adresse.value = item.label

  if (item && item.lat != null && item.lng != null) {
    const lat = Number(item.lat)
    const lng = Number(item.lng)

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      latitude.value = lat
      longitude.value = lng
      emit('locate-from-address', { lat, lng })
    }
  }

  // 👇 Fermeture immédiate après sélection
  showSuggestions.value = false
  suggestions.value = []
}

/**
 * Formate une suggestion d’adresse en une chaîne lisible pour l’affichage.
 *
 * Cette fonction :
 *  - Extrait les informations pertinentes de `item.raw.address` (numéro, rue, ville, province, code postal, pays),
 *  - Construit une représentation textuelle sur une ou deux lignes,
 *  - Retourne une chaîne prête à être affichée dans la liste des suggestions (ex. : `123 Rue Saint-Jean – Québec, QC, Canada`).
 *
 * @function formatSuggestion
 * @param {Object} item - L’objet représentant une suggestion d’adresse.
 * @param {Object} [item.raw] - Données brutes de la suggestion provenant du service de géocodage.
 * @param {Object} [item.raw.address] - Détails de l’adresse retournée par l’API (Nominatim).
 * @param {string} [item.raw.address.house_number] - Numéro civique.
 * @param {string} [item.raw.address.road] - Nom de la rue.
 * @param {string} [item.raw.address.city] - Ville (ou équivalent).
 * @param {string} [item.raw.address.state] - Province ou région.
 * @param {string} [item.raw.address.postcode] - Code postal.
 * @param {string} [item.raw.address.country] - Pays.
 * @returns {string} Une version formatée de l’adresse (lisible et compacte).

 */
function formatSuggestion(item) {
  const a = (item.raw && item.raw.address) ? item.raw.address : {}

  const ligne1 = [
    a.house_number,
    a.road
  ].filter(Boolean).join(' ')

  const quartier =
    a.suburb ||
    a.city_district ||
    a.neighbourhood

  const ville =
    a.city ||
    a.town ||
    a.village ||
    a.municipality

  const ligne2 = [
    quartier,
    ville,
    a.state,
    a.country
  ].filter(Boolean).join(', ')

  return [ligne1, ligne2].filter(Boolean).join(' – ')
}

function hideSuggestions() {
  // On laisse d'abord les autres handlers (selectSuggestion) se déclencher
  setTimeout(() => {
    // Si le focus est encore dans la zone d’adresse, on NE cache PAS
    const active = document.activeElement
    if (active && active.closest && active.closest('.adresse-wrapper')) {
      return
    }

    showSuggestions.value = false
  }, 100)
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

onMounted(async () => {
  // Bloquer le scroll dès que le composant est monté
  disableScroll()
  
  await nextTick()
  titreEl.value?.focus?.()
})

// Débloquer le scroll quand le composant est détruit
onUnmounted(() => {
  enableScroll()
})
</script>


<template>
  <div class="overlay"  @keydown="onKeydown" tabindex="-1" role="dialog" aria-modal="true">
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

          <div class="form-control" :class="{ invalid: categorieValidation }">
            <label for="categorieMarqueur">Categorie</label>
              <select id="categorieMarqueur" v-model="categorie"
                :aria-invalid="categorieValidation ? 'true':'false'"
                @input="categorieValidation=false" >
                <option :value="null" selected>Aucune</option>
                <option v-for="categorie in categorieStore.activeCategories" :key="categorie._id" :value="categorie._id">{{ categorie.nom }}</option>
              </select>
                
         
            <p v-if="categorieValidation" class="error-message">{{ categorieMessage }}</p>
          </div>

          <div class="form-control form-col-2" :class="{ invalid: adresseValidation }">
            <div class="adresse-wrapper" @mousedown.stop>
              <label for="adresseMarqueur">Adresse</label>

              <input
                id="adresseMarqueur"
                v-model.trim="adresse"
                type="text"
                placeholder="Ex: 897 Avenue Painchaud"
                :aria-invalid="adresseValidation ? 'true':'false'"
                @input="adresseValidation=false; onAdresseInput($event.target.value)"
                @focus="adresse && suggestions.length && (showSuggestions = true)"
                @blur="hideSuggestions"
              />

              <ul
                v-if="showSuggestions && suggestions.length"
                class="adresse-suggestions"
              >
                <li
                  v-for="item in suggestions"
                  :key="item.place_id"
                  @mousedown.prevent="selectSuggestion(item)"
                >
                  {{ formatSuggestion(item) }}
                </li>
              </ul>
            </div>
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
              <AddImage
                v-model="files"
                :initial-urls="initialImageUrls"
                @change="onImagesChange"
              />
            </div>
          </div>
        </div>

        <footer class="modal-actions">
          <button type="button" class="btn btn-muted" @click="confirmClose">Annuler</button>
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
  padding: 20px 24px 90px;
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

/* bloc de champ */
.form-control {
  background: rgba(248, 250, 252, 0.98);
  border-radius: 14px;
  padding: 12px 14px 10px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.form-control.invalid {
  border-color: #f97373;
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.3);
  background: #fef2f2;
}

/* labels */
.form-control label { 
  font-weight: 600; 
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* champs */
input,
select,
textarea {
  width: 100%; 
  padding: 0.7rem 0.9rem; 
  border: 1px solid #e5e7eb; 
  border-radius: 10px; 
  outline: none;
  background: #ffffff; 
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0); 
  transition: border-color .15s, box-shadow .15s, background 0.15s;
  font-size: 0.95rem;
  color: var(--text-main);
}

input::placeholder,
textarea::placeholder {
  color: var(--text-soft);
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--accent); 
  box-shadow: 0 0 0 3px rgba(56, 189, 248, .3);
  background: #f9feff;
}

textarea { 
  resize: vertical; 
  min-height: 90px;
}

option {
  font-size: 0.95rem;
  border-radius: 10px; 
}

/* erreurs & aide */
.error-message { 
  color: #dc2626; 
  font-size: .85rem;
  margin-top: 6px;
}

.help-row { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-top: 6px;
}

.char-count { 
  color: #6b7280; 
  font-size: .85rem;
}

/* image */
.image-row { 
  display: flex;
  flex-wrap: wrap;
  gap: 10px; 
  align-items: center;
}

.image-row .flex-1 { 
  flex: 1; 
  margin-bottom: 10px;
  border: none;
  padding: 12px 18px; 
  cursor: pointer;
  font-size: 0.95rem;
}

.image-preview {
  margin-top: 10px;
  width: 100%; 
  max-height: 220px; 
  object-fit: cover; 
  border-radius: 12px; 
  padding: 4px;
}

/* suggestions d’adresse */
.adresse-wrapper {
  position: relative;
}

.adresse-suggestions {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: 4px;
  list-style: none;
  padding: 4px 0;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
  max-height: 220px;
  overflow-y: auto;
  z-index: 20;
}

.adresse-suggestions li {
  padding: 7px 10px;
  font-size: 0.9rem;
  cursor: pointer;
  color: #111827;
}

.adresse-suggestions li:hover {
  background: #f3f4f6;
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

.btn-muted { 
  background: #f3f4f6; 
  color: #111827;
  border: 1px solid #e5e7eb;
  transition: background 0.18s ease, transform 0.1s ease, box-shadow 0.18s ease;
}

.btn-muted:hover { 
  background: #e5e7eb;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(148, 163, 184, 0.4);
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

/* file input bouton natif */
input[type="file"]::file-selector-button {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #111827;
  cursor: pointer;
  font-weight: 600;
  margin-right: 12px;
  transition: background 0.2s, border-color 0.2s, transform 0.1s;
}

input[type="file"]::file-selector-button:hover {
  background: #eef2f7;
  border-color: #c4cbd4;
  transform: translateY(-1px);
}

/* SCROLLBAR */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent; 
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.8); 
  border-radius: 8px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.95);
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
    padding: 18px 16px 80px;
  }
}

/* Animation d’apparition */
@keyframes fadeScale {
  from { opacity: 0; transform: scale(.97) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>