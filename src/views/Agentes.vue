<template>
  <div class="ide-page">

    <!-- Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
      <div>
        <div class="section-title">Agentes IA</div>
        <p class="section-subtitle" style="margin-bottom:0;">Crea y administra tus agentes de inteligencia artificial</p>
      </div>
      <button class="ag-new-btn" @click="abrirDialog()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo Agente
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display:flex; justify-content:center; padding:48px;">
      <div class="ag-spinner"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="agentes.length === 0" class="ide-ia-card" style="text-align:center; padding:48px;">
      <div style="font-size:48px; margin-bottom:16px;">🤖</div>
      <div style="color:#e2e8f0; font-size:15px; font-weight:700; margin-bottom:8px;">No hay agentes creados</div>
      <div style="color:#64748b; font-size:13px; margin-bottom:24px;">Crea tu primer agente IA con Claude</div>
      <button class="ag-new-btn" @click="abrirDialog()">Crear primer agente</button>
    </div>

    <!-- Grid -->
    <div v-else class="ag-grid">
      <div v-for="ag in agentes" :key="ag.id" class="ide-ia-card ide-ia-card--hover ag-card">
        <div class="ag-card__hd">
          <div class="ag-avatar" :style="{ background: ag.color+'22', color: ag.color }">{{ ag.avatar }}</div>
          <div style="flex:1; min-width:0;">
            <div class="ag-name">{{ ag.nombre }}</div>
            <div class="ag-model">{{ ag.modelo }}</div>
          </div>
          <div style="display:flex; gap:4px;">
            <button class="ag-ico-btn" @click.stop="abrirDialog(ag)" title="Editar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="ag-ico-btn" @click.stop="$router.push({ name: 'agente-detalle', params: { id: ag.id } })" title="Ver detalle">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button class="ag-ico-btn ag-ico-btn--del" @click.stop="confirmarEliminar(ag)" title="Eliminar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </div>

        <p class="ag-desc">{{ ag.descripcion || 'Sin descripción' }}</p>

        <div class="ag-footer">
          <span class="ag-badge" :style="{ background: ag.activo ? '#22c55e22' : '#ef444422', color: ag.activo ? '#22c55e' : '#ef4444' }">
            {{ ag.activo ? '● Activo' : '● Inactivo' }}
          </span>
          <span class="ag-badge" style="background:#6366f122; color:#818cf8;">{{ ag.modoOperacion }}</span>
          <div style="margin-left:auto; font-size:11px; color:#64748b;">{{ ag.totalConversaciones }} conv.</div>
        </div>
      </div>
    </div>

    <!-- Dialog crear/editar -->
    <transition name="modal-fade">
      <div v-if="dialog" class="ag-modal-backdrop" @mousedown.self="dialog = false">
        <div class="ag-modal">
          <div class="ag-modal-header">
            <span>{{ editando ? 'Editar Agente' : 'Nuevo Agente IA' }}</span>
            <button class="ag-modal-close" @click="dialog = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="ag-modal-body">
            <div class="ag-form-grid">
              <div class="ide-field">
                <label>Nombre del agente *</label>
                <input v-model="form.nombre" class="ide-input" placeholder="Ej: Sofía, Max, Aria…" />
              </div>
              <div class="ide-field">
                <label>Tono de comunicación</label>
                <select v-model="form.tono" class="ide-select">
                  <option v-for="t in tonos" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Modelo Claude</label>
                <select v-model="form.modelo" class="ide-select">
                  <option value="claude-haiku-4-5">Claude Haiku 4.5 — Rápido</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — Equilibrado</option>
                  <option value="claude-opus-4-7">Claude Opus 4.7 — Máxima calidad</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Modo de operación</label>
                <select v-model="form.modoOperacion" class="ide-select">
                  <option value="full">🤖 IA Total</option>
                  <option value="hybrid">⚡ Híbrido</option>
                  <option value="assist">🧑 Asistente</option>
                </select>
              </div>
              <div class="ide-field ag-form-full">
                <label>Descripción</label>
                <input v-model="form.descripcion" class="ide-input" placeholder="Descripción breve del agente" />
              </div>
              <div class="ide-field ag-form-full">
                <label>System Prompt (instrucciones para Claude)</label>
                <textarea v-model="form.systemPrompt" class="ide-textarea" placeholder="Eres un agente de ventas llamado Sofía…" rows="5"></textarea>
              </div>
              <div class="ide-field ag-form-full">
                <label>Canales asignados <span style="color:#64748b; font-weight:400;">(selecciona los medios donde actúa por defecto)</span></label>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;">
                  <label v-for="c in canalesDisponibles" :key="c.id" style="display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; cursor:pointer; user-select:none; font-size:12px; font-weight:600; transition:all .15s;"
                    :style="form.canalesAsignados.includes(c.id) ? { background: c.color + '22', border: '1px solid ' + c.color + '55', color: c.color } : { background: '#1e293b', border: '1px solid #334155', color: '#64748b' }">
                    <input type="checkbox" :value="c.id" v-model="form.canalesAsignados" style="display:none;" />
                    <span v-html="c.icon" style="display:flex; width:13px; height:13px;"></span>
                    {{ c.label }}
                  </label>
                </div>
                <div style="font-size:10px; color:#475569; margin-top:5px;">Para asignar este agente a publicaciones o anuncios específicos, usa la sección <strong style="color:#818cf8;">Campañas</strong>.</div>
              </div>
            </div>
          </div>
          <div class="ag-modal-footer">
            <button class="ag-btn-cancel" @click="dialog = false">Cancelar</button>
            <button class="ag-btn-ok" :disabled="saving" @click="guardar">
              <span v-if="saving" class="ag-spinner ag-spinner--sm ag-spinner--white"></span>
              {{ editando ? 'Actualizar' : 'Crear Agente' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
export default {
  name: 'Agentes',
  data: () => ({
    agentes: [],
    loading: true,
    dialog: false,
    saving: false,
    editando: null,
    form: {
      nombre: '', descripcion: '', modelo: 'claude-haiku-4-5',
      tono: 'profesional', modoOperacion: 'hybrid', systemPrompt: '',
      avatar: '✦', color: '#6366f1', canalesAsignados: [],
    },
    tonos: ['profesional', 'amigable', 'formal', 'técnico', 'empático'],
    canalesDisponibles: [
      { id: 'whatsapp',  label: 'WhatsApp',  color: '#25D366', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' },
      { id: 'instagram', label: 'Instagram', color: '#E1306C', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>' },
      { id: 'messenger', label: 'Messenger', color: '#0084ff', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/></svg>' },
      { id: 'chatweb',   label: 'Chat Web', color: '#6366f1', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' },
    ],
  }),
  async mounted() {
    await this.cargar();
  },
  methods: {
    async cargar() {
      try {
        this.loading = true;
        this.agentes = await this.$service.list('agentes') || [];
      } finally {
        this.loading = false;
      }
    },
    abrirDialog(ag = null) {
      if (ag) {
        this.editando = ag;
        this.form = { ...ag, canalesAsignados: ag.canalesAsignados || [] };
      } else {
        this.editando = null;
        this.form = { nombre: '', descripcion: '', modelo: 'claude-haiku-4-5', tono: 'profesional', modoOperacion: 'hybrid', systemPrompt: '', avatar: '✦', color: '#6366f1', canalesAsignados: [] };
      }
      this.dialog = true;
    },
    async guardar() {
      if (!this.form.nombre) { this.$message.error('El nombre es obligatorio'); return; }
      this.saving = true;
      try {
        if (this.editando) {
          await this.$service.put(`agentes/${this.editando.id}`, this.form);
          this.$message.success('Agente actualizado');
        } else {
          await this.$service.post('agentes', this.form);
          this.$message.success('Agente creado correctamente');
        }
        this.dialog = false;
        await this.cargar();
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      } finally {
        this.saving = false;
      }
    },
    confirmarEliminar(ag) {
      this.$confirm(`¿Eliminar el agente "${ag.nombre}"?`, async () => {
        await this.$service.delete(`agentes/${ag.id}`);
        this.$message.success('Agente eliminado');
        await this.cargar();
      });
    },
  },
};
</script>

<style scoped>
.ag-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.ag-card { padding: 14px; }

.ag-card__hd { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.ag-avatar { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.ag-name   { font-size: 14px; font-weight: 700; color: #e2e8f0; }
.ag-model  { font-size: 11px; color: #64748b; margin-top: 1px; }

.ag-ico-btn {
  background: none; border: none; cursor: pointer; color: #475569;
  padding: 4px; border-radius: 5px; display: flex; transition: color 0.15s;
}
.ag-ico-btn:hover { color: #94a3b8; }
.ag-ico-btn--del:hover { color: #ef4444; }

.ag-desc { font-size: 12px; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0 0 12px; }
.ag-footer { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ag-badge  { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }

.ag-new-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: #6366f1; color: #fff; border: none; border-radius: 8px;
  padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
  transition: background 0.15s; font-family: inherit;
}
.ag-new-btn:hover { background: #4f46e5; }

.ag-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ag-form-full { grid-column: span 2; }

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
  padding: 2px; border-radius: 4px; display: flex;
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

/* Spinners */
.ag-spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid #6366f1; border-top-color: transparent;
  animation: ag-spin 0.75s linear infinite;
}
.ag-spinner--sm  { width: 14px; height: 14px; border-width: 2px; }
.ag-spinner--white { border-color: #fff; border-top-color: transparent; }
@keyframes ag-spin { to { transform: rotate(360deg); } }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
</style>
