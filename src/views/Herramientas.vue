<template>
  <!-- Standalone route: full sub-nav module layout -->
  <div v-if="!agenteId" class="ide-mod">

    <!-- Sub-nav: agent selector -->
    <div class="ide-subnav">
      <div class="ide-sn-hd">
        <div class="ide-sn-ico" style="background:linear-gradient(135deg,#c96442,#e8956d);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
        </div>
        <div>
          <div class="ide-sn-title">Herramientas</div>
          <div class="ide-sn-sub" style="color:#c96442;">Tool Use</div>
        </div>
      </div>

      <div style="font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:1px; padding:0 10px 8px;">Agentes</div>

      <div v-if="loadingAgentes" style="display:flex; justify-content:center; padding:16px;">
        <v-progress-circular indeterminate color="primary" size="20" />
      </div>

      <button
        v-for="ag in agentes" :key="ag.id"
        class="ide-sn-btn"
        :class="agenteSeleccionado === ag.id ? 'ide-sn-btn--o' : ''"
        @click="seleccionarAgente(ag.id)"
      >
        <div style="width:20px; height:20px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0;"
          :style="{ background: ag.color+'22', color: ag.color }">{{ ag.avatar }}</div>
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ ag.nombre }}</span>
      </button>

      <div v-if="!loadingAgentes && agentes.length === 0" style="font-size:11px; color:#475569; padding:8px 12px;">
        No hay agentes
      </div>
    </div>

    <!-- Content -->
    <div class="ide-body">
      <div v-if="!agenteSeleccionado" style="text-align:center; padding:48px; color:#475569;">
        <div style="font-size:32px; margin-bottom:12px;">🔧</div>
        <div style="font-size:13px; margin-bottom:8px;">Selecciona un agente para ver sus herramientas</div>
      </div>
      <template v-else>
        <div class="ide-sec-hd">
          <h2>Herramientas — {{ agenteActual ? agenteActual.nombre : '' }}</h2>
          <p>Define qué acciones puede ejecutar Claude de forma autónoma</p>
        </div>
        <HerramientasContenido :agente-id="agenteSeleccionado" />
      </template>
    </div>
  </div>

  <!-- Embedded in AgenteDetalle: just the content -->
  <HerramientasContenido v-else :agente-id="agenteId" />
</template>

<script>
import HerramientasContenido from './HerramientasContenido.vue';

export default {
  name: 'Herramientas',
  components: { HerramientasContenido },
  props: { agenteId: { type: String, default: null } },
  data: () => ({
    agentes: [],
    loadingAgentes: false,
    agenteSeleccionado: null,
  }),
  computed: {
    agenteActual() { return this.agentes.find(a => a.id === this.agenteSeleccionado) || null; },
  },
  async mounted() {
    if (!this.agenteId) await this.cargarAgentes();
  },
  methods: {
    async cargarAgentes() {
      try {
        this.loadingAgentes = true;
        this.agentes = await this.$service.list('agentes') || [];
        if (this.agentes.length > 0) this.agenteSeleccionado = this.agentes[0].id;
      } finally {
        this.loadingAgentes = false;
      }
    },
    seleccionarAgente(id) { this.agenteSeleccionado = id; },
  },
};
</script>
