<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import { ref, onMounted, computed } from 'vue'
import { useMarqueursStore } from '../stores/useMarqueur'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const marqueursStore = useMarqueursStore()
const authStore = useAuthStore()

const messageErreur = ref('')
const filtreStatus = ref('pending')

// --------------------------------------------
// LISTE FILTRÉE (par statut)
// --------------------------------------------
const marqueursFiltres = computed(() => {
  return (marqueursStore.marqueurs ?? []).filter(
    (m) => (m.properties.status ?? '').toLowerCase() === filtreStatus.value.toLowerCase()
  )
})

// --------------------------------------------
// CHARGER LES MARQUEURS
// --------------------------------------------
const getMarqueurs = () => {
  marqueursStore.getMarqueurs().catch((error) => {
    messageErreur.value = error.message
  })
}

// --------------------------------------------
// ACCEPTER MARQUEUR
// --------------------------------------------
const accepterMarqueur = async (marqueur) => {
  const id = marqueur?.id
  if (!id) return

  try {
    const payload = { status: 'approved' }
    const updated = await marqueursStore.modifierMarqueurStatus(id, authStore.token, payload)

    if (!updated) return

    marqueur.properties.status = updated.properties.status

  } catch (err) {
    messageErreur.value = err.message
  }
}

// --------------------------------------------
// REFUSER / SUPPRIMER MARQUEUR
// --------------------------------------------
const refuserMarqueur = async (marqueur) => {
  const id = marqueur?.id
  if (!id) return

  try {
    const payload = { status: "rejected" }
    const response = await marqueursStore.modifierMarqueurStatus(id, authStore.token, payload)

    // Si supprimé → response === null
    if (response === null) {
      marqueursStore.marqueurs = marqueursStore.marqueurs.filter(m => m.id !== id)
      return
    }

  } catch (err) {
    console.error("Erreur rejet:", err)
  }
}

onMounted(() => {
  getMarqueurs()
})
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <span class="brand-vertical">L U D O V</span>
    </aside>

    <main class="content">

      <h2 class="section-title">Notifications</h2>

      <div class="offers-wrapper">
        <table class="offers-table" role="table" aria-label="Offres fournisseur">
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
              <td class="provider">{{ marqueur.properties.titre }}</td>
              <td class="address">{{ marqueur.properties.adresse }}</td>

              <td class="info-col">
                <button class="info-btn" @click="$emit('show-info', marqueur)">
                  <svg class="info-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.75" />
                    <line x1="12" y1="10.5" x2="12" y2="17" stroke="currentColor" stroke-width="1.75" />
                    <circle cx="12" cy="7.5" r="1.25" fill="currentColor" />
                  </svg>
                  <span>Afficher la description</span>
                </button>
              </td>

              <td class="menu-col">
                <button class="kebab" aria-label="Modifier" @click="$emit('menu', marqueur)">
                  Modifier
                </button>
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

      <section class="map-wrapper">
        <LeafletMap />
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ton CSS original ici inchangé */
</style>
