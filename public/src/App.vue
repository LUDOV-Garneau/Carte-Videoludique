<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// store d'authentification (pour savoir si l’utilisateur est admin)
const auth = useAuthStore()

// base URL pour bien gérer les chemins (utile si déployé dans un sous-dossier)
const base = import.meta.env.BASE_URL
</script>

<template>
  <div id="app">
    <RouterView />

    <!-- Footer avec les liens vers les guides -->
    <footer class="footer">
      <p>
        <a :href="`${base}docs/guide_utilisateur.html`" target="_blank">
          📘 Guide utilisateur
        </a>
        <a :href="`${base}docs/guide_administrateur.html`" target="_blank">
            🔒 Guide administrateur
        </a>
      </p>
    </footer>
  </div>
</template>

<style>
html,
body,
#plugin-verusvueapp {
  min-height: 100%;
  margin: 0;
}

/* Pied de page */
.footer {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid #ddd;
  margin-top: 2rem;
  font-size: 0.95rem;
  background-color: #f9f9f9;
}

.footer a {
  color: #007acc;
  text-decoration: none;
  font-weight: 500;
}

.footer a:hover {
  text-decoration: underline;
}
</style>
