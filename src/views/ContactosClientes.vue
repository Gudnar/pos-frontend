<template>
  <div style="height:100%;overflow-y:auto;padding:24px;">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
      <div>
        <div class="section-title">Clientes</div>
        <p class="section-subtitle">Gestiona tu cartera de clientes y sus datos de contacto</p>
      </div>
      <button class="ct-new-btn" @click="abrirDialog()">+ Nuevo Cliente</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display:flex;justify-content:center;padding:60px 0;">
      <div class="ct-spinner"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="items.length === 0" class="ide-ia-card" style="text-align:center;padding:48px 24px;">
      <div style="font-size:48px;margin-bottom:12px;">👥</div>
      <div style="font-size:16px;font-weight:700;color:var(--t2);margin-bottom:8px;">Sin clientes aún</div>
      <p style="color:var(--t4);margin-bottom:20px;font-size:13px;">Agrega tus clientes para mantener un registro organizado de tu cartera</p>
      <button class="ct-new-btn" @click="abrirDialog()">+ Nuevo Cliente</button>
    </div>

    <!-- Grid -->
    <div v-else class="ct-grid">
      <div v-for="item in items" :key="item.id" class="ide-ia-card ide-ia-card--hover">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="ct-avatar" :style="`background:${avatarColor(item.empresa || item.nombre)}22;color:${avatarColor(item.empresa || item.nombre)}`">
              {{ ((item.empresa || item.nombre) || '?')[0].toUpperCase() }}
            </div>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--t2);">{{ item.empresa || item.nombre }}</div>
              <div style="font-size:11px;color:var(--t4);">{{ item.grupo || 'Sin grupo' }}</div>
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="ct-action-btn ct-action-btn--rep" title="Representantes" @click="verRepresentantes(item)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </button>
            <button class="ct-action-btn" title="Editar" @click="abrirDialog(item)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="ct-action-btn ct-action-btn--danger" title="Eliminar" @click="confirmarEliminar(item)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>

        <div v-if="item.grupo" class="ct-info-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <span>{{ item.grupo }}</span>
        </div>

        <!-- Representante actual -->
        <template v-if="item.representanteActual">
          <div class="ct-rep-divider"></div>
          <div class="ct-info-row ct-info-row--rep">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span style="font-weight:600;color:var(--scroll);">{{ item.representanteActual.nombre }}</span>
            <span v-if="item.representanteActual.cargo" style="color:var(--t5);">— {{ item.representanteActual.cargo }}</span>
          </div>
          <div v-if="item.representanteActual.telefono" class="ct-info-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.52 6.73a19.79 19.79 0 01-3.07-8.67A2 2 0 013.44 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 7.91a16 16 0 006.97 6.97l.79-.79a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            <span>{{ item.representanteActual.telefono }}</span>
          </div>
          <div v-if="item.representanteActual.email" class="ct-info-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>{{ item.representanteActual.email }}</span>
          </div>
        </template>
        <div v-else class="ct-info-row" style="color:var(--b3);font-style:italic;font-size:11px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Sin representante asignado
        </div>

        <div style="margin-top:10px;">
          <span class="ct-badge" :class="item.activo === false ? 'ct-badge--off' : 'ct-badge--on'">
            {{ item.activo === false ? 'Inactivo' : 'Activo' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modal representantes -->
    <representantes-modal
      :visible.sync="repModal"
      :titulo="selectedItem ? (selectedItem.empresa || selectedItem.nombre) : ''"
      :endpoint="selectedItem ? `contactos-clientes/${selectedItem.id}/representantes` : 'contactos-clientes'"
      @changed="cargar"
    />

    <!-- Modal -->
    <transition name="modal-fade">
      <div v-if="dialog" class="ct-modal-backdrop" @click.self="dialog = false">
        <div class="ct-modal">
          <div class="ct-modal-header">
            <span>{{ editando ? 'Editar Cliente' : 'Nuevo Cliente' }}</span>
            <button class="ct-modal-close" @click="dialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field">
                <label>Nombre comercial / Razón social *</label>
                <input v-model="form.nombre" class="ide-input" placeholder="Nombre del cliente o razón social" />
              </div>
              <div class="ide-field">
                <label>Grupo / Etiqueta</label>
                <select v-model="form.grupo" class="ide-select">
                  <option value="">Sin grupo</option>
                  <option v-for="g in grupos" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Empresa</label>
                <input v-model="form.empresa" class="ide-input" placeholder="Nombre de la empresa" />
              </div>
              <div class="ide-field ct-form-full">
                <label>Dirección</label>
                <input v-model="form.direccion" class="ide-input" placeholder="Dirección física" />
              </div>
              <div class="ide-field">
                <label>Estado</label>
                <select v-model="form.estado" class="ide-select">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Sitio web</label>
                <input v-model="form.web" class="ide-input" placeholder="https://..." />
              </div>
              <div class="ide-field ct-form-full">
                <label>Notas</label>
                <textarea v-model="form.notas" class="ide-textarea" rows="3" placeholder="Información adicional..."></textarea>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="dialog = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardar">
              {{ saving ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear Cliente') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import RepresentantesModal from '@/components/RepresentantesModal.vue'

const PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
const emptyForm = () => ({
  nombre: '', empresa: '', grupo: '',
  direccion: '', web: '', notas: '', estado: 'activo',
});

export default {
  name: 'ContactosClientes',
  components: { RepresentantesModal },
  data: () => ({
    items: [],
    loading: true,
    dialog: false,
    saving: false,
    editando: null,
    form: emptyForm(),
    grupos: ['VIP', 'Potencial', 'Frecuente', 'Minorista', 'Mayorista', 'Corporativo'],
    repModal: false,
    selectedItem: null,
  }),
  async mounted() {
    await this.cargar();
  },
  methods: {
    avatarColor(nombre) {
      if (!nombre) return PALETTE[0];
      let h = 0;
      for (let i = 0; i < nombre.length; i++) h = nombre.charCodeAt(i) + ((h << 5) - h);
      return PALETTE[Math.abs(h) % PALETTE.length];
    },
    async cargar() {
      try {
        this.loading = true;
        this.items = await this.$service.list('contactos-clientes') || [];
      } catch {
        this.items = [];
      } finally {
        this.loading = false;
      }
    },
    abrirDialog(item = null) {
      this.editando = item;
      this.form = item ? { ...emptyForm(), ...item } : emptyForm();
      this.dialog = true;
    },
    async guardar() {
      if (!this.form.nombre.trim()) {
        this.$message.error('El nombre es obligatorio');
        return;
      }
      this.saving = true;
      try {
        if (this.editando) {
          await this.$service.put(`contactos-clientes/${this.editando.id}`, this.form);
          this.$message.success('Cliente actualizado');
        } else {
          await this.$service.post('contactos-clientes', this.form);
          this.$message.success('Cliente creado correctamente');
        }
        this.dialog = false;
        await this.cargar();
      } finally {
        this.saving = false;
      }
    },
    verRepresentantes(item) {
      this.selectedItem = item
      this.repModal = true
    },
    confirmarEliminar(item) {
      this.$confirm(`¿Eliminar al cliente "${item.nombre}"?`, async () => {
        await this.$service.delete(`contactos-clientes/${item.id}`);
        this.$message.success('Cliente eliminado');
        await this.cargar();
      });
    },
  },
};
</script>

<style scoped>
.section-title { font-size: 22px; font-weight: 800; color: var(--t1); margin-bottom: 4px; }
.section-subtitle { font-size: 13px; color: var(--t4); margin: 0; }

.ct-new-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border: none; border-radius: 9px;
  padding: 9px 18px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s;
}
.ct-new-btn:hover { opacity: 0.88; }

.ct-spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid var(--b1);
  border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.ct-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.ct-avatar {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800; flex-shrink: 0;
}

.ct-info-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--t3); margin-top: 5px;
}
.ct-info-row svg { flex-shrink: 0; color: var(--t5); }
.ct-info-row--rep svg { color: #6366f1; }
.ct-rep-divider {
  border-top: 1px dashed var(--b4);
  margin: 8px 0 4px;
}

.ct-badge {
  display: inline-block; padding: 2px 9px;
  border-radius: 999px; font-size: 10px; font-weight: 700;
}
.ct-badge--on  { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e44; }
.ct-badge--off { background: #ef444422; color: #f87171; border: 1px solid #ef444444; }

.ct-action-btn {
  background: var(--bg-c); border: 1px solid var(--b3);
  border-radius: 7px; color: var(--t4);
  padding: 5px; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  transition: all 0.15s;
}
.ct-action-btn:hover { border-color: #6366f1; color: #818cf8; }
.ct-action-btn--danger:hover { border-color: #ef4444; color: #f87171; }
.ct-action-btn--rep:hover { border-color: #14b8a6; color: #2dd4bf; }

/* Modal */
.ct-modal-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: #00000088;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.ct-modal {
  background: var(--bg-s); border: 1px solid var(--b4);
  border-radius: 14px; width: 100%; max-width: 580px;
  max-height: 90vh; display: flex; flex-direction: column;
  overflow: hidden;
}
.ct-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--b1);
  font-size: 15px; font-weight: 800; color: var(--t1);
}
.ct-modal-close {
  background: none; border: none; color: var(--t4);
  cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 6px;
}
.ct-modal-close:hover { color: #ef4444; }
.ct-modal-body { flex: 1; overflow-y: auto; padding: 20px; }
.ct-modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 20px; border-top: 1px solid var(--b1);
}

.ct-form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
}
.ct-form-full { grid-column: span 2; }

.ct-btn-cancel {
  background: var(--bg-c); border: 1px solid var(--b3);
  color: var(--t3); border-radius: 8px;
  padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.ct-btn-ok {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none; color: #fff; border-radius: 8px;
  padding: 8px 20px; font-size: 13px; font-weight: 700; cursor: pointer;
  opacity: 1; transition: opacity 0.15s;
}
.ct-btn-ok:disabled { opacity: 0.5; cursor: not-allowed; }

/* Transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
</style>
