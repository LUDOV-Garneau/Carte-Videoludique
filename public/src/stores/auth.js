import { defineStore,acceptHMRUpdate } from 'pinia'
import { jwtDecode } from "jwt-decode";
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('jwt', newToken)
  }

  const token = ref(localStorage.getItem('jwt') || null);
 
  const decodedToken = computed(() => {
    if (!token.value) return null
   
      try {
        const decoded = jwtDecode(token.value)

        const now = Date.now() / 1000

        if (decoded.exp && decoded.exp < now) {
          logout()
          return null
        }

        return decoded
      } catch (e) {
        logout()
        return null
    }
  })

  // Obtenir le nom d'admin depuis le token décodé
  const name = computed(() => {
    return decodedToken.value ? decodedToken.value.nom : '';
  });
  // Obtenir le rôle d'admin depuis le token décodé
  const role = computed(() => {
    return decodedToken.value ? decodedToken.value.role : '';
  });
  
  const isAuthenticated = computed(() => {
    const decoded = decodedToken.value
    if (!decoded) return false

    const now = Date.now() / 1000
    return decoded.exp >= now
  });

  function logout() {
    token.value = null
    localStorage.removeItem('jwt'); 
  }

  return {
    token,
    name,
    role,
    decodedToken,
    isAuthenticated,
    logout,
    setToken
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}