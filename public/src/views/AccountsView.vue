<template>
  <div class="container mt-4">
    <h1>Comptes</h1>

    <!-- Barre de recherche + filtre rôle -->
    <div class="d-flex gap-3 mb-3">

      <!-- Recherche -->
      <input
        v-model="searchQuery"
        type="text"
        class="form-control"
        placeholder="Rechercher un utilisateur..."
      />

      <!-- Filtre par rôle -->
      <select v-model="roleFilter" class="form-select" style="max-width: 200px;">
        <option value="">Tous les rôles</option>
        <option value="Gestionnaire">Gestionnaire</option>
        <option value="Éditeur">Éditeur</option>
      </select>

    </div>

    <table class="table table-striped mt-3">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Prénom</th>
          <th>Rôle</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td>{{ user.nom }}</td>
          <td>{{ user.prenom }}</td>
          <td>{{ user.role }}</td>

          <td>
            <!-- Masquer les actions si c'est l'utilisateur connecté -->
            <div v-if="user._id !== userId" class="d-flex gap-4">
              <button class="btn btn-warning btn-sm" @click="editUser(user)">Modifier</button>
              <button class="btn btn-danger btn-sm" @click="deleteUser(user.id)">Supprimer</button>
            </div>

            <!-- Message si c'est l'utilisateur connecté -->
            <div v-else class="text-muted">
              <router-link to="/profile">Votre profil</router-link>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script setup>
import { ref,onBeforeMount,computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { API_URL } from '@/config'


const auth = useAuthStore()

const users = ref([])
const error = ref(null)
const loading = ref(true)

const searchQuery = ref("")
const roleFilter = ref("")

const userId = auth.decodedToken.id


const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch =
      user.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.prenom.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesRole =
      roleFilter.value === "" || user.role === roleFilter.value

    return matchesSearch && matchesRole
  })
})

onBeforeMount(async () => {
  try {
    if (!auth.token || !auth.decodedToken?.id) {
      error.value = "Vous devez être connecté pour voir les administrateurs."
      return
    }

    
    const response = await fetch(`${API_URL}/admins`, {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    })

    if (!response.ok) {
      throw new Error("Erreur lors du chargement du profil.")
    }

    const data = await response.json()
    users.value = data.data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function deleteUser(id) {
 
}
async function editUser(user) {
  
}
</script>
