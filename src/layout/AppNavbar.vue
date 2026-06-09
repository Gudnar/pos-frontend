<template>
  <header class="ide-navbar">
    <div class="ide-navbar__left">
      <h1 class="ide-navbar__title">{{ pageTitle }}</h1>
    </div>
    <div class="ide-navbar__right">
      <div class="ide-navbar__time">{{ time }}</div>
      <div class="ide-navbar__user">
        <div class="ide-navbar__avatar">{{ userInitials }}</div>
        <div class="ide-navbar__user-info">
          <span class="ide-navbar__user-name">{{ userName }}</span>
          <span class="ide-navbar__user-role">{{ userRol }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'AppNavbar',
  data: () => ({ time: '' }),
  computed: {
    currentUser() { return this.$store.getters.currentUser || this.$storage.get('user') || {}; },
    userName() { return this.currentUser?.nombres || 'Usuario'; },
    userRol() { return this.currentUser?.rol || 'USER'; },
    userInitials() {
      const n = this.currentUser?.nombres || 'U';
      return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    },
    pageTitle() {
      const map = {
        home: 'Dashboard',
        agentes: 'Agentes IA',
        'agente-detalle': 'Detalle del Agente',
        herramientas: 'Herramientas (Tool Use)',
        conversaciones: 'Conversaciones',
        reportes: 'Reportes',
        configuracion: 'Configuración',
      };
      return map[this.$route.name] || 'IDE-IA';
    },
  },
  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
  },
  methods: {
    updateTime() {
      const now = new Date();
      this.time = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    },
  },
};
</script>

<style scoped>
.ide-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  height: 56px;
  background: #0d1526;
  border-bottom: 1px solid #1e3a5f33;
  flex-shrink: 0;
  position: sticky; top: 0; z-index: 50;
}

.ide-navbar__title {
  font-size: 15px; font-weight: 700; color: #e2e8f0; letter-spacing: -0.2px;
}

.ide-navbar__right {
  display: flex; align-items: center; gap: 16px;
}

.ide-navbar__time {
  font-size: 12px; font-weight: 600; color: #475569;
  font-variant-numeric: tabular-nums;
}

.ide-navbar__user {
  display: flex; align-items: center; gap: 8px;
}

.ide-navbar__avatar {
  width: 30px; height: 30px;
  border-radius: 8px; background: #6366f133;
  color: #818cf8; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.ide-navbar__user-name {
  font-size: 12px; font-weight: 600; color: #e2e8f0; display: block;
}
.ide-navbar__user-role {
  font-size: 10px; color: #475569; display: block;
}
</style>
