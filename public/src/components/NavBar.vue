<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/connexion')
}

// état du menu mobile
const navOpen = ref(false)
const toggleNav = () => {
  navOpen.value = !navOpen.value
}
</script>

<template>
  <header class="page-header">
    <div class="header-top">
      <h1>
        <router-link to="/" class="home-link">
          Le jeu vidéo au Québec
        </router-link>
      </h1>

      <nav class="navbar">
        <button
          class="navbar-toggler"
          type="button"
          @click="toggleNav"
          :aria-expanded="navOpen.toString()"
          aria-label="Afficher / masquer la navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div id="navbarNav" class="navbar-collapse" :class="{ show: navOpen }">
          <ul class="custom-list">
            <template v-if="auth.isAuthenticated">
              <li class="nav-item">
                <router-link to="/profile" class="nav-link">
                  {{ auth.name }}
                </router-link>
              </li>

              <template v-if="auth.role === 'Gestionnaire'">
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
              </template>

              <li class="nav-item">
                <a href="#" class="nav-link" @click.prevent="logout()">
                  Se déconnecter
                </a>
              </li>
            </template>
          </ul>
        </div>
      </nav>
    </div>

    <p class="subtitle">
      Cette carte vise à répertorier les lieux où le jeu vidéo s’est vendu, joué,
      échangé et créé au fil de son histoire au Québec.
    </p>

    <div class="section-separator"></div>
  </header>
</template>

<style scoped>
h1,
h2,
p {
  color: var(--text);
}

.nav-link.active {
  color: #ec0f0f;
  font-weight: bold;
}

/* ---------- Header global ---------- */
.page-header {
  position: relative;
  max-width: 1100px;
  margin: 24px auto 32px;
  padding: 24px 32px 20px;
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 17px 27px rgba(15, 23, 42, 0.10);
  overflow: hidden; /* pour le halo ci-dessous */
}

.eyebrow {
  display: inline-block;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}

.section-separator {
  width: 80px;
  height: 4px;
  background-color: var(--accent-dark);
  border-radius: 999px;
  margin: 14px 0 4px;
  opacity: 0.9;
}

/* Ligne du haut : titre + nav */
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  font-weight: 800;
  font-size: clamp(1.6rem, 2vw + 0.8rem, 2.2rem);
  color: #0f172a;
}

.home-link {
  text-decoration: none;
  color: inherit;
}

.subtitle {
  margin-top: 10px;
  font-size: 0.98rem;
  color: rgba(15, 23, 42, 0.88);
  line-height: 1.7;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  max-width: 60ch;
}

/* ---------- Navbar ---------- */
.navbar {
  position: relative;
  display: flex;
  align-items: center;
}

/* bouton hamburger */
.navbar-toggler {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
}

/* icône hamburger (3 barres) */
.navbar-toggler-icon {
  width: 22px;
  height: 2px;
  background-color: var(--accent);
  border-radius: 2px;
  position: relative;
  display: block;
}

.navbar-toggler-icon::before,
.navbar-toggler-icon::after {
  content: "";
  width: 22px;
  height: 2px;
  background-color: #111827;
  border-radius: 2px;
  position: absolute;
  left: 0;
}

.navbar-toggler-icon::before {
  top: -6px;
}
.navbar-toggler-icon::after {
  top: 6px;
}

/* bloc collapsable */
.navbar-collapse {
  display: none;
}

/* classe ajoutée quand navOpen = true */
.navbar-collapse.show {
  display: block;
}

/* liste de liens */
.custom-list {
  list-style-type: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 12px;
  align-items: center;
}

.nav-item {
  display: flex;
  align-items: center;
}

.nav-link {
  color: rgba(15, 23, 42, 0.8);
  text-decoration: none;
  font-size: 0.95rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background-color: rgba(15, 23, 42, 0.02);
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.nav-link:hover {
  background-color: var(--accent);
  color:white;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.04);
}

/* ---------- Responsive ---------- */

/* Mobile / tablette */
@media (max-width: 768px) {
  .page-header {
    padding: 12px 16px 10px;
  }

  .header-top {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header h1 {
    text-align: center;
  }

  .navbar {
    justify-content: flex-end;
  }

  .navbar-collapse {
    width: 100%;
    margin-top: 8px;
  }

  .custom-list {
    flex-direction: column;
    align-items: flex-end;
  }

  .nav-link {
    text-align: right;
  }
}

/* Desktop : menu toujours visible, plus de hamburger si tu veux */
@media (min-width: 769px) {
  .navbar-collapse {
    display: block !important;
  }

  .navbar-toggler {
    display: none;
  }
}
</style>
