<template>
  <div class="cp-root">

    <!-- Lista de sucursales -->
    <div class="cp-panel">
      <div class="cp-col-header" style="border-radius:14px 14px 0 0;">
        <div>
          <div class="cp-col-title">Sucursales</div>
          <div class="cp-col-count">{{ sucursales.length }} registros</div>
        </div>
        <button class="cp-add-btn" @click="abrirForm()">+ Nueva</button>
      </div>
      <input v-model="q" class="cp-search" placeholder="Buscar sucursal..." />
      <div class="cp-list">
        <div v-if="loading" class="cp-loading"><div class="ct-spinner"></div></div>
        <div v-else-if="!filtradas.length" class="cp-empty">Sin sucursales</div>
        <div
          v-else
          v-for="s in filtradas" :key="s.id"
          class="cp-uni-row"
          @click="abrirForm(s)"
        >
          <div class="cp-dot" :style="`background:${s.esPrincipal ? '#6366f1' : 'var(--b3)'};flex-shrink:0;`"></div>
          <div style="flex:1;min-width:0;">
            <div class="cp-uni-name">{{ s.nombre }}</div>
            <div style="font-size:10px;color:var(--t5);margin-top:1px;">
              {{ s.ciudad || '' }}{{ s.ciudad && s.codigo ? ' · ' : '' }}{{ s.codigo ? 'Cód: '+s.codigo : '' }}
            </div>
          </div>
          <span v-if="s.esPrincipal" style="font-size:9px;padding:1px 6px;border-radius:4px;background:#6366f122;color:#818cf8;border:1px solid #6366f133;flex-shrink:0;">Principal</span>
          <span :class="['ct-badge', s.activo===false ? 'ct-badge--off' : 'ct-badge--on']" style="font-size:9px;flex-shrink:0;">
            {{ s.activo===false ? 'Inactivo' : 'Activo' }}
          </span>
          <button class="cp-icon-btn cp-icon-btn--danger" style="flex-shrink:0;" title="Eliminar" @click.stop="eliminar(s)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <transition name="modal-fade">
      <div v-if="dialog" class="ct-modal-backdrop">
        <div class="ct-modal" style="max-width:480px;">
          <div class="ct-modal-header">
            <span>{{ editando ? 'Editar Sucursal' : 'Nueva Sucursal' }}</span>
            <button class="ct-modal-close" @click="dialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field ct-form-full">
                <label>Nombre *</label>
                <input v-model="form.nombre" class="ide-input" placeholder="Ej: Sucursal Centro, Tienda Norte..." />
              </div>
              <div class="ide-field">
                <label>Código</label>
                <input v-model="form.codigo" class="ide-input" placeholder="Ej: SUC-01" />
              </div>
              <div class="ide-field">
                <label>Ciudad</label>
                <input v-model="form.ciudad" class="ide-input" placeholder="Ej: La Paz, Santa Cruz..." />
              </div>
              <div class="ide-field ct-form-full">
                <label>Dirección</label>
                <input v-model="form.direccion" class="ide-input" placeholder="Calle, Nro, Zona..." />
              </div>
              <div class="ide-field">
                <label>Teléfono</label>
                <input v-model="form.telefono" class="ide-input" placeholder="+591 2 XXXXXXX" />
              </div>
              <div class="ide-field">
                <label>Email</label>
                <input v-model="form.email" class="ide-input" type="email" placeholder="sucursal@empresa.com" />
              </div>
              <div class="ide-field">
                <label>Estado</label>
                <select v-model="form.estado" class="ide-select">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div class="ide-field" style="flex-direction:row;align-items:center;gap:10px;padding-top:4px;">
                <input id="chk-principal" v-model="form.esPrincipal" type="checkbox" style="width:15px;height:15px;cursor:pointer;" />
                <label for="chk-principal" style="cursor:pointer;font-size:12px;font-weight:600;color:var(--t3);margin:0;">Sucursal principal</label>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="dialog = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardar">
              {{ saving ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
const emptyForm = () => ({ nombre: '', codigo: '', ciudad: '', direccion: '', telefono: '', email: '', esPrincipal: false, estado: 'activo' })

export default {
  name: 'Sucursales',
  data: () => ({
    sucursales: [], loading: false, q: '',
    editando: null, form: emptyForm(), saving: false, dialog: false,
  }),
  computed: {
    filtradas() {
      if (!this.q.trim()) return this.sucursales
      const q = this.q.toLowerCase()
      return this.sucursales.filter(s => s.nombre.toLowerCase().includes(q) || (s.ciudad && s.ciudad.toLowerCase().includes(q)))
    },
  },
  created() { this.cargar() },
  methods: {
    async cargar() {
      this.loading = true
      try {
        this.sucursales = await this.$service.list('sucursales') || []
        this.$store.commit('setSucursales', this.sucursales)
      } finally { this.loading = false }
    },
    abrirForm(s = null) {
      this.editando = s
      this.form = s
        ? { nombre: s.nombre, codigo: s.codigo || '', ciudad: s.ciudad || '', direccion: s.direccion || '', telefono: s.telefono || '', email: s.email || '', esPrincipal: s.esPrincipal, estado: s.activo === false ? 'inactivo' : 'activo' }
        : emptyForm()
      this.dialog = true
    },
    async guardar() {
      if (!this.form.nombre.trim()) return this.$message.error('El nombre es obligatorio')
      this.saving = true
      try {
        if (this.editando) {
          await this.$service.put(`sucursales/${this.editando.id}`, this.form)
          this.$message.success('Sucursal actualizada')
        } else {
          await this.$service.post('sucursales', this.form)
          this.$message.success('Sucursal creada')
        }
        this.dialog = false
        this.editando = null
        this.form = emptyForm()
        await this.cargar()
      } finally { this.saving = false }
    },
    eliminar(s) {
      this.$confirm(`¿Eliminar la sucursal "${s.nombre}"?`, async () => {
        await this.$service.delete(`sucursales/${s.id}`)
        this.$message.success('Sucursal eliminada')
        await this.cargar()
      })
    },
  },
}
</script>

<style scoped>
.cp-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; }
.cp-panel { flex:1; background:var(--bg-s); border:1px solid var(--b1); border-radius:14px; display:flex; flex-direction:column; overflow:hidden; max-width:560px; }
.cp-col-header { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 8px; border-bottom:1px solid var(--b2); flex-shrink:0; }
.cp-col-title { font-size:13px; font-weight:800; color:var(--t1); }
.cp-col-count { font-size:10px; color:var(--t5); margin-top:1px; }
.cp-add-btn { background:#6366f122; border:1px solid #6366f133; color:#818cf8; border-radius:7px; padding:3px 9px; font-size:16px; cursor:pointer; font-weight:700; }
.cp-add-btn:hover { background:#6366f133; }
.cp-search { margin:8px 10px 4px; background:var(--bg-e); border:1px solid var(--b1); border-radius:7px; color:var(--t3); font-size:11px; padding:6px 10px; outline:none; flex-shrink:0; }
.cp-list { flex:1; overflow-y:auto; padding:4px 8px 12px; }
.cp-loading { display:flex; justify-content:center; padding:24px; }
.cp-empty { text-align:center; padding:20px 10px; font-size:12px; color:var(--b3); font-style:italic; }
.cp-dot { width:8px; height:8px; border-radius:50%; }
.cp-uni-row { display:flex; align-items:center; gap:8px; padding:9px 8px; border-radius:8px; cursor:pointer; margin-bottom:2px; transition:background 0.15s; }
.cp-uni-row:hover { background:var(--bg-c); }
.cp-uni-name { font-size:12px; color:var(--scroll); font-weight:600; }
.cp-icon-btn { background:var(--bg-e); border:1px solid var(--b1); border-radius:6px; padding:5px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--t4); transition:all 0.15s; }
.cp-icon-btn:hover { border-color:#6366f1; color:#818cf8; }
.cp-icon-btn--danger:hover { border-color:#ef4444; color:#f87171; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
