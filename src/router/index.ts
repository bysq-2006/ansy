import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Activity',
      component: () => import('../content/activity.vue'),
    },
    {
      path: '/management',
      name: 'Management',
      component: () => import('../content/management.vue'),
    },
    {
      path: '/management/add-md',
      name: 'AddMd',
      component: () => import('../content/mange/add-md.vue'),
    }
  ],
})

export default router
