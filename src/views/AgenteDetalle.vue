<template>
  <div class="ide-mod">

    <!-- Sub-nav -->
    <div class="ide-subnav">
      <div class="ide-sn-hd">
        <div v-if="agente" class="ide-sn-ico" :style="{ background: 'linear-gradient(135deg,#c96442,#e8956d)' }">
          <span style="font-size:14px;">{{ agente.avatar }}</span>
        </div>
        <div v-else class="ide-sn-ico" style="background:linear-gradient(135deg,#c96442,#e8956d);">✦</div>
        <div v-if="agente">
          <div class="ide-sn-title">{{ agente.nombre }}</div>
          <div class="ide-sn-sub" style="color:#c96442;">Anthropic</div>
        </div>
        <div v-else>
          <div class="ide-sn-title">Agente IA</div>
          <div class="ide-sn-sub" style="color:#c96442;">Claude</div>
        </div>
      </div>

      <button
        v-for="s in secciones" :key="s.id"
        class="ide-sn-btn"
        :class="seccion === s.id ? 'ide-sn-btn--o' : ''"
        @click="seccion = s.id"
      >
        <span v-html="s.svg" style="flex-shrink:0; display:flex;"></span>
        {{ s.label }}
      </button>

      <div style="margin-top:auto; padding-top:12px; border-top:1px solid #1e3a5f33;">
        <button class="ide-sn-btn" @click="$router.push({ name: 'agentes' })" style="color:#475569;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver a Agentes
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="ide-body" style="display:flex; align-items:center; justify-content:center;">
      <v-progress-circular indeterminate color="primary" size="36" />
    </div>

    <!-- Normal sections -->
    <div v-else-if="agente && seccion !== 'probar'" class="ide-body">

      <!-- Configuración -->
      <template v-if="seccion === 'config'">
        <div class="ide-sec-hd">
          <h2>Configuración del Agente</h2>
          <p>Ajusta el nombre, modelo y comportamiento básico de {{ agente.nombre }}</p>
        </div>
        <div style="max-width:620px;">
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div class="ad-form-grid">
              <div class="ide-field">
                <label>Nombre del agente *</label>
                <input v-model="formConfig.nombre" class="ide-input" placeholder="Ej: Sofía, Max, Aria…" />
              </div>
              <div class="ide-field">
                <label>Tono de comunicación</label>
                <select v-model="formConfig.tono" class="ide-select">
                  <option v-for="t in tonos" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Modelo Claude</label>
                <select v-model="formConfig.modelo" class="ide-select">
                  <option value="claude-haiku-4-5">Claude Haiku 4.5 — Rápido</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — Equilibrado</option>
                  <option value="claude-opus-4-7">Claude Opus 4.7 — Máxima calidad</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Modo de operación</label>
                <select v-model="formConfig.modoOperacion" class="ide-select">
                  <option value="full">🤖 IA Total</option>
                  <option value="hybrid">⚡ Híbrido</option>
                  <option value="assist">🧑 Asistente</option>
                </select>
              </div>
              <div class="ide-field ad-form-full">
                <label>Descripción</label>
                <input v-model="formConfig.descripcion" class="ide-input" placeholder="Breve descripción del agente" />
              </div>
              <div class="ide-field ad-form-full" style="flex-direction:row; align-items:center; gap:12px;">
                <label style="margin:0;">Agente activo</label>
                <div class="ide-toggle" :class="{ 'ide-toggle--on': formConfig.activo }" @click="formConfig.activo = !formConfig.activo"><div></div></div>
                <span style="font-size:11px;" :style="{ color: formConfig.activo ? '#22c55e' : '#ef4444' }">{{ formConfig.activo ? 'Activo' : 'Inactivo' }}</span>
              </div>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end;">
            <v-btn depressed color="primary" :loading="saving" @click="guardarConfig" style="font-size:12px; border-radius:8px;">Guardar cambios</v-btn>
          </div>
        </div>
      </template>

      <!-- Rol del agente -->
      <template v-else-if="seccion === 'rol'">
        <div class="ide-sec-hd">
          <h2>Rol del Agente IA</h2>
          <p>Define cómo se comportará Claude con tus clientes</p>
        </div>
        <div style="max-width:680px;">
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div class="ad-form-grid">
              <div class="ide-field">
                <label>Tokens máximos por respuesta</label>
                <input type="range" min="64" max="2048" step="64" v-model.number="formConfig.maxTokens"
                  style="width:100%; accent-color:#c96442; margin-top:8px;" />
                <div style="font-size:11px; color:#64748b; margin-top:2px;">{{ formConfig.maxTokens }} tokens ≈ {{ Math.round(formConfig.maxTokens * 0.75) }} palabras</div>
              </div>
              <div class="ide-field">
                <label>Idioma principal</label>
                <select v-model="formConfig.idioma" class="ide-select">
                  <option value="español">Español</option>
                  <option value="inglés">Inglés</option>
                  <option value="auto">Automático (detectar)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="ide-field" style="margin-bottom:16px;">
            <label>
              System Prompt — Instrucciones para Claude
              <span style="margin-left:8px; font-size:10px; font-weight:500; color:#475569;">Define completamente el comportamiento del agente</span>
            </label>
            <textarea v-model="formConfig.systemPrompt" class="ide-textarea" rows="14"
              placeholder="Eres un agente de ventas llamado Sofía que trabaja para [Empresa]…"
              style="font-size:12px; line-height:1.7;"
            ></textarea>
            <div style="display:flex; justify-content:space-between; margin-top:4px;">
              <span style="font-size:10px; color:#475569;">{{ (formConfig.systemPrompt || '').length }} caracteres</span>
              <span style="font-size:10px; color:#64748b;">{{ agente.nombre }} · {{ formConfig.modelo }}</span>
            </div>
          </div>

          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:12px; font-weight:700; color:#e2e8f0; margin-bottom:10px;">Plantillas rápidas</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button v-for="t in plantillas" :key="t.label" class="ad-tag-btn" @click="formConfig.systemPrompt = t.prompt">{{ t.label }}</button>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <v-btn depressed color="primary" :loading="saving" @click="guardarConfig" style="font-size:12px; border-radius:8px;">Guardar rol</v-btn>
          </div>
        </div>
      </template>

      <!-- Herramientas -->
      <template v-else-if="seccion === 'herramientas'">
        <div class="ide-sec-hd">
          <h2>Herramientas (Tool Use)</h2>
          <p>Define qué acciones puede ejecutar Claude de forma autónoma</p>
        </div>
        <HerramientasLista :agente-id="agente.id" />
      </template>

      <!-- Calificación IA -->
      <template v-else-if="seccion === 'calificacion'">
        <div class="ide-sec-hd">
          <h2>Calificación IA</h2>
          <p>Configura cómo Claude califica y clasifica leads automáticamente</p>
        </div>
        <div style="max-width:620px;">
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:14px;">Umbrales de clasificación</div>
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div v-for="tier in tiers" :key="tier.id" class="ad-tier-row">
                <div class="ad-tier-dot" :style="{ background: tier.color }"></div>
                <span style="font-size:13px; color:#e2e8f0; flex:1;">{{ tier.label }}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                  <input type="number" v-model.number="tier.min" class="ide-input" style="width:64px; padding:4px 8px; text-align:center; font-size:12px;" :min="0" :max="100" />
                  <span style="color:#475569; font-size:12px;">–</span>
                  <input type="number" v-model.number="tier.max" class="ide-input" style="width:64px; padding:4px 8px; text-align:center; font-size:12px;" :min="0" :max="100" />
                  <span style="font-size:11px; color:#64748b;">pts</span>
                </div>
              </div>
            </div>
          </div>

          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:14px;">Criterios de calificación</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div v-for="c in criterios" :key="c.id" style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#0f172a; border-radius:8px; border:1px solid #1e3a5f33;">
                <div>
                  <div style="font-size:12px; font-weight:700; color:#e2e8f0;">{{ c.label }}</div>
                  <div style="font-size:11px; color:#64748b; margin-top:2px;">{{ c.desc }}</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:11px; font-weight:700;" :style="{ color: c.color }">+{{ c.puntos }} pts</span>
                  <div class="ide-toggle" :class="{ 'ide-toggle--on': c.activo }" @click="c.activo = !c.activo"><div></div></div>
                </div>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <v-btn depressed color="primary" style="font-size:12px; border-radius:8px;" @click="$message.success('Configuración de calificación guardada')">Guardar configuración</v-btn>
          </div>
        </div>
      </template>

      <!-- Escalado -->
      <template v-else-if="seccion === 'escalado'">
        <div class="ide-sec-hd">
          <h2>Escalado a humano</h2>
          <p>Define cuándo el agente debe transferir la conversación a un agente humano</p>
        </div>
        <div style="max-width:620px;">
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:14px;">Reglas de escalado automático</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div v-for="r in reglas" :key="r.id" style="display:flex; align-items:flex-start; justify-content:space-between; padding:12px 14px; background:#0f172a; border-radius:8px; border:1px solid #1e3a5f33;">
                <div style="flex:1; padding-right:16px;">
                  <div style="font-size:12px; font-weight:700; color:#e2e8f0;">{{ r.label }}</div>
                  <div style="font-size:11px; color:#64748b; margin-top:2px; line-height:1.5;">{{ r.desc }}</div>
                </div>
                <div class="ide-toggle" :class="{ 'ide-toggle--on': r.activo }" @click="r.activo = !r.activo"><div></div></div>
              </div>
            </div>
          </div>

          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:10px;">Mensaje de transferencia</div>
            <textarea v-model="mensajeEscalado" class="ide-textarea" rows="3"
              placeholder="Por favor espera un momento, te comunicaré con un agente especializado…"></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <v-btn depressed color="primary" style="font-size:12px; border-radius:8px;" @click="$message.success('Reglas de escalado guardadas')">Guardar reglas</v-btn>
          </div>
        </div>
      </template>

      <!-- Historial -->
      <template v-else-if="seccion === 'historial'">
        <div class="ide-sec-hd">
          <h2>Historial IA</h2>
          <p>Conversaciones manejadas por {{ agente.nombre }}</p>
        </div>
        <ConversacionesLista :agente-id="agente.id" />
      </template>

    </div>

    <!-- Probar Agente — bare layout para que el chat llene el espacio -->
    <div v-else-if="agente && seccion === 'probar'" class="ide-body--bare" style="padding:20px;">
      <ProbarAgente :agente="agente" />
    </div>

  </div>
</template>

<script>
import HerramientasLista from './Herramientas.vue';
import ConversacionesLista from './Conversaciones.vue';
import ProbarAgente from './ProbarAgente.vue';

const SVGS = {
  settings: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  user:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  tool:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
  qualify:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  phone:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.22 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`,
  send:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  clock:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};

export default {
  name: 'AgenteDetalle',
  components: { HerramientasLista, ConversacionesLista, ProbarAgente },
  data() {
    return {
      agente: null,
      loading: true,
      saving: false,
      seccion: 'config',
      formConfig: { nombre: '', descripcion: '', modelo: '', tono: '', modoOperacion: '', systemPrompt: '', maxTokens: 256, idioma: 'español', activo: true },
      mensajeEscalado: 'Por favor espera un momento, te comunicaré con un agente especializado que podrá ayudarte mejor.',
      tonos: ['profesional', 'amigable', 'formal', 'técnico', 'empático'],
      secciones: [
        { id: 'config',      label: 'Configuración',    svg: SVGS.settings },
        { id: 'rol',         label: 'Rol del Agente IA', svg: SVGS.user    },
        { id: 'herramientas',label: 'Herramientas',      svg: SVGS.tool    },
        { id: 'calificacion',label: 'Calificación IA',   svg: SVGS.qualify },
        { id: 'escalado',    label: 'Escalado a humano', svg: SVGS.phone   },
        { id: 'probar',      label: 'Probar Agente',     svg: SVGS.send    },
        { id: 'historial',   label: 'Historial IA',      svg: SVGS.clock   },
      ],
      tiers: [
        { id: 'hot',  label: '🔥 Hot Lead',  color: '#22c55e', min: 70, max: 100 },
        { id: 'warm', label: '🌡 Warm Lead', color: '#f59e0b', min: 40, max: 69  },
        { id: 'cold', label: '❄️ Cold Lead',  color: '#60a5fa', min: 0,  max: 39  },
      ],
      criterios: [
        { id: 'intencion',  label: 'Intención de compra',   desc: 'El cliente menciona comprar, contratar o adquirir', puntos: 30, color: '#22c55e', activo: true  },
        { id: 'presupuesto',label: 'Menciona presupuesto',   desc: 'El cliente indica cuánto puede invertir',           puntos: 20, color: '#f59e0b', activo: true  },
        { id: 'urgencia',   label: 'Urgencia o tiempo límite',desc: 'Necesita resolver pronto o tiene fecha límite',    puntos: 20, color: '#f97316', activo: true  },
        { id: 'autoridad',  label: 'Toma de decisiones',     desc: 'Es el responsable de decidir la compra',           puntos: 15, color: '#8b5cf6', activo: false },
        { id: 'fit',        label: 'Perfil de cliente ideal', desc: 'Coincide con el buyer persona definido',           puntos: 15, color: '#6366f1', activo: false },
      ],
      reglas: [
        { id: 'solicitud',  label: 'Solicitud directa',    desc: 'El cliente pide explícitamente hablar con una persona', activo: true  },
        { id: 'molestia',   label: 'Cliente molesto',      desc: 'Se detecta frustración, enojo o palabras negativas',   activo: true  },
        { id: 'tecnico',    label: 'Problema técnico',     desc: 'El agente no puede resolver el problema por sí solo',  activo: true  },
        { id: 'venta_alta', label: 'Venta de alto valor',  desc: 'El monto supera el límite de venta autónoma',          activo: false },
        { id: 'inactividad',label: 'Sin respuesta 5 min',  desc: 'El agente no recibe respuesta del usuario por 5 min',  activo: false },
      ],
      plantillas: [
        { label: 'Ventas B2B',     prompt: 'Eres un agente de ventas B2B experto. Tu objetivo es calificar leads, identificar necesidades y agendar demos con el equipo comercial. Responde siempre de forma profesional y concisa.' },
        { label: 'Soporte técnico',prompt: 'Eres un agente de soporte técnico. Ayuda a los usuarios a resolver problemas paso a paso. Si no puedes resolver el problema, escala al equipo de soporte nivel 2.' },
        { label: 'E-commerce',     prompt: 'Eres un asistente de tienda online. Ayuda a los clientes a encontrar productos, responde preguntas sobre envíos y políticas, y guía el proceso de compra.' },
        { label: 'Bienes raíces',  prompt: 'Eres un asesor inmobiliario virtual. Ayuda a los clientes a explorar propiedades, agenda visitas y responde preguntas sobre financiamiento y procesos legales.' },
      ],
    };
  },
  async mounted() {
    await this.cargar();
  },
  methods: {
    async cargar() {
      try {
        this.loading = true;
        this.agente = await this.$service.get('agentes', this.$route.params.id);
        if (this.agente) {
          this.formConfig = {
            nombre: this.agente.nombre || '',
            descripcion: this.agente.descripcion || '',
            modelo: this.agente.modelo || 'claude-haiku-4-5',
            tono: this.agente.tono || 'profesional',
            modoOperacion: this.agente.modoOperacion || 'hybrid',
            systemPrompt: this.agente.systemPrompt || '',
            maxTokens: this.agente.maxTokens || 256,
            idioma: this.agente.idioma || 'español',
            activo: this.agente.activo !== false,
          };
        }
      } finally {
        this.loading = false;
      }
    },
    async guardarConfig() {
      if (!this.formConfig.nombre) { this.$message.error('El nombre es obligatorio'); return; }
      this.saving = true;
      try {
        await this.$service.put(`agentes/${this.agente.id}`, this.formConfig);
        Object.assign(this.agente, this.formConfig);
        this.$message.success('Agente actualizado');
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.ad-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ad-form-full { grid-column: span 2; }

.ad-tier-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #0f172a; border-radius: 8px; border: 1px solid #1e3a5f33; }
.ad-tier-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.ad-tag-btn {
  padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 600;
  cursor: pointer; background: #c9644218; color: #e8956d;
  border: 1px solid #c9644233; font-family: inherit; transition: background 0.15s;
}
.ad-tag-btn:hover { background: #c9644233; }
</style>
