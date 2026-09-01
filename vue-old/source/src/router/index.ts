import { createWebHashHistory, createRouter } from 'vue-router'

const routes = [
  { path: '/', component: () => import('@/views/home/index.vue') },
  { path: '/user', component: () => import('@/views/user/index.vue') },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})