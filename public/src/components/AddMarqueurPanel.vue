<script setup>
import { ref, watch } from 'vue';
import { useMarqueurStore } from '../stores/useMarqueur.js';
import AddImage from './AddImage.vue';
import * as utils from '../utils/utils.js';
import * as cloudinary from '../utils/cloudinary.js';
import { geocodeAddress } from '../utils/geocode.js';

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

const files = ref([]);

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
];

const form = ref({
  lng: '',
  lat: '',
  titre: '',
  description: '',
  type: '',
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
  type: '',
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
    type: '',
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
    type: '',
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
    type: '',
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

                        <input 
                          type="text" 
                          id="adresse" 
                          v-model.trim="form.adresse" 
                          placeholder="123 Rue Saint-Jean, Québec, QC, Canada" 
                          class="form-inputText"
                          />
                        <span class="error" v-if="formErrors.adresse">{{ formErrors.adresse }}</span>

                        <button type="button" class="btn-locate" @click="locateFromAddress">Localiser</button>
                    </div>

                    <div class="form-group">
                        <label for="titre">Titre <span class="required">*</span></label>
                        <input type="text" id="titre" v-model.trim="form.titre" placeholder="Titre" class="form-inputText"/>
                        <span class="error" v-if="formErrors.titre">{{ formErrors.titre }}</span>
                    </div>

                    <div class="form-group">
                        <label for="type">Type</label>
                        <select id="type" v-model="form.type" class="form-select">
                        <option value="" selected>Aucun</option>
                        <option v-for="type in TYPES" :key="type" :value="type">{{ type }}</option>
                        </select>
                        <span class="error" v-if="formErrors.type">{{ formErrors.type }}</span>
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
}

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
  border-radius: 4px;
  border: 2px solid #4CAF50;
  background: white;
  color: #4CAF50;
  line-height: 22px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.panel__close:hover {
  background: #4CAF50;
  color: white;
}

.panel__body {
  padding: 12px 12px 0 12px;
  overflow: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Formulaire */
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
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

.form-inputText {
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

.error {
  color: #D8000C;
  font-size: 13px;
  margin-top: 4px;
}

.btn-submit {
  background-color: white;
  color: #4CAF50;
  padding: 10px;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 12px;
}

.btn-submit:hover {
  background-color: #4CAF50;
  color: white;
}

.btn-locate {
  background-color: white;
  color: #4CAF50;
  padding: 8px;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 12px;
}

.btn-locate:hover {
  background-color: #4CAF50;
  color: white;
}

.form-submit {
  position: sticky;
  bottom: 0;
  background: #f2f2f2;
  padding: 12px 0;
  margin-top: auto;
  border-top: 1px solid #ddd;
}

/* Transition simple (fade + léger slide) */
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
</style>
