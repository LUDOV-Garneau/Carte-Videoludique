<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
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
    const response = await fetch(`${API_URL}/login`, {
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

<template>
  <div class="login-page">
    <div class="login-card">
      <h2>Connexion</h2>

      <form @submit.prevent="handleSubmit" novalidate>
        <div class="field">
          <label for="email">Courriel</label>
          <input type="email" id="email" v-model="email" required />
          <span v-if="emailError" class="error">{{ emailError }}</span>
        </div>

        <div class="field">
          <label for="password">Mot de passe</label>
          <input type="password" id="password" v-model="password" required />
          <span v-if="passwordError" class="error">{{ passwordError }}</span>
        </div>

        <span v-if="errorMessage" class="error center">{{ errorMessage }}</span>

        <button type="submit" class="btn">Se connecter</button>
      </form>
      <a href="/">Retour à la carte</a>
    </div>
  </div>
</template>



<style scoped>
/* centre tout dans la page */
.login-page {
  display: flex;
  justify-content: center;
  padding-top: 40px;
  padding-bottom: 80px;
}

/* card moderne */
.login-card {
  background: #ffffff;
  width: 420px;
  padding: 32px 38px;
  border-radius: 18px;

  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}

.login-card h2 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 700;
  color: #0f172a;
}

/* champs */
.field {
  margin-bottom: 18px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.95rem;
  color: #1e293b;
}

.field input {
  width: 100%;
  padding: 12px 14px;
  font-size: 1rem;

  border: 1px solid #cbd5e1;
  border-radius: 10px;
  outline: none;

  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* focus turquoise */
.field input:focus {
  border-color: #2c7a7b;
  box-shadow: 0 0 0 3px rgba(44, 122, 123, 0.2);
}

/* erreurs */
.error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 4px;
}

.error.center {
  display: block;
  text-align: center;
  margin: 8px 0 10px;
}

/* bouton */
.btn {
  width: 100%;
  padding: 12px 0;
  margin-top: 10px;

  background-color: #2c7a7b;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;

  transition: background-color 0.25s ease, transform 0.15s ease;
}

.btn:hover {
  background-color: #256f70;
}

.btn:active {
  transform: scale(0.97);
}
</style>