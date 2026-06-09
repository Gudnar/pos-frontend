<template>
  <div class="ide-mod">

    <!-- Sub-nav -->
    <div class="ide-subnav">
      <div class="ide-sn-hd">
        <div class="ide-sn-ico" style="background: linear-gradient(135deg,#6366f1,#8b5cf6);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </div>
        <div>
          <div class="ide-sn-title">Dashboard</div>
          <div class="ide-sn-sub" style="color:#6366f1;">IDE-IA</div>
        </div>
      </div>

      <button
        v-for="s in secciones" :key="s.id"
        class="ide-sn-btn"
        :class="seccion === s.id ? 'ide-sn-btn--i' : ''"
        @click="seccion = s.id"
      >
        <span v-html="s.svg" style="flex-shrink:0; display:flex;"></span>
        {{ s.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="ide-body">
      <!-- RESUMEN -->
      <template v-if="seccion === 'resumen'">
        <div class="ide-sec-hd">
          <h2>Resumen del sistema</h2>
          <p>Estado actual de tus agentes IA y actividad reciente</p>
        </div>

        <div class="home-stats">
          <div v-for="stat in stats" :key="stat.label" class="ide-ia-card home-stat">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
              <span style="font-size:12px; color:#64748b; font-weight:500;">{{ stat.label }}</span>
              <div class="home-stat-ico" :style="{ background: stat.color + '18' }">
                <span :style="{ color: stat.color, fontSize:'16px' }">{{ stat.emoji }}</span>
              </div>
            </div>
            <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
            <div style="font-size:11px; color:#64748b; margin-top:4px;">{{ stat.sub }}</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin:24px 0 12px;">
          <div style="font-size:14px; font-weight:700; color:#e2e8f0;">Agentes recientes</div>
          <router-link :to="{ name: 'agentes' }" style="font-size:12px; color:#6366f1; text-decoration:none;">Ver todos →</router-link>
        </div>

        <div v-if="loadingAgentes" style="display:flex; justify-content:center; padding:32px;">
          <v-progress-circular indeterminate color="primary" size="32" />
        </div>
        <div v-else-if="agentes.length === 0" class="ide-ia-card" style="text-align:center; padding:32px;">
          <div style="font-size:32px; margin-bottom:12px;">🤖</div>
          <div style="color:#64748b; font-size:13px; margin-bottom:16px;">No tienes agentes creados aún.</div>
          <router-link :to="{ name: 'agentes' }">
            <v-btn depressed color="primary" style="font-size:12px; border-radius:8px;">Crear primer agente</v-btn>
          </router-link>
        </div>
        <div v-else class="home-agentes">
          <div
            v-for="ag in agentes.slice(0, 4)" :key="ag.id"
            class="ide-ia-card ide-ia-card--hover"
            style="padding:14px;"
            @click="$router.push({ name: 'agente-detalle', params: { id: ag.id } })"
          >
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
              <div class="home-ag-avatar" :style="{ background: ag.color+'22', color: ag.color }">{{ ag.avatar }}</div>
              <div style="flex:1; min-width:0;">
                <div style="font-size:13px; font-weight:700; color:#e2e8f0;">{{ ag.nombre }}</div>
                <div style="font-size:11px; color:#64748b;">{{ ag.modelo }}</div>
              </div>
              <div class="home-ag-badge" :class="ag.activo ? 'home-ag-badge--on' : ''">
                {{ ag.activo ? 'Activo' : 'Inactivo' }}
              </div>
            </div>
            <div style="font-size:11px; color:#64748b; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:10px;">
              {{ ag.systemPrompt || ag.descripcion || 'Sin descripción' }}
            </div>
            <div style="display:flex; gap:16px;">
              <div style="font-size:11px; color:#64748b;">
                <span style="color:#818cf8; font-weight:700;">{{ ag.totalConversaciones }}</span> conv.
              </div>
              <div style="font-size:11px; color:#64748b;">
                <span style="color:#818cf8; font-weight:700;">{{ ag.totalMensajes }}</span> msg.
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- INICIO RÁPIDO -->
      <template v-else-if="seccion === 'inicio'">
        <div class="ide-sec-hd">
          <h2>Inicio rápido</h2>
          <p>Guía para configurar tu primer agente IA con Claude</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; max-width:620px;">
          <div v-for="(step, i) in pasos" :key="i" class="ide-ia-card" style="display:flex; align-items:flex-start; gap:16px; padding:18px;">
            <div class="home-step-num" :style="{ background: step.done ? '#22c55e22' : '#6366f122', color: step.done ? '#22c55e' : '#818cf8' }">
              <span v-if="step.done">✓</span>
              <span v-else>{{ i+1 }}</span>
            </div>
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:4px;">{{ step.title }}</div>
              <div style="font-size:12px; color:#64748b; line-height:1.5; margin-bottom:10px;">{{ step.desc }}</div>
              <router-link :to="{ name: step.route }" style="font-size:11px; color:#6366f1; font-weight:600; text-decoration:none;">
                {{ step.cta }} →
              </router-link>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
const SVGS = {
  grid:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  bolt:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
};

const PASOS_BASE = [
  { title: 'Configura tu API Key', desc: 'Ingresa tu clave de Anthropic para activar Claude AI en todos tus agentes.', route: 'configuracion', cta: 'Ir a Configuración', roles: ['SUPER_ADMIN', 'ADMIN_CLIENTE'] },
  { title: 'Crea tu primer agente', desc: 'Define el nombre, rol y comportamiento de tu agente IA personalizado.', route: 'agentes', cta: 'Crear agente', roles: null },
  { title: 'Configura herramientas', desc: 'Añade herramientas (Tool Use) que Claude puede ejecutar de forma autónoma.', route: 'herramientas', cta: 'Gestionar herramientas', roles: null },
  { title: 'Prueba tu agente', desc: 'Conversa en tiempo real con tu agente y ajusta su comportamiento.', route: 'agentes', cta: 'Probar agente', roles: null },
];

export default {
  name: 'AppHome',
  data: () => ({
    seccion: 'resumen',
    agentes: [],
    statsData: { conversaciones: 0, mensajes: 0, porcentaje: 0 },
    loadingAgentes: true,
    secciones: [
      { id: 'resumen', label: 'Resumen',      svg: SVGS.grid },
      { id: 'inicio',  label: 'Inicio rápido', svg: SVGS.bolt },
    ],
  }),
  computed: {
    currentUser() {
      return this.$store.getters.currentUser || this.$storage.get('user') || {};
    },
    userRol() { return this.currentUser?.rol || null; },
    pasos() {
      return PASOS_BASE.filter(p => !p.roles || (this.userRol && p.roles.includes(this.userRol)));
    },
    stats() {
      return [
        { label: 'Agentes activos',      value: this.agentes.filter(a => a.activo).length, sub: 'Total: ' + this.agentes.length,       color: '#6366f1', emoji: '🤖' },
        { label: 'Conversaciones',       value: this.statsData.conversaciones,               sub: 'Histórico',                           color: '#22c55e', emoji: '💬' },
        { label: 'Mensajes procesados',  value: this.statsData.mensajes,                     sub: 'Por Claude',                          color: '#f59e0b', emoji: '✉️' },
        { label: 'Tasa de resolución',   value: this.statsData.porcentaje + '%',             sub: 'Sin escalado',                        color: '#8b5cf6', emoji: '✅' },
      ];
    },
  },
  async mounted() {
    await this.cargar();
  },
  methods: {
    async cargar() {
      try {
        this.loadingAgentes = true;
        const [agentes, stats] = await Promise.all([
          this.$service.list('agentes'),
          this.$service.list('conversaciones/estadisticas'),
        ]);
        this.agentes = agentes || [];
        if (stats) {
          this.statsData = {
            conversaciones: stats.total || 0,
            mensajes: this.agentes.reduce((s, a) => s + (a.totalMensajes || 0), 0),
            porcentaje: stats.porcentajeResolucion || 0,
          };
        }
      } catch (e) { /* silencioso */ } finally {
        this.loadingAgentes = false;
      }
    },
  },
};
</script>

<style scoped>
.home-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
  margin-bottom: 8px;
}
.home-stat-ico { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.home-agentes { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }
.home-ag-avatar {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
}
.home-ag-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: #ef444422; color: #ef4444; white-space: nowrap; }
.home-ag-badge--on { background: #22c55e22; color: #22c55e; }
.home-step-num {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
</style>
