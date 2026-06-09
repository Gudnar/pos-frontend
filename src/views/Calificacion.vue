<template>
  <div class="ide-mod">

    <!-- Sub-nav -->
    <div class="ide-subnav">
      <div class="ide-sn-hd">
        <div class="ide-sn-ico" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <div>
          <div class="ide-sn-title">Calificación IA</div>
          <div class="ide-sn-sub" style="color:#6366f1;">Lead Scoring</div>
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

      <!-- ──────────── MÉTRICAS ──────────── -->
      <template v-if="seccion === 'metricas'">
        <div class="ide-sec-hd">
          <h2>Métricas de conversaciones</h2>
          <p>Resumen en tiempo real de tus leads calificados por IA</p>
        </div>

        <div v-if="loading" style="display:flex; justify-content:center; padding:40px;">
          <v-progress-circular indeterminate color="primary" size="28" />
        </div>
        <template v-else>

          <!-- KPIs -->
          <div class="cal-kpi-grid" style="margin-bottom:16px;">
            <div class="cal-kpi-card">
              <div class="cal-kpi-val" style="color:#818cf8;">{{ metricas.total || 0 }}</div>
              <div class="cal-kpi-lbl">Conversaciones</div>
            </div>
            <div class="cal-kpi-card">
              <div class="cal-kpi-val" :style="{ color: scoreColor(metricas.scorePromedio || 0) }">{{ metricas.scorePromedio || 0 }}</div>
              <div class="cal-kpi-lbl">Score promedio</div>
            </div>
            <div class="cal-kpi-card">
              <div class="cal-kpi-val" style="color:#22c55e;">{{ metricas.porcentajeResolucion || 0 }}%</div>
              <div class="cal-kpi-lbl">Resueltas</div>
            </div>
            <div class="cal-kpi-card">
              <div class="cal-kpi-val" style="color:#f59e0b;">{{ formatSegundos(metricas.tiempoRespuestaSegundos) }}</div>
              <div class="cal-kpi-lbl">T. respuesta IA</div>
            </div>
          </div>

          <!-- Tier distribution -->
          <div class="cal-dist-grid" style="margin-bottom:16px;">
            <div class="ide-ia-card cal-dist-card" style="border-color:#22c55e44;">
              <div class="cal-dist-emoji">🔥</div>
              <div class="cal-dist-val" style="color:#22c55e;">{{ (metricas.distribucion || {}).hot || 0 }}</div>
              <div class="cal-dist-label">Hot Leads</div>
              <div class="cal-dist-range">Score 70–100</div>
            </div>
            <div class="ide-ia-card cal-dist-card" style="border-color:#f59e0b44;">
              <div class="cal-dist-emoji">🌡</div>
              <div class="cal-dist-val" style="color:#f59e0b;">{{ (metricas.distribucion || {}).warm || 0 }}</div>
              <div class="cal-dist-label">Warm Leads</div>
              <div class="cal-dist-range">Score 40–69</div>
            </div>
            <div class="ide-ia-card cal-dist-card" style="border-color:#60a5fa44;">
              <div class="cal-dist-emoji">❄️</div>
              <div class="cal-dist-val" style="color:#60a5fa;">{{ (metricas.distribucion || {}).cold || 0 }}</div>
              <div class="cal-dist-label">Cold Leads</div>
              <div class="cal-dist-range">Score 1–39</div>
            </div>
            <div class="ide-ia-card cal-dist-card" style="border-color:#33415544;">
              <div class="cal-dist-emoji">⬜</div>
              <div class="cal-dist-val" style="color:#475569;">{{ (metricas.distribucion || {}).sinScore || 0 }}</div>
              <div class="cal-dist-label">Sin calificar</div>
              <div class="cal-dist-range">Score = 0</div>
            </div>
          </div>

          <!-- Intenciones + Sentimientos -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div class="ide-ia-card">
              <div style="font-size:12px; font-weight:700; color:#e2e8f0; margin-bottom:12px;">Intenciones detectadas</div>
              <div v-if="!Object.keys(metricas.intenciones || {}).length" style="font-size:12px; color:#475569; padding:8px 0;">Sin datos aún</div>
              <div v-else style="display:flex; flex-direction:column; gap:10px;">
                <div v-for="(count, key) in metricas.intenciones" :key="key" style="display:flex; align-items:center; gap:8px;">
                  <span class="cal-mini-badge" :style="intencionBadgeStyle(key)">{{ intencionLabel(key) }}</span>
                  <div style="flex:1; height:4px; border-radius:2px; background:#1e293b; overflow:hidden;">
                    <div :style="{ width: pct(count, metricas.total)+'%', height:'100%', background: intencionColor(key), borderRadius:'2px', transition:'width 0.4s' }"></div>
                  </div>
                  <span style="font-size:11px; color:#94a3b8; min-width:22px; text-align:right; font-weight:700;">{{ count }}</span>
                </div>
              </div>
            </div>
            <div class="ide-ia-card">
              <div style="font-size:12px; font-weight:700; color:#e2e8f0; margin-bottom:12px;">Sentimientos detectados</div>
              <div v-if="!Object.keys(metricas.sentimientos || {}).length" style="font-size:12px; color:#475569; padding:8px 0;">Sin datos aún</div>
              <div v-else style="display:flex; flex-direction:column; gap:10px;">
                <div v-for="(count, key) in metricas.sentimientos" :key="key" style="display:flex; align-items:center; gap:8px;">
                  <span class="cal-mini-badge" :style="sentimientoBadgeStyle(key)">{{ sentimientoLabel(key) }}</span>
                  <div style="flex:1; height:4px; border-radius:2px; background:#1e293b; overflow:hidden;">
                    <div :style="{ width: pct(count, metricas.total)+'%', height:'100%', background: sentimientoColor(key), borderRadius:'2px', transition:'width 0.4s' }"></div>
                  </div>
                  <span style="font-size:11px; color:#94a3b8; min-width:22px; text-align:right; font-weight:700;">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>

        </template>
      </template>

      <!-- ──────────── REGLAS ──────────── -->
      <template v-else-if="seccion === 'reglas'">
        <div class="ide-sec-hd">
          <h2>Reglas de calificación</h2>
          <p>Señales que Claude busca en cada conversación para asignar puntos al lead</p>
        </div>

        <div style="max-width:680px;">
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:14px;">Criterios activos</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div
                v-for="c in criterios" :key="c.id"
                style="display:flex; align-items:flex-start; gap:14px; padding:12px 14px; background:#0f172a; border-radius:8px; border:1px solid;"
                :style="{ borderColor: c.activo ? c.color+'33' : '#1e3a5f22' }"
              >
                <div class="cal-ico" :style="{ background: c.color+'22', color: c.color }">{{ c.emoji }}</div>
                <div style="flex:1;">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px;">
                    <span style="font-size:13px; font-weight:700; color:#e2e8f0;">{{ c.label }}</span>
                    <span style="font-size:11px; font-weight:700; padding:1px 7px; border-radius:999px;" :style="{ background: c.color+'22', color: c.color }">+{{ c.puntos }} pts</span>
                  </div>
                  <div style="font-size:11px; color:#64748b; line-height:1.5;">{{ c.desc }}</div>
                </div>
                <div class="ide-toggle" :class="{ 'ide-toggle--on': c.activo }" @click="c.activo = !c.activo"><div></div></div>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="cal-btn-ghost" @click="agregarCriterio">+ Agregar criterio</button>
            <v-btn depressed color="primary" style="font-size:12px; border-radius:8px;" :loading="guardando" @click="guardar">Guardar reglas</v-btn>
          </div>
        </div>
      </template>

      <!-- ──────────── UMBRALES ──────────── -->
      <template v-else-if="seccion === 'umbrales'">
        <div class="ide-sec-hd">
          <h2>Umbrales de clasificación</h2>
          <p>Define los rangos de puntuación para cada categoría de lead</p>
        </div>

        <div style="max-width:520px;">
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div v-for="tier in tiers" :key="tier.id" class="cal-tier-row" :style="{ borderColor: tier.color+'33' }">
                <div style="width:10px; height:10px; border-radius:50%; flex-shrink:0;" :style="{ background: tier.color }"></div>
                <div style="flex:1;">
                  <div style="font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:2px;">{{ tier.emoji }} {{ tier.label }}</div>
                  <div style="font-size:11px; color:#64748b;">{{ tier.desc }}</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                  <input type="number" v-model.number="tier.min" class="ide-input" style="width:60px; padding:4px 8px; font-size:12px; text-align:center;" :min="0" :max="100" />
                  <span style="color:#475569; font-size:12px;">–</span>
                  <input type="number" v-model.number="tier.max" class="ide-input" style="width:60px; padding:4px 8px; font-size:12px; text-align:center;" :min="0" :max="100" />
                  <span style="font-size:11px; color:#64748b;">pts</span>
                </div>
              </div>
            </div>
          </div>

          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:12px; font-weight:700; color:#e2e8f0; margin-bottom:12px;">Vista previa del scoring</div>
            <div style="display:flex; height:24px; border-radius:8px; overflow:hidden;">
              <div v-for="tier in tiers" :key="tier.id" :style="{ flex: tier.max - tier.min, background: tier.color }" :title="tier.label"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:10px; color:#64748b;">
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <v-btn depressed color="primary" style="font-size:12px; border-radius:8px;" :loading="guardando" @click="guardar">Guardar umbrales</v-btn>
          </div>
        </div>
      </template>

      <!-- ──────────── RESULTADOS ──────────── -->
      <template v-else-if="seccion === 'resultados'">
        <div class="ide-sec-hd">
          <h2>Resultados de calificación</h2>
          <p>Distribución actual de leads calificados por Claude</p>
        </div>

        <div v-if="loading" style="display:flex; justify-content:center; padding:32px;">
          <v-progress-circular indeterminate color="primary" size="28" />
        </div>
        <template v-else>
          <div class="cal-lead-grid">
            <div v-for="tier in leadTiers" :key="tier.label" class="ide-ia-card" :style="{ border: '1px solid '+tier.color+'44', textAlign:'center', padding:'24px' }">
              <div style="font-size:28px; margin-bottom:10px;">{{ tier.emoji }}</div>
              <div style="font-size:32px; font-weight:900;" :style="{ color: tier.color }">{{ tier.value }}</div>
              <div style="font-size:13px; font-weight:700; color:#e2e8f0; margin:4px 0;">{{ tier.label }}</div>
              <div style="font-size:11px; color:#64748b;">Score {{ tier.range }}</div>
            </div>
          </div>

          <div class="ide-ia-card" style="margin-top:16px;">
            <div style="font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:14px;">Últimas calificaciones</div>
            <div v-if="ultimasConv.length === 0" style="text-align:center; color:#64748b; font-size:13px; padding:16px;">
              No hay conversaciones calificadas aún
            </div>
            <div v-else style="display:flex; flex-direction:column; gap:0;">
              <div v-for="conv in ultimasConv" :key="conv.id" style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #1e3a5f22;">
                <div class="cal-contact-av">{{ conv.contacto.slice(0,2).toUpperCase() }}</div>
                <div style="flex:1; min-width:0;">
                  <div style="font-size:13px; font-weight:600; color:#e2e8f0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ conv.contacto }}</div>
                  <div style="font-size:11px; color:#64748b; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span>{{ conv.canal }}</span>
                    <span>·</span>
                    <span>{{ formatDate(conv.fechaModificacion || conv.fechaCreacion) }}</span>
                    <span v-if="conv.intencion" class="cal-mini-badge" :style="intencionBadgeStyle(conv.intencion)">{{ intencionLabel(conv.intencion) }}</span>
                    <span v-if="conv.sentimiento" class="cal-mini-badge" :style="sentimientoBadgeStyle(conv.sentimiento)">{{ sentimientoLabel(conv.sentimiento) }}</span>
                  </div>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                  <div style="font-size:18px; font-weight:900;" :style="{ color: scoreColor(conv.score) }">{{ conv.score }}</div>
                  <div class="cal-tier-badge" :style="tierBadgeStyle(conv.score)">{{ tierLabel(conv.score) }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- ──────────── PROMPT ──────────── -->
      <template v-else-if="seccion === 'prompt'">
        <div class="ide-sec-hd">
          <h2>Prompt de calificación</h2>
          <p>Instrucciones para que Claude califique leads — se aplica a cada conversación automáticamente</p>
        </div>

        <div style="max-width:680px;">
          <div class="ide-ia-card" style="margin-bottom:16px; background:#1a0f0a; border-color:#c9644244;">
            <div style="font-size:12px; font-weight:700; color:#e8956d; margin-bottom:8px;">💡 ¿Qué es el prompt de calificación?</div>
            <p style="font-size:12px; color:#94a3b8; line-height:1.6; margin:0;">
              Claude analiza cada conversación y devuelve un JSON con score, intención, urgencia, sentimiento y datos del contacto.
              Puedes personalizar las instrucciones aquí. Si lo dejas vacío, se usa el prompt predeterminado para consultorios médicos.
            </p>
          </div>

          <div class="ide-ia-card" style="margin-bottom:16px; border-color:#6366f133;">
            <div style="font-size:12px; font-weight:700; color:#818cf8; margin-bottom:10px;">Formato de respuesta esperado (no modificar)</div>
            <pre style="font-size:11px; color:#64748b; background:#0f172a; padding:12px; border-radius:8px; overflow-x:auto; margin:0;">{{ jsonExample }}</pre>
          </div>

          <div class="ide-field" style="margin-bottom:16px;">
            <label>Instrucciones personalizadas para Claude</label>
            <textarea v-model="promptCalif" class="ide-textarea" rows="14" style="font-size:12px; line-height:1.7;"
              placeholder="Deja vacío para usar el prompt predeterminado de consultorio médico.

Si personalizas, el JSON de respuesta debe incluir los mismos campos:
score (0-100), intencion, urgencia, sentimiento, servicioDetectado, etapaFunnel, datosCapturados, motivo"></textarea>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <button v-if="promptCalif" class="cal-btn-ghost" style="color:#ef4444; border-color:#ef444433;" @click="promptCalif = ''">Restaurar predeterminado</button>
            <div v-else></div>
            <v-btn depressed color="primary" style="font-size:12px; border-radius:8px;" :loading="guardando" @click="guardar">Guardar prompt</v-btn>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script>
const SVGS = {
  chart:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><rect x="2" y="3" width="20" height="18" rx="2" ry="2" opacity="0"/></svg>`,
  star:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  sliders:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  list:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  edit:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
};

const JSON_EXAMPLE = `{
  "score": 85,
  "intencion": "RESERVAR" | "INFORMAR" | "CANCELAR" | "QUEJAR" | "OTRO",
  "urgencia": "INMEDIATA" | "ESTA_SEMANA" | "SIN_URGENCIA",
  "sentimiento": "POSITIVO" | "NEUTRAL" | "NEGATIVO" | "FRUSTRADO",
  "servicioDetectado": "Limpieza dental",
  "etapaFunnel": "DESCUBRIMIENTO" | "CONSIDERACION" | "DECISION" | "RECURRENTE",
  "datosCapturados": { "nombre": "...", "telefono": "...", "email": "..." },
  "motivo": "El paciente confirmó la cita para el viernes"
}`;

export default {
  name: 'Calificacion',
  data: () => ({
    seccion: 'metricas',
    loading: true,
    guardando: false,
    metricas: {},
    conversaciones: [],
    promptCalif: '',
    jsonExample: JSON_EXAMPLE,
    secciones: [
      { id: 'metricas',   label: 'Métricas',   svg: SVGS.chart   },
      { id: 'reglas',     label: 'Reglas',     svg: SVGS.star    },
      { id: 'umbrales',   label: 'Umbrales',   svg: SVGS.sliders },
      { id: 'resultados', label: 'Resultados', svg: SVGS.list    },
      { id: 'prompt',     label: 'Prompt IA',  svg: SVGS.edit    },
    ],
    criterios: [
      { id: 'intencion',   emoji: '🛒', label: 'Intención de compra',    desc: 'El cliente menciona comprar, contratar o adquirir el servicio',      puntos: 30, color: '#22c55e', activo: true  },
      { id: 'presupuesto', emoji: '💰', label: 'Presupuesto disponible', desc: 'El cliente indica cuánto puede invertir o su rango de presupuesto',  puntos: 20, color: '#f59e0b', activo: true  },
      { id: 'urgencia',    emoji: '⏰', label: 'Urgencia / tiempo límite',desc: 'Necesita resolver pronto, tiene fecha límite o urgencia real',       puntos: 20, color: '#f97316', activo: true  },
      { id: 'autoridad',   emoji: '👔', label: 'Toma de decisiones',     desc: 'Es el responsable final de la decisión de compra',                   puntos: 15, color: '#8b5cf6', activo: false },
      { id: 'fit',         emoji: '🎯', label: 'Perfil de cliente ideal', desc: 'Coincide con el buyer persona o segmento objetivo definido',         puntos: 15, color: '#6366f1', activo: false },
    ],
    tiers: [
      { id: 'hot',  emoji: '🔥', label: 'Hot Lead',  desc: 'Listo para comprar, alta prioridad',  color: '#22c55e', min: 70, max: 100 },
      { id: 'warm', emoji: '🌡', label: 'Warm Lead', desc: 'Interesado, requiere seguimiento',     color: '#f59e0b', min: 40, max: 69  },
      { id: 'cold', emoji: '❄️', label: 'Cold Lead', desc: 'Poco interés o fuera del perfil',     color: '#60a5fa', min: 0,  max: 39  },
    ],
  }),
  computed: {
    ultimasConv() {
      return [...this.conversaciones]
        .sort((a, b) => new Date(b.fechaModificacion || b.fechaCreacion) - new Date(a.fechaModificacion || a.fechaCreacion))
        .slice(0, 12);
    },
    leadTiers() {
      const d = this.metricas.distribucion || {};
      return [
        { label: 'Hot Leads',  range: '70–100', value: d.hot  || 0, color: '#22c55e', emoji: '🔥' },
        { label: 'Warm Leads', range: '40–69',  value: d.warm || 0, color: '#f59e0b', emoji: '🌡' },
        { label: 'Cold Leads', range: '1–39',   value: d.cold || 0, color: '#60a5fa', emoji: '❄️' },
      ];
    },
  },
  async mounted() {
    await this.cargar();
  },
  methods: {
    async cargar() {
      this.loading = true;
      try {
        const [config, met, convs] = await Promise.all([
          this.$service.get('conversaciones/calificacion-config').catch(() => null),
          this.$service.get('conversaciones/metricas').catch(() => null),
          this.$service.list('conversaciones').catch(() => []),
        ]);

        if (config) {
          if (config.prompt) this.promptCalif = config.prompt;
          if (Array.isArray(config.criterios)) {
            config.criterios.forEach(saved => {
              const local = this.criterios.find(c => c.id === saved.id);
              if (local) { local.puntos = saved.puntos; local.activo = saved.activo; }
            });
          }
          if (Array.isArray(config.tiers)) {
            config.tiers.forEach(saved => {
              const local = this.tiers.find(t => t.id === saved.id);
              if (local) { local.min = saved.min; local.max = saved.max; }
            });
          }
        }

        if (met) this.metricas = met;
        this.conversaciones = convs || [];
      } finally {
        this.loading = false;
      }
    },

    async guardar() {
      this.guardando = true;
      try {
        await this.$service.put('conversaciones/calificacion-config', {
          prompt: this.promptCalif,
          criterios: this.criterios.map(c => ({ id: c.id, puntos: c.puntos, activo: c.activo })),
          tiers: this.tiers.map(t => ({ id: t.id, min: t.min, max: t.max })),
        });
        this.$message.success('Configuración guardada');
      } catch (_e) {
        // error already shown by service interceptor
      } finally {
        this.guardando = false;
      }
    },

    // ── Score/tier helpers ──
    scoreColor(s) { return s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : s > 0 ? '#60a5fa' : '#475569'; },
    tierLabel(s)  { return s >= 70 ? '🔥 Hot' : s >= 40 ? '🌡 Warm' : s > 0 ? '❄️ Cold' : '—'; },
    tierBadgeStyle(s) {
      if (s >= 70) return 'background:#22c55e22; color:#22c55e;';
      if (s >= 40) return 'background:#f59e0b22; color:#f59e0b;';
      if (s >  0) return 'background:#60a5fa22; color:#60a5fa;';
      return 'background:#33415522; color:#475569;';
    },

    // ── Intención helpers ──
    intencionLabel(v) {
      return { RESERVAR:'Reservar', INFORMAR:'Informar', CANCELAR:'Cancelar', QUEJAR:'Queja', OTRO:'Otro' }[v] || v;
    },
    intencionColor(v) {
      return { RESERVAR:'#22c55e', INFORMAR:'#818cf8', CANCELAR:'#ef4444', QUEJAR:'#f97316', OTRO:'#64748b' }[v] || '#64748b';
    },
    intencionBadgeStyle(v) {
      const c = this.intencionColor(v);
      return `background:${c}18; border:1px solid ${c}33; color:${c};`;
    },

    // ── Sentimiento helpers ──
    sentimientoLabel(v) {
      return { POSITIVO:'Positivo', NEUTRAL:'Neutral', NEGATIVO:'Negativo', FRUSTRADO:'Frustrado' }[v] || v;
    },
    sentimientoColor(v) {
      return { POSITIVO:'#22c55e', NEUTRAL:'#64748b', NEGATIVO:'#ef4444', FRUSTRADO:'#f97316' }[v] || '#64748b';
    },
    sentimientoBadgeStyle(v) {
      const c = this.sentimientoColor(v);
      return `background:${c}18; border:1px solid ${c}33; color:${c};`;
    },

    // ── Misc ──
    pct(count, total) { return total > 0 ? Math.round(count / total * 100) : 0; },
    formatSegundos(s) {
      if (!s) return '—';
      if (s < 60) return `${s}s`;
      return `${Math.round(s / 60)}m`;
    },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('es-BO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : ''; },
    agregarCriterio() { this.$message.success('Editor de criterios personalizados disponible próximamente'); },
  },
};
</script>

<style scoped>
.cal-ico { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
.cal-tier-row { display:flex; align-items:center; gap:12px; padding:12px 14px; background:#0f172a; border-radius:8px; border:1px solid; }
.cal-lead-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.cal-dist-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.cal-dist-card { text-align:center; padding:20px; }
.cal-dist-emoji { font-size:26px; margin-bottom:8px; }
.cal-dist-val { font-size:30px; font-weight:900; }
.cal-dist-label { font-size:12px; font-weight:700; color:#e2e8f0; margin:4px 0; }
.cal-dist-range { font-size:11px; color:#64748b; }
.cal-contact-av { width:34px; height:34px; border-radius:9px; background:#6366f122; color:#818cf8; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; }
.cal-tier-badge { font-size:10px; font-weight:600; padding:2px 8px; border-radius:999px; }
.cal-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.cal-kpi-card { background:#1e293b; border:1px solid #1e3a5f33; border-radius:10px; padding:18px; text-align:center; }
.cal-kpi-val { font-size:28px; font-weight:900; margin-bottom:4px; }
.cal-kpi-lbl { font-size:11px; color:#64748b; font-weight:600; }
.cal-mini-badge { font-size:10px; font-weight:700; padding:1px 7px; border-radius:999px; white-space:nowrap; flex-shrink:0; }
.cal-btn-ghost {
  padding:8px 14px; border-radius:8px; border:1px solid #334155;
  background:none; color:#64748b; font-size:12px; font-weight:600;
  cursor:pointer; font-family:inherit; transition:all 0.15s;
}
.cal-btn-ghost:hover { border-color:#6366f133; color:#94a3b8; }
</style>
