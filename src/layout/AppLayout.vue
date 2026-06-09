<template>
  <div class="ide-app">

    <!-- ── SIDEBAR ── -->
    <div class="ide-sidebar" :class="{ 'ide-sidebar--collapsed': collapsed }">

      <!-- Logo -->
      <div class="ide-sidebar__header" :class="{ 'ide-sidebar__header--collapsed': collapsed }">
        <div class="ide-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5a2 2 0 00-2 2v4a2 2 0 002 2h4m0-6h6m0 0h4a2 2 0 002-2V9a2 2 0 00-2-2h-4m0 6v6m0 0H9"/>
          </svg>
        </div>
        <div v-if="!collapsed" class="ide-logo-text">
          <div class="ide-logo-name">IDE-IA</div>
          <div class="ide-logo-sub">Anthropic Claude</div>
        </div>
      </div>

      <!-- Client badge (ADMIN_CLIENTE / COLABORADOR) -->
      <div v-if="clienteNombre && userRol !== 'SUPER_ADMIN'" class="ide-cliente-badge">
        <span class="ide-cliente-dot"></span>
        <span v-if="!collapsed" class="ide-cliente-name">{{ clienteNombre }}</span>
      </div>

      <!-- Nav -->
      <nav class="ide-nav">
        <button
          v-for="item in nav"
          :key="item._isChild ? 'child-' + item.id : item.id"
          class="ide-nav__item"
          :class="{
            'ide-nav__item--active': isItemActive(item),
            'ide-nav__item--child': item._isChild,
          }"
          :style="navItemStyle(item)"
          :title="collapsed ? item.label : undefined"
          @click="item._isChild ? goChild(item) : go(item)"
        >
          <div v-if="isItemActive(item)" class="ide-nav__indicator"></div>
          <span class="ide-nav__icon" v-html="item.svg"></span>
          <span v-if="!collapsed" class="ide-nav__label">{{ item.label }}</span>
          <span v-if="item.badge && !collapsed && !item._isChild" class="ide-nav__badge" :class="item.badge === 'NEW' ? 'ide-nav__badge--new' : ''">
            {{ item.badge }}
          </span>
          <span v-if="item.badge && collapsed && !item._isChild" class="ide-nav__dot" :class="item.badge === 'NEW' ? 'ide-nav__dot--new' : ''"></span>
          <span v-if="item.type === 'group' && !collapsed" class="ide-nav__chevron" :class="{ 'ide-nav__chevron--open': isGroupExpanded(item) }">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </span>
        </button>
      </nav>

      <!-- Footer -->
      <div class="ide-sidebar__footer">
        <div v-if="!collapsed" class="ide-user">
          <div class="ide-avatar ide-avatar--small" style="background: #6366f133; color: #818cf8;">
            {{ userInitials }}
          </div>
          <div class="ide-user-info">
            <div class="ide-user-name">{{ userName }}</div>
            <div class="ide-user-online">● En línea</div>
          </div>
        </div>
        <div style="display:flex; gap:4px; align-items:center;">
          <button class="ide-collapse-btn" :style="collapsed ? 'justify-content: center; flex:1;' : 'flex:1;'" @click="collapsed = !collapsed">
            <svg v-if="collapsed" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            <span v-if="!collapsed" class="ide-collapse-label">Colapsar</span>
          </button>
          <button class="ide-logout-btn" title="Cerrar sesión" @click="handleLogout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ── MAIN ── -->
    <div class="ide-main">

      <!-- Top Bar -->
      <div class="ide-topbar">
        <div class="ide-topbar__left">
          <span class="ide-topbar__title">{{ moduleTitle }}</span>
          <!-- Selector de sucursal -->
          <div v-if="sucursales.length > 0" class="ide-sucursal-selector">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:#475569;"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            <select class="ide-sucursal-select" :value="sucursalActualId" @change="cambiarSucursal($event.target.value)">
              <option v-if="!isRolRestringido" value="">Todas las sucursales</option>
              <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <div v-if="active === 'conversaciones'" class="ide-topbar__badges">
            <span class="ide-badge" style="background:#25D36622;color:#25D366;border:1px solid #25D36644;">WhatsApp</span>
            <span class="ide-badge" style="background:#E1306C22;color:#E1306C;border:1px solid #E1306C44;">Instagram</span>
            <span class="ide-badge" style="background:#1877F222;color:#1877F2;border:1px solid #1877F244;">Facebook</span>
          </div>
        </div>
        <div class="ide-topbar__right">
          <div class="ide-topbar__time">
            <span style="color:#64748b;">{{ dateStr }}</span>
            <span style="margin-left:8px;color:#94a3b8;font-weight:700;">{{ timeStr }}</span>
          </div>
          <div class="ide-topbar__actions">
            <button class="ide-icon-btn" title="Notificaciones">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span class="ide-icon-btn__dot"></span>
            </button>
            <button class="ide-icon-btn" title="Recargar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            </button>
          </div>
          <div class="ide-topbar__user">
            <div class="ide-avatar ide-avatar--small" style="background:#6366f133;color:#818cf8;">{{ userInitials }}</div>
            <div>
              <div class="ide-user-name">{{ userName }}</div>
              <div style="font-size:9px;color:#475569;">{{ userRol }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Module content -->
      <div class="ide-module">
        <router-view />
      </div>
    </div>

  </div>
</template>

<script>
const SVGS = {
  grid:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  bot:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><line x1="12" y1="17" x2="12" y2="17" stroke-width="3" stroke-linecap="round"/><line x1="8" y1="17" x2="8" y2="17" stroke-width="3" stroke-linecap="round"/><line x1="16" y1="17" x2="16" y2="17" stroke-width="3" stroke-linecap="round"/></svg>`,
  tool:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
  inbox:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  analytics:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
  settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  catalog:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
  branch:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  usersGear:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="11" r="2"/><path d="M19 9v.01M19 13v.01M17.5 10.5l-.01.01M20.5 11.5l-.01.01M17.5 12.5l-.01.01M20.5 10.5l-.01.01"/></svg>`,
  clients:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
  account:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  contacts: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
  truck:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  inventory:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  pos:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  receipt:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 2v20l3-3 2 3 3-3 2 3 3-3 3 3V2l-3 3-2-3-3 3-2-3-3 3z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>`,
  cashReg:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`,
  person:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  cart:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`,
  box:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>`,
  wallet:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  history:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>`,
  chart:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  alert:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  clipboard:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`,
  swap:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>`,
  trending: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  tag:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  globe:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  coin:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M9 12h6M12 9v6"/></svg>`,
};

const ALL_NAV = [
  { id:'empresas',       label:'Empresas',       route:'empresas',       svg: SVGS.clients,   badge: null, roles: ['SUPER_ADMIN'] },
  { id:'home',           label:'Dashboard',      route:'home',           svg: SVGS.grid,      badge: null, roles: null },
  { id:'agentes',        label:'Agentes IA',     route:'agentes',        svg: SVGS.bot,       badge: null, roles: null },
  { id:'herramientas',   label:'Herramientas',   route:'herramientas',   svg: SVGS.tool,      badge: null, roles: null },
  { id:'conversaciones', label:'Conversaciones', route:'conversaciones', svg: SVGS.inbox,     badge: null, roles: null },
  { id:'reportes',       label:'Reportes',       route:'reportes',       svg: SVGS.analytics, badge: null, roles: null },
  {
    id: 'inventario', label: 'Inventario', svg: SVGS.inventory, badge: null, roles: null, type: 'group',
    children: [
      { id: 'inventario-stock',           label: 'Stock Actual',      route: 'inventario-stock',           svg: SVGS.inventory, badge: null, roles: null },
      { id: 'inventario-kardex',          label: 'Kardex',            route: 'inventario-kardex',          svg: SVGS.chart,     badge: null, roles: null },
      { id: 'inventario-lotes',           label: 'Consulta Lotes',    route: 'inventario-lotes',           svg: SVGS.box,       badge: null, roles: null },
      { id: 'inventario-ajustes',         label: 'Ajustes',           route: 'inventario-ajustes',         svg: SVGS.tool,      badge: null, roles: null },
      { id: 'inventario-bajas',           label: 'Bajas',             route: 'inventario-bajas',           svg: SVGS.box,       badge: null, roles: null },
      { id: 'inventario-transferencias',  label: 'Transferencias',    route: 'inventario-transferencias',  svg: SVGS.swap,      badge: null, roles: null },
      { id: 'inventario-devoluciones',    label: 'Devoluciones',      route: 'inventario-devoluciones',    svg: SVGS.history,   badge: null, roles: null },
      { id: 'inventario-toma',            label: 'Toma Inventario',   route: 'inventario-toma',            svg: SVGS.clipboard, badge: null, roles: null },
      { id: 'inventario-alertas',         label: 'Alertas',           route: 'inventario-alertas',         svg: SVGS.alert,     badge: null, roles: null },
      { id: 'inventario-reporte-general', label: 'Rpt. General',      route: 'inventario-reporte-general', svg: SVGS.analytics, badge: null, roles: null },
      { id: 'inventario-rotacion',        label: 'Rotación',          route: 'inventario-rotacion',        svg: SVGS.trending,  badge: null, roles: null },
      { id: 'inventario-precios',         label: 'Hist. Precios',     route: 'inventario-precios',         svg: SVGS.tag,       badge: null, roles: null },
    ],
  },
  {
    id: 'ventas', label: 'Ventas', svg: SVGS.receipt, badge: null, roles: null, type: 'group',
    children: [
      { id: 'punto-venta',    label: 'Punto de Venta', route: 'punto-venta',    svg: SVGS.pos,     badge: null, roles: null },
      { id: 'ventas-historial', label: 'Historial',    route: 'ventas-historial', svg: SVGS.receipt, badge: null, roles: null },
      { id: 'caja',           label: 'Caja',           route: 'caja',           svg: SVGS.cashReg, badge: null, roles: ['ADMIN_CLIENTE', 'SUPER_ADMIN', 'ENCARGADO', 'CAJERO'] },
    ],
  },
  {
    id: 'compras', label: 'Compras', svg: SVGS.cart, badge: null, roles: null, type: 'group',
    children: [
      { id: 'compras-ingreso',          label: 'Ingreso Inicial',  route: 'compras-ingreso',          svg: SVGS.box,     badge: null, roles: null },
      { id: 'compras-orden',            label: 'Nueva Compra',     route: 'compras-orden',            svg: SVGS.cart,    badge: null, roles: null },
      { id: 'compras-historial',        label: 'Historial',        route: 'compras-historial',        svg: SVGS.receipt, badge: null, roles: null },
      { id: 'compras-pagos',            label: 'Pagos',            route: 'compras-pagos',            svg: SVGS.wallet,  badge: null, roles: null },
      { id: 'compras-pagos-historial',  label: 'Historial Pagos',  route: 'compras-pagos-historial',  svg: SVGS.history, badge: null, roles: null },
    ],
  },
  {
    id: 'configuracion', label: 'Configuración', svg: SVGS.settings, badge: null, roles: ['SUPER_ADMIN', 'ADMIN_CLIENTE'], type: 'group',
    children: [
      { id: 'configuracion-general', label: 'General',    route: 'configuracion',     svg: SVGS.settings,  badge: null, roles: ['SUPER_ADMIN', 'ADMIN_CLIENTE'] },
      { id: 'catalogo-productos',    label: 'Catálogo',   route: 'catalogo-productos', svg: SVGS.catalog,   badge: null, roles: ['ADMIN_CLIENTE'] },
      { id: 'sucursales',            label: 'Sucursales', route: 'sucursales',         svg: SVGS.branch,    badge: null, roles: ['ADMIN_CLIENTE', 'SUPER_ADMIN'] },
      { id: 'usuarios-sistema',      label: 'Usuarios',   route: 'usuarios-sistema',   svg: SVGS.usersGear, badge: null, roles: ['ADMIN_CLIENTE', 'SUPER_ADMIN'] },
    ],
  },
  { id: 'logistica', label: 'Logística', route: 'logistica', svg: SVGS.truck, badge: null, roles: ['ADMIN_CLIENTE'] },
  { id: 'fuentes', label: 'Fuentes de Fondos', route: 'fuentes', svg: SVGS.wallet, badge: null, roles: ['ADMIN_CLIENTE'] },
  { id:'mi-cuenta',      label:'Mi Cuenta',      route:'mi-cuenta',      svg: SVGS.account,   badge: null, roles: ['ADMIN_CLIENTE'] },
  {
    id: 'contactos', label: 'Contactos', svg: SVGS.contacts, badge: null, roles: null, type: 'group',
    children: [
      { id: 'proveedores',        label: 'Proveedores', route: 'proveedores',        svg: SVGS.truck,  badge: null, roles: null },
      { id: 'contactos-clientes', label: 'Clientes',    route: 'contactos-clientes', svg: SVGS.person, badge: null, roles: null },
    ],
  },
];

const TITLES = {
  home:             'Dashboard',
  empresas:         'Empresas',
  agentes:          'Agentes IA — Claude',
  herramientas:     'Herramientas (Tool Use)',
  conversaciones:   'Conversaciones',
  reportes:         'Reportes',
  configuracion:    'Configuración',
  'agente-detalle': 'Detalle del Agente',
  'mi-cuenta':      'Mi Cuenta',
  'contactos':             'Contactos',
  'proveedores':           'Proveedores',
  'contactos-clientes':    'Clientes — Contactos',
  'configuracion-general': 'Configuración',
  'catalogo-productos':    'Catálogo de Productos',
  'sucursales':            'Sucursales',
  'usuarios-sistema':      'Gestión de Usuarios',
  'inventario':                  'Inventario',
  'inventario-stock':            'Stock Actual',
  'inventario-kardex':           'Kardex de Movimientos',
  'inventario-lotes':            'Consulta de Lotes',
  'inventario-ajustes':          'Ajustes de Inventario',
  'inventario-bajas':            'Bajas de Inventario',
  'inventario-transferencias':   'Transferencias entre Sucursales',
  'inventario-devoluciones':     'Devoluciones',
  'inventario-toma':             'Toma de Inventario',
  'inventario-alertas':          'Alertas de Inventario',
  'inventario-reporte-general':  'Reporte General de Inventario',
  'inventario-rotacion':         'Rotación de Inventario',
  'inventario-precios':          'Historial de Precios',
  'ventas':                'Ventas',
  'punto-venta':           'Punto de Venta',
  'ventas-historial':      'Historial de Ventas',
  'caja':                  'Caja',
  'compras':               'Compras',
  'compras-ingreso':       'Ingreso Inicial de Stock',
  'compras-orden':         'Nueva Compra',
  'compras-historial':     'Historial de Compras',
  'compras-pagos':             'Pagos a Proveedores',
  'compras-pagos-historial':   'Historial de Pagos',
  'logistica':                 'Logística de Importación',
  'logistica-orden-detalle':   'Detalle de Orden de Importación',
  'fuentes':                   'Fuentes de Fondos',
};

export default {
  name: 'AppLayout',
  data() {
    return {
      collapsed: false,
      time: new Date(),
      expandedGroups: [],
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.currentUser || this.$storage.get('user') || {};
    },
    userRol() { return this.currentUser?.rol || 'USER'; },
    nav() {
      const rol = this.userRol;
      const result = [];
      for (const item of ALL_NAV) {
        if (item.roles && !item.roles.includes(rol)) continue;
        if (item.type === 'group') {
          const visible = (item.children || []).filter(c => !c.roles || c.roles.includes(rol));
          if (!visible.length) continue;
          result.push(item);
          if (!this.collapsed && (this.expandedGroups.includes(item.id) || this.activeGroup === item.id)) {
            visible.forEach(child => result.push({ ...child, _isChild: true }));
          }
        } else {
          result.push(item);
        }
      }
      return result;
    },
    active() {
      const name = this.$route.name || '';
      for (const item of ALL_NAV) {
        if (item.route === name) return item.id;
        if (item.children) {
          const child = item.children.find(c => c.route === name);
          if (child) return child.id;
        }
      }
      return name;
    },
    activeGroup() {
      const name = this.$route.name || '';
      for (const item of ALL_NAV) {
        if (item.children && item.children.some(c => c.route === name)) return item.id;
      }
      return null;
    },
    moduleTitle() { return TITLES[this.active] || TITLES[this.$route.name] || 'IDE-IA'; },
    sucursales() { return this.$store.getters.sucursales; },
    sucursalActual() { return this.$store.getters.sucursalActual; },
    sucursalActualId() { return this.$store.getters.sucursalActualId; },
    isRolRestringido() { return this.$store.getters.isRolRestringido; },
    userName() { return this.currentUser?.nombres || this.currentUser?.usuario || 'Usuario'; },
    userInitials() {
      const n = this.currentUser?.nombres || this.currentUser?.usuario || 'U';
      return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    },
    clienteNombre() {
      return this.$store.getters.clienteInfo?.nombre || null;
    },
    timeStr() {
      return this.time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    },
    dateStr() {
      return this.time.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    },
  },
  watch: {
    '$store.state.clienteId'(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.$store.commit('setSucursales', []);
        this.$store.commit('setSucursalActual', null);
        this._cargarSucursales();
      }
    },
  },
  mounted() {
    this._restoreAuth();
    this._timer = setInterval(() => { this.time = new Date(); }, 60000);
    this._cargarSucursales();
  },
  beforeDestroy() {
    clearInterval(this._timer);
  },
  methods: {
    _restoreAuth() {
      if (!this.$store.getters.isAuth) {
        const token = this.$storage.get('token');
        const user = this.$storage.get('user');
        if (token && user) {
          this.$store.commit('setAuth', true);
          this.$store.commit('setUser', user);
          const empresaGuardada = this.$storage.get('empresaActual');
          if (empresaGuardada) {
            this.$store.commit('setEmpresaActual', empresaGuardada);
          } else {
            this.$store.commit('setClienteId', user.clienteId ?? null);
          }
        }
      }
    },
    isItemActive(item) {
      return item.type === 'group' ? this.activeGroup === item.id : this.active === item.id;
    },
    navItemStyle(item) {
      if (this.collapsed) return 'padding: 10px 0; justify-content: center;';
      if (item._isChild) return 'padding-left: 28px;';
      return '';
    },
    isGroupExpanded(item) {
      return this.expandedGroups.includes(item.id) || this.activeGroup === item.id;
    },
    go(item) {
      if (item.type === 'group') {
        if (this.collapsed) {
          this.collapsed = false;
          this.$nextTick(() => {
            if (!this.expandedGroups.includes(item.id)) this.expandedGroups.push(item.id);
          });
        } else {
          const idx = this.expandedGroups.indexOf(item.id);
          if (idx >= 0) this.expandedGroups.splice(idx, 1);
          else this.expandedGroups.push(item.id);
        }
        return;
      }
      if (this.$route.name !== item.route) {
        this.$router.push({ name: item.route });
      }
    },
    goChild(child) {
      if (this.$route.name !== child.route) {
        this.$router.push({ name: child.route });
      }
    },
    async _cargarSucursales() {
      if (!this.$store.getters.isAuth) return;
      try {
        const lista = await this.$service.list('sucursales');
        this.$store.commit('setSucursales', lista || []);
        // Auto-select the only branch for restricted roles
        if (this.isRolRestringido && lista?.length === 1) {
          this.$store.commit('setSucursalActual', lista[0]);
        }
        // Restore saved selection
        const saved = this.$storage.get('sucursalActual');
        if (saved && lista?.find(s => s.id === saved.id)) {
          this.$store.commit('setSucursalActual', saved);
        }
      } catch { /* ignore */ }
    },
    cambiarSucursal(id) {
      if (!id) {
        this.$store.commit('setSucursalActual', null);
        this.$storage.remove('sucursalActual');
      } else {
        const s = this.sucursales.find(s => s.id === id);
        this.$store.commit('setSucursalActual', s || null);
        if (s) this.$storage.set('sucursalActual', s);
      }
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
/* ── Root ── */
.ide-app {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #0a0f1e;
}

/* ── Sidebar ── */
.ide-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #0d1526;
  border-right: 1px solid #1e3a5f44;
  display: flex;
  flex-direction: column;
  transition: width 0.25s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
  z-index: 10;
}
.ide-sidebar--collapsed { width: 60px; }

/* Logo */
.ide-sidebar__header {
  padding: 18px 16px;
  border-bottom: 1px solid #1e3a5f44;
  display: flex;
  align-items: center;
  gap: 10px;
}
.ide-sidebar__header--collapsed {
  padding: 18px 0;
  justify-content: center;
}
.ide-logo {
  width: 32px; height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ide-logo-name {
  font-size: 14px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.3px;
}
.ide-logo-sub {
  font-size: 9px; color: #475569; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1px;
}

/* Client badge */
.ide-cliente-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 14px;
  font-size: 10px; font-weight: 700; color: #c96442;
  letter-spacing: 0.5px; text-transform: uppercase;
  white-space: nowrap; overflow: hidden;
}
.ide-cliente-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #22c55e; flex-shrink: 0;
}
.ide-cliente-name { overflow: hidden; text-overflow: ellipsis; }

/* Logout */
.ide-logout-btn {
  background: none; border: none; cursor: pointer;
  color: #475569; padding: 5px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: color 0.15s;
}
.ide-logout-btn:hover { color: #ef4444; }

/* Nav */
.ide-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex; flex-direction: column; gap: 2px;
  overflow-y: auto;
}
.ide-nav__item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 9px; border: none; cursor: pointer;
  background: transparent;
  color: #64748b;
  font-size: 13px; font-weight: 500;
  transition: all 0.15s;
  width: 100%; text-align: left;
  position: relative;
}
.ide-nav__item:hover { background: #1e293b44; color: #94a3b8; }
.ide-nav__item--active {
  background: #6366f122 !important;
  color: #818cf8 !important;
  font-weight: 700;
}
.ide-nav__indicator {
  position: absolute; left: 0; top: 20%; bottom: 20%;
  width: 3px; border-radius: 0 3px 3px 0;
  background: #6366f1;
}
.ide-nav__icon { flex-shrink: 0; display: flex; }
.ide-nav__label { flex: 1; white-space: nowrap; }
.ide-nav__badge {
  margin-left: auto;
  min-width: 18px; height: 18px; border-radius: 999px;
  background: #6366f1; color: #fff;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 5px;
}
.ide-nav__badge--new { background: #c96442; }
.ide-nav__dot {
  position: absolute; top: 4px; right: 4px;
  width: 8px; height: 8px; border-radius: 50%;
  background: #ef4444;
}
.ide-nav__dot--new { background: #c96442; }
.ide-nav__item--child {
  margin-left: 8px;
  border-left: 2px solid #1e3a5f66;
  border-radius: 0 9px 9px 0;
  font-size: 12px;
}
.ide-nav__chevron {
  margin-left: auto;
  display: flex;
  color: #475569;
  transition: transform 0.2s ease;
}
.ide-nav__chevron--open { transform: rotate(90deg); }

/* Footer */
.ide-sidebar__footer {
  border-top: 1px solid #1e3a5f44;
  padding: 12px 8px;
  display: flex; flex-direction: column; gap: 8px;
}
.ide-user {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 8px;
  background: #161d2f;
}
.ide-user-info { flex: 1; min-width: 0; }
.ide-user-name { font-size: 11px; font-weight: 700; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ide-user-online { font-size: 9px; color: #22c55e; font-weight: 600; }
.ide-collapse-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  padding: 4px 8px; color: #475569;
  width: 100%;
}
.ide-collapse-btn:hover { color: #94a3b8; }
.ide-collapse-label { font-size: 10px; font-weight: 600; margin-left: auto; }

/* Avatar */
.ide-avatar {
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; flex-shrink: 0;
}
.ide-avatar--small { width: 28px; height: 28px; font-size: 11px; }

/* ── Main ── */
.ide-main {
  flex: 1;
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* Top Bar */
.ide-topbar {
  height: 52px;
  flex-shrink: 0;
  background: #0d1526;
  border-bottom: 1px solid #1e3a5f44;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px;
}
.ide-topbar__left {
  display: flex; align-items: center; gap: 10px;
}
.ide-topbar__title {
  font-size: 16px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.3px;
}
.ide-topbar__badges { display: flex; gap: 6px; }
.ide-badge {
  display: inline-flex; align-items: center;
  padding: 1px 7px; border-radius: 999px;
  font-size: 10px; font-weight: 600;
  white-space: nowrap; flex-shrink: 0;
}
.ide-badge--new { background: #c9644222; color: #e8956d; border: 1px solid #c9644244; }

.ide-topbar__right {
  display: flex; align-items: center; gap: 14px;
}
.ide-topbar__time { font-size: 12px; font-weight: 500; }
.ide-topbar__actions { display: flex; gap: 8px; }
.ide-icon-btn {
  background: none; border: none; cursor: pointer;
  color: #64748b; padding: 4px; position: relative;
  border-radius: 6px; transition: color 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.ide-icon-btn:hover { color: #94a3b8; }
.ide-icon-btn__dot {
  position: absolute; top: 2px; right: 2px;
  width: 7px; height: 7px; border-radius: 50%;
  background: #ef4444;
}
.ide-topbar__user {
  display: flex; align-items: center; gap: 8px;
  padding-left: 10px; border-left: 1px solid #1e3a5f44;
}

/* Module */
.ide-module {
  flex: 1;
  overflow: hidden;
}

/* Sucursal selector */
.ide-sucursal-selector {
  display: flex; align-items: center; gap: 6px;
  background: #1e293b; border: 1px solid #1e3a5f44;
  border-radius: 8px; padding: 4px 10px; margin-left: 12px;
}
.ide-sucursal-select {
  background: transparent; border: none; outline: none;
  color: #94a3b8; font-size: 11px; font-weight: 600;
  cursor: pointer; max-width: 180px;
}
.ide-sucursal-select option { background: #1e293b; color: #e2e8f0; }
</style>
