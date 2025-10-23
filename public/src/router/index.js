import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import AdminView from '@/views/AdminView.vue'
import ConnectionView from '@/views/ConnectionView.vue'
import InscriptionView from '@/views/InscriptionView.vue'
import ProfileView from '@/views/ProfileView.vue'
import AccountsView from '@/views/AccountsView.vue'
import ForbiddenView from '@/views/ForbiddenView.vue'
import NotFoundView from '@/views/NotFoundView.vue'


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
          next('/connexion')
        }
      },
    },
    {
      path: '/connexion',
      name: 'Connection',
      component: ConnectionView,
    },
    {
      path: '/inscription',
      name: 'Signup',
      component: InscriptionView,
    },
    {
      path: '/profile',
      name: 'Profile',
      component: ProfileView,
    },
    {
      path: '/comptes',
      name: 'Accounts',
      component: AccountsView,
    },
    {
      path: '/403',
      name: 'Page403',
      component: ForbiddenView,
    },
    {
      path: '/404',
      name: 'Page404',
      component: NotFoundView,
    },


  ],
})

export default router
