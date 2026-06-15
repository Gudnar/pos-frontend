<template>
  <aside class="ide-sidebar" :class="{ 'ide-sidebar--collapsed': !open }">
    <!-- Logo -->
    <div class="ide-sidebar__header">
      <div class="ide-sidebar__logo">
        <span>✦</span>
      </div>
      <transition name="fade">
        <div v-if="open" class="ide-sidebar__brand">
          <div class="ide-sidebar__brand-name">IDE-IA</div>
          <div class="ide-sidebar__brand-sub">Anthropic Claude</div>
        </div>
      </transition>
      <button class="ide-sidebar__toggle" @click="toggleSidebar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>
    </div>

    <!-- Client badge (only for ADMIN_CLIENTE / COLABORADOR) -->
    <transition name="fade">
      <div v-if="open && clienteNombre && !isSuperAdmin" class="ide-sidebar__cliente">
        <span class="ide-sidebar__cliente-dot"></span>
        <span class="ide-sidebar__cliente-name">{{ clienteNombre }}</span>
      </div>
    </transition>

    <!-- Nav -->
    <nav class="ide-sidebar__nav">
      <router-link
        v-for="item in navItems"
        :key="item.route"
        :to="{ name: item.route }"
        class="ide-sidebar__item"
        active-class="ide-sidebar__item--active"
      >
        <div class="ide-sidebar__item-icon" v-html="item.icon"></div>
        <transition name="fade">
          <span v-if="open" class="ide-sidebar__item-label">{{ item.label }}</span>
        </transition>
        <span v-if="open && item.badge" class="ide-sidebar__badge">{{ item.badge }}</span>
      </router-link>
    </nav>

    <!-- User -->
    <div class="ide-sidebar__footer">
      <div class="ide-sidebar__user">
        <div class="ide-sidebar__avatar">
          {{ userInitials }}
        </div>
        <transition name="fade">
          <div v-if="open" class="ide-sidebar__user-info">
            <div class="ide-sidebar__user-name">{{ userName }}</div>
            <div class="ide-sidebar__user-role">{{ userRol }}</div>
          </div>
        </transition>
      </div>
      <button class="ide-sidebar__logout" @click="handleLogout" :title="open ? '' : 'Cerrar sesión'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
      </button>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'AppSidebar',
  computed: {
    open() { return this.$store.getters.isSidenavOpen; },
    currentUser() { return this.$store.getters.currentUser || this.$storage.get('user') || {}; },
    userName() { return this.currentUser?.nombres || this.currentUser?.usuario || 'Usuario'; },
    userRol() { return this.currentUser?.rol || 'USER'; },
    isSuperAdmin() { return this.userRol === 'SUPER_ADMIN'; },
    clienteNombre() { return this.$store.getters.clienteInfo?.nombre || null; },
    userInitials() {
      const n = this.currentUser?.nombres || 'U';
      return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    },
    navItems() {
      const rol = this.userRol;
      const all = [
        { route: 'clientes',      label: 'Clientes',       icon: this.clientesIcon, roles: ['SUPER_ADMIN'] },
        { route: 'home',          label: 'Dashboard',      icon: this.gridIcon },
        { route: 'agentes',       label: 'Agentes IA',     icon: this.botIcon },
        { route: 'herramientas',  label: 'Herramientas',   icon: this.toolIcon },
        { route: 'conversaciones',label: 'Conversaciones', icon: this.chatIcon },
        { route: 'reportes',      label: 'Reportes',       icon: this.analyticsIcon },
        { route: 'ingresos',      label: 'Ingresos',       icon: this.ingresoIcon,  roles: ['ADMIN_CLIENTE', 'ENCARGADO', 'CAJERO', 'VENDEDOR'] },
        { route: 'gastos',        label: 'Gastos',         icon: this.gastoIcon,    roles: ['ADMIN_CLIENTE', 'ENCARGADO', 'CAJERO', 'VENDEDOR'] },
        { route: 'configuracion', label: 'Configuración',  icon: this.settingsIcon, roles: ['SUPER_ADMIN', 'ADMIN_CLIENTE'] },
      ];
      return all.filter(item => !item.roles || item.roles.includes(rol));
    },
    clientesIcon: () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
    gridIcon: () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    botIcon: () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="17" r="1" fill="currentColor"/><path d="M9 17h.01M15 17h.01"/></svg>`,
    toolIcon: () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
    chatIcon: () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
    analyticsIcon: () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
    settingsIcon: () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    ingresoIcon: () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M12 15v-3M10.5 13.5L12 12l1.5 1.5"/></svg>`,
    gastoIcon: () => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M12 12v3M10.5 13.5L12 15l1.5-1.5"/></svg>`,
  },
  methods: {
    toggleSidebar() {
      this.$store.commit('setSidenav', !this.open);
    },
    handleLogout() {
      this.$confirm('¿Deseas cerrar sesión?', () => {
        this.$storage.removeAll();
        this.$store.commit('logout');
        this.$router.push('/login');
      });
    },
  },
};
</script>

<style scoped>
.ide-sidebar {
  position: fixed;
  left: 0; top: 0;
  width: 220px;
  height: 100vh;
  background: var(--bg-s);
  border-right: 1px solid var(--b2);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  z-index: 100;
  overflow: hidden;
}
.ide-sidebar--collapsed { width: 64px; }

.ide-sidebar__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  border-bottom: 1px solid var(--b2);
  min-height: 60px;
}

.ide-sidebar__logo {
  width: 32px; height: 32px; flex-shrink: 0;
  background: linear-gradient(135deg, #c96442, #e8956d);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
}

.ide-sidebar__brand-name {
  font-size: 14px; font-weight: 900; color: var(--t1); letter-spacing: -0.3px;
}
.ide-sidebar__brand-sub {
  font-size: 9px; color: #c96442; font-weight: 700;
}

.ide-sidebar__toggle {
  margin-left: auto; background: none; border: none;
  color: var(--t5); cursor: pointer; padding: 4px; border-radius: 4px;
}
.ide-sidebar__toggle:hover { color: var(--t3); }

.ide-sidebar__cliente {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 16px 4px;
  font-size: 10px; font-weight: 700; color: #c96442;
  letter-spacing: 0.5px; text-transform: uppercase;
  white-space: nowrap; overflow: hidden;
}
.ide-sidebar__cliente-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #22c55e; flex-shrink: 0;
}
.ide-sidebar__cliente-name { overflow: hidden; text-overflow: ellipsis; }

.ide-sidebar__nav {
  flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto;
}

.ide-sidebar__item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px;
  color: var(--t4); text-decoration: none;
  font-size: 13px; font-weight: 500;
  transition: all 0.15s; white-space: nowrap; overflow: hidden;
}
.ide-sidebar__item:hover { background: var(--bg-c); color: var(--t3); }
.ide-sidebar__item--active { background: #6366f122; color: #818cf8 !important; font-weight: 700; }

.ide-sidebar__item-icon { flex-shrink: 0; }
.ide-sidebar__item-label { flex: 1; }
.ide-sidebar__badge {
  background: #c96442; color: #fff;
  font-size: 9px; font-weight: 800;
  padding: 1px 6px; border-radius: 999px;
}

.ide-sidebar__footer {
  padding: 12px 8px;
  border-top: 1px solid var(--b2);
  display: flex; align-items: center; gap: 8px;
}

.ide-sidebar__user { display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden; }

.ide-sidebar__avatar {
  width: 28px; height: 28px; border-radius: 8px;
  background: #6366f133; color: #818cf8;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}

.ide-sidebar__user-name {
  font-size: 12px; font-weight: 600; color: var(--t2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ide-sidebar__user-role {
  font-size: 10px; color: var(--t5);
}

.ide-sidebar__logout {
  background: none; border: none; color: var(--t5); cursor: pointer;
  padding: 6px; border-radius: 6px; transition: color 0.15s; flex-shrink: 0;
}
.ide-sidebar__logout:hover { color: #ef4444; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter, .fade-leave-to { opacity: 0; }
</style>
