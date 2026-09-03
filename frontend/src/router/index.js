import { createRouter, createWebHistory } from 'vue-router';

import HomeView from '../views/HomeView.vue';
import ChatbotView from '../views/ChatbotView.vue';
import TicketView from '../views/TicketView.vue';
import KnowledgeView from '../views/KnowledgeView.vue';
import AdminLoginView from '../views/admin/AdminLoginView.vue';
import AdminDashboardView from '../views/admin/AdminDashboardView.vue';
import AdminReportsView from '../views/admin/AdminReportsView.vue';
import AdminRecapView from '../views/admin/AdminRecapView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/chatbot',
    name: 'chatbot',
    component: ChatbotView
  },
  {
    path: '/ticket',
    name: 'ticket',
    component: TicketView
  },
  {
    path: '/knowledge',
    name: 'knowledge',
    component: KnowledgeView
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLoginView
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: AdminReportsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/recap',
    name: 'admin-recap',
    component: AdminRecapView,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  }
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('sigap_hse_admin_token');

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next({ path: '/admin/login', query: { redirect: to.fullPath } });
      return;
    }
  }

  if (to.path === '/admin/login' && token) {
    next('/admin/dashboard');
    return;
  }

  next();
});

export default router;
