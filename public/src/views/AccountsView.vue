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

      <!-- Filtre par rôle et statut -->
      <select v-model="roleFilter" class="form-select" style="max-width: 200px">
        <option value="">Tous les rôles et status</option>
        <option value="Gestionnaire">Gestionnaire</option>
        <option value="Éditeur">Éditeur</option>
        <option value="Inactif">Inactif</option>
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
            <!-- 1. Si c'est l'utilisateur connecté -->
            <div v-if="user._id === userId" class="text-muted">
              <router-link to="/profile">Votre profil</router-link>
            </div>

            <!-- 2. Si l'utilisateur est inactif -->
            <div v-else-if="user.status === 'inactif'" class="text-muted">Profil inactif</div>

            <!-- 3. Sinon : afficher Modifier / Supprimer -->
            <div v-else class="d-flex gap-4">
              <button class="btn btn-warning btn-sm" @click="editUser(user)">Modifier</button>
              <button class="btn btn-danger btn-sm" @click="deleteUser(user)">Supprimer</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Boîte de dialogue de confirmation -->
    <div v-if="showConfirm" class="dialog-backdrop">
      <div class="dialog-box">
        <h5>Confirmation</h5>
        <p>
          Voulez-vous vraiment supprimer
          <strong>{{ userToDelete?.prenom }} {{ userToDelete?.nom }}</strong> ?
        </p>

        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="cancelDelete">Non</button>
          <button class="btn btn-danger" @click="confirmDelete">Oui</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { API_URL } from '@/config'

const auth = useAuthStore()

const users = ref([])
const error = ref(null)
const loading = ref(true)

const showConfirm = ref(false)
const userToDelete = ref(null)

const searchQuery = ref('')
const roleFilter = ref('')

const userId = auth.decodedToken.id

const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const matchesSearch =
      user.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.prenom.toLowerCase().includes(searchQuery.value.toLowerCase())

    let matchesRoleOrStatus = false
    if (roleFilter.value === '') {
      matchesRoleOrStatus = true
    } else if (roleFilter.value === 'Inactif') {
      matchesRoleOrStatus = user.status === 'inactif'
    } else {
      matchesRoleOrStatus = user.role === roleFilter.value
    }

    return matchesSearch && matchesRoleOrStatus
  })
})

onBeforeMount(async () => {
  try {
    if (!auth.token || !auth.decodedToken?.id) {
      error.value = 'Vous devez être connecté pour voir les administrateurs.'
      return
    }

    const response = await fetch(`${API_URL}/admins`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors du chargement du profil.')
    }

    const data = await response.json()
    users.value = data.data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

function cancelDelete() {
  showConfirm.value = false
  userToDelete.value = null
}

async function confirmDelete() {
  try {
    const response = await fetch(`${API_URL}/admins/${userToDelete.value._id}/inactif`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })

    if (!response.ok) throw new Error('Erreur lors de la suppression.')

    // Met à jour la liste localement
    users.value = users.value.map((u) =>
      u.id === userToDelete.value.id ? { ...u, status: 'inactif' } : u,
    )
  } catch (err) {
    console.error(err)
  } finally {
    showConfirm.value = false
    userToDelete.value = null
  }
}

async function deleteUser(user) {
  userToDelete.value = user
  showConfirm.value = true
}
async function editUser(user) {}
</script>

<style>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog-box {
  background: white;
  padding: 20px;
  border-radius: 6px;
  width: 350px;
}
</style>
