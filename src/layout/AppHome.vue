<template>
  <div class="ide-mod">

    <!-- Sub-nav -->
    <div class="ide-subnav">
      <div class="ide-sn-hd">
        <div class="ide-sn-ico" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </div>
        <div>
          <div class="ide-sn-title">Dashboard</div>
          <div class="ide-sn-sub" style="color:#6366f1;">IDE-IA</div>
        </div>
      </div>

      <button v-for="s in secciones" :key="s.id" class="ide-sn-btn" :class="seccion === s.id ? 'ide-sn-btn--i' : ''" @click="seccion = s.id">
        <span v-html="s.svg" style="flex-shrink:0;display:flex;"></span>
        {{ s.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="ide-body">

      <!-- ── RESUMEN DEL DÍA ── -->
      <template v-if="seccion === 'resumen'">
        <div class="ide-sec-hd" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div>
            <h2>Resumen del día</h2>
            <p>{{ fechaLabel }}</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="date" v-model="fechaDia" class="dh-date-input" @change="cargarDia" />
            <button class="dh-refresh-btn" :class="{ 'dh-refresh-btn--spin': loading }" @click="cargarDia" title="Actualizar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            </button>
          </div>
        </div>

        <!-- Stat cards -->
        <div class="dh-grid4">
          <div class="dh-card" v-for="card in statCards" :key="card.label" :style="`--c:${card.color}`">
            <div class="dh-card-top">
              <span class="dh-card-label">{{ card.label }}</span>
              <div class="dh-card-ico">
                <span v-html="card.svg"></span>
              </div>
            </div>
            <div class="dh-card-val">{{ card.value }}</div>
            <div class="dh-card-sub">{{ card.sub }}</div>
          </div>
        </div>

        <!-- Ventas + Ingresos/Gastos row -->
        <div class="dh-row2">

          <!-- Ventas del día -->
          <div class="ide-ia-card dh-table-card">
            <div class="dh-section-hd">
              <div style="font-size:13px;font-weight:700;color:var(--t2);">Ventas del día</div>
              <router-link :to="{name:'ventas-historial'}" style="font-size:11px;color:#6366f1;text-decoration:none;">Ver todas →</router-link>
            </div>

            <div v-if="loading" class="dh-loading"><div class="dh-spinner"></div></div>
            <div v-else-if="!ventas.length" class="dh-empty">Sin ventas hoy</div>
            <div v-else class="dh-venta-list">
              <div v-for="v in ventas" :key="v.id" class="dh-venta-row">
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12px;font-weight:600;color:var(--t2);">{{ v.nroVenta }}</div>
                  <div style="font-size:10px;color:var(--t5);margin-top:1px;">
                    {{ v.nombreCliente || 'Cliente general' }}
                    <span v-if="v.metodoPago" style="margin-left:6px;" :style="`color:${metodoColor(v.metodoPago)}`">· {{ v.metodoPago }}</span>
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                  <div style="font-size:13px;font-weight:700;color:#22c55e;">Bs {{ fmt(v.total) }}</div>
                  <span class="dh-estado-badge" :class="`dh-estado-badge--${v.estadoVenta?.toLowerCase()}`">{{ v.estadoVenta }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Ingresos y Gastos -->
          <div style="display:flex;flex-direction:column;gap:14px;">

            <!-- Ingresos -->
            <div class="ide-ia-card dh-table-card">
              <div class="dh-section-hd">
                <div style="font-size:13px;font-weight:700;color:var(--t2);">Ingresos</div>
                <router-link :to="{name:'ingresos'}" style="font-size:11px;color:#22c55e;text-decoration:none;">Ver todos →</router-link>
              </div>
              <div v-if="loading" class="dh-loading"><div class="dh-spinner"></div></div>
              <div v-else-if="!ingresos.length" class="dh-empty">Sin ingresos hoy</div>
              <div v-else class="dh-mov-list">
                <div v-for="ing in ingresos" :key="ing.id" class="dh-mov-row">
                  <div class="dh-mov-dot" style="background:#22c55e22;color:#22c55e;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:var(--t2);">{{ ing.tipo }}</div>
                    <div style="font-size:10px;color:var(--t5);">{{ ing.descripcion || ing.categoria }}</div>
                  </div>
                  <div style="font-size:12px;font-weight:700;color:#22c55e;flex-shrink:0;">+Bs {{ fmt(ing.monto) }}</div>
                </div>
              </div>
            </div>

            <!-- Gastos -->
            <div class="ide-ia-card dh-table-card">
              <div class="dh-section-hd">
                <div style="font-size:13px;font-weight:700;color:var(--t2);">Gastos</div>
                <router-link :to="{name:'gastos'}" style="font-size:11px;color:#ef4444;text-decoration:none;">Ver todos →</router-link>
              </div>
              <div v-if="loading" class="dh-loading"><div class="dh-spinner"></div></div>
              <div v-else-if="!gastos.length" class="dh-empty">Sin gastos hoy</div>
              <div v-else class="dh-mov-list">
                <div v-for="g in gastos" :key="g.id" class="dh-mov-row">
                  <div class="dh-mov-dot" style="background:#ef444422;color:#ef4444;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:var(--t2);">{{ g.tipo }}</div>
                    <div style="font-size:10px;color:var(--t5);">{{ g.descripcion || g.categoria }}</div>
                  </div>
                  <div style="font-size:12px;font-weight:700;color:#ef4444;flex-shrink:0;">-Bs {{ fmt(g.monto) }}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </template>

      <!-- ── INICIO RÁPIDO ── -->
      <template v-else-if="seccion === 'inicio'">
        <div class="ide-sec-hd"><h2>Inicio rápido</h2><p>Guía para configurar tu primer agente IA con Claude</p></div>
        <div style="display:flex;flex-direction:column;gap:12px;max-width:620px;">
          <div v-for="(step, i) in pasos" :key="i" class="ide-ia-card" style="display:flex;align-items:flex-start;gap:16px;padding:18px;">
            <div class="home-step-num" :style="{ background: step.done ? '#22c55e22' : '#6366f122', color: step.done ? '#22c55e' : '#818cf8' }">
              <span v-if="step.done">✓</span><span v-else>{{ i+1 }}</span>
            </div>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:700;color:var(--t2);margin-bottom:4px;">{{ step.title }}</div>
              <div style="font-size:12px;color:var(--t4);line-height:1.5;margin-bottom:10px;">{{ step.desc }}</div>
              <router-link :to="{ name: step.route }" style="font-size:11px;color:#6366f1;font-weight:600;text-decoration:none;">{{ step.cta }} →</router-link>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script>
const SVGS = {
  grid:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  bolt:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  cart:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>`,
  up:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  down:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
  bal:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
}

const PASOS_BASE = [
  { title: 'Configura tu API Key',   desc: 'Ingresa tu clave de Anthropic para activar Claude AI.',            route: 'configuracion', cta: 'Ir a Configuración', roles: ['SUPER_ADMIN','ADMIN_CLIENTE'] },
  { title: 'Crea tu primer agente',  desc: 'Define el nombre, rol y comportamiento de tu agente IA.',          route: 'agentes',        cta: 'Crear agente',        roles: null },
  { title: 'Configura herramientas', desc: 'Añade herramientas (Tool Use) que Claude ejecuta de forma autónoma.', route: 'herramientas', cta: 'Gestionar herramientas', roles: null },
  { title: 'Prueba tu agente',       desc: 'Conversa en tiempo real y ajusta el comportamiento.',               route: 'agentes',        cta: 'Probar agente',       roles: null },
]

export default {
  name: 'AppHome',
  data() {
    const hoy = new Date().toISOString().split('T')[0]
    return {
      seccion:  'resumen',
      fechaDia: hoy,
      loading:  false,
      ventas:   [],
      ingresos: [],
      gastos:   [],
      secciones: [
        { id: 'resumen', label: 'Resumen del día', svg: SVGS.grid },
        { id: 'inicio',  label: 'Inicio rápido',   svg: SVGS.bolt },
      ],
    }
  },
  computed: {
    currentUser() { return this.$store.getters.currentUser || this.$storage.get('user') || {} },
    userRol()     { return this.currentUser?.rol || null },
    pasos()       { return PASOS_BASE.filter(p => !p.roles || (this.userRol && p.roles.includes(this.userRol))) },
    fechaLabel() {
      const d = new Date(this.fechaDia + 'T12:00:00')
      return d.toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
    },
    totalVentas()   { return this.ventas.filter(v => v.estadoVenta !== 'ANULADA').reduce((s,v) => s + Number(v.total  || 0), 0) },
    totalIngresos() { return this.ingresos.reduce((s,i) => s + Number(i.monto || 0), 0) },
    totalGastos()   { return this.gastos.reduce((s,g)   => s + Number(g.monto || 0), 0) },
    balance()       { return this.totalVentas + this.totalIngresos - this.totalGastos },
    statCards() {
      return [
        { label: 'Ventas',    value: 'Bs ' + this.fmt(this.totalVentas),   sub: this.ventas.filter(v=>v.estadoVenta!=='ANULADA').length + ' transacciones',   color: '#6366f1', svg: SVGS.cart },
        { label: 'Ingresos',  value: 'Bs ' + this.fmt(this.totalIngresos), sub: this.ingresos.length + ' registros',                                          color: '#22c55e', svg: SVGS.up   },
        { label: 'Gastos',    value: 'Bs ' + this.fmt(this.totalGastos),   sub: this.gastos.length + ' registros',                                            color: '#ef4444', svg: SVGS.down },
        { label: 'Balance',   value: 'Bs ' + this.fmt(this.balance),       sub: this.balance >= 0 ? 'Positivo' : 'Negativo',                                  color: this.balance >= 0 ? '#f59e0b' : '#ef4444', svg: SVGS.bal },
      ]
    },
  },
  async mounted() {
    await this.cargarDia()
  },
  methods: {
    async cargarDia() {
      this.loading = true
      try {
        const [ventas, ingresos, gastos] = await Promise.all([
          this.$service.list('ventas',   { fecha: this.fechaDia }),
          this.$service.list('ingresos', { fecha: this.fechaDia }),
          this.$service.list('gastos',   { fecha: this.fechaDia }),
        ])
        this.ventas   = ventas   || []
        this.ingresos = ingresos || []
        this.gastos   = gastos   || []
      } catch (_e) { /* silencioso */ } finally {
        this.loading = false
      }
    },
    fmt(n) {
      return Number(n || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    metodoColor(m) {
      const map = { EFECTIVO: '#22c55e', QR: '#6366f1', TRANSFERENCIA: '#3b82f6', TARJETA: '#f59e0b', ADELANTO: '#8b5cf6' }
      return map[m] || 'var(--t4)'
    },
  },
}
</script>

<style scoped>
/* Stat cards */
.dh-grid4 { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:18px; }
.dh-card  { background:var(--bg-c); border:1px solid var(--b1); border-radius:12px; padding:16px; position:relative; overflow:hidden; }
.dh-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--c); }
.dh-card-top  { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.dh-card-label { font-size:11px; font-weight:600; color:var(--t4); text-transform:uppercase; letter-spacing:.5px; }
.dh-card-ico  { width:32px; height:32px; border-radius:8px; background:color-mix(in srgb, var(--c) 15%, transparent); color:var(--c); display:flex; align-items:center; justify-content:center; }
.dh-card-val  { font-size:22px; font-weight:800; color:var(--c); line-height:1.1; margin-bottom:4px; }
.dh-card-sub  { font-size:11px; color:var(--t5); }

/* Layout */
.dh-row2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:860px) { .dh-row2 { grid-template-columns:1fr; } }

/* Table cards */
.dh-table-card { padding:0; overflow:hidden; }
.dh-section-hd { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid var(--b1); }

/* Ventas list */
.dh-venta-list { max-height:320px; overflow-y:auto; }
.dh-venta-row  { display:flex; align-items:center; gap:12px; padding:10px 14px; border-bottom:1px solid var(--b1); }
.dh-venta-row:last-child { border-bottom:none; }
.dh-venta-row:hover { background:var(--bg-e); }

/* Movimientos (ingresos/gastos) */
.dh-mov-list { max-height:180px; overflow-y:auto; }
.dh-mov-row  { display:flex; align-items:center; gap:10px; padding:8px 14px; border-bottom:1px solid var(--b1); }
.dh-mov-row:last-child { border-bottom:none; }
.dh-mov-dot  { width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

/* Estado badge */
.dh-estado-badge { font-size:9px; font-weight:700; padding:1px 6px; border-radius:4px; background:var(--bg-e); color:var(--t4); }
.dh-estado-badge--pagada  { background:#22c55e18; color:#22c55e; }
.dh-estado-badge--anulada { background:#ef444418; color:#ef4444; }
.dh-estado-badge--pendiente { background:#f59e0b18; color:#f59e0b; }

/* Controles cabecera */
.dh-date-input { background:var(--bg-e); border:1px solid var(--b1); border-radius:7px; color:var(--t1); font-size:12px; padding:5px 10px; outline:none; cursor:pointer; }
.dh-refresh-btn { width:32px; height:32px; border-radius:7px; border:1px solid var(--b1); background:var(--bg-e); color:var(--t3); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
.dh-refresh-btn:hover { border-color:#6366f1; color:#818cf8; }
.dh-refresh-btn--spin svg { animation:spin .7s linear infinite; }

/* Misc */
.dh-loading { display:flex; justify-content:center; padding:20px; }
.dh-empty   { text-align:center; padding:16px; font-size:12px; color:var(--t5); font-style:italic; }
.dh-spinner { width:22px; height:22px; border-radius:50%; border:2px solid var(--b1); border-top-color:#6366f1; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.home-step-num { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; }
</style>
