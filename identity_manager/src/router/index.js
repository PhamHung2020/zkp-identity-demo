import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import IdentityDetails from '../views/IdentityDetails.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/identity/:id', name: 'IdentityDetails', component: IdentityDetails },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
