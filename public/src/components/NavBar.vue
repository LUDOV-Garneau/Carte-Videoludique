<template>
  <header class="page-header" :class="container">
    <div class="page-header-content">
     <h1 class="page-title mb-0 text-center">
        <router-link to="/admin" style="text-decoration: none; color: inherit">
          Le jeu vidéo au Québec
        </router-link>
      </h1>

      <nav class="navbar navbar-expand-lg navbar-light bg-transparent shadow-none">
        <div class="container-fluid">
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
              <template v-if="auth.isAuthenticated">
                <li class="nav-item">
                  <router-link to="/profile" class="nav-link">{{ auth.name }}</router-link>
                </li>
                <!-- Liens réservés aux Gestionnaires -->
                <template v-if="auth.role === 'Gestionnaire'">
                  <li class="nav-item">
                    <router-link to="/accounts" class="nav-link">Administrateurs</router-link>
                  </li>
                  <li class="nav-item">
                    <router-link to="/inscription" class="nav-link">Créer un compte</router-link>
                  </li>
                </template>
                <li class="nav-item">
                  <a href="#" class="nav-link" @click="logout()">Se déconnecter</a>
                </li>
              </template>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()


const logout = () => {
  auth.logout()
  router.push('/connexion')
}
</script>

<style scoped>
/* Pour personnaliser la couleur des liens actifs dans la navbar */
.nav-link.active {
  color: #ec0f0f;
  font-weight: bold;
}
/* ---------- Contenu & header ---------- */
.content {
  flex: 1;
  padding: 28px clamp(16px, 3vw, 40px);
  margin: 0;
}

/* Vous pouvez ajouter plus de styles personnalisés ici pour la navbar */
</style>
