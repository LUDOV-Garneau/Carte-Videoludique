<script setup>
import { ref, watch, onMounted } from 'vue';
import { useMarqueurStore } from '../stores/useMarqueur.js';
import { useCategorieStore } from '../stores/useCategorie.js';
import AddImage from './AddImage.vue';
import * as utils from '../utils/utils.js';
import * as cloudinary from '../utils/cloudinary.js';
import { geocodeAddress, fetchAdresseSuggestions} from '../utils/geocode.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  coordinates: {
    type: Object,
    default: () => ({ lng: '', lat: '' })
  },
  adresse: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'marqueur-added', 'locate-address']);

const marqueurStore = useMarqueurStore();
const categorieStore = useCategorieStore();

const files = ref([]);
const suggestions = ref([])
const showSuggestions = ref(false)

// Charger les catégories au montage du composant
onMounted(async () => {
  await categorieStore.fetchCategories();
});

const form = ref({
  lng: '',
  lat: '',
  titre: '',
  description: '',
  categorie: null,
  nom: '',
  email: '',
  souvenir: '',
  adresse: '',
  images: [],
});

const formErrors = ref({
  lng: '',
  lat: '',
  titre: '',
  description: '',
  categorie: '',
  nom: '',
  email: '',
  souvenir: '',
  adresse: '',
  error: '',
});

watch(
  () => props.coordinates,
  (newCoords) => {
    form.value.lng = newCoords.lng;
    form.value.lat = newCoords.lat;
  },
  { immediate: true }
);

watch(
  () => props.adresse,
  (newAdresse) => {
    form.value.adresse = newAdresse;
  },
  { immediate: true }
);

watch(() => props.isOpen, async (newVal) => {
  if (newVal && newVal === true) {
    await categorieStore.fetchCategories();
  }
});

/**
 * Ferme le panneau d'ajout de marqueur.
 * 
 * Cette fonction :
 *  - Émet l'événement `close` vers le composant parent,
 *  - Réinitialise les champs du formulaire via `resetForm()`.
 *
 * @function closePanel
 * @returns {void}
 */
function closePanel() {
  emit('close');
  resetForm();
}

/**
 * Réinitialise complètement le formulaire d'ajout de marqueur.
 *
 * Cette fonction :
 *  - Vide toutes les valeurs du formulaire (`form.value`),
 *  - Réinitialise les messages d'erreur (`formErrors.value`),
 *  - Supprime les fichiers sélectionnés (`files.value`).
 *
 * Elle est généralement appelée :
 *  - Lors de la fermeture du panneau (`closePanel()`),
 *  - Après l'ajout réussi d'un marqueur.
 *
 * @function resetForm
 * @returns {void}
 */
function resetForm() {
  form.value = {
    lng: '',
    lat: '',
    titre: '',
    description: '',
    categorie: null,
    nom: '',
    email: '',
    souvenir: '',
    adresse: '',
    images: [],
  };
  formErrors.value = {
    lng: '',
    lat: '',
    titre: '',
    description: '',
    categorie: '',
    nom: '',
    email: '',
    souvenir: '',
    adresse: '',
    error: '',
  };
  files.value = [];
}

/**
 * Valide les champs du formulaire d'ajout de marqueur avant envoi.
 *
 * Cette fonction vérifie :
 *  - Que la latitude et la longitude sont soit **toutes deux remplies**, soit **toutes deux vides** ;
 *  - Qu'au moins **une adresse ou des coordonnées** est fournie ;
 *  - Que les champs obligatoires (`titre`, `description`) sont remplis ;
 *  - Que le **courriel** est valide, s'il est fourni.
 *
 * En cas d'erreur :
 *  - Les messages correspondants sont enregistrés dans `formErrors.value` ;
 *  - La fonction renvoie `false`.
 *
 * @function validateForm
 * @returns {boolean} `true` si le formulaire est valide, sinon `false`.
 */
function validateForm() {
  let isValid = true;
  formErrors.value = {
    lng: '',
    lat: '',
    titre: '',
    description: '',
    categorie: '',
    nom: '',
    email: '',
    souvenir: '',
    adresse: '',
  };

  // Vérif coordonnées complètes
  if ((!form.value.lng && form.value.lat) || (form.value.lng && !form.value.lat)) {
    formErrors.value.lng = 'La longitude et la latitude doivent être toutes les deux remplies ou laissées vides.';
    formErrors.value.lat = 'La longitude et la latitude doivent être toutes les deux remplies ou laissées vides.';
    isValid = false;
  }

  // Vérif que minimum adresse ou coordonnées
  if (!form.value.adresse && (!form.value.lng && !form.value.lat)) {
    formErrors.value.error = 'Il faut fournir une adresse ou des coordonnées (longitude et latitude).';
    isValid = false;
  }

  // Vérif titre requis
  if (!form.value.titre) {
    formErrors.value.titre = 'Le titre est requis.';
    isValid = false;
  }

  // Vérif description requise
  if (!form.value.description) {
    formErrors.value.description = 'La description est requise.';
    isValid = false;
  }

  // Vérif email si rempli
  if (form.value.email && !utils.isValidEmail(form.value.email)) {
    formErrors.value.email = 'Le courriel n\'est pas valide.';
    isValid = false;
  }

  return isValid;
}

/**
 * Envoie de façon asynchrone le contenu du formulaire au serveur pour créer un nouveau marqueur.
 *
 * La fonction :
 *  - Valide le formulaire via {@link validateForm}.
 *  - Envoie une requête POST vers l’API du site "Carte-Vidéoludique" à travers {marqueurStore}.
 *  - Ferme le panneau en cas de succès.
 *  - Journalise et relance l’erreur en cas d’échec.
 *
 * @async
 * @function sendRequest
 * @returns {emit {created}} Ne retourne rien, mais effectue des effets de bord (envoi HTTP, fermeture du panneau).
 * @throws {Error} Si la requête réseau échoue ou si la réponse du serveur contient une erreur.
 */
async function sendRequest() {
  try {
    if (validateForm()) {
      if (files.value.length > 0) {
        form.value.images = await cloudinary.uploadMultipleImages(files.value);
      }
      const created = await marqueurStore.ajouterMarqueur(form.value);

      emit('marqueur-added', created);
      closePanel();
    }
  } catch (err) {
    if (form.value.images.length) {
      try {
        await cloudinary.cleanupImages(form.value.images.map(img => img.publicId));
      } catch (e) {
        console.warn('Rollback Cloudinary a échoué :', e);
      }
    }
    console.error('sendRequest error:', err);
    throw err;
  }
}

/**
 * Localise une adresse saisie dans le formulaire sur la carte Leaflet.
 *
 * Cette fonction utilise `geocodeAddress()` pour convertir l’adresse textuelle
 * en coordonnées GPS, puis :
 *  - ajoute un marqueur à l’emplacement correspondant,
 *  - met à jour les champs de latitude et longitude du formulaire,
 *  - centre et zoome la carte sur cette position.
 *
 * Si un marqueur précédent existe déjà, il est supprimé avant d’ajouter le nouveau.
 *
 * ⚠️ Remarques :
 * - Si aucune adresse n’est saisie ou trouvée, la fonction ne fait rien.
 * - En cas d’erreur de géocodage, un message est inscrit dans `formErrors.value.adresse`.
 *
 * @async
 * @function locateFromAddress
 * @returns {emit {lat: number, lng: number}}
 * Coordonnées GPS de l’adresse localisée.
 * @throws {Error} En cas d’erreur réseau ou si l’API de géocodage échoue.
 *
 * @example
 * // Suppose que form.value.adresse = "350 rue des Lilas Ouest, Québec"
 * await locateFromAddress();
 * // → Ajoute un marqueur à la position correspondante et centre la carte.
 */
async function locateFromAddress() {
  const q = (form.value.adresse || '').trim()
  if (!q) return

  if(addressAlreadyExist(q)){
    formErrors.value.adresse = "Cette adresse existe déjà dans sur la carte"
    return
  }

  try {
    const pos = await geocodeAddress({ address: q })

    if (!pos) {
      console.warn(`Aucune position trouvée pour "${q}"`)
      formErrors.value.adresse = "Adresse introuvable ou hors Québec."
      return
    }

    const { lat, lng } = pos
    form.value.lat = Number(lat.toFixed(5))
    form.value.lng = Number(lng.toFixed(5))

    emit('locate-address', { lat, lng })
  } catch (e) {
    console.error('Erreur locateFromAddress :', e)
    formErrors.value.adresse = 'Adresse introuvable.'
  }
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
  form.value.adresse = value

  if (!value || value.length < 3) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  try {
    const results = await fetchAdresseSuggestions(form.value.adresse)
    suggestions.value = results
    showSuggestions.value = results.length > 0
  } catch (err) {
    console.error('Erreur fetchAdresseSuggestions :', err)
    suggestions.value = []
    showSuggestions.value = false
  }
}

/**
 * Vérifie si une adresse saisie par l'utilisateur correspond
 * à une adresse déjà présente sur la carte.
 *
 * Cette fonction effectue une comparaison insensible à la casse
 * entre l'adresse fournie et celles déjà enregistrées dans
 * `marqueurStore.marqueurs`.
 *
 * @param {string} adresse - L'adresse saisie par l'utilisateur.
 * @returns {boolean} `true` si l'adresse existe déjà sur la carte, sinon `false`.
 */
function addressAlreadyExist(adresse) {
  const lower = adresse.trim().toLowerCase()
  return marqueurStore.marqueurs.some(m =>
    (m.properties?.adresse ?? '').trim().toLowerCase() === lower
  )
}

/**
 * Gère la sélection d’une suggestion d’adresse.
 * - Met à jour le champ d’adresse.
 * - Met à jour les coordonnées.
 * - Émet un événement pour centrer la carte.
 * - Ferme immédiatement la liste des suggestions.
 */
function selectSuggestion(item) {
  form.value.adresse = item.label

  if (item && item.lat != null && item.lng != null) {
    const lat = Number(item.lat)
    const lng = Number(item.lng)

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      form.value.latitude = lat
      form.value.longitude = lng
      locateFromAddress({ lat, lng }) 
    }
  }
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

/**
 * Masque la liste de suggestions d’adresses après une courte temporisation.
 *
 * Cette fonction :
 *  - Utilise un `setTimeout` pour laisser le temps à d'autres gestionnaires d'événements,
 *    comme `selectSuggestion`, de se déclencher avant de masquer la liste.
 *  - Vérifie si le focus est toujours à l’intérieur du conteneur `.adresse-wrapper`
 *    (champ d’adresse ou liste de suggestions).
 *    Si c’est le cas, la liste reste visible.
 *  - Sinon, elle cache la liste des suggestions (`showSuggestions.value = false`).
 *
 * @function hideSuggestions
 * @returns {void}
 */
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
</script>

<template>
    <transition name="panel-fade">
        <aside v-if="isOpen" class="panel" role="dialog" aria-label="Ajouter un lieu">
            <header class="panel__header">
                <h3>Ajouter un lieu</h3>
                <button class="panel__close" @click="closePanel" aria-label="Fermer">×</button>
            </header>

            <div class="panel__body">
                <form class="form" @submit.prevent="sendRequest">
                    <div class="form-group">
                        <label for="lat">Latitude</label>
                        <input type="number" id="lat" v-model.number="form.lat" placeholder="Latitude" inputmode="decimal" min="-90" max="90" step="any" class="form-inputText"/>
                        <span class="error" v-if="formErrors.lat">{{ formErrors.lat }}</span>
                    </div>

                    <div class="form-group">
                        <label for="lng">Longitude</label>
                        <input type="number" id="lng" v-model.number="form.lng" placeholder="Longitude" inputmode="decimal" min="-180" max="180" step="any" class="form-inputText"/>
                        <span class="error" v-if="formErrors.lng">{{ formErrors.lng }}</span>
                    </div>

                    <div class="form-group">
                      <label for="adresse">Adresse</label>
                      <div class="adresse-wrapper" @mousedown.stop>

                      
                        <input 
                          type="text" 
                          id="adresse" 
                          v-model.trim="form.adresse" 
                          placeholder="123 Rue Saint-Jean, Vieux-Québec, Québec, Canada" 
                          @input="onAdresseInput($event.target.value)"
                          @focus="adresse && suggestions.length && (showSuggestions = true)"
                          @blur="hideSuggestions"
                          class="form-inputText"
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
                              {{ formatSuggestion(item)}}
                            </li>
                          </ul>
                      </div>
                      <span class="error" v-if="formErrors.adresse">{{ formErrors.adresse }}</span>

                      <button type="button" class="btn-locate" @click="locateFromAddress">Localiser</button>
                    </div>

                    <div class="form-group">
                        <label for="titre">Titre <span class="required">*</span></label>
                        <input type="text" id="titre" v-model.trim="form.titre" placeholder="Titre" class="form-inputText"/>
                        <span class="error" v-if="formErrors.titre">{{ formErrors.titre }}</span>
                    </div>

                    <div class="form-group">
                        <label for="categorie">Catégorie</label>
                        <select id="categorie" v-model="form.categorie" class="form-select" >
                        <option :value="null" selected>Aucune</option>
                        <option v-for="categorie in categorieStore.activeCategories" :key="categorie._id" :value="categorie._id">{{ categorie.nom }}</option>
                        </select>
                        <span class="error" v-if="formErrors.categorie">{{ formErrors.categorie }}</span>
                    </div>

                    <div class="form-group">
                        <label for="description">Description <span class="required">*</span></label>
                        <input type="text" id="description" v-model.trim="form.description" placeholder="Description" class="form-inputText"/>
                        <span class="error" v-if="formErrors.description">{{ formErrors.description }}</span>
                    </div>

                    <div class="form-group">
                        <label for="nom">Votre nom</label>
                        <input type="text" id="nom" v-model.trim="form.nom" placeholder="Nom" class="form-inputText"/>
                        <span class="error" v-if="formErrors.nom">{{ formErrors.nom }}</span>
                    </div>

                    <div class="form-group">
                        <label for="email">Courriel</label>
                        <input type="email" id="email" v-model.trim="form.email" placeholder="Courriel" class="form-inputText"/>
                        <span class="error" v-if="formErrors.email">{{ formErrors.email }}</span>
                    </div>

                    <div class="form-group">
                        <label for="souvenir">Souvenir</label>
                        <textarea id="souvenir" v-model.trim="form.souvenir" placeholder="Souvenir" class="form-textarea" rows="5"></textarea>
                        <span class="error" v-if="formErrors.souvenir">{{ formErrors.souvenir }}</span>
                    </div>

                    <div class="form-group">
                        <label for="image">Photo du lieu</label>
                        <p>Des photos utiles</p>
                        <AddImage v-model="files"/>
                    </div>

                    <div class="form-group form-submit">
                        <span class="error" v-if="formErrors.error">{{ formErrors.error }}</span>
                        <button type="submit" class="btn-submit">Envoyer</button>
                    </div>
                </form>
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
  right: 12px;
  width: 320px;

  display: flex;
  flex-direction: column;

  background: #f2f2f2;
  color: #111;
  border: 2px solid var(--accent);
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  z-index: 1000;
}

/* ---------- Header du panneau ---------- */

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 10px 12px;
  font-weight: 700;
  border-bottom: 1px solid #ddd;
}

.panel__header h3 {
  margin: 0;
  font-size: 16px;
}

.panel__close {
  width: 28px;
  height: 28px;
  line-height: 22px;
  font-size: 18px;

  border-radius: 4px;
  border: 2px solid var(--accent);
  background: white;
  color: var(--accent);

  cursor: pointer;
  transition: all 0.3s ease;
}

.panel__close:hover {
  background: var(--accent);
  color: white;
}

/* ---------- Corps du panneau ---------- */

.panel__body {
  flex: 1;

  padding: 12px 12px 0 12px;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

/* ---------- Formulaire ---------- */

.form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 4px;
}

.required {
  color: #D8000C;
}

/* Champs */

.form-inputText {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.form-textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  resize: none;
}

.form-select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

/* Erreurs */

.error {
  color: #D8000C;
  font-size: 13px;
  margin-top: 4px;
}

/* ---------- Boutons ---------- */

.btn-submit {
  margin-top: 12px;
  padding: 10px;

  background-color: white;
  color: var(--accent);
  border: 2px solid var(--accent);
  border-radius: 4px;

  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-submit:hover {
  background-color: #4CAF50;
  color: white;
}

.btn-locate {
  margin-top: 12px;
  padding: 8px;

  background-color: white;
  color: var(--accent);
  border: 2px solid var(--accent);
  border-radius: 4px;

  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-locate:hover {
  background-color: var(--accent);
  color: white;
}

/* Footer sticky du formulaire */

.form-submit {
  position: sticky;
  bottom: 0;
  padding: 12px 0;
  margin-top: auto;
  background: #f2f2f2;
  border-top: 1px solid #ddd;
}

/* ---------- Transitions du panneau ---------- */

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

.panel.left.panel-fade-enter-from,
.panel.left.panel-fade-leave-to {
  transform: translateX(-8px);
}

/* ---------- Suggestions d’adresse ---------- */

.adresse-wrapper {
  position: relative;
}

.adresse-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;

  margin-top: 4px;
  padding: 4px 0;

  max-height: 220px;
  overflow-y: auto;

  list-style: none;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 18px rgba(0,0,0,0.08);
  z-index: 9999;
}

.adresse-suggestions li {
  padding: 6px 10px;
  font-size: 0.9rem;
  cursor: pointer;
}

.adresse-suggestions li:hover {
  background: #f3f4f6;
}

</style>
