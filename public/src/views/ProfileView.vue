<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Mon Profil</h1>

    <div v-if="!auth.isAuthenticated">
      <p class="text-center text-muted">Aucun utilisateur connecté.</p>
      <router-link to="/login" class="btn btn-primary d-block mx-auto" style="width: 200px;">
        Se connecter
      </router-link>
    </div>

    <div v-if="user" class="card mx-auto text-center" style="max-width: 500px;">
      <div class="card-body">
        <!-- <img
          v-if="user.avatar"
          :src="user.avatar"
          alt="Avatar"
          class="rounded-circle mb-3"
          width="120"
          height="120"
        /> -->
        <!-- -->

        <h3 class="card-title">{{ user.nom }}</h3>
        <p class="text-muted">{{ user.prenom }}</p>
        <p class="text-muted">{{ user.courriel }}</p>
        <p><strong>Créé le :</strong> {{ formatDate(user.createdAt) }}</p>
        <p><strong>Mis à jour le :</strong> {{ formatDate(user.updatedAt) }}</p>


        <!-- <router-link to="/profil/modifier" class="btn btn-outline-primary mt-3">
          Modifier le profil
        </router-link> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { API_URL } from '@/config'

const router = useRouter()
const auth = useAuthStore()


// États réactifs
const user = ref(null)
const loading = ref(true)
const error = ref(null)

// Fonction de formatage des dates
function formatDate(date) {
  if (!date) return 'Inconnue'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Chargement du profil avant le montage
onBeforeMount(async () => {
  try {
    if (!auth.token || !auth.decodedToken?.id) {
      error.value = "Vous devez être connecté pour voir votre profil."
      return
    }

    const id = auth.decodedToken.id
    console.log(id);

    const response = await fetch(`${API_URL}/admins/${id}`, {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    })

    if (!response.ok) {
      throw new Error("Erreur lors du chargement du profil.")
    }

    const data = await response.json()
    user.value = data.data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

</script>

<style scoped>
.container {
  font-family: "Segoe UI", sans-serif;
}
</style>

