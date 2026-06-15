<template>
  <div class="ide-page esp-page">

    <!-- Header -->
    <div class="esp-header">
      <div>
        <div class="section-title">Especialistas</div>
        <p class="section-subtitle" style="margin-bottom:0;">Gestiona el equipo médico, sus especialidades y horarios de atención</p>
      </div>
      <button class="esp-new-btn" @click="abrirDialog()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo Especialista
      </button>
    </div>

    <!-- Loading -->
    <div v-if="cargando" style="display:flex;justify-content:center;padding:64px;">
      <div class="esp-spinner"></div>
    </div>

    <!-- Vacío -->
    <div v-else-if="especialistas.length === 0" class="ide-ia-card" style="text-align:center;padding:64px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--b3)" stroke-width="1.25" style="margin-bottom:16px;"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      <div style="color:var(--t2);font-size:15px;font-weight:700;margin-bottom:6px;">Aún no hay especialistas</div>
      <div style="color:var(--t4);font-size:13px;margin-bottom:22px;">Agrega el equipo médico para que el agente pueda informar y agendar consultas</div>
      <button class="esp-new-btn" style="margin:0 auto;" @click="abrirDialog()">+ Nuevo Especialista</button>
    </div>

    <!-- Grid de cards -->
    <div v-else class="esp-grid">
      <div v-for="esp in especialistas" :key="esp.id" class="esp-card ide-ia-card" :class="{ 'esp-card--inactivo': !esp.activo }">

        <!-- Avatar -->
        <div class="esp-avatar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </div>

        <!-- Info -->
        <div class="esp-info">
          <div class="esp-nombre">{{ esp.nombre }}</div>
          <div class="esp-tags">
            <span v-for="tag in (esp.especialidades || [])" :key="tag" class="esp-tag">{{ tag }}</span>
            <span v-if="!esp.especialidades || esp.especialidades.length === 0" class="esp-tag esp-tag--empty">Sin especialidades</span>
          </div>
          <div v-if="esp.descripcion" class="esp-desc">{{ esp.descripcion }}</div>
        </div>

        <!-- Horarios resumen -->
        <div class="esp-horarios-resumen">
          <div v-if="esp.horarios && esp.horarios.length > 0">
            <div v-for="h in esp.horarios" :key="h.dia" class="esp-horario-row">
              <span class="esp-dia">{{ h.dia }}</span>
              <span class="esp-franjas">
                <span v-for="f in h.franjas" :key="f.inicio" class="esp-franja">{{ f.inicio }}–{{ f.fin }}</span>
              </span>
            </div>
          </div>
          <div v-else style="color:var(--t5);font-size:12px;">Sin horarios definidos</div>
        </div>

        <!-- Estado y acciones -->
        <div class="esp-actions">
          <span class="esp-estado" :class="esp.activo ? 'esp-estado--activo' : 'esp-estado--inactivo'">
            {{ esp.activo ? 'Activo' : 'Inactivo' }}
          </span>
          <button class="esp-action-btn" title="Editar" @click="abrirDialog(esp)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="esp-action-btn esp-action-btn--del" title="Eliminar" @click="confirmarEliminar(esp)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>

      </div>
    </div>

    <!-- ── Dialog crear/editar ── -->
    <div v-if="dialog" class="esp-overlay" @click.self="cerrarDialog">
      <div class="esp-modal">
        <div class="esp-modal__header">
          <span>{{ editando ? 'Editar Especialista' : 'Nuevo Especialista' }}</span>
          <button class="esp-close-btn" @click="cerrarDialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="esp-modal__body">

          <!-- Nombre -->
          <div class="esp-field">
            <label class="esp-label">Nombre completo *</label>
            <input v-model="form.nombre" class="esp-input" placeholder="Dr. Juan Pérez" maxlength="200" />
          </div>

          <!-- Especialidades -->
          <div class="esp-field">
            <label class="esp-label">Especialidades</label>
            <div class="esp-tags-input">
              <span v-for="(tag, i) in form.especialidades" :key="i" class="esp-tag-chip">
                {{ tag }}
                <button type="button" @click="quitarEspecialidad(i)">×</button>
              </span>
              <input
                v-model="nuevaEspecialidad"
                class="esp-tag-input-field"
                placeholder="Ej: Cardiología (Enter para agregar)"
                @keydown.enter.prevent="agregarEspecialidad"
                @keydown.188.prevent="agregarEspecialidad"
              />
            </div>
          </div>

          <!-- Descripción -->
          <div class="esp-field">
            <label class="esp-label">Descripción</label>
            <textarea v-model="form.descripcion" class="esp-textarea" rows="2" placeholder="Breve presentación del especialista (opcional)"></textarea>
          </div>

          <!-- Activo (solo edición) -->
          <div v-if="editando" class="esp-field esp-field--inline">
            <label class="esp-label">Estado</label>
            <label class="esp-toggle">
              <input type="checkbox" v-model="form.activo" />
              <span class="esp-toggle__slider"></span>
              <span class="esp-toggle__label">{{ form.activo ? 'Activo' : 'Inactivo' }}</span>
            </label>
          </div>

          <!-- Horarios -->
          <div class="esp-field">
            <label class="esp-label">Horarios de atención</label>
            <div class="esp-horarios-editor">
              <div v-for="dia in diasSemana" :key="dia" class="esp-dia-row">
                <div class="esp-dia-check">
                  <input type="checkbox" :id="'dia-'+dia" :checked="tieneDia(dia)" @change="toggleDia(dia)" />
                  <label :for="'dia-'+dia" class="esp-dia-label">{{ dia }}</label>
                </div>
                <div v-if="tieneDia(dia)" class="esp-franjas-editor">
                  <div v-for="(franja, fi) in getFranjas(dia)" :key="fi" class="esp-franja-row">
                    <input type="time" class="esp-time-input" :value="franja.inicio" @change="setFranjaInicio(dia, fi, $event.target.value)" />
                    <span class="esp-franja-sep">–</span>
                    <input type="time" class="esp-time-input" :value="franja.fin" @change="setFranjaFin(dia, fi, $event.target.value)" />
                    <button type="button" class="esp-franja-del" @click="quitarFranja(dia, fi)" title="Eliminar franja">×</button>
                  </div>
                  <button type="button" class="esp-add-franja" @click="agregarFranja(dia)">+ franja</button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="esp-modal__footer">
          <button class="esp-btn-cancel" @click="cerrarDialog">Cancelar</button>
          <button class="esp-btn-save" :disabled="guardando" @click="guardar">
            {{ guardando ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Crear especialista') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Confirm eliminar ── -->
    <div v-if="confirmDelete" class="esp-overlay" @click.self="confirmDelete = null">
      <div class="esp-modal esp-modal--sm">
        <div class="esp-modal__header">
          <span>Eliminar especialista</span>
          <button class="esp-close-btn" @click="confirmDelete = null">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="esp-modal__body" style="padding:24px 28px;">
          <p style="color:var(--scroll);font-size:14px;margin:0 0 6px;">¿Eliminar a <strong>{{ confirmDelete.nombre }}</strong>?</p>
          <p style="color:var(--t4);font-size:13px;margin:0;">Esta acción no se puede deshacer.</p>
        </div>
        <div class="esp-modal__footer">
          <button class="esp-btn-cancel" @click="confirmDelete = null">Cancelar</button>
          <button class="esp-btn-delete" :disabled="eliminando" @click="eliminar">
            {{ eliminando ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
const DIAS_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

function formVacio() {
  return {
    nombre: '',
    especialidades: [],
    descripcion: '',
    activo: true,
    horarios: [],
  }
}

export default {
  name: 'Especialistas',
  data() {
    return {
      especialistas: [],
      cargando: false,
      dialog: false,
      editando: null,
      guardando: false,
      form: formVacio(),
      nuevaEspecialidad: '',
      confirmDelete: null,
      eliminando: false,
      diasSemana: DIAS_SEMANA,
    }
  },
  mounted() {
    this.cargar()
  },
  methods: {
    async cargar() {
      this.cargando = true
      try {
        this.especialistas = await this.$service.get('especialistas')
      } catch {
        this.$message.error('Error al cargar especialistas')
      } finally {
        this.cargando = false
      }
    },

    abrirDialog(esp = null) {
      this.editando = esp
      if (esp) {
        this.form = {
          nombre: esp.nombre,
          especialidades: [...(esp.especialidades || [])],
          descripcion: esp.descripcion || '',
          activo: esp.activo,
          horarios: JSON.parse(JSON.stringify(esp.horarios || [])),
        }
      } else {
        this.form = formVacio()
      }
      this.nuevaEspecialidad = ''
      this.dialog = true
    },

    cerrarDialog() {
      this.dialog = false
      this.editando = null
    },

    agregarEspecialidad() {
      const val = this.nuevaEspecialidad.trim()
      if (val && !this.form.especialidades.includes(val)) {
        this.form.especialidades.push(val)
      }
      this.nuevaEspecialidad = ''
    },

    quitarEspecialidad(i) {
      this.form.especialidades.splice(i, 1)
    },

    // ── Horarios helpers ──
    tieneDia(dia) {
      return this.form.horarios.some(h => h.dia === dia)
    },
    getFranjas(dia) {
      const h = this.form.horarios.find(h => h.dia === dia)
      return h ? h.franjas : []
    },
    toggleDia(dia) {
      const idx = this.form.horarios.findIndex(h => h.dia === dia)
      if (idx >= 0) {
        this.form.horarios.splice(idx, 1)
      } else {
        this.form.horarios.push({ dia, franjas: [{ inicio: '08:00', fin: '13:00' }] })
      }
    },
    agregarFranja(dia) {
      const h = this.form.horarios.find(h => h.dia === dia)
      if (h) h.franjas.push({ inicio: '14:00', fin: '18:00' })
    },
    quitarFranja(dia, fi) {
      const h = this.form.horarios.find(h => h.dia === dia)
      if (h) h.franjas.splice(fi, 1)
      if (h && h.franjas.length === 0) {
        const idx = this.form.horarios.findIndex(x => x.dia === dia)
        this.form.horarios.splice(idx, 1)
      }
    },
    setFranjaInicio(dia, fi, val) {
      const h = this.form.horarios.find(h => h.dia === dia)
      if (h && h.franjas[fi]) h.franjas[fi].inicio = val
    },
    setFranjaFin(dia, fi, val) {
      const h = this.form.horarios.find(h => h.dia === dia)
      if (h && h.franjas[fi]) h.franjas[fi].fin = val
    },

    async guardar() {
      if (!this.form.nombre.trim()) {
        this.$message.error('El nombre es obligatorio')
        return
      }
      this.guardando = true
      try {
        const payload = {
          nombre: this.form.nombre.trim(),
          especialidades: this.form.especialidades,
          descripcion: this.form.descripcion.trim() || undefined,
          horarios: this.form.horarios,
          ...(this.editando ? { activo: this.form.activo } : {}),
        }
        if (this.editando) {
          await this.$service.put(`especialistas/${this.editando.id}`, payload)
          this.$message.success('Especialista actualizado')
        } else {
          await this.$service.post('especialistas', payload)
          this.$message.success('Especialista creado')
        }
        this.cerrarDialog()
        await this.cargar()
      } catch {
        this.$message.error('Error al guardar')
      } finally {
        this.guardando = false
      }
    },

    confirmarEliminar(esp) {
      this.confirmDelete = esp
    },

    async eliminar() {
      this.eliminando = true
      try {
        await this.$service.delete(`especialistas/${this.confirmDelete.id}`)
        this.$message.success('Especialista eliminado')
        this.confirmDelete = null
        await this.cargar()
      } catch {
        this.$message.error('Error al eliminar')
      } finally {
        this.eliminando = false
      }
    },
  },
}
</script>

<style scoped>
.esp-page { padding: 28px 32px; }

.esp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.esp-new-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  white-space: nowrap;
}
.esp-new-btn:hover { background: #5558e8; }

/* Grid */
.esp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.esp-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  transition: opacity .2s;
}
.esp-card--inactivo { opacity: .55; }

.esp-avatar {
  width: 48px;
  height: 48px;
  background: var(--bg-c);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.esp-nombre { font-size: 15px; font-weight: 700; color: var(--t1); margin-bottom: 6px; }

.esp-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.esp-tag {
  background: #312e81;
  color: #a5b4fc;
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
}
.esp-tag--empty { background: var(--bg-c); color: var(--t5); }

.esp-desc { font-size: 12px; color: var(--t4); margin-top: 6px; }

.esp-horarios-resumen { display: flex; flex-direction: column; gap: 4px; }
.esp-horario-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.esp-dia { color: var(--t3); min-width: 80px; text-transform: capitalize; }
.esp-franjas { display: flex; gap: 6px; flex-wrap: wrap; }
.esp-franja {
  background: var(--bg-e);
  color: var(--t4);
  border-radius: 4px;
  padding: 1px 7px;
  font-size: 11px;
}

.esp-actions { display: flex; align-items: center; gap: 8px; margin-top: auto; }
.esp-estado {
  font-size: 11px;
  font-weight: 700;
  border-radius: 20px;
  padding: 2px 10px;
  margin-right: auto;
}
.esp-estado--activo { background: #052e16; color: #22c55e; }
.esp-estado--inactivo { background: var(--bg-c); color: var(--t5); }

.esp-action-btn {
  background: var(--bg-c);
  border: none;
  border-radius: 6px;
  padding: 6px 8px;
  color: var(--t3);
  cursor: pointer;
  transition: background .15s, color .15s;
}
.esp-action-btn:hover { background: var(--b3); color: var(--t2); }
.esp-action-btn--del:hover { background: #450a0a; color: #f87171; }

/* Modal */
.esp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.esp-modal {
  background: var(--bg-e);
  border: 1px solid var(--bg-c);
  border-radius: 14px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.esp-modal--sm { max-width: 380px; }

.esp-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--bg-c);
  font-size: 15px;
  font-weight: 700;
  color: var(--t1);
}
.esp-close-btn {
  background: transparent;
  border: none;
  color: var(--t4);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  line-height: 1;
}
.esp-close-btn:hover { color: var(--t2); }

.esp-modal__body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.esp-modal__footer {
  padding: 14px 24px;
  border-top: 1px solid var(--bg-c);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.esp-field { display: flex; flex-direction: column; gap: 6px; }
.esp-field--inline { flex-direction: row; align-items: center; }
.esp-label { font-size: 12px; font-weight: 600; color: var(--t3); }

.esp-input, .esp-textarea {
  background: var(--bg-c);
  border: 1px solid var(--b3);
  border-radius: 8px;
  padding: 9px 12px;
  color: var(--t1);
  font-size: 13px;
  outline: none;
  transition: border-color .15s;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}
.esp-input:focus, .esp-textarea:focus { border-color: #6366f1; }

/* Tags input */
.esp-tags-input {
  background: var(--bg-c);
  border: 1px solid var(--b3);
  border-radius: 8px;
  padding: 7px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 42px;
}
.esp-tag-chip {
  background: #312e81;
  color: #a5b4fc;
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}
.esp-tag-chip button {
  background: transparent;
  border: none;
  color: #818cf8;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}
.esp-tag-input-field {
  background: transparent;
  border: none;
  outline: none;
  color: var(--t1);
  font-size: 13px;
  min-width: 160px;
  flex: 1;
}

/* Toggle */
.esp-toggle { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.esp-toggle input { display: none; }
.esp-toggle__slider {
  width: 36px;
  height: 20px;
  background: var(--b3);
  border-radius: 20px;
  position: relative;
  transition: background .2s;
}
.esp-toggle__slider::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 14px;
  height: 14px;
  background: var(--t4);
  border-radius: 50%;
  transition: left .2s, background .2s;
}
.esp-toggle input:checked + .esp-toggle__slider { background: #4f46e5; }
.esp-toggle input:checked + .esp-toggle__slider::after { left: 19px; background: #fff; }
.esp-toggle__label { font-size: 13px; color: var(--t3); }

/* Horarios editor */
.esp-horarios-editor { display: flex; flex-direction: column; gap: 8px; }
.esp-dia-row { display: flex; flex-direction: column; gap: 6px; }
.esp-dia-check { display: flex; align-items: center; gap: 8px; }
.esp-dia-check input[type=checkbox] { accent-color: #6366f1; width: 14px; height: 14px; cursor: pointer; }
.esp-dia-label { font-size: 13px; color: var(--scroll); cursor: pointer; text-transform: capitalize; }
.esp-franjas-editor { margin-left: 22px; display: flex; flex-direction: column; gap: 6px; }
.esp-franja-row { display: flex; align-items: center; gap: 8px; }
.esp-time-input {
  background: var(--bg-c);
  border: 1px solid var(--b3);
  border-radius: 6px;
  padding: 5px 8px;
  color: var(--t1);
  font-size: 12px;
  outline: none;
  width: 100px;
}
.esp-time-input:focus { border-color: #6366f1; }
.esp-franja-sep { color: var(--t5); }
.esp-franja-del {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
}
.esp-add-franja {
  background: transparent;
  border: 1px dashed var(--b3);
  border-radius: 6px;
  color: #6366f1;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  width: fit-content;
  transition: border-color .15s;
}
.esp-add-franja:hover { border-color: #6366f1; }

/* Buttons footer */
.esp-btn-cancel {
  background: transparent;
  border: 1px solid var(--b3);
  border-radius: 8px;
  padding: 8px 18px;
  color: var(--t3);
  font-size: 13px;
  cursor: pointer;
}
.esp-btn-cancel:hover { border-color: var(--t5); color: var(--t2); }

.esp-btn-save {
  background: #6366f1;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.esp-btn-save:hover:not(:disabled) { background: #5558e8; }
.esp-btn-save:disabled { opacity: .5; cursor: default; }

.esp-btn-delete {
  background: #7f1d1d;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  color: #fca5a5;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.esp-btn-delete:hover:not(:disabled) { background: #991b1b; }
.esp-btn-delete:disabled { opacity: .5; cursor: default; }

/* Spinner */
.esp-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--bg-c);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: esp-spin .7s linear infinite;
}
@keyframes esp-spin { to { transform: rotate(360deg); } }
</style>
