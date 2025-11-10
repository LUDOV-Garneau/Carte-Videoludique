<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">

      <!-- Bouton pour les écrans petits (hamburger menu) -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Liens de navigation -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <template v-if="auth.isAuthenticated">
            <li class="nav-item">
                  <router-link to="/profile" class="nav-link">
                    {{ auth.username }}
                  </router-link>
            </li>
            <li class="nav-item">
                  <router-link to="/accounts" class="nav-link">
                    Administrateurs
                  </router-link>
            </li>
            <li class="nav-item">
                  <router-link to="/inscription" class="nav-link">
                    Créer un compte
                  </router-link>
            </li>
            <li  class="nav-item">
                <a href="#" class="nav-link" @click="logout()">
                    Se déconnecter
                </a>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth= useAuthStore()
const router = useRouter()


const logout = () => {
  auth.logout()
  router.push("/connexion")

}
</script>

<style scoped>
/* Pour personnaliser la couleur des liens actifs dans la navbar */
.nav-link.active {
  color: #ec0f0f;
  font-weight: bold;
}

/* Vous pouvez ajouter plus de styles personnalisés ici pour la navbar */
</style>
