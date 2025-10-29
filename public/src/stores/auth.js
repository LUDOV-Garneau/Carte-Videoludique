import { defineStore,acceptHMRUpdate } from 'pinia'
import { jwtDecode } from "jwt-decode";
import { ref, computed } from 'vue'


export const useAuthStore = defineStore('auth', () => {
  //récupérer le token depuis localStorage si on l'utilise
  const token = ref(localStorage.getItem('jwt') || null);

  // Décode les infos utilisateur à partir du token
  const decodedToken = computed(() => {
    if (token.value) {
      try {
        return jwtDecode(token.value)
      } catch (e) {
        return null
      }
    }
    return null
  });

  // Obtenir le nom d'admin depuis le token décodé
  const name = computed(() => {
    return decodedToken.value ? decodedToken.value.nom : '';
  });
  
  const isAuthenticated = computed(() => {
    const decoded = decodedToken.value
    if (!decoded) return false

    const now = Date.now() / 1000
    return decoded.exp >= now
  });

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('jwt', newToken)
  }

  function logout() {
    token.value = null
    // Supprimer le token de localStorage
    localStorage.removeItem('jwt'); // Supprimer le token de localStorage
  }

  return {
    token,
    name,
    decodedToken,
    isAuthenticated,
    logout,
    setToken
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}