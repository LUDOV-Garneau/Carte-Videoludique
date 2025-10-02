import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import AdminView from '@/views/AdminView.vue'
import ConnectionView from '@/views/ConnectionView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path:'/admin',
      name: 'admin',
      component: AdminView,
      beforeEnter: (to, from, next) => {
        const auth = useAuthStore()
        if (auth.isAuthenticated) {
          next()
        } else {
          next('/connection')
        }
      },
    },
    {
      path: '/connexion',
      name: 'Connection',
      component: ConnectionView,
    },

  ],
})

export default router
