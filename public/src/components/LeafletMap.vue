<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'
import { reverseGeocode, isAddressInQuebecProvince } from '../utils/geocode.js'
import AddMarqueurPanel from './AddMarqueurPanel.vue'
import MarqueurPanel from './MarqueurPanel.vue'
import CategorieEditPanel from './CategorieEditPanel.vue'
import { useAuthStore } from '../stores/auth.js'
import FilterPanel from './FilterPanel.vue'
import { useMarqueurStore } from '../stores/useMarqueur.js'
import { useCategorieStore } from '@/stores/useCategorie.js'
import { API_URL } from '../config.js'

import 'leaflet.fullscreen'
import 'leaflet.fullscreen/Control.FullScreen.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const authStore = useAuthStore()
const marqueurStore = useMarqueurStore()
const categorieStore = useCategorieStore()

const mapEl = ref(null)
let map
let controlAjoutMarqueur
let btnAjoutMarqueur
let controlEditCategorie
let btnEditCategorie
let controlFilter
let controlImportGeoJSON
let btnImportGeoJSON
let fileInput

const longitude = ref('')
const latitude = ref('')
const createPanelOpen = ref(false);
const infoPanelOpen = ref(false);
const categorieEditPanelOpen = ref(false);
const marqueurs = ref([]);
const selectedMarqueur = ref(null);
const currentMarqueur = ref(null);
const currentAdresse = ref('');
const filterPanelOpen = ref(false);
const activeFilters = ref([]);
const noResults = ref(false)

const QUEBEC_BOUND = L.latLngBounds(
  [40, -90],
  [63, -50]
)

function openFilterPanel() {
  filterPanelOpen.value = true;
}

function closeFilterPanel() {
  filterPanelOpen.value = false;
}

/**
 * Initialise la carte Leaflet et la centre sur Montréal.
 *
 * Cette fonction crée une instance de carte Leaflet, associée à l’élément DOM `mapEl`,
 * avec le zoom activé et une vue initiale centrée sur Montréal (45.5017, -73.5673).
 *
 * @function initMap
 * @returns {void}
 */
function initMap() {
  map = L.map(mapEl.value, {
    center: [52.5, -71.0],
    zoom: 5,
    minZoom: 5,
    maxZoom: 19,

    zoomControl: true,
    zoomAnimation: false,
    maxBounds: QUEBEC_BOUND,
    maxBoundsViscosity: 1.0,

    fullscreenControl: true,
    fullscreenControlOptions: {
      position: 'topleft',
      title: 'Plein écran',
      titleCancel: 'Quitter le plein écran'
    }
  })
  .setView([52.5, -71.0], 5);
}

/**
 * Ajoute la couche de tuiles (fond de carte) à la carte Leaflet.
 *
 * Utilise les tuiles « light_all » de CARTO basées sur OpenStreetMap.
 * Fournit un maximum de zoom de 19 et affiche les attributions nécessaires.
 *
 * @function addTileLayer
 * @returns {void}
 */
function addTileLayer() {
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    noWrap: true,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd'
  }).addTo(map)
}

/**
 * Centre la carte sur les coordonnées spécifiées avec une animation fluide.
 *
 * @function focusOn
 * @param {number} lat - Latitude du point à centrer.
 * @param {number} lng - Longitude du point à centrer.
 * @param {number} [zoom=16] - Niveau de zoom optionnel (par défaut 16).
 * @returns {void}
 */
function focusOn(lat, lng) {
  if (!map) return
  map.flyTo([lat, lng], 16)
}

/**
 * Configure le comportement du clic sur la carte.
 *
 * Lorsqu’un clic se produit :
 *  - Si le panneau est ouvert, place un marqueur à l’endroit cliqué.
 *  - Supprime tout marqueur précédent.
 *  - Met à jour les champs `latitude`, `longitude`.
 *  - Fait une géocodification inverse pour remplir `form.adresse`.
 *
 * @async
 * @function setupMapClickHandler
 * @returns {Promise<void>} Promise résolue lorsque le gestionnaire de clic est attaché.
 */
function setupMapClickHandler() {
	map.on('click', async (e) => {
		if (!createPanelOpen.value) return

		const { lat, lng } = e.latlng
		if (currentMarqueur.value) map.removeLayer(currentMarqueur.value)

		latitude.value = lat.toFixed(5);
		longitude.value = lng.toFixed(5);

    currentMarqueur.value = L.marker([lat, lng])
			.addTo(map)
			.bindPopup(`Proposition<br>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
			.openPopup();
		map.setView([lat, lng], 18);

		verifyAdressInQuebec(lat, lng)
	});
}

/**
 * Cette fonction vérifie si l'adresse est dans la province de Québec.
 * Si oui, elle ajoute le marqueur sur la carte
 * Sinon, elle retire le marqueur et affiche un message à l'utilisateur
 *
 * @param lat La coordonnée de latitude du marqueur
 * @param lng La coordonnée de longitude du marqueur
 */
async function verifyAdressInQuebec(lat, lng) {
  try {
    const result = await reverseGeocode({lat, lng});
    const addr = result.address;

    if (!addr) {
      if (currentMarqueur.value) {
        map.removeLayer(currentMarqueur.value);
        currentMarqueur.value = null;
      }
      currentAdresse.value = '';
      alert('Impossible de déterminer une adresse.');
      closeCreatePanel();
      return;
    }

    if (!isAddressInQuebecProvince(addr)) {
      if (currentMarqueur.value) {
        map.removeLayer(currentMarqueur.value);
        currentMarqueur.value = null;
      }
      currentAdresse.value = '';
      map.setView([lat, lng], 5);
      alert("L'adresse doit être située dans la province de Québec, Canada.");
      closeCreatePanel();
      return;
    }

    const quartier = addr.suburb || addr.city_district;
    const ville =
      addr.city || addr.town || addr.village || addr.municipality;

    const ligne = [
      addr.house_number,
      addr.road,
      quartier,
      ville,
      addr.state,
      addr.postcode,
      addr.country,
    ]
      .filter(Boolean)
      .join(', ');

    currentAdresse.value = ligne;

  } catch (err) {
    console.error(err);
    if (currentMarqueur.value) {
      map.removeLayer(currentMarqueur.value);
      currentMarqueur.value = null;
    }
    currentAdresse.value = '';
    alert("Erreur lors de la vérification de l'adresse.");
    closeCreatePanel();
  }
}

/**
 * Affiche tous les marqueurs sur la carte Leaflet.
 *
 * Cette fonction :
 *  - Récupère la liste des marqueurs depuis le store (`marqueurStore`),
 *  - Supprime les anciens marqueurs de la carte,
 *  - Crée et ajoute un nouveau `L.marker` pour chaque entrée de données,
 *  - Configure l'opacité selon le statut (`pending` = semi-transparent),
 *  - Attache un événement de clic sur chaque marqueur pour :
 *      → le définir comme marqueur sélectionné (`selectedMarqueur`),
 *      → charger ses données détaillées via `marqueurStore.getMarqueur(id)`,
 *      → ouvrir le panneau d'information (`openInfoPanel()`),
 *      → et recentrer la carte sur le marqueur.
 *
 * @async
 * @function afficherMarqueurs
 * @returns {Promise<void>} Promesse résolue lorsque les marqueurs sont affichés.
 *
 */
async function afficherMarqueurs() {
  try {
    await marqueurStore.getMarqueurs();

    // Supprimer les anciens marqueurs
    marqueurs.value.forEach(m => map.removeLayer(m));
    marqueurs.value = [];

    const filtered = marqueurStore.marqueurs.filter(m => {
      const categorie = m.properties?.categorie || null;
      if (activeFilters.value.length === 0) return true;
      return activeFilters.value.includes(categorie);
    });

    noResults.value = (filtered.length === 0);
    if (filtered.length === 0) return;

    filtered.forEach(mData => {
      if (!mData.geometry?.coordinates) return;

      const [lat, lng] = mData.geometry.coordinates;
      const props = mData.properties;

      // -------------------------------
      // 1️⃣ Icône basée sur la catégorie
      // -------------------------------
      let icon = DefaultIcon;

      if (props.categorie) {
        const cat = categorieStore.getCategorie(props.categorie);

        if (cat?.image?.filename) {
          const iconUrl = categorieStore.getIconUrl(cat.image.filename);

          icon = L.icon({
            iconUrl,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          });
        }
      }

      // -------------------------------
      // 2️⃣ Création du marker Leaflet
      // -------------------------------
      const marker = L.marker([lat, lng], { icon });

      if (props.status === "pending") {
        marker.setOpacity(0.45);
      }

      marker.properties = props;

      marker.on("click", () => {
        selectedMarqueur.value = marker;
        marqueurStore.getMarqueur(props.id);
        openInfoPanel();
        map.setView([lat, lng], Math.max(map.getZoom(), 15));
      });

      marker.addTo(map);
      marqueurs.value.push(marker);
    });

  } catch (e) {
    console.error("afficherMarqueurs ERROR →", e);
  }
}


/**
 * Ouvre le panneau d'ajout d'un marqueur
 */
function openCreatePanel() {
  createPanelOpen.value = true
  const container = map?.getContainer?.()
  if(container?.style) container.style.cursor = 'crosshair'
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = 'none'
  if (btnEditCategorie) btnEditCategorie.style.display = 'none'
}

/**
 * Ferme le panneau d'ajout d'un marqueur
 * et efface le contenu des champs si nécéssaire
 */
function closeCreatePanel() {
  createPanelOpen.value = false
  const container = map?.getContainer?.()
  if (container?.style) container.style.cursor = 'grab'
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = ''
  if (btnEditCategorie) btnEditCategorie.style.display = ''
  if (currentMarqueur.value) {
    map.removeLayer(currentMarqueur.value)
    currentMarqueur.value = null
  }
  latitude.value = ''
  longitude.value = ''
  currentAdresse.value = ''
}

/**
 * Ouvre le panneau d'information d'un marqueur.
 * Ferme le panneau d'ajout s'il est ouvert et masque le bouton d'ajout.
 */
function openInfoPanel() {
  if (createPanelOpen.value) closeCreatePanel();
  infoPanelOpen.value = true;
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = 'none';
}

/**
 * Ferme le panneau d'information d'un marqueur.
 * Réinitialise la sélection et réaffiche le bouton d'ajout.
 */
function closeInfoPanel() {
  infoPanelOpen.value = false;
  selectedMarqueur.value = null;
  marqueurStore.marqueurActif = null;
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = '';
}

/**
 * Ouvre le panneau d'édition des catégories.
 * Masque les boutons d'ajout et d'édition.
 */
function openCategorieEditPanel() {
  categorieEditPanelOpen.value = true;
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = 'none';
  if (btnEditCategorie) btnEditCategorie.style.display = 'none';
}

/**
 * Ferme le panneau d'édition des catégories.
 * Réaffiche les boutons d'ajout et d'édition.
 */
function closeCategorieEditPanel() {
  categorieEditPanelOpen.value = false;
  if (btnAjoutMarqueur) btnAjoutMarqueur.style.display = '';
  if (btnEditCategorie) btnEditCategorie.style.display = '';
}

/**
 * Gère la mise à jour de la carte après l'ajout d'un marqueur.
 * Recharge les marqueurs, nettoie le marqueur temporaire
 * et ferme le panneau d'ajout.
 */
async function handleMarqueurAdded() {
	await afficherMarqueurs();
	closeCreatePanel();
}

/**
 * Gère la mise à jour de la carte après la suppréssion d'un marqueur.
 * Recharge les marqueurs, nettoie le marqueur temporaire
 * et ferme le panneau d'ajout.
 */
async function handleMarqueurDeleted() {
  await afficherMarqueurs();
  closeInfoPanel();
}

/**
 * Localise une adresse sur la carte à partir de ses coordonnées.
 * Supprime l'ancien marqueur, ajoute le nouveau et recadre la carte.
 * @param {{ lat: number, lng: number }} coords
 */
function handlelocateFromAddress({ lat, lng }) {
	if (currentMarqueur.value) {
		map.removeLayer(currentMarqueur.value);
		currentMarqueur.value = null;
	}

	currentMarqueur.value = L.marker({lat, lng})
		.addTo(map)
		.bindPopup('Adresse localisée')
		.openPopup();

	latitude.value = lat.toFixed(5);
	longitude.value = lng.toFixed(5);

	map.setView({lat, lng}, 15);
}

/**
 * Ajoute un contrôle personnalisé à la carte Leaflet pour permettre
 * l’ouverture du panneau d’ajout de marqueur.
 *
 * Le contrôle est placé en haut à droite de la carte.
 * Il crée un bouton « + Ajouter un marqueur » qui appelle `openPanel()`
 * lorsqu’on clique dessus.
 *
 * @function addCustomControl
 * @returns {void}
 */
function addCustomControl() {
  const ControlAjoutMarqueur = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-custom')
      btnAjoutMarqueur = container

      const btn = L.DomUtil.create('a', 'btn-ajout-marqueur', container)
      btn.href = '#'
      btn.title = 'Ajouter un marqueur'
      btn.textContent = 'Ajouter un marqueur'
      btn.setAttribute('role', 'button')
      btn.setAttribute('aria-label', 'Ajouter un marqueur')
      btn.innerHTML = '<span aria-hidden="true"> + </span><span class="sr-only">Ajouter un marqueur</span>'

      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        openCreatePanel()
      })

      return container
    }
  });

  const ControlEditCategorie = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-custom');
      btnEditCategorie = container;

      const btn = L.DomUtil.create('a', 'btn-edit-categorie', container);
      btn.href = '#';
      btn.title = 'Gérer les catégories';
      btn.textContent = 'Gérer les catégories';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', 'Gérer les catégories');
      btn.innerHTML = '<span aria-hidden="true"> ✎ </span><span class="sr-only">Gérer les catégories</span>';

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        openCategorieEditPanel();
      });
      return container
    }
  });

  const ControlImportGeoJSON = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-custom');
      btnImportGeoJSON = container;

      const btn = L.DomUtil.create('a', 'btn-import-geojson', container);
      btn.href = '#';
      btn.title = 'Importer un fichier GeoJSON';
      btn.textContent = 'Importer GeoJSON';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', 'Importer un fichier GeoJSON');
      btn.innerHTML = '<span aria-hidden="true"> 📁 </span><span class="sr-only">Importer GeoJSON</span>';

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        openGeoJSONImport();
      });
      return container
    }
  });

  controlAjoutMarqueur = new ControlAjoutMarqueur()
  map.addControl(controlAjoutMarqueur)
  if (authStore.isAuthenticated) {
    controlEditCategorie = new ControlEditCategorie()
    map.addControl(controlEditCategorie)
    
    // Ajouter le contrôle d'importation GeoJSON pour les admins
    controlImportGeoJSON = new ControlImportGeoJSON()
    map.addControl(controlImportGeoJSON)
  }
}

/**
 * Ajoute un filtre selon la catégorie
 */
function addFilterControl() {
  const FilterControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const container = L.DomUtil.create("div", "leaflet-control leaflet-control-custom");

      const btn = L.DomUtil.create("a", "btn-filter-map", container);
      btn.href = "#";
      btn.title = "Filtrer les catégories";
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 4h18M6 10h12M9 16h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.on(btn, "click", (e) => {
        L.DomEvent.preventDefault(e);
        openFilterPanel();     // *** tu vas créer cette fonction ***
      });

      return container;
    }
  });

  controlFilter = new FilterControl();
  map.addControl(controlFilter);
}

/**
 * Configure les raccourcis clavier globaux liés à la carte.
 *
 * Actuellement, la touche **Échap (Escape)** permet de fermer le panneau
 * si celui-ci est ouvert. Le listener est stocké sur l’objet `map`
 * afin de pouvoir être retiré lors du démontage du composant (`onUnmounted`).
 *
 * @function setupKeyboardShortcuts
 * @returns {void}
 */
function setupKeyboardShortcuts() {
  const onKey = (e) => {
    if (e.key === 'Escape' && createPanelOpen.value) closeCreatePanel()
  }
  window.addEventListener('keydown', onKey)
  map.__onKey = onKey
}

function applyFilters(filters) {
  activeFilters.value = filters;
  afficherMarqueurs(); // refresh
}

function resetFilters() {
  activeFilters.value = [];
  afficherMarqueurs();
}

/**
 * Déclenche la sélection d'un fichier GeoJSON
 */
function openGeoJSONImport() {
  if (fileInput) {
    fileInput.click();
  }
}

/**
 * Traite le fichier GeoJSON sélectionné
 */
async function handleGeoJSONFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.geojson') && !file.name.toLowerCase().endsWith('.json')) {
    alert('Veuillez sélectionner un fichier GeoJSON (.geojson ou .json)');
    return;
  }

  console.log('Début de l\'import du fichier:', file.name, 'Taille:', file.size, 'octets');

  try {
    // Étape 1: Lire le fichier
    console.log('Lecture du fichier...');
    const text = await file.text();
    console.log('Fichier lu, taille du texte:', text.length, 'caractères');
    console.log('Début du contenu:', text.substring(0, 200));
    
    // Étape 2: Parser le JSON
    console.log('Parsing JSON...');
    let geoJsonData;
    try {
      geoJsonData = JSON.parse(text);
      console.log('JSON parsé avec succès, type:', geoJsonData.type);
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      alert(`Erreur de format JSON: ${parseError.message}`);
      return;
    }
    
    // Étape 3: Vérifier que c'est un GeoJSON valide
    if (!geoJsonData.type || (geoJsonData.type !== 'FeatureCollection' && geoJsonData.type !== 'Feature')) {
      console.error('Type GeoJSON invalide:', geoJsonData.type);
      alert(`Le fichier ne semble pas être un GeoJSON valide. Type trouvé: ${geoJsonData.type || 'undefined'}`);
      return;
    }

    console.log('Validation GeoJSON OK, envoi à l\'API...');

    // Étape 4: Envoyer à l'API
    const response = await fetch(`${API_URL}/marqueurs/import-geojson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authStore.token ? `Bearer ${authStore.token}` : ''
      },
      body: JSON.stringify(geoJsonData)
    });

    console.log('Réponse API reçue, status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('Résultat import:', result);
      alert(`Import réussi ! ${result.data.imported} marqueurs importés${result.data.categoriesCreated?.length > 0 ? `, ${result.data.categoriesCreated.length} nouvelles catégories créées` : ''}.`);
      await afficherMarqueurs(); // Recharger la carte
    } else {
      const errorText = await response.text();
      console.error('Erreur API:', response.status, errorText);
      try {
        const error = JSON.parse(errorText);
        alert(`Erreur lors de l'import: ${error.message}`);
      } catch {
        alert(`Erreur lors de l'import (${response.status}): ${errorText}`);
      }
    }
  } catch (error) {
    console.error('Erreur générale lors du traitement du fichier:', error);
    alert(`Erreur lors du traitement: ${error.message}`);
  } finally {
    // Reset input pour permettre de re-sélectionner le même fichier
    event.target.value = '';
  }
}

onMounted(async() => {
  initMap()
  addTileLayer()
  setupMapClickHandler()
  addCustomControl()
  addFilterControl();
  setupKeyboardShortcuts()
  
  // Créer l'input file caché pour l'import GeoJSON
  fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.geojson,.json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', handleGeoJSONFile);
  document.body.appendChild(fileInput);
  
  await afficherMarqueurs();
});

onUnmounted(() => {
  if (map) {
    if (controlAjoutMarqueur) map.removeControl(controlAjoutMarqueur)
    if (controlEditCategorie) map.removeControl(controlEditCategorie)
    if (controlImportGeoJSON) map.removeControl(controlImportGeoJSON)
    if (controlFilter) map.removeControl(controlFilter)
    if (map.__onKey) window.removeEventListener('keydown', map.__onKey)
    map.remove()
  }
  
  // Nettoyer l'input file
  if (fileInput && fileInput.parentNode) {
    fileInput.parentNode.removeChild(fileInput);
  }
});

defineExpose({
  afficherMarqueurs,
  handlelocateFromAddress,
  applyFilters,
  resetFilters,

  latitude,
  longitude,
  marqueurs,
  currentMarqueur,
  selectedMarqueur,
  map,
  focusOn
});
</script>


<template>

  <div class="map" ref="mapEl"></div>
  <div v-if="noResults" class="no-results">
    Aucun lieu trouvé pour ces filtres.
  </div>


  <MarqueurPanel
    :is-open="infoPanelOpen"
    @close="closeInfoPanel"
    @marqueur-deleted="handleMarqueurDeleted"
  />

  <AddMarqueurPanel
    :is-open="createPanelOpen"
    :coordinates="{ lat: latitude, lng: longitude }"
    :adresse="currentAdresse"
    @close="closeCreatePanel"
    @marqueur-added="handleMarqueurAdded"
    @locate-address="handlelocateFromAddress"
  />

  <CategorieEditPanel
    :is-open="categorieEditPanelOpen"
    @close="closeCategorieEditPanel"
  />

  <FilterPanel
    :is-open="filterPanelOpen"
    @close="closeFilterPanel"
    @apply-filters="applyFilters"
    @reset-filters="resetFilters"
  />
</template>

<style scoped>
.map {
  position: absolute;
  inset: 0;
}

/* ---------- Contrôle Leaflet custom ---------- */
:deep(.btn-ajout-marqueur) {
  background-color: white;
  border: 2px solid var(--accent);
  color: var(--accent-dark);
  padding: 5px 10px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}
:deep(.btn-ajout-marqueur:hover) {
  background-color: var(--accent);
  color: white;
}
:deep(.btn-edit-categorie) {
  background-color: white;
  border: 2px solid var(--accent);
  color: var(--accent-dark);
  padding: 5px 10px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}
:deep(.btn-edit-categorie:hover) {
  background-color: var(--accent);
  color: white;
}
:deep(.btn-import-geojson) {
  background-color: white;
  border: 2px solid #2196F3;
  color: #1976D2;
  padding: 5px 10px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}
:deep(.btn-import-geojson:hover) {
  background-color: #2196F3;
  color: white;
}

.leaflet-fullscreen-icon {
	background-image: url('icon-fullscreen.svg');
	background-size: 26px 52px;
}

.leaflet-fullscreen-icon.leaflet-fullscreen-on {
	background-position: 0 -26px;
}

.leaflet-touch .leaflet-fullscreen-icon {
	background-position: 2px 2px;
}

.leaflet-touch .leaflet-fullscreen-icon.leaflet-fullscreen-on {
	background-position: 2px -24px;
}

/* Safari still needs this vendor-prefix: https://caniuse.com/mdn-css_selectors_fullscreen */
/* stylelint-disable-next-line selector-no-vendor-prefix */
.leaflet-container:-webkit-full-screen,
.leaflet-container:fullscreen {
	width: 100% !important;
	height: 100% !important;
	z-index: 99999;
}

.leaflet-pseudo-fullscreen {
	position: fixed !important;
	width: 100% !important;
	height: 100% !important;
	top: 0 !important;
	left: 0 !important;
	z-index: 99999;
}

:deep(.btn-filter-map) {
  background: white;
  border: 2px solid var(--accent);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  transition: 0.2s;
}

:deep(.btn-filter-map:hover) {
  background: var(--accent);
  color: white;
}

.no-results {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 10px 18px;
  border-radius: 6px;
  border: 1px solid #ddd;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  font-size: 15px;
  font-weight: 600;
  color: #333;
  z-index: 5000;
}

</style>
