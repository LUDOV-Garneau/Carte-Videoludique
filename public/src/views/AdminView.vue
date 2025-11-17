<script setup>
import LeafletMap from '../components/LeafletMap.vue'
import { ref, onMounted, computed } from 'vue'
import { useMarqueursStore } from '../stores/useMarqueur'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const marqueursStore = useMarqueursStore()
const authStore = useAuthStore()

const messageErreur = ref('')

const filtreStatus = ref('pending')

const marqueursFiltres = computed(() => {
  console.log(marqueursStore.marqueurs)
  return (marqueursStore.marqueurs ?? []).filter(
    (m) => (m.properties.status ?? '').toLowerCase() === filtreStatus.value.toLowerCase(),
  )
})

const getMarqueurs = () => {
  marqueursStore.getMarqueurs().catch((error) => {
    messageErreur.value = error.message
  })
}

const accepterMarqueur = async (marqueur) => {
  const id = marqueur?.id
  if (!id) return

  try {
    if (!authStore.token) throw new Error('Non authentifié: token absent')

    const payload = { status: 'approved' }
    const updated = await marqueursStore.modifierMarqueurStatus(id, authStore.token, payload)

    if (updated) {
      marqueur.properties.status = updated.properties.status
    }

  } catch (err) {
    messageErreur.value = err.message
  }
}

const refuserMarqueur = async (marqueur) => {
  const id = marqueur?.id
  if (!id) return

  try {
    const payload = { status: "rejected" }
    const response = await marqueursStore.modifierMarqueurStatus(id, authStore.token, payload)

    // si supprimé => response === null
    if (response === null) {
      marqueursStore.marqueurs = marqueursStore.marqueurs.filter(
        (m) => m.id !== id
      )
    }

  } catch (err) {
    console.error(err)
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

      <!-- ⭐⭐⭐ TON MENU ADMIN ORIGINAL ⭐⭐⭐ -->
      <header class="page-header">
        <nav class="navbar navbar-expand-lg bg-body-tertiary mb-2 rounded">
          <div class="container-fluid">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">

              <li class="nav-item">
                <RouterLink class="nav-link" to="/admin">Notification marqueurs</RouterLink>
              </li>

              <li class="nav-item">
                <RouterLink class="nav-link" to="/admin/marqueurs">Liste des marqueurs</RouterLink>
              </li>

              <li class="nav-item">
                <RouterLink class="nav-link" to="/admin/utilisateurs">Gestion utilisateurs</RouterLink>
              </li>

              <li class="nav-item">
                <button class="nav-link btn btn-link text-danger p-0" @click="auth.logout">
                  Déconnexion
                </button>
              </li>

            </ul>
          </div>
        </nav>
      </header>
      <!-- ⭐⭐⭐ FIN MENU ADMIN ⭐⭐⭐ -->


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
            <tr v-if="!marqueursFiltres || marqueursFiltres.length === 0">
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
/* TON CSS ORIGINAL ENTIER – inchangé */
</style>
