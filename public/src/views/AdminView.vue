<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import MarqueurModal from '../components/MarqueurModalComponent.vue'
import { ref, onMounted, computed } from 'vue'
import { useMarqueurStore } from '../stores/useMarqueur'
import { useAuthStore } from '@/stores/auth'

import * as cloudinary from '../utils/cloudinary.js'
import TableauNotification from '../components/TableauNotification.vue'
import NavBar from '../components/NavBar.vue'

const authStore = useAuthStore()
const marqueurStore = useMarqueurStore()

const messageErreur = ref('')
const filtreStatus = ref('pending')
const modalVisible = ref(false)
const selectedMarqueur = ref(null)
const leafletMapRef = ref(null)



const marqueursFiltres = computed(() => {
  return (marqueurStore.marqueurs ?? []).filter(
    m => (m.properties.status ?? '').toLowerCase() === filtreStatus.value.toLowerCase()
  )
})

const getMarqueurs = () => {
  marqueurStore.getMarqueurs().catch(error => {
    messageErreur.value = error.message
  })
}


const ouvrirModal = (marqueur) => {
  selectedMarqueur.value = marqueur
  modalVisible.value = true
}

const accepterMarqueur = async (marqueur) => {
  if (!authStore.token) {
    messageErreur.value = "Non authentifié"
    return
  }

  const id = marqueur?.properties?.id || marqueur.id || marqueur._id
  if (!id) return

  try {
    const updated = await marqueurStore.modifierMarqueurStatus(id, authStore.token, {
      status: 'approved'
    })

    if (updated?.properties?.status) {
      marqueur.properties.status = updated.properties.status
    }
    if (leafletMapRef.value?.afficherMarqueurs) {
      leafletMapRef.value.afficherMarqueurs()
    }
  } catch (err) {
    messageErreur.value = err.message
  }
}

const refuserMarqueur = async (marqueur) => {
  const id = marqueur?.properties?.id || marqueur.id || marqueur._id
  if (!id) return

  try {
    await marqueurStore.supprimerMarqueur(id, authStore.token)

    marqueurStore.marqueurs = marqueurStore.marqueurs.filter(
      m => (m.id || m._id || m.properties?.id) !== id
    )

    await marqueurStore.getMarqueurs()

    if (leafletMapRef.value?.afficherMarqueurs) {
      leafletMapRef.value.afficherMarqueurs()
    }
  } catch (err) {
    console.error("Erreur suppression:", err)
  }
}

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

onMounted(() => {
  getMarqueurs()
  
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
        @accepter-marqueur="accepterMarqueur"
        @refuser-marqueur="refuserMarqueur"
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
