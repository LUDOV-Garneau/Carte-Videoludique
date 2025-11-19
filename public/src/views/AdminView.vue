<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import MarqueurModal from '../components/MarqueurModalComponent.vue'
import { ref, onMounted, computed } from 'vue'
import { useMarqueurStore } from '../stores/useMarqueur'
import { useAuthStore } from '@/stores/auth'
import { useEditRequestStore } from '@/stores/useEditRequest'
import { useRouter ,} from 'vue-router'
import * as cloudinary from '../utils/cloudinary.js'
import TableauNotification from '../components/TableauNotification.vue'
import NavBar from '../components/NavBar.vue';


/* ----------------------------------------------------
   STORES + ROUTER
---------------------------------------------------- */
const router = useRouter()
const authStore = useAuthStore()
const editRequestStore = useEditRequestStore()

/* ----------------------------------------------------
   REFS
---------------------------------------------------- */
const messageErreur = ref('')
const filtreStatus = ref('pending')
const modalVisible = ref(false)
const selectedMarqueur = ref(null)
const leafletMapRef = ref(null)

/* ----------------------------------------------------
   LOGOUT
---------------------------------------------------- */
const logout = () => {
  authStore.logout()
  router.push('/connexion')
}

/* ----------------------------------------------------
   MARQUEURS FILTRÉS
---------------------------------------------------- */
const marqueursFiltres = computed(() => {
  return (marqueurStore.marqueurs ?? []).filter(
    m => (m.properties.status ?? '').toLowerCase() === filtreStatus.value.toLowerCase()
  )
})

/* ----------------------------------------------------
   GET MARQUEURS
---------------------------------------------------- */
const getMarqueurs = () => {
  marqueurStore.getMarqueurs().catch(error => {
    messageErreur.value = error.message
  })
}

const ouvrirModal = (marqueur) => {
  selectedMarqueur.value = marqueur
  modalVisible.value = true
}

const getEditRequests = () => {
  editRequestStore.getEditRequests()
  .catch(error => {
    messageErreur.value = error.message;
  });
}

const accepterMarqueur = async (marqueur) => {
  const id = marqueur?.properties?.id
  if (!id) return

  try {
    if (!authStore.token) throw new Error('Non authentifié: token absent')

    console.log('ancien status:', marqueur.properties.status) // <-- AVANT

/* ----------------------------------------------------
   OUVRIR MODAL
---------------------------------------------------- */
const ouvrirModal = (marqueur) => {
  selectedMarqueur.value = marqueur
  modalVisible.value = true
}

/* ----------------------------------------------------
   ACCEPTER MARQUEUR
---------------------------------------------------- */
const accepterMarqueur = async (marqueur) => {
  const id = marqueur.id || marqueur._id || marqueur?.properties?.id
  if (!id) return console.error("Aucun ID trouvé (accepter):", marqueur)

  try {
    const updated = await marqueurStore.modifierMarqueurStatus(id, authStore.token, {
      status: 'approved'
    })

    if (updated?.properties?.status) {
      marqueur.properties.status = updated.properties.status
    }
  } catch (err) {
    messageErreur.value = err.message
  }
}

/* ----------------------------------------------------
   REFUSER → SUPPRIMER MARQUEUR
---------------------------------------------------- */
const refuserMarqueur = async (marqueur) => {
  const id = marqueur.id || marqueur._id || marqueur?.properties?.id
  if (!id) return console.error("Aucun ID trouvé pour suppression:", marqueur)

  try {
    await marqueurStore.supprimerMarqueur(id, authStore.token)

    marqueurStore.marqueurs = marqueurStore.marqueurs.filter(
      m => (m.id || m._id || m.properties?.id) !== id
    )

    await marqueurStore.getMarqueurs()
    console.log("Marqueur supprimé et liste rafraîchie")
  } catch (err) {
    console.error("Erreur suppression:", err)
  }
}

/* ----------------------------------------------------
   MODIFIER MARQUEUR
---------------------------------------------------- */
const validerModification = async (marqueurModifie) => {
  try {
    const id = marqueurModifie?.properties?.id || marqueurModifie?._id
    if (!id) throw new Error('Identifiant du marqueur manquant')

    const props = marqueurModifie?.properties ?? {}

    const payload = {
      titre: props.titre,
      type: props.type,
      adresse: props.adresse,
      description: props.description,
      temoignage: props.temoignage,
    }

    const lat = marqueurModifie.lat
    const lng = marqueurModifie.lng

    if (lat != null && lng != null) {
      payload.lat = Number(lat)
      payload.lng = Number(lng)
    }

    // Images
    let imagesPayload = Array.isArray(props.images) ? [...props.images] : []

    if (marqueurModifie.files?.length > 0) {
      try {
        const uploaded = await cloudinary.uploadMultipleImages(marqueurModifie.files)
        if (Array.isArray(uploaded)) {
          imagesPayload = [...imagesPayload, ...uploaded]
        }
      } catch (uploadErr) {
        console.warn('Erreur upload image:', uploadErr)
      }
    }

    payload.images = imagesPayload

    await marqueurStore.modifierMarqueur(id, authStore.token, payload)

    modalVisible.value = false
    messageErreur.value = ''
    await getMarqueurs()

    if (leafletMapRef.value?.afficherMarqueurs) {
      leafletMapRef.value.afficherMarqueurs()
    }
  } catch (err) {
    messageErreur.value = err.message || String(err)
  }
}

/* ----------------------------------------------------
   ON MOUNT
---------------------------------------------------- */
onMounted(() => {
  getMarqueurs()
  getEditRequests()
})
</script>

<template>
  <NavBar/>
  <div class="layout">
    <main class="content">
      <h2 class="section-title">Notifications</h2>
     
      <TableauNotification
        v-model:filtre-status="filtreStatus"
        :marqueurs-filtres="marqueursFiltres"
        @ouvrir-modal="ouvrirModal"
        @accepter="accepterMarqueur"
        @refuser="refuserMarqueur"
      />

      <MarqueurModal
        v-if="modalVisible && selectedMarqueur"
        :marqueur="selectedMarqueur"
        @fermer="modalVisible = false; selectedMarqueur = null"
        @locate-from-address="handleLocateFromAddressFromModal"
        @valider="validerModification"
      />

      <section class="map-wrapper">
        <LeafletMap ref="leafletMapRef" />
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Tableau de notification */

/* Titre */
/* ---------- Typo & couleurs locales (sans :root) ---------- */
h1,
h2,
p,
table {
  color: #111827;
}

/* ---------- Layout & fond blanc texturé ---------- */
.layout {
  display: flex;
  min-height: 100vh;
  position: relative;
  isolation: isolate;
}

/* ---------- Contenu & header ---------- */
.content {
  flex: 1;
  padding: 28px clamp(16px, 3vw, 40px);
  margin: 0;
}

/* ---------- Titre section ---------- */
.section-title {
  margin: 8px auto 12px;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  max-width: 1100px;
}

/* ---------- Carte encadrée premium ---------- */
.map-wrapper {
  position: relative;
  margin: 18px auto 0;
  width: 100%;
  max-width: 1200px;
  height: min(78vh, 900px);
  border-radius: 20px;
  overflow: clip;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 6px 14px rgba(0, 0, 0, 0.06);
}

/* ---------- Titres par défaut ---------- */
h1 {
  color: #0f172a;
}
h2 {
  color: #0f172a;
  text-decoration: underline;
}
.logout-btn:hover {
  background: #dc2626;
}
.logout-btn:active {
  transform: scale(0.97);
}

/* tout ton CSS en dessous est inchangé */
</style>
