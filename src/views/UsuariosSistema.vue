<template>
  <div class="cp-root">

    <!-- Lista de usuarios -->
    <div class="cp-panel">
      <div class="cp-col-header" style="border-radius:14px 14px 0 0;">
        <div>
          <div class="cp-col-title">Usuarios del Sistema</div>
          <div class="cp-col-count">{{ usuarios.length }} registros</div>
        </div>
        <button class="cp-add-btn" @click="abrirForm()">+ Nuevo</button>
      </div>
      <input v-model="q" class="cp-search" placeholder="Buscar usuario..." />
      <div class="cp-list">
        <div v-if="loading" class="cp-loading"><div class="ct-spinner"></div></div>
        <div v-else-if="!filtrados.length" class="cp-empty">Sin usuarios</div>
        <div
          v-else
          v-for="u in filtrados" :key="u.id"
          class="cp-uni-row"
          @click="abrirForm(u)"
        >
          <div class="cp-avatar-mini" :style="`background:${rolColor(u.rol)}22;color:${rolColor(u.rol)};`">
            {{ iniciales(u) }}
          </div>
          <div style="flex:1;min-width:0;">
            <div class="cp-uni-name">{{ u.nombres }} {{ u.apellidos || '' }}</div>
            <div style="font-size:10px;color:#475569;margin-top:1px;">@{{ u.usuario }}</div>
          </div>
          <span class="cp-rol-badge" :style="`background:${rolColor(u.rol)}22;color:${rolColor(u.rol)};border-color:${rolColor(u.rol)}44;`">
            {{ u.rol }}
          </span>
          <span :class="['ct-badge', u.activo===false ? 'ct-badge--off' : 'ct-badge--on']" style="font-size:9px;flex-shrink:0;">
            {{ u.activo===false ? 'Inactivo' : 'Activo' }}
          </span>
          <button class="cp-icon-btn cp-icon-btn--danger" style="flex-shrink:0;" title="Eliminar" @click.stop="eliminar(u)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <transition name="modal-fade">
      <div v-if="dialog" class="ct-modal-backdrop" @click.self="dialog = false">
        <div class="ct-modal" style="max-width:520px;">
          <div class="ct-modal-header">
            <span>{{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}</span>
            <button class="ct-modal-close" @click="dialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field">
                <label>Nombres *</label>
                <input v-model="form.nombres" class="ide-input" placeholder="Nombre completo" />
              </div>
              <div class="ide-field">
                <label>Apellidos</label>
                <input v-model="form.apellidos" class="ide-input" placeholder="Apellidos" />
              </div>
              <div class="ide-field">
                <label>Usuario *</label>
                <input v-model="form.usuario" class="ide-input" placeholder="nombre.usuario" :disabled="!!editando" />
              </div>
              <div class="ide-field">
                <label>{{ editando ? 'Nueva contraseña' : 'Contraseña *' }}</label>
                <input v-model="form.contrasena" class="ide-input" type="password" placeholder="••••••••" />
              </div>
              <div class="ide-field">
                <label>Email</label>
                <input v-model="form.correoElectronico" class="ide-input" type="email" placeholder="correo@empresa.com" />
              </div>
              <div class="ide-field">
                <label>Rol *</label>
                <select v-model="form.rol" class="ide-select">
                  <option value="ADMIN_CLIENTE">Administrador</option>
                  <option value="ENCARGADO">Encargado</option>
                  <option value="CAJERO">Cajero</option>
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="COLABORADOR">Colaborador</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Estado</label>
                <select v-model="form.estado" class="ide-select">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <!-- Sucursales asignadas -->
            <div style="margin-top:16px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">
                Sucursales asignadas
              </div>
              <div v-if="!sucursales.length" style="font-size:12px;color:#334155;font-style:italic;">
                No hay sucursales creadas aún.
                <router-link :to="{name:'sucursales'}" style="color:#818cf8;">Crear sucursal →</router-link>
              </div>
              <div v-else style="display:flex;flex-wrap:wrap;gap:8px;">
                <label
                  v-for="s in sucursales" :key="s.id"
                  :class="['cp-suc-chip', form.sucursales.includes(s.id) ? 'cp-suc-chip--on' : '']"
                  @click="toggleSucursal(s.id)"
                >
                  <span class="cp-dot" :style="`background:${s.esPrincipal?'#6366f1':'#334155'};`"></span>
                  {{ s.nombre }}
                </label>
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
const emptyForm = () => ({ nombres: '', apellidos: '', usuario: '', contrasena: '', correoElectronico: '', rol: 'VENDEDOR', sucursales: [], estado: 'activo' })

const ROL_COLORS = { ENCARGADO: '#f59e0b', CAJERO: '#3b82f6', VENDEDOR: '#22c55e', COLABORADOR: '#8b5cf6', ADMIN_CLIENTE: '#6366f1' }

export default {
  name: 'UsuariosSistema',
  data: () => ({
    usuarios: [], sucursales: [], loading: false, q: '',
    editando: null, form: emptyForm(), saving: false, dialog: false,
  }),
  computed: {
    filtrados() {
      if (!this.q.trim()) return this.usuarios
      const q = this.q.toLowerCase()
      return this.usuarios.filter(u =>
        u.nombres.toLowerCase().includes(q) ||
        u.usuario.toLowerCase().includes(q) ||
        (u.apellidos && u.apellidos.toLowerCase().includes(q))
      )
    },
  },
  created() {
    this.cargar()
    this.cargarSucursales()
  },
  methods: {
    async cargar() {
      this.loading = true
      try { this.usuarios = await this.$service.list('usuarios-sistema') || [] }
      finally { this.loading = false }
    },
    async cargarSucursales() {
      try { this.sucursales = await this.$service.list('sucursales') || [] }
      catch { this.sucursales = [] }
    },
    rolColor(rol) { return ROL_COLORS[rol] || '#64748b' },
    iniciales(u) {
      return ((u.nombres?.[0] || '') + (u.apellidos?.[0] || u.nombres?.[1] || '')).toUpperCase()
    },
    abrirForm(u = null) {
      this.editando = u
      this.form = u
        ? { nombres: u.nombres, apellidos: u.apellidos || '', usuario: u.usuario, contrasena: '', correoElectronico: u.correoElectronico || '', rol: u.rol, sucursales: (u.sucursales || []).map(s => s.id), estado: u.activo === false ? 'inactivo' : 'activo' }
        : emptyForm()
      this.dialog = true
    },
    toggleSucursal(id) {
      const idx = this.form.sucursales.indexOf(id)
      if (idx >= 0) this.form.sucursales.splice(idx, 1)
      else this.form.sucursales.push(id)
    },
    async guardar() {
      if (!this.form.nombres.trim()) return this.$message.error('El nombre es obligatorio')
      if (!this.editando && !this.form.usuario.trim()) return this.$message.error('El usuario es obligatorio')
      if (!this.editando && !this.form.contrasena) return this.$message.error('La contraseña es obligatoria')
      this.saving = true
      try {
        if (this.editando) {
          const payload = { ...this.form }
          if (!payload.contrasena) delete payload.contrasena
          else payload.nuevaContrasena = payload.contrasena
          delete payload.contrasena
          delete payload.usuario
          await this.$service.put(`usuarios-sistema/${this.editando.id}`, payload)
          this.$message.success('Usuario actualizado')
        } else {
          await this.$service.post('usuarios-sistema', this.form)
          this.$message.success('Usuario creado')
        }
        this.dialog = false
        this.editando = null
        this.form = emptyForm()
        await this.cargar()
      } finally { this.saving = false }
    },
    eliminar(u) {
      this.$confirm(`¿Eliminar el usuario "${u.nombres}"?`, async () => {
        await this.$service.delete(`usuarios-sistema/${u.id}`)
        this.$message.success('Usuario eliminado')
        await this.cargar()
      })
    },
  },
}
</script>

<style scoped>
.cp-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; }
.cp-panel { flex:1; background:#0d1526; border:1px solid #1e3a5f44; border-radius:14px; display:flex; flex-direction:column; overflow:hidden; max-width:600px; }
.cp-col-header { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 8px; border-bottom:1px solid #1e3a5f33; flex-shrink:0; }
.cp-col-title { font-size:13px; font-weight:800; color:#f1f5f9; }
.cp-col-count { font-size:10px; color:#475569; margin-top:1px; }
.cp-add-btn { background:#6366f122; border:1px solid #6366f133; color:#818cf8; border-radius:7px; padding:3px 9px; font-size:16px; cursor:pointer; font-weight:700; }
.cp-add-btn:hover { background:#6366f133; }
.cp-search { margin:8px 10px 4px; background:#0f172a; border:1px solid #1e3a5f44; border-radius:7px; color:#94a3b8; font-size:11px; padding:6px 10px; outline:none; flex-shrink:0; }
.cp-list { flex:1; overflow-y:auto; padding:4px 8px 12px; }
.cp-loading { display:flex; justify-content:center; padding:24px; }
.cp-empty { text-align:center; padding:20px 10px; font-size:12px; color:#334155; font-style:italic; }
.cp-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
.cp-uni-row { display:flex; align-items:center; gap:8px; padding:9px 8px; border-radius:8px; cursor:pointer; margin-bottom:2px; transition:background 0.15s; }
.cp-uni-row:hover { background:#1e293b; }
.cp-uni-name { font-size:12px; color:#cbd5e1; font-weight:600; }
.cp-avatar-mini { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; flex-shrink:0; }
.cp-rol-badge { font-size:9px; font-weight:700; padding:1px 6px; border-radius:4px; border:1px solid; white-space:nowrap; flex-shrink:0; }
.cp-icon-btn { background:#0f172a; border:1px solid #1e3a5f44; border-radius:6px; padding:5px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; transition:all 0.15s; }
.cp-icon-btn:hover { border-color:#6366f1; color:#818cf8; }
.cp-icon-btn--danger:hover { border-color:#ef4444; color:#f87171; }
.cp-suc-chip { display:flex; align-items:center; gap:6px; padding:5px 10px; border-radius:8px; border:1px solid #1e3a5f44; background:#0f172a; color:#64748b; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.15s; user-select:none; }
.cp-suc-chip:hover { border-color:#6366f133; color:#94a3b8; }
.cp-suc-chip--on { background:#6366f114; border-color:#6366f144; color:#818cf8; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid #1e3a5f44; border-top-color:#6366f1; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
