import Vue from 'vue';
import VueRouter from 'vue-router';
import routes from './routes';

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('ide_ia_user')); } catch { return null; }
};

router.beforeEach((to, from, next) => {
  const hasToken = localStorage.getItem('ide_ia_token') !== null;

  // Check requiresAuth from any matched route record (including parent /admin)
  const requiresAuth = to.matched.some(r => r.meta?.requiresAuth);
  if (requiresAuth && !hasToken) {
    return next({ name: 'login' });
  }

  if (to.name === 'login' && hasToken) {
    return next({ name: 'home' });
  }

  // Role check for routes with meta.roles
  if (to.meta?.roles && hasToken) {
    const user = getUser();
    if (!user) {
      // Token present but user data missing — re-authenticate
      return next({ name: 'login' });
    }
    const rol = user.rol;
    if (!to.meta.roles.includes(rol)) {
      return next({ name: 'forbidden' });
    }
  }

  next();
});

export default router;
