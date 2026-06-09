<template>
  <div>

    <!-- ═══ MODAL PRINCIPAL ═══ -->
    <transition name="modal-fade">
      <div v-if="visible" class="rm-backdrop" @click.self="close">
        <div class="rm-modal">

          <div class="rm-header">
            <div>
              <div class="rm-title">Representantes</div>
              <div class="rm-subtitle">{{ titulo }}</div>
            </div>
            <button class="rm-close" @click="close">✕</button>
          </div>

          <div class="rm-body">
            <div v-if="loading" style="display:flex;justify-content:center;padding:32px;">
              <div class="ct-spinner"></div>
            </div>

            <template v-else>
              <!-- Actuales -->
              <div class="rm-section-label">
                <span class="rm-dot rm-dot--green"></span>
                Representante(s) actual(es)
              </div>

              <div v-if="activos.length === 0" class="rm-empty">
                Sin representante activo —
                <span class="rm-link" @click="abrirForm()">Agregar uno</span>
              </div>

              <div v-for="rep in activos" :key="rep.id" class="rm-card">
                <div class="rm-card-row">
                  <div class="rm-avatar">{{ (rep.nombre || '?')[0].toUpperCase() }}</div>
                  <div class="rm-card-info">
                    <div class="rm-card-name">{{ rep.nombre }}</div>
                    <div v-if="rep.cargo" class="rm-card-meta">{{ rep.cargo }}</div>
                    <div class="rm-card-contacts">
                      <span v-if="rep.telefono" class="rm-contact-item">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.52 6.73a19.79 19.79 0 01-3.07-8.67A2 2 0 013.44 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 7.91a16 16 0 006.97 6.97l.79-.79a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                        {{ rep.telefono }}
                      </span>
                      <span v-if="rep.email" class="rm-contact-item">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        {{ rep.email }}
                      </span>
                    </div>
                    <div v-if="rep.fechaInicio" class="rm-card-date">Desde {{ rep.fechaInicio }}</div>
                  </div>
                  <div class="rm-card-actions">
                    <button class="rm-btn rm-btn--edit" title="Editar" @click="abrirForm(rep)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="rm-btn rm-btn--baja" title="Dar de baja" @click="abrirBaja(rep)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    </button>
                    <button class="rm-btn rm-btn--del" title="Eliminar" @click="eliminar(rep)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
                <div v-if="rep.notas" class="rm-card-notes">{{ rep.notas }}</div>
              </div>

              <!-- Historial -->
              <template v-if="historicos.length > 0">
                <div
                  class="rm-section-label rm-section-label--history"
                  style="margin-top:18px;cursor:pointer;"
                  @click="showHistory = !showHistory"
                >
                  <span class="rm-dot rm-dot--gray"></span>
                  Historial ({{ historicos.length }})
                  <span class="rm-toggle-label">{{ showHistory ? '▲ ocultar' : '▼ ver' }}</span>
                </div>
                <template v-if="showHistory">
                  <div v-for="rep in historicos" :key="rep.id" class="rm-card rm-card--historic">
                    <div class="rm-card-row">
                      <div class="rm-avatar rm-avatar--gray">{{ (rep.nombre || '?')[0].toUpperCase() }}</div>
                      <div class="rm-card-info">
                        <div class="rm-card-name" style="color:#94a3b8;">{{ rep.nombre }}</div>
                        <div v-if="rep.cargo" class="rm-card-meta">{{ rep.cargo }}</div>
                        <div class="rm-card-date">
                          {{ rep.fechaInicio || '—' }}
                          <span style="margin:0 4px;">→</span>
                          {{ rep.fechaFin || 'Sin fecha' }}
                        </div>
                        <div v-if="rep.motivoCambio" class="rm-card-notes" style="margin-top:4px;">
                          Motivo: {{ rep.motivoCambio }}
                        </div>
                      </div>
                      <div class="rm-card-actions">
                        <button class="rm-btn rm-btn--del" title="Eliminar del historial" @click="eliminar(rep)">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </template>
          </div>

          <div class="rm-footer">
            <button class="ct-new-btn" @click="abrirForm()">+ Agregar representante</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══ FORMULARIO ═══ -->
    <transition name="modal-fade">
      <div v-if="formDialog" class="rm-sub-backdrop" @click.self="formDialog = false">
        <div class="rm-sub-modal">
          <div class="rm-header">
            <span>{{ editingRep ? 'Editar representante' : 'Nuevo representante' }}</span>
            <button class="rm-close" @click="formDialog = false">✕</button>
          </div>
          <div class="rm-sub-body">
            <div class="ct-form-grid">
              <div class="ide-field ct-form-full">
                <label>Nombre completo *</label>
                <input v-model="form.nombre" class="ide-input" placeholder="Nombre del representante" />
              </div>
              <div class="ide-field">
                <label>Cargo</label>
                <input v-model="form.cargo" class="ide-input" placeholder="Ej: Gerente Comercial" />
              </div>
              <div class="ide-field">
                <label>Fecha de inicio</label>
                <input v-model="form.fechaInicio" class="ide-input" type="date" />
              </div>
              <div class="ide-field">
                <label>Teléfono</label>
                <input v-model="form.telefono" class="ide-input" placeholder="+591 7XXXXXXX" />
              </div>
              <div class="ide-field">
                <label>Email</label>
                <input v-model="form.email" class="ide-input" type="email" placeholder="correo@empresa.com" />
              </div>

              <!-- Solo al crear -->
              <template v-if="!editingRep">
                <div class="ide-field ct-form-full" style="flex-direction:row;align-items:center;gap:10px;padding-top:6px;">
                  <input id="chk-reemplazar" v-model="form.reemplazarActual" type="checkbox" style="width:15px;height:15px;cursor:pointer;flex-shrink:0;" />
                  <label for="chk-reemplazar" style="cursor:pointer;font-size:12px;font-weight:600;color:#94a3b8;margin:0;">
                    Reemplaza al representante actual (lo da de baja automáticamente)
                  </label>
                </div>
                <div v-if="form.reemplazarActual" class="ide-field ct-form-full">
                  <label>Motivo del cambio</label>
                  <textarea v-model="form.motivoCambio" class="ide-textarea" rows="2" placeholder="¿Por qué cambia el representante?"></textarea>
                </div>
              </template>

              <div class="ide-field ct-form-full">
                <label>Notas</label>
                <textarea v-model="form.notas" class="ide-textarea" rows="2" placeholder="Información adicional..."></textarea>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="formDialog = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardar">
              {{ saving ? 'Guardando...' : (editingRep ? 'Actualizar' : 'Agregar') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══ DAR DE BAJA ═══ -->
    <transition name="modal-fade">
      <div v-if="bajaDialog" class="rm-sub-backdrop" @click.self="bajaDialog = false">
        <div class="rm-sub-modal" style="max-width:420px;">
          <div class="rm-header">
            <span>Dar de baja representante</span>
            <button class="rm-close" @click="bajaDialog = false">✕</button>
          </div>
          <div class="rm-sub-body">
            <p style="font-size:13px;color:#94a3b8;margin-bottom:16px;">
              <strong style="color:#e2e8f0;">{{ repParaBaja && repParaBaja.nombre }}</strong> quedará en el historial para trazabilidad. No se eliminará.
            </p>
            <div class="ct-form-grid">
              <div class="ide-field">
                <label>Fecha de baja</label>
                <input v-model="bajaForm.fechaFin" class="ide-input" type="date" />
              </div>
              <div class="ide-field ct-form-full">
                <label>Motivo del cambio</label>
                <textarea v-model="bajaForm.motivoCambio" class="ide-textarea" rows="3" placeholder="Razón del cambio de representante..."></textarea>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="bajaDialog = false">Cancelar</button>
            <button class="ct-btn-ok" style="background:linear-gradient(135deg,#f59e0b,#d97706);" :disabled="saving" @click="confirmarBaja">
              {{ saving ? 'Guardando...' : 'Confirmar baja' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
const emptyForm = () => ({
  nombre: '',
  cargo: '',
  telefono: '',
  email: '',
  fechaInicio: new Date().toISOString().split('T')[0],
  reemplazarActual: false,
  motivoCambio: '',
  notas: '',
})

export default {
  name: 'RepresentantesModal',
  props: {
    visible:  { type: Boolean, default: false },
    titulo:   { type: String,  default: '' },
    endpoint: { type: String,  required: true },
  },
  data: () => ({
    loading:        false,
    representantes: [],
    showHistory:    false,
    // Formulario
    formDialog:  false,
    editingRep:  null,
    form:        emptyForm(),
    saving:      false,
    // Baja
    bajaDialog:  false,
    repParaBaja: null,
    bajaForm:    { fechaFin: '', motivoCambio: '' },
  }),
  computed: {
    activos()    { return this.representantes.filter(r => r.activo) },
    historicos() { return this.representantes.filter(r => !r.activo) },
  },
  watch: {
    visible(val) { if (val) this.cargar() },
  },
  methods: {
    close() { this.$emit('update:visible', false) },

    async cargar() {
      this.loading = true
      try {
        this.representantes = await this.$service.list(this.endpoint) || []
      } catch {
        this.representantes = []
      } finally {
        this.loading = false
      }
    },

    abrirForm(rep = null) {
      this.editingRep = rep
      this.form = rep ? { ...emptyForm(), ...rep } : emptyForm()
      this.formDialog = true
    },

    async guardar() {
      if (!this.form.nombre.trim()) {
        this.$message.error('El nombre es obligatorio')
        return
      }
      this.saving = true
      try {
        if (this.editingRep) {
          await this.$service.put(`${this.endpoint}/${this.editingRep.id}`, this.form)
          this.$message.success('Representante actualizado')
        } else {
          await this.$service.post(this.endpoint, this.form)
          this.$message.success('Representante agregado')
        }
        this.formDialog = false
        await this.cargar()
        this.$emit('changed')
      } finally {
        this.saving = false
      }
    },

    abrirBaja(rep) {
      this.repParaBaja = rep
      this.bajaForm = {
        fechaFin: new Date().toISOString().split('T')[0],
        motivoCambio: '',
      }
      this.bajaDialog = true
    },

    async confirmarBaja() {
      this.saving = true
      try {
        await this.$service.patch(`${this.endpoint}/${this.repParaBaja.id}/desactivar`, this.bajaForm)
        this.$message.success('Representante dado de baja')
        this.bajaDialog = false
        await this.cargar()
        this.$emit('changed')
      } finally {
        this.saving = false
      }
    },

    eliminar(rep) {
      this.$confirm(`¿Eliminar a "${rep.nombre}" del historial?`, async () => {
        await this.$service.delete(`${this.endpoint}/${rep.id}`)
        this.$message.success('Representante eliminado')
        await this.cargar()
        this.$emit('changed')
      })
    },
  },
}
</script>

<style scoped>
/* Backdrop principal */
.rm-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: #00000099;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.rm-modal {
  background: #0d1526; border: 1px solid #1e3a5f66;
  border-radius: 14px; width: 100%; max-width: 560px;
  max-height: 88vh; display: flex; flex-direction: column;
  overflow: hidden;
}

/* Sub-modals (formulario y baja) */
.rm-sub-backdrop {
  position: fixed; inset: 0; z-index: 300;
  background: #00000099;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.rm-sub-modal {
  background: #0d1526; border: 1px solid #1e3a5f66;
  border-radius: 14px; width: 100%; max-width: 520px;
  max-height: 90vh; display: flex; flex-direction: column;
  overflow: hidden;
}

/* Header compartido */
.rm-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #1e3a5f44;
  flex-shrink: 0;
}
.rm-title   { font-size: 15px; font-weight: 800; color: #f1f5f9; }
.rm-subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
.rm-close {
  background: none; border: none; color: #64748b;
  cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 6px;
  flex-shrink: 0;
}
.rm-close:hover { color: #ef4444; }

/* Body */
.rm-body    { flex: 1; overflow-y: auto; padding: 16px 20px; }
.rm-sub-body { flex: 1; overflow-y: auto; padding: 16px 20px; }

/* Footer */
.rm-footer {
  padding: 12px 20px; border-top: 1px solid #1e3a5f44;
  flex-shrink: 0;
}

/* Section labels */
.rm-section-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.6px;
  margin-bottom: 8px;
}
.rm-toggle-label { margin-left: auto; font-size: 10px; color: #475569; }

/* Dots */
.rm-dot       { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.rm-dot--green { background: #22c55e; }
.rm-dot--gray  { background: #475569; }

/* Empty state */
.rm-empty { font-size: 13px; color: #475569; padding: 10px 0; }
.rm-link  { color: #6366f1; cursor: pointer; text-decoration: underline; }

/* Cards */
.rm-card {
  background: #1e293b; border: 1px solid #1e3a5f44;
  border-radius: 10px; padding: 12px; margin-bottom: 8px;
}
.rm-card--historic {
  background: #161d2f; border-color: #1e3a5f22; opacity: 0.8;
}
.rm-card-row {
  display: flex; align-items: flex-start; gap: 10px;
}

/* Avatar */
.rm-avatar {
  width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
  background: #6366f122; color: #818cf8;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800;
}
.rm-avatar--gray { background: #33415522; color: #64748b; }

/* Card info */
.rm-card-info  { flex: 1; min-width: 0; }
.rm-card-name  { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.rm-card-meta  { font-size: 11px; color: #64748b; margin-top: 2px; }
.rm-card-date  { font-size: 11px; color: #475569; margin-top: 3px; }
.rm-card-notes { font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic; }
.rm-card-contacts {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;
}
.rm-contact-item {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: #94a3b8;
}

/* Action buttons */
.rm-card-actions { display: flex; gap: 4px; flex-shrink: 0; }
.rm-btn {
  background: #0f172a; border-radius: 6px; padding: 5px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; border: 1px solid #1e3a5f44;
}
.rm-btn--edit:hover  { border-color: #6366f1; color: #818cf8; }
.rm-btn--baja:hover  { border-color: #f59e0b; color: #fbbf24; }
.rm-btn--del:hover   { border-color: #ef4444; color: #f87171; }
.rm-btn svg { color: #64748b; }
.rm-btn:hover svg { color: inherit; }

/* Spinner */
.ct-spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid #1e3a5f44; border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
</style>
