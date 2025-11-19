<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import MarqueurModal from '../components/MarqueurModalComponent.vue'
import { ref, onMounted, computed } from 'vue'
import { useMarqueurStore } from '../stores/useMarqueur'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import * as cloudinary from '../utils/cloudinary.js'

/* ----------------------------------------------------
   STORES + ROUTER
---------------------------------------------------- */
const router = useRouter()
const authStore = useAuthStore()
const marqueurStore = useMarqueurStore()   // ← FIX : bon nom

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

/* ----------------------------------------------------
   LOCALISATION VIA MODAL
---------------------------------------------------- */
function handleLocateFromAddressFromModal(coords) {
  leafletMapRef.value?.handleLocateFromAddress?.(coords)
}

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

    leafletMapRef.value?.afficherMarqueurs?.()
  } catch (err) {
    messageErreur.value = err.message || String(err)
  }
}

/* ----------------------------------------------------
   ON MOUNT
---------------------------------------------------- */
onMounted(() => {
  getMarqueurs()
})
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <span class="brand-vertical">L U D O V</span>

      <!-- 🔥 Bouton Déconnexion ajouté -->
      <button class="logout-btn" @click="logout">Déconnexion</button>
    </aside>

    <main class="content">
      <h2 class="section-title">Notifications</h2>

      <div class="offers-wrapper">
        <table class="offers-table" role="table">
          <thead>
            <tr>
              <th>Lieu</th>
              <th>Adresse</th>
              <th class="info-col">Info</th>
              <th class="modif-col">Modification</th>
              <th class="accept-col">Accepter</th>
              <th class="reject-col">Refuser</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="marqueur in marqueursFiltres" :key="marqueur.id">
              <td>{{ marqueur.properties.titre }}</td>
              <td>{{ marqueur.properties.adresse }}</td>

              <td class="info-col">
                <button class="info-btn" @click="$emit('show-info', marqueur)">
                  <span>Afficher la description</span>
                </button>
              </td>

              <td class="menu-col">
                <button class="kebab" @click="ouvrirModal(marqueur)">Modifier</button>
              </td>

              <td class="accept-col">
                <button class="action-btn accept" @click="accepterMarqueur(marqueur)">
                  Accepter
                </button>
              </td>

              <td class="reject-col">
                <button class="action-btn reject" @click="refuserMarqueur(marqueur)">
                  Refuser
                </button>
              </td>
            </tr>

            <tr v-if="marqueursFiltres.length === 0">
              <td colspan="6" class="empty">Aucune offre pour le moment.</td>
            </tr>
          </tbody>
        </table>
      </div>

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
.logout-btn {
  margin-top: 20px;
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  width: 80%;
  transition: background 0.2s ease, transform 0.1s ease;
}
.logout-btn:hover {
  background: #dc2626;
}
.logout-btn:active {
  transform: scale(0.97);
}

/* tout ton CSS en dessous est inchangé */
</style>
