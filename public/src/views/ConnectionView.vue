
<template>
  <div class="container mt-5">
    <h2>Connexion</h2>
    <form @submit.prevent="handleSubmit" class="form-group" novalidate>
      <div class="mb-3">
        <label for="email" class="form-label">Courriel</label>
        <input type="email" id="email" v-model="email" class="form-control" required />
        <span v-if="emailError" class="error">{{ emailError }}</span>
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">Mot de passe</label>
        <input type="password" id="password" v-model="password" class="form-control" required />
        <span v-if="passwordError" class="error">{{ passwordError }}</span>
      </div>
      <span v-if="errorMessage" class="error">
        {{ errorMessage }}
      </span>

      <button type="submit" class="btn btn-primary">Se connecter</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { API_URL } from '@/config'


const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const errorMessage = ref('')
const auth = useAuthStore()

const router = useRouter()


const validateForm = () => {
  let isValid = true
  emailError.value = ''
  passwordError.value = ''

  if (!email.value) {
    emailError.value = "L'email est requis."
    isValid = false
  } else if (!isValidEmail(email.value)) {
    emailError.value = 'Veuillez entrer une adresse courriel valide'
    isValid = false
  }

  if (!password.value) {
    passwordError.value = 'Le mot de passe est requis.'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    const response = await fetch(API_URL+`/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courriel: email.value,
        mdp: password.value,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      auth.setToken(data.data.token)
      
      router.push('/admin') 
    } else {
      if (response.status == 401) {
        errorMessage.value = 'Mot de passe ou courriel invalide'
      } else {
        errorMessage.value = 'Problème de connexion'
      }
    }
  } catch (error) {
    errorMessage.value = 'Une erreur est survenue. Veuillez réessayer plus tard.'
  }
}

//Validatoin du courriel
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}
</script>

<style scoped>
/* Styles pour le formulaire */
.form-group {
  max-width: 400px;
  margin: 0 auto;
}

.btn-primary {
  width: 100%;
}

.alert {
  margin-top: 10px;
}
.error {
  color: red;
  font-size: 0.9rem;
  margin-top: 5px;
  display: block;
}
</style>
