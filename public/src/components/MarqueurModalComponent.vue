<script setup>
import { defineProps, defineEmits, ref, watch, onMounted, nextTick, computed } from 'vue'
import AddImage from './AddImage.vue'
import { fetchAdresseSuggestions, geocodeAddress } from '../utils/geocode'

const props = defineProps({
  marqueur: { type: Object, required: true }
})

const emit = defineEmits(['fermer', 'valider', 'locate-from-address'])

const titre = ref('')
const type = ref('')
const adresse = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)
const description = ref('')
const temoignage = ref('')
const latitude = ref(null)
const longitude = ref(null)

const files = ref([])
const imagePreview = ref('')

const TYPES = [
  'Écoles et instituts de formation',
  'Développement et édition de jeux',
  'Boutiques spécialisées',
  'Magasins à grande surface',
  'Friperies, marchés aux puces et d\'occasion',
  'Dépanneurs et marchés',
  'Clubs vidéo',
  'Arcades et salles de jeux',
  'Organismes et institutions',
  'Autres',
]

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
const typeEl = ref(null)
const adresseEl = ref(null)
const descriptionEl = ref(null)

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

const hydrateFromProps = () => {
  const p = props.marqueur?.properties ?? {}
  titre.value = p.titre ?? ''
  type.value = p.type ?? ''
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
  typeValidation.value = false
  adresseValidation.value = false
  descriptionValidation.value = false
  titreMessage.value = ''
  typeMessage.value = ''
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
      type: type.value.trim(),
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
  await nextTick()
  titreEl.value?.focus?.()
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

          <div class="form-control" :class="{ invalid: typeValidation }">
            <label for="typeMarqueur">Type</label>
              <select id="typeMarqueur" v-model.trim="type"
                :aria-invalid="typeValidation ? 'true':'false'"
                @input="typeValidation=false" >
                <option v-for="option in TYPES" :key="option" :value="option">{{ option }}</option>
              </select>
                
         
            <p v-if="typeValidation" class="error-message">{{ typeMessage }}</p>
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
          <img
            v-if="imagePreview"
            :src="imagePreview"
            alt="Aperçu"
            class="image-preview"/>
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
input,select,
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
select:focus,
textarea:focus{
  border-color: var(--accent); 
  box-shadow:0 0 0 3px rgba(0,216,224,.25);
}
textarea{ 
  resize: vertical; 
}

option{
  font-size: 0.95rem;
  
  border-radius:10px; 
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
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 18px rgba(0,0,0,0.08);
  max-height: 220px;
  overflow-y: auto;
  z-index: 20;
}

.adresse-suggestions li {
  padding: 6px 10px;
  font-size: 0.9rem;
  cursor: pointer;
}

.adresse-suggestions li:hover {
  background: #f3f4f6;
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