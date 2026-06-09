<template>
  <div>
    <!-- Stats -->
    <div class="hc-stats">
      <div v-for="s in stats" :key="s.label" class="ide-ia-card hc-stat">
        <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
        <div style="font-size:11px; color:#64748b; margin-top:2px;">{{ s.label }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display:flex; justify-content:center; padding:32px;">
      <div class="ag-spinner"></div>
    </div>

    <div v-else style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">

      <!-- Separador herramientas de sistema -->
      <div v-if="herramientas.some(h => h.esSistema)" style="display:flex; align-items:center; gap:10px; margin-top:4px;">
        <div style="font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:1px; white-space:nowrap;">Herramientas del sistema</div>
        <div style="flex:1; height:1px; background:#1e3a5f;"></div>
        <div style="font-size:10px; color:#334155; white-space:nowrap;">Solo lectura · siempre activas para Claude</div>
      </div>

      <!-- Cards de herramientas -->
      <div
        v-for="h in herramientas" :key="h.id"
        class="ide-ia-card hc-card"
        :class="{ 'hc-card--sistema': h.esSistema }"
        :style="{ borderColor: h.esSistema ? h.color+'33' : (h.activa ? h.color+'44' : '#1e3a5f22') }"
      >
        <!-- Separador antes de las personalizadas -->
        <template v-if="!h.esSistema && herramientas.indexOf(h) > 0 && herramientas[herramientas.indexOf(h)-1].esSistema">
        </template>

        <div style="display:flex; align-items:flex-start; gap:12px;">
          <!-- Icono -->
          <div class="hc-ico" :style="{ background: h.color+'22' }">
            <svg v-if="h.icono==='qualify'" width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="h.color" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            <svg v-else-if="h.icono==='user'" width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="h.color" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <svg v-else-if="h.icono==='edit'" width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="h.color" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="h.color" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          </div>

          <!-- Info -->
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;">
              <span style="font-size:13px; font-weight:700; color:#e2e8f0;">{{ h.label }}</span>
              <code style="font-size:10px; color:#64748b; background:#0f172a; padding:1px 6px; border-radius:4px;">{{ h.nombre }}</code>
              <!-- Badge sistema -->
              <span v-if="h.esSistema" class="hc-badge hc-badge--sistema">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Sistema
              </span>
              <!-- Badge estado (solo custom) -->
              <template v-else>
                <span v-if="h.activa" class="hc-badge" :style="h.autoConfirmar ? 'background:#22c55e22;color:#22c55e;' : 'background:#f59e0b22;color:#f59e0b;'">
                  {{ h.autoConfirmar ? '✓ Auto' : '⏳ Aprobación' }}
                </span>
                <span v-else class="hc-badge" style="background:#47556922;color:#64748b;">Inactiva</span>
              </template>
            </div>
            <div style="font-size:11px; color:#64748b; line-height:1.5;">{{ h.descripcion }}</div>

            <!-- Parámetros como chips -->
            <div v-if="h.parametros && h.parametros.length" style="display:flex; gap:5px; flex-wrap:wrap; margin-top:8px;">
              <div v-for="p in h.parametros" :key="p" class="hc-param">
                <span style="color:#94a3b8;">{{ extraerNombre(p) }}</span>
                <span style="color:#6366f1; font-size:9px; margin-left:3px;">{{ extraerTipo(p) }}</span>
                <span v-if="p.includes('?')" style="color:#475569; font-size:9px; margin-left:2px;">opt</span>
              </div>
            </div>

            <!-- Ejemplo -->
            <div v-if="h.ejemplo" style="margin-top:6px; font-size:10px; color:#475569; font-family:monospace; background:#0f172a; padding:5px 10px; border-radius:6px; border-left:2px solid #1e3a5f;">
              {{ h.ejemplo }}
            </div>

            <!-- Barra de confianza (solo custom activas) -->
            <div v-if="!h.esSistema && h.activa" style="display:flex; align-items:center; gap:8px; margin-top:10px;">
              <span style="font-size:10px; color:#475569; flex-shrink:0;">Confianza:</span>
              <div style="flex:1; height:4px; background:#1e3a5f; border-radius:2px; overflow:hidden;">
                <div :style="{ width: h.confianzaMinima+'%', height:'100%', background: h.color, borderRadius:'2px' }"></div>
              </div>
              <span style="font-size:11px; font-weight:700;" :style="{ color: h.color }">{{ h.confianzaMinima }}%</span>
            </div>
          </div>

          <!-- Acciones: solo para herramientas custom -->
          <div v-if="!h.esSistema" style="display:flex; flex-direction:column; gap:6px; align-items:center; flex-shrink:0;">
            <div
              class="ide-toggle"
              :class="{ 'ide-toggle--on': h.activa }"
              @click="toggle(h)"
              :title="h.activa ? 'Desactivar' : 'Activar'"
            ><div></div></div>
            <button class="hc-btn-ic" title="Editar" @click="abrirEditar(h)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="hc-btn-ic hc-btn-ic--del" title="Eliminar" @click="pedirEliminar(h)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>

          <!-- Icono candado para herramientas de sistema -->
          <div v-else style="flex-shrink:0; opacity:0.3; padding-top:2px;" title="Herramienta de sistema — no editable">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
        </div>
      </div>

      <!-- Separador herramientas personalizadas -->
      <div v-if="herramientas.some(h => !h.esSistema)" style="display:flex; align-items:center; gap:10px; margin-top:4px;">
        <div style="font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:1px; white-space:nowrap;">Herramientas personalizadas</div>
        <div style="flex:1; height:1px; background:#1e3a5f;"></div>
      </div>

      <!-- Botón agregar -->
      <div class="hc-add" @click="abrirCrear">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        <span>Agregar herramienta</span>
      </div>
    </div>

    <!-- ══ Modal crear / editar ══════════════════════════════════════ -->
    <transition name="modal-fade">
      <div v-if="dialogForm" class="ag-modal-backdrop" @mousedown.self="dialogForm = false">
        <div class="ag-modal" style="max-width:600px;">

          <!-- Header -->
          <div class="ag-modal-header">
            <span>{{ editId ? 'Editar herramienta' : 'Nueva herramienta' }}</span>
            <button class="ag-modal-close" @click="dialogForm = false">✕</button>
          </div>

          <!-- Body -->
          <div class="ag-modal-body" style="display:flex; flex-direction:column; gap:16px;">

            <!-- Nombre + Label -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div class="ide-field">
                <label>Nombre interno *</label>
                <input
                  v-model="form.nombre"
                  class="ide-input"
                  placeholder="calificar_lead"
                  :disabled="!!editId"
                  style="font-family:monospace;"
                />
                <span style="font-size:10px; color:#475569;">snake_case — Claude usa este nombre exacto</span>
              </div>
              <div class="ide-field">
                <label>Etiqueta *</label>
                <input v-model="form.label" class="ide-input" placeholder="Calificar Lead" />
              </div>
            </div>

            <!-- Descripción -->
            <div class="ide-field">
              <label>Descripción * <span style="font-weight:400;color:#475569;">(Claude la lee para decidir cuándo usar esta herramienta)</span></label>
              <textarea v-model="form.descripcion" class="ide-textarea" rows="2" placeholder="Registra el score del lead según el interés detectado en la conversación."></textarea>
            </div>

            <!-- Editor de parámetros -->
            <div class="ide-field" style="gap:0;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                <label style="margin:0;">Parámetros</label>
                <button class="hc-btn-text" @click="agregarParam">+ Agregar parámetro</button>
              </div>

              <div v-if="paramEditors.length === 0" style="font-size:11px; color:#475569; padding:10px 12px; background:#0f172a; border-radius:8px; border:1px dashed #1e3a5f;">
                Sin parámetros — Claude ejecutará la herramienta sin datos de entrada.
              </div>

              <div v-for="(p, idx) in paramEditors" :key="idx" class="hc-param-row">
                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                  <input
                    v-model="p.nombre"
                    class="ide-input"
                    placeholder="nombre"
                    style="flex:0 0 120px; font-family:monospace; font-size:12px;"
                  />
                  <select v-model="p.tipo" class="ide-input" style="flex:0 0 100px; font-size:12px;">
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="enum">enum</option>
                  </select>
                  <input
                    v-if="p.tipo === 'enum'"
                    v-model="p.enumVals"
                    class="ide-input"
                    placeholder="val1, val2, val3"
                    style="flex:1; min-width:100px; font-size:11px;"
                  />
                  <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#94a3b8;cursor:pointer;flex-shrink:0;">
                    <input type="checkbox" v-model="p.opcional" style="accent-color:#6366f1;" />
                    opcional
                  </label>
                  <button class="hc-btn-rm" @click="quitarParam(idx)" title="Quitar">×</button>
                </div>
                <code v-if="p.nombre" style="display:block;margin-top:5px;font-size:10px;color:#22c55e;background:#0f2a1a;padding:3px 8px;border-radius:4px;">{{ construirParamStr(p) }}</code>
              </div>
            </div>

            <!-- Color + Ejecución + Confianza -->
            <div style="display:grid; grid-template-columns:auto 1fr 1fr; gap:14px; align-items:start;">
              <!-- Color -->
              <div class="ide-field">
                <label>Color</label>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                  <div
                    v-for="c in COLORES" :key="c"
                    class="hc-color-dot"
                    :style="{ background: c, boxShadow: form.color === c ? '0 0 0 2px #1e293b, 0 0 0 4px '+c : 'none' }"
                    @click="form.color = c"
                  ></div>
                </div>
              </div>

              <!-- AutoConfirmar -->
              <div class="ide-field">
                <label>Ejecución</label>
                <div style="display:flex; flex-direction:column; gap:5px; margin-top:4px;">
                  <label class="hc-radio" :class="{ 'hc-radio--on': form.autoConfirmar }" @click="form.autoConfirmar = true">
                    <span class="hc-rdot" :style="form.autoConfirmar ? 'background:#22c55e' : ''"></span>
                    Auto-confirmar
                  </label>
                  <label class="hc-radio" :class="{ 'hc-radio--on': !form.autoConfirmar }" @click="form.autoConfirmar = false">
                    <span class="hc-rdot" :style="!form.autoConfirmar ? 'background:#f59e0b' : ''"></span>
                    Req. aprobación
                  </label>
                </div>
              </div>

              <!-- Confianza -->
              <div class="ide-field">
                <label>Confianza mínima <strong :style="{ color: form.color }">{{ form.confianzaMinima }}%</strong></label>
                <input type="range" v-model.number="form.confianzaMinima" min="0" max="100" step="5" style="width:100%; margin-top:8px;" />
              </div>
            </div>

            <!-- Ejemplo -->
            <div class="ide-field">
              <label>Ejemplo <span style="font-weight:400;color:#475569;">(opcional)</span></label>
              <input v-model="form.ejemplo" class="ide-input" style="font-family:monospace;font-size:11px;" :placeholder="ejemploPlaceholder" />
            </div>

          </div>

          <!-- Footer -->
          <div class="ag-modal-footer">
            <button class="ag-btn-cancel" @click="dialogForm = false">Cancelar</button>
            <button class="ag-btn-ok" :disabled="saving" @click="guardar">
              <span v-if="saving" class="ag-spinner ag-spinner--sm ag-spinner--white"></span>
              {{ editId ? 'Guardar cambios' : 'Crear herramienta' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ Modal confirmar eliminar ═══════════════════════════════════ -->
    <transition name="modal-fade">
      <div v-if="dialogDel" class="ag-modal-backdrop" @mousedown.self="dialogDel = false">
        <div class="ag-modal" style="max-width:380px;">
          <div style="font-size:15px; font-weight:700; color:#e2e8f0; margin-bottom:8px;">¿Eliminar herramienta?</div>
          <div style="font-size:13px; color:#94a3b8; margin-bottom:20px;">
            Se eliminará <strong style="color:#e2e8f0;">{{ aEliminar ? aEliminar.label : '' }}</strong>. Claude dejará de tener acceso a esta acción.
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="ag-btn-cancel" @click="dialogDel = false">Cancelar</button>
            <button class="ag-btn-ok" :disabled="deleting" style="background:#ef4444;" @click="eliminar">
              <span v-if="deleting" class="ag-spinner ag-spinner--sm ag-spinner--white"></span>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
const COLORES = ['#6366f1','#f59e0b','#ef4444','#22c55e','#06b6d4','#ec4899','#8b5cf6','#64748b','#c96442','#0ea5e9'];

function formVacio() {
  return { nombre: '', label: '', descripcion: '', color: '#6366f1', autoConfirmar: true, confianzaMinima: 70, ejemplo: '', activa: true };
}

export default {
  name: 'HerramientasContenido',
  props: {
    agenteId: { type: String, required: true },
  },
  data() {
    return {
      herramientas: [],
      loading: true,
      dialogForm: false,
      editId: null,
      form: formVacio(),
      paramEditors: [],
      saving: false,
      dialogDel: false,
      aEliminar: null,
      deleting: false,
      COLORES,
    };
  },
  computed: {
    stats() {
      const h = this.herramientas;
      return [
        { label: 'Activas',           value: h.filter(t => t.activa).length,                     color: '#22c55e' },
        { label: 'Auto-confirmación', value: h.filter(t => t.activa && t.autoConfirmar).length,  color: '#6366f1' },
        { label: 'Req. aprobación',   value: h.filter(t => t.activa && !t.autoConfirmar).length, color: '#f59e0b' },
        { label: 'Inactivas',         value: h.filter(t => !t.activa).length,                    color: '#475569' },
      ];
    },
    ejemploPlaceholder() {
      const args = this.paramEditors.map(p => p.nombre || 'param').join(', ');
      return (this.form.nombre || 'herramienta') + '({ ' + args + ' })';
    },
  },
  watch: {
    agenteId() { this.cargar(); },
  },
  async mounted() {
    await this.cargar();
  },
  methods: {
    // ── Carga ────────────────────────────────────────────────────────
    async cargar() {
      this.loading = true;
      try {
        this.herramientas = await this.$service.list('herramientas/agente/' + this.agenteId) || [];
      } catch (e) {
        this.$message.error('Error al cargar herramientas');
      } finally {
        this.loading = false;
      }
    },

    // ── Toggle activa ────────────────────────────────────────────────
    async toggle(h) {
      try {
        await this.$service.put('herramientas/' + h.id, {
          agenteId:        h.agenteId,
          nombre:          h.nombre,
          label:           h.label,
          descripcion:     h.descripcion,
          parametros:      h.parametros || [],
          activa:          !h.activa,
          autoConfirmar:   h.autoConfirmar,
          confianzaMinima: h.confianzaMinima,
          color:           h.color,
          icono:           h.icono,
          ejemplo:         h.ejemplo,
        });
        h.activa = !h.activa;
      } catch (e) {
        this.$message.error('Error al cambiar el estado');
      }
    },

    // ── Abrir crear ──────────────────────────────────────────────────
    abrirCrear() {
      this.editId = null;
      this.form = formVacio();
      this.paramEditors = [];
      this.dialogForm = true;
    },

    // ── Abrir editar ─────────────────────────────────────────────────
    abrirEditar(h) {
      this.editId = h.id;
      this.form = {
        nombre:          h.nombre,
        label:           h.label,
        descripcion:     h.descripcion,
        color:           h.color || '#6366f1',
        autoConfirmar:   h.autoConfirmar !== false,
        confianzaMinima: h.confianzaMinima != null ? h.confianzaMinima : 70,
        ejemplo:         h.ejemplo || '',
        activa:          h.activa,
      };
      this.paramEditors = (h.parametros || []).map(s => this.parsearParamStr(s));
      this.dialogForm = true;
    },

    // ── Guardar (crear o actualizar) ─────────────────────────────────
    async guardar() {
      if (!this.form.nombre.trim()) { this.$message.error('El nombre interno es obligatorio'); return; }
      if (!this.form.label.trim())  { this.$message.error('La etiqueta es obligatoria'); return; }
      if (!this.form.descripcion.trim()) { this.$message.error('La descripción es obligatoria'); return; }
      for (var i = 0; i < this.paramEditors.length; i++) {
        var p = this.paramEditors[i];
        if (!p.nombre.trim()) { this.$message.error('Cada parámetro debe tener nombre'); return; }
        if (p.tipo === 'enum' && !p.enumVals.trim()) { this.$message.error('El parámetro "' + p.nombre + '" necesita valores de enum'); return; }
      }

      var payload = {
        agenteId:        this.agenteId,
        nombre:          this.form.nombre.trim(),
        label:           this.form.label.trim(),
        descripcion:     this.form.descripcion.trim(),
        color:           this.form.color,
        autoConfirmar:   this.form.autoConfirmar,
        confianzaMinima: this.form.confianzaMinima,
        activa:          this.form.activa,
        ejemplo:         this.form.ejemplo.trim() || null,
        parametros:      this.paramEditors.map(p => this.construirParamStr(p)).filter(Boolean),
      };

      this.saving = true;
      try {
        if (this.editId) {
          await this.$service.put('herramientas/' + this.editId, payload);
          this.$message.success('Herramienta actualizada');
        } else {
          await this.$service.post('herramientas', payload);
          this.$message.success('Herramienta creada');
        }
        this.dialogForm = false;
        await this.cargar();
      } catch (e) {
        this.$message.error('Error al guardar la herramienta');
      } finally {
        this.saving = false;
      }
    },

    // ── Eliminar ─────────────────────────────────────────────────────
    pedirEliminar(h) {
      this.aEliminar = h;
      this.dialogDel = true;
    },
    async eliminar() {
      if (!this.aEliminar) return;
      this.deleting = true;
      try {
        await this.$service.delete('herramientas/' + this.aEliminar.id);
        this.$message.success('Herramienta eliminada');
        this.dialogDel = false;
        this.aEliminar = null;
        await this.cargar();
      } catch (e) {
        this.$message.error('Error al eliminar');
      } finally {
        this.deleting = false;
      }
    },

    // ── Parámetros ───────────────────────────────────────────────────
    agregarParam() {
      this.paramEditors.push({ nombre: '', tipo: 'string', opcional: false, enumVals: '' });
    },
    quitarParam(i) {
      this.paramEditors.splice(i, 1);
    },
    construirParamStr(p) {
      if (!p.nombre) return '';
      var mark = p.opcional ? '?' : '';
      if (p.tipo === 'enum') {
        var vals = p.enumVals.split(',').map(function(v) { return "'" + v.trim() + "'"; }).filter(function(v) { return v !== "''"; }).join('|');
        return p.nombre + mark + ': ' + (vals || "'valor'");
      }
      return p.nombre + mark + ': ' + p.tipo;
    },
    parsearParamStr(str) {
      var isOpt  = str.includes('?');
      var clean  = str.replace('?', '');
      var idx    = clean.indexOf(':');
      if (idx === -1) return { nombre: str.trim(), tipo: 'string', opcional: false, enumVals: '' };
      var nombre   = clean.slice(0, idx).trim();
      var typePart = clean.slice(idx + 1).trim();
      if (typePart.includes("'") && typePart.includes('|')) {
        var vals = (typePart.match(/'([^']+)'/g) || []).map(function(v) { return v.replace(/'/g, ''); }).join(', ');
        return { nombre: nombre, tipo: 'enum', opcional: isOpt, enumVals: vals };
      }
      if (typePart.startsWith('number'))  return { nombre: nombre, tipo: 'number',  opcional: isOpt, enumVals: '' };
      if (typePart.startsWith('boolean')) return { nombre: nombre, tipo: 'boolean', opcional: isOpt, enumVals: '' };
      return { nombre: nombre, tipo: 'string', opcional: isOpt, enumVals: '' };
    },

    // ── Display helpers ──────────────────────────────────────────────
    extraerNombre(str) {
      var clean = str.replace('?', '');
      var idx   = clean.indexOf(':');
      return idx === -1 ? clean.trim() : clean.slice(0, idx).trim();
    },
    extraerTipo(str) {
      var clean = str.replace('?', '');
      var idx   = clean.indexOf(':');
      if (idx === -1) return '';
      var t = clean.slice(idx + 1).trim();
      return t.includes("'") ? 'enum' : t.split(' ')[0];
    },
  },
};
</script>

<style scoped>
/* Stats */
.hc-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.hc-stat  { text-align: center; padding: 14px; }

/* Card */
.hc-card  { border: 1px solid #1e3a5f22; transition: border-color 0.2s; }

.hc-ico {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.hc-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
.hc-badge--sistema {
  background: #0ea5e922; color: #0ea5e9;
  display: inline-flex; align-items: center;
}
.hc-card--sistema { background: #0f172a88; }

.hc-param {
  display: inline-flex; align-items: center; font-size: 10px; font-family: monospace;
  background: #0f172a; color: #94a3b8; padding: 3px 8px;
  border-radius: 4px; border: 1px solid #1e3a5f44;
}

/* Action buttons */
.hc-btn-ic {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid #334155;
  background: #0f172a; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.hc-btn-ic:hover        { background: #1e3a5f; color: #94a3b8; }
.hc-btn-ic--del:hover   { background: #ef444422; color: #ef4444; border-color: #ef444433; }

/* Add button */
.hc-add {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px dashed #334155; cursor: pointer; padding: 14px;
  border-radius: 12px; color: #475569; font-size: 12px; transition: all 0.15s;
}
.hc-add:hover { border-color: #c96442; color: #e8956d; }

/* Param editor */
.hc-btn-text {
  font-size: 11px; color: #6366f1; background: #6366f122;
  border: 1px solid #6366f133; padding: 3px 10px; border-radius: 6px;
  cursor: pointer; transition: all 0.15s;
}
.hc-btn-text:hover { background: #6366f133; }

.hc-param-row {
  background: #0f172a; padding: 10px; border-radius: 8px;
  border: 1px solid #1e3a5f; margin-bottom: 6px;
}

.hc-btn-rm {
  width: 22px; height: 22px; border-radius: 5px; border: none;
  background: #ef444422; color: #ef4444; font-size: 16px; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.hc-btn-rm:hover { background: #ef444444; }

/* Color picker */
.hc-color-dot {
  width: 20px; height: 20px; border-radius: 50%; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.hc-color-dot:hover { transform: scale(1.15); }

/* Radio selector */
.hc-radio {
  display: flex; align-items: center; gap: 7px; cursor: pointer;
  padding: 6px 8px; border-radius: 7px; border: 1px solid #1e3a5f;
  font-size: 11px; color: #64748b; transition: all 0.15s; user-select: none;
}
.hc-radio--on { border-color: #334155; color: #e2e8f0; background: #0f172a; }
.hc-rdot { width: 8px; height: 8px; border-radius: 50%; background: #334155; flex-shrink: 0; transition: background 0.15s; }

/* Modal */
.ag-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  backdrop-filter: blur(2px); display: flex; align-items: center;
  justify-content: center; z-index: 9999;
}
.ag-modal {
  background: #1e293b; border: 1px solid #334155; border-radius: 12px;
  width: 100%; max-width: 560px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; max-height: 90vh;
}
.ag-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 14px; font-size: 15px; font-weight: 700; color: #f1f5f9;
  border-bottom: 1px solid #1e3a5f33; flex-shrink: 0;
}
.ag-modal-close {
  background: none; border: none; color: #475569; cursor: pointer;
  padding: 2px; border-radius: 4px; font-size: 16px; line-height: 1;
}
.ag-modal-close:hover { color: #94a3b8; }
.ag-modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
.ag-modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 24px 20px; border-top: 1px solid #1e3a5f33; flex-shrink: 0;
}
.ag-btn-cancel {
  background: transparent; border: 1px solid #334155; color: #64748b;
  border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: border-color 0.15s;
}
.ag-btn-cancel:hover { border-color: #475569; color: #94a3b8; }
.ag-btn-ok {
  background: #6366f1; color: #fff; border: none; border-radius: 8px;
  padding: 8px 20px; font-size: 12px; font-weight: 700; cursor: pointer;
  font-family: inherit; display: inline-flex; align-items: center; gap: 6px;
  transition: background 0.15s;
}
.ag-btn-ok:hover:not(:disabled) { background: #4f46e5; }
.ag-btn-ok:disabled { opacity: 0.6; cursor: not-allowed; }

/* Spinner */
.ag-spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid #6366f1; border-top-color: transparent;
  animation: hc-spin 0.75s linear infinite;
}
.ag-spinner--sm    { width: 14px; height: 14px; border-width: 2px; }
.ag-spinner--white { border-color: rgba(255,255,255,0.6); border-top-color: transparent; }

@keyframes hc-spin { to { transform: rotate(360deg); } }

/* Modal transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
</style>
