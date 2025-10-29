<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Profil</h1>

    <div v-if="!user">
      <p class="text-center text-muted">Aucun utilisateur connecté.</p>
      <router-link to="/login" class="btn btn-primary d-block mx-auto" style="width: 200px;">
        Se connecter
      </router-link>
    </div>

    <div v-else class="card mx-auto text-center" style="max-width: 500px;">
      <div class="card-body">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          alt="Avatar"
          class="rounded-circle mb-3"
          width="120"
          height="120"
        />
        <div v-else class="mb-3">
          <i class="bi bi-person-circle" style="font-size: 5rem;"></i>
        </div>

        <h3 class="card-title">{{ user.nom }}</h3>
        <p class="text-muted">{{ user.prenom }}</p>
        <p class="text-muted">{{ user.courriel }}</p>
        <p><strong>Créé le :</strong> {{ formatDate(user.createdAt) }}</p>
        <p><strong>Mis à jour le :</strong> {{ formatDate(user.updatedAt) }}</p>
        

        <router-link to="/profil/modifier" class="btn btn-outline-primary mt-3">
          Modifier le profil
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { API_URL } from '@/config'

const router = useRouter()
const auth = useAuthStore()
const id = auth.decodedToken?.id // vérifie si le token existe

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

// Chargement du profil au montage
onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      error.value = 'Vous devez être connecté pour voir votre profil.'
      loading.value = false
      return
    }

    const response = await fetch(`${API_URL}/admins/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Erreur lors du chargement du profil.')
    }

    const data = await response.json()
    user.value = data
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

