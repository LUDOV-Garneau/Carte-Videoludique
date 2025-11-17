<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import MarqueurModal from '../components/MarqueurModalComponent.vue'
import { ref, onMounted, computed } from 'vue'
import { useMarqueurStore } from '../stores/useMarqueur'
import { useAuthStore } from '@/stores/auth'
import { useRouter ,} from 'vue-router'
import * as cloudinary from '../utils/cloudinary.js'
import TableauNotification from '../components/TableauNotification.vue'

const props = defineProps({
  marqueur: {
    type: Object,
    required: true
  }
})

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/connexion')
}

const marqueurStore = useMarqueurStore()
const authStore = useAuthStore()

const messageErreur = ref('')

const filtreStatus = ref('pending')
const modalVisible = ref(false)
const selectedMarqueur = ref(null)
const leafletMapRef = ref(null)


const marqueursFiltres = computed(() => {
  console.log(marqueurStore.marqueurs)
  return (marqueurStore.marqueurs ?? []).filter(
    m => (m.properties.status ?? '').toLowerCase() === filtreStatus.value.toLowerCase()
  )
})

const getMarqueurs = () => {
  marqueurStore.getMarqueurs()
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

    const payload = { status: 'approved' };
    const updated = await marqueurStore.modifierMarqueurStatus(id, authStore.token, payload);

    console.log('status renvoyé par le serveur:', updated?.properties?.status) // <-- RÉPONSE

    marqueur.properties.status = updated.properties.status

    console.log('nouveau status local:', marqueur.properties.status) // <-- APRÈS
  } catch (err) {
    messageErreur.value = err.message
  }
}

const refuserMarqueur = async (marqueur) => {
  const id = marqueur?.properties?.id
  if (!id) return

  try {
    if (!authStore.token) throw new Error('Non authentifié: token absent')

    console.log('ancien status:', marqueur.properties.status) // <-- AVANT

    const payload = { status: 'rejected' }
    const updated = await marqueurStore.modifierMarqueurStatus(id, authStore.token, payload)

    console.log('status renvoyé par le serveur:', updated?.properties?.status) // <-- RÉPONSE

    marqueur.properties.status = updated.properties.status

    console.log('nouveau status local:', marqueur.properties.status) // <-- APRÈS
  } catch (err) {
    messageErreur.value = err.message
  }
};

const validerModification = async (marqueurModifie) => {
  try {
    console.log('Marqueur modifié reçu dans AdminView:', marqueurModifie)

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

    // 🔹 récupérer lat/lng envoyés par le modal
    const lat = marqueurModifie.lat
    const lng = marqueurModifie.lng

    if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      payload.lat = Number(lat)
      payload.lng = Number(lng)
    }

    console.log('Payload avant envoi :', payload)

    // ---------- images ----------
    let imagesPayload = Array.isArray(props.images) ? [...props.images] : []

    if (marqueurModifie.files && marqueurModifie.files.length > 0) {
      try {
        const uploaded = await cloudinary.uploadMultipleImages(marqueurModifie.files)
        if (Array.isArray(uploaded) && uploaded.length > 0) {
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
    console.error('Erreur lors de la modification:', err)
  }
}

// const showInfo = (marqueur) => { selectedMarqueur.value = marqueur; modalVisible.value = true }


onMounted(() => {
  getMarqueurs()
})
</script>

<template>
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
        <LeafletMap ref="leafletMapRef"/>
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
  background:
    radial-gradient(circle at 25% -10%, rgba(0, 0, 0, 0.03) 0%, transparent 40%),
    radial-gradient(circle at 120% 10%, rgba(0, 0, 0, 0.02) 0%, transparent 45%),
    linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  position: relative;
  isolation: isolate;
}

/* ---------- Contenu & header ---------- */
.content {
  flex: 1;
  padding: 28px clamp(16px, 3vw, 40px);
  margin: 0;
}
.page-header {
  max-width: 1100px;
  margin: 0 auto 24px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px 28px 0;
  backdrop-filter: blur(8px) saturate(1.05);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.05);
}

.page-header-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.page-title {
  text-align: center;
  font-weight: 800;
  font-size: clamp(1.5rem, 2vw + 0.6rem, 2rem);
  color: #0f172a;
  margin: 0;
}

/* ---------- Navbar (Bootstrap-friendly) ---------- */
.page-header .navbar {
  background: transparent !important;
  box-shadow: none !important;
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
  margin-top: 8px;
}
.navbar .nav-link {
  color: #334155;
  font-weight: 500;
  transition: color 0.2s ease;
}
.navbar .nav-link:hover {
  color: #0f172a;
}
.nav-link.active {
  color: #0f766e;
  font-weight: 700;
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
p {
  color: #111827;
}
table {
  color: #111827;
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .sidebar {
    width: 72px;
  }
  .brand-vertical {
    font-size: 1.05rem;
    letter-spacing: 0.16rem;
  }
  .page-header {
    padding: 16px 18px;
  }
  .navbar {
    border-radius: 12px;
  }
  .map-wrapper {
    height: 70vh;
  }
}
@media (max-width: 640px) {
  .sidebar {
    display: none;
  }
  .content {
    padding: 18px 14px;
  }
  .page-header {
    padding: 12px 18px;
  }
  .page-header-content {
    gap: 8px;
  }
  .page-title {
    font-size: 1.4rem;
  }
  .map-wrapper {
    height: 63vh;
  }
}
</style>
