<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import MarqueurModal from '../components/MarqueurModalComponent.vue'
import { ref, onMounted, computed, watch } from 'vue'
import { useMarqueurStore } from '../stores/useMarqueur'
import { useAuthStore } from '@/stores/auth'
import * as cloudinary from '../utils/cloudinary.js'
import TableauNotification from '../components/TableauNotification.vue'
import NavBar from '../components/NavBar.vue'
import { useCommentRequestStore } from "@/stores/useCommentRequestStore.js"

/* ------------------ STORES ------------------ */
const authStore = useAuthStore()
const marqueurStore = useMarqueurStore()
const commentStore = useCommentRequestStore()

/* ------------------ ÉTATS ------------------ */
const filtreStatus = ref("pending")
const modalVisible = ref(false)
const selectedMarqueur = ref(null)
const leafletMapRef = ref(null)

/* ----------------------------------------------------
   ⭐ Filtrage local selon pending / edit-request
---------------------------------------------------- */
const marqueursFiltres = computed(() => {
  return (marqueurStore.marqueurs ?? []).filter(
    m => (m.properties?.status ?? "").toLowerCase() === filtreStatus.value.toLowerCase()
  )
})

/* ----------------------------------------------------
   ⭐ Charger selon onglet
---------------------------------------------------- */
async function rechargerSelonOnglet() {
  if (filtreStatus.value === "archived") {
    await marqueurStore.getArchivedMarqueurs()
  } else {
    await marqueurStore.getMarqueurs()
  }
}

watch(filtreStatus, async (newVal) => {
  if (newVal === "comments") {
    await commentStore.getPendingComments()
  }
  await rechargerSelonOnglet()
})

/* ----------------------------------------------------
   ⭐ Modal
---------------------------------------------------- */
function ouvrirModal(marqueur) {
  selectedMarqueur.value = marqueur
  modalVisible.value = true
}

/* ----------------------------------------------------
   ⭐ Accepter un marqueur
---------------------------------------------------- */
async function accepterMarqueur(marqueur) {
  const id = marqueur?.properties?.id || marqueur._id
  if (!id) return

  await marqueurStore.modifierMarqueurStatus(id, authStore.token, { status: "approved" })

  await rechargerSelonOnglet()
  leafletMapRef.value?.afficherMarqueurs?.()
}

/* ----------------------------------------------------
   ⭐ Refuser / Archiver un marqueur
---------------------------------------------------- */
async function refuserMarqueur(marqueur) {
  const id = marqueur?.properties?.id || marqueur._id
  if (!id) return

  await marqueurStore.supprimerMarqueur(id, authStore.token)

  await rechargerSelonOnglet()
  leafletMapRef.value?.afficherMarqueurs?.()
}

/* ----------------------------------------------------
   ⭐ Gestion des commentaires
---------------------------------------------------- */
async function accepterCommentaire(marqueurId, commentId) {
  await commentStore.accepter(marqueurId, commentId)
  await commentStore.getPendingComments()
}

async function refuserCommentaire(marqueurId, commentId) {
  await commentStore.refuser(marqueurId, commentId)
  await commentStore.getPendingComments()
}

/* ----------------------------------------------------
   ⭐ Centrer sur la carte
---------------------------------------------------- */
function centrerCarte(marqueur) {
  if (!marqueur?.geometry?.coordinates) return
  const [lat, lng] = marqueur.geometry.coordinates
  leafletMapRef.value?.focusOn?.(lat, lng)
}

/* ----------------------------------------------------
   ⭐ Valider modification
---------------------------------------------------- */
async function validerModification(marqueurModifie) {
  const id = marqueurModifie?.properties?.id || marqueurModifie?._id
  if (!id) return

  const props = marqueurModifie.properties

  const payload = {
    titre: props.titre,
    categorie: props.categorie,
    adresse: props.adresse,
    description: props.description,
    temoignage: props.temoignage,
    images: [...props.images]
  }

  if (marqueurModifie.files?.length > 0) {
    const uploaded = await cloudinary.uploadMultipleImages(marqueurModifie.files)
    payload.images.push(...uploaded)
  }

  await marqueurStore.modifierMarqueur(id, authStore.token, payload)

  modalVisible.value = false

  await rechargerSelonOnglet()
  leafletMapRef.value?.afficherMarqueurs?.()
}

/* ----------------------------------------------------
   ⭐ Chargement initial
---------------------------------------------------- */
onMounted(async () => {
  await marqueurStore.getMarqueurs()
})
</script>

<template>
  <NavBar />

  <div class="layout">
    <main class="content">

      <h2 class="section-title">Notifications</h2>

      <TableauNotification
        v-model:filtre-status="filtreStatus"
        :marqueurs-filtres="marqueursFiltres"
        @ouvrir-modal="ouvrirModal"
        @accepter-marqueur="accepterMarqueur"
        @refuser-marqueur="refuserMarqueur"
        @accepter-commentaire="accepterCommentaire"
        @refuser-commentaire="refuserCommentaire"
        @focus-marqueur="centrerCarte"
        @refresh="async () => { await rechargerSelonOnglet(); leafletMapRef.value?.afficherMarqueurs?.(); }"
      />

      <MarqueurModal
        v-if="modalVisible && selectedMarqueur"
        :is-open="modalVisible"
        :marqueur="selectedMarqueur"
        @fermer="modalVisible = false; selectedMarqueur = null"
        @valider="validerModification"
      />

      <section class="map-wrapper">
        <LeafletMap ref="leafletMapRef" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.content {
  flex: 1;
  padding: 28px clamp(16px, 3vw, 40px);
}
.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}
.map-wrapper {
  margin-top: 18px;
  height: min(78vh, 900px);
  max-width: 1200px;
  width: 100%;
  border-radius: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 6px 14px rgba(0, 0, 0, 0.06);
}
</style>
