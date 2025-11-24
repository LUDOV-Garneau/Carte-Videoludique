<script setup>
import { onMounted, watch } from 'vue'
import { useEditRequestStore } from '@/stores/useEditRequest'
import { useAuthStore } from '@/stores/auth'

const editRequestStore = useEditRequestStore()
const authStore = useAuthStore()

const props = defineProps({
  filtreStatus: { type: String, default: 'pending' },
  marqueursFiltres: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:filtreStatus',
  'ouvrir-modal',
  'accepter-marqueur',
  'refuser-marqueur',
  'show-info',
  'focus-marqueur'
])

const setFiltre = (status) => {
  emit('update:filtreStatus', status)
}

const ouvrirModalLocal = (marqueur) => {
  emit('ouvrir-modal', marqueur)
}

const accepterLocal = (marqueur) => {
  emit('accepter-marqueur', marqueur)
}

const refuserLocal = (marqueur) => {
  emit('refuser-marqueur', marqueur)
}

const focusMarqueur = (marqueur) => {
  emit('focus-marqueur', marqueur)
}

const loadEditRequests = async () => {
  try {
    const token = authStore.token
    const data = await editRequestStore.getEditRequests(token)
    console.log('liste editRequest :', data)
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de modification :', error)
  }
}

watch(
  () => props.filtreStatus,
  (newVal) => {
    if (newVal === 'edit-request') {
      loadEditRequests()
    }
  }
)

onMounted(() => {
  if (props.filtreStatus === 'edit-request') {
    loadEditRequests()
  }
})
</script>

<template>
  <div class="offers-wrapper">
    <div class="tabs-wrapper">
      <div class="tabs">
        <button
          :class="{ active: filtreStatus === 'pending' }"
          @click="setFiltre('pending')"
        >
          Demande d'ajout
        </button>

        <button
          :class="{ active: filtreStatus === 'edit-request' }"
          @click="setFiltre('edit-request')"
        >
          Demande de modification
        </button>
      </div>
    </div>

    <!-- TABLE DES DEMANDES D'AJOUT -->
    <table
      v-if="filtreStatus === 'pending'"
      class="offers-table"
      role="table"
      aria-label="Offres fournisseur"
    >
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
        <tr
          v-for="marqueur in marqueursFiltres"
          :key="marqueur.id || marqueur._id"
          class="row-hover"
          @click="focusMarqueur(marqueur)"
        >
          <td class="provider">{{ marqueur.properties.titre }}</td>
          <td class="address">{{ marqueur.properties.adresse }}</td>

          <td class="info-col" @click.stop>
            <button class="info-btn" @click="emit('show-info', marqueur)">
              <svg class="info-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.75" />
                <line x1="12" y1="10.5" x2="12" y2="17" stroke="currentColor" stroke-width="1.75" />
                <circle cx="12" cy="7.5" r="1.25" fill="currentColor" />
              </svg>
              <span>Afficher la description</span>
            </button>
          </td>

          <td class="menu-col" @click.stop>
            <button class="kebab" aria-label="Modifier" @click="ouvrirModalLocal(marqueur)">
              Modifier
            </button>
          </td>

          <td class="accept-col" @click.stop>
            <button class="action-btn accept" @click="accepterLocal(marqueur)">
              Accepter
            </button>
          </td>

          <td class="reject-col" @click.stop>
            <button class="action-btn reject" @click="refuserLocal(marqueur)">
              Refuser
            </button>
          </td>
        </tr>

        <tr v-if="!marqueursFiltres || marqueursFiltres.length === 0">
          <td colspan="6" class="empty">Aucune offre pour le moment.</td>
        </tr>
      </tbody>
    </table>

    <!-- TABLE DES DEMANDES DE MODIFICATION -->
    <table v-if="filtreStatus === 'edit-request'">
      <thead>
        <tr>
          <th>Lieu</th>
          <th>Modifications proposées</th>
          <th class="info-col">Info</th>
          <th class="accept-col">Accepter</th>
          <th class="reject-col">Refuser</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="req in editRequestStore.editRequests" :key="req._id">
          <td>{{ req.proposedProperties?.titre || req.marqueur?.properties?.titre }}</td>
          <td>
            {{ req.proposedProperties?.adresse }}<br>
            {{ req.proposedProperties?.description }}
          </td>

          <td class="info-col">
            <button class="info-btn">Voir détails</button>
          </td>

          <td class="accept-col">
            <button class="action-btn accept">Accepter</button>
          </td>

          <td class="reject-col">
            <button class="action-btn reject">Refuser</button>
          </td>
        </tr>

        <tr v-if="!editRequestStore.editRequests.length">
          <td colspan="5" class="empty">
            Aucune demande de modification pour le moment.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* (Ton style original inchangé) */
</style>
