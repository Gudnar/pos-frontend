<template>
  <div style="height:100%;overflow-y:auto;padding:24px;">

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  VISTA: EMPRESAS                                       -->
    <!-- ══════════════════════════════════════════════════════ -->
    <template v-if="vista === 'empresas'">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:10px;">
        <div>
          <div class="section-title">Empresas</div>
          <p class="section-subtitle">{{ empresas.length }} empresa{{ empresas.length !== 1 ? 's' : '' }} registrada{{ empresas.length !== 1 ? 's' : '' }}</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div v-if="empresaActiva" class="emp-activa-badge">
            <span class="emp-dot"></span>
            Activa: <strong>{{ empresaActiva.nombre }}</strong>
            <button class="emp-salir-btn" @click="salirContexto" title="Salir del contexto">✕</button>
          </div>
          <button class="ct-new-btn" @click="abrirCrear">+ Nueva empresa</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="cargando" style="display:flex;justify-content:center;padding:60px 0;">
        <div class="ct-spinner"></div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!empresas.length" class="ide-ia-card" style="text-align:center;padding:60px 24px;">
        <div style="font-size:48px;margin-bottom:12px;">🏢</div>
        <div style="font-size:16px;font-weight:700;color:var(--t2);margin-bottom:8px;">Sin empresas registradas</div>
        <p style="color:var(--t4);margin-bottom:20px;font-size:13px;">Crea la primera empresa para comenzar</p>
        <button class="ct-new-btn" @click="abrirCrear">+ Nueva empresa</button>
      </div>

      <!-- Grid de empresas -->
      <div v-else class="emp-grid">
        <div
          v-for="emp in empresas" :key="emp.id"
          class="ide-ia-card emp-card"
          :class="{ 'emp-card--activa': empresaActivaId === emp.id }"
        >
          <!-- Card header -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="emp-avatar" :style="{ background: avatarColor(emp.nombre) + '33', color: avatarColor(emp.nombre) }">
                {{ emp.nombre.charAt(0).toUpperCase() }}
              </div>
              <div style="min-width:0;">
                <div style="font-size:14px;font-weight:700;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">{{ emp.nombre }}</div>
                <div style="font-size:11px;color:var(--t5);font-family:monospace;">{{ emp.slug }}</div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;">
              <span class="emp-plan" :class="`emp-plan--${emp.plan || 'basico'}`">{{ emp.plan || 'básico' }}</span>
              <span class="ct-badge" :class="emp.activo !== false ? 'ct-badge--on' : 'ct-badge--off'">
                {{ emp.activo !== false ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>

          <!-- Info -->
          <div style="border-top:1px solid var(--b2);padding-top:10px;margin-bottom:10px;">
            <div v-if="emp.correoContacto" class="ct-info-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>{{ emp.correoContacto }}</span>
            </div>
            <div v-if="emp.telefono" class="ct-info-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              <span>{{ emp.telefono }}</span>
            </div>
            <div v-if="!emp.correoContacto && !emp.telefono" style="font-size:11px;color:var(--b3);font-style:italic;">
              Sin datos de contacto
            </div>
          </div>

          <!-- Acciones -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid var(--b2);">
            <div style="display:flex;gap:6px;">
              <button
                class="emp-acceder-btn"
                :class="{ 'emp-acceder-btn--activo': empresaActivaId === emp.id }"
                @click="acceder(emp)"
                :disabled="empresaActivaId === emp.id"
              >
                <svg v-if="empresaActivaId === emp.id" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                {{ empresaActivaId === emp.id ? 'Activa' : 'Acceder' }}
              </button>
              <button class="emp-usuarios-btn" @click="gestionarUsuarios(emp)" title="Gestionar usuarios">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                Usuarios
              </button>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="ct-action-btn" title="Editar" @click="abrirEditar(emp)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="ct-action-btn ct-action-btn--danger" title="Eliminar" @click="confirmarEliminar(emp)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  VISTA: USUARIOS DE LA EMPRESA                        -->
    <!-- ══════════════════════════════════════════════════════ -->
    <template v-else-if="vista === 'usuarios'">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <button class="emp-back-btn" @click="volverEmpresas">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Empresas
          </button>
          <div class="emp-breadcrumb-sep">›</div>
          <div>
            <div class="section-title" style="font-size:18px;">{{ empresaSeleccionada.nombre }}</div>
            <p class="section-subtitle">{{ usuariosEmp.length }} usuario{{ usuariosEmp.length !== 1 ? 's' : '' }}</p>
          </div>
        </div>
        <button class="ct-new-btn" @click="abrirFormUsuario()">+ Nuevo usuario</button>
      </div>

      <!-- Loading -->
      <div v-if="loadingUsuarios" style="display:flex;justify-content:center;padding:60px 0;">
        <div class="ct-spinner"></div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!usuariosEmp.length" class="ide-ia-card" style="text-align:center;padding:60px 24px;">
        <div style="font-size:48px;margin-bottom:12px;">👤</div>
        <div style="font-size:16px;font-weight:700;color:var(--t2);margin-bottom:8px;">Sin usuarios</div>
        <p style="color:var(--t4);margin-bottom:20px;font-size:13px;">Crea el primer usuario para esta empresa</p>
        <button class="ct-new-btn" @click="abrirFormUsuario()">+ Nuevo usuario</button>
      </div>

      <!-- Lista de usuarios -->
      <div v-else class="usr-grid">
        <div v-for="u in usuariosEmp" :key="u.id" class="ide-ia-card usr-card">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="usr-avatar" :style="{ background: rolColor(u.rol) + '22', color: rolColor(u.rol) }">
              {{ iniciales(u) }}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;font-weight:700;color:var(--t2);">{{ u.nombres }} {{ u.apellidos || '' }}</div>
              <div style="font-size:11px;color:var(--t5);margin-top:1px;">@{{ u.usuario }}</div>
              <div v-if="u.correoElectronico" style="font-size:11px;color:var(--t5);">{{ u.correoElectronico }}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
              <span class="usr-rol-badge" :style="{ background: rolColor(u.rol)+'22', color: rolColor(u.rol), borderColor: rolColor(u.rol)+'44' }">
                {{ u.rol }}
              </span>
              <span class="ct-badge" :class="u.activo !== false ? 'ct-badge--on' : 'ct-badge--off'" style="font-size:9px;">
                {{ u.activo !== false ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>

          <!-- Sucursales -->
          <div v-if="u.sucursales && u.sucursales.length" style="margin-top:10px;padding-top:8px;border-top:1px solid var(--b2);">
            <div style="font-size:10px;color:var(--t5);margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Sucursales</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              <span v-for="s in u.sucursales" :key="s.id" class="usr-suc-chip">{{ s.nombre }}</span>
            </div>
          </div>

          <!-- Acciones -->
          <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid var(--b2);">
            <button class="ct-action-btn" title="Editar" @click="abrirFormUsuario(u)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="ct-action-btn ct-action-btn--danger" title="Eliminar" @click="eliminarUsuario(u)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>

    </template>

    <!-- ══════════════════════════════════════════════════════ -->
    <!--  MODALES                                               -->
    <!-- ══════════════════════════════════════════════════════ -->

    <!-- Modal crear/editar EMPRESA -->
    <transition name="modal-fade">
      <div v-if="dialogEmpresa" class="ct-modal-backdrop">
        <div class="ct-modal">
          <div class="ct-modal-header">
            <span>{{ editandoEmpresa ? 'Editar empresa' : 'Nueva empresa' }}</span>
            <button class="ct-modal-close" @click="cerrarDialogEmpresa">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field">
                <label>Nombre de la empresa *</label>
                <input v-model="formEmpresa.nombre" class="ide-input" placeholder="Mi Empresa S.A." @input="autoSlug" />
              </div>
              <div class="ide-field">
                <label>Slug (URL) *</label>
                <input v-model="formEmpresa.slug" class="ide-input" placeholder="mi-empresa" />
                <div style="font-size:10px;color:var(--t5);margin-top:3px;">Solo letras minúsculas, números y guiones</div>
              </div>
              <div class="ide-field">
                <label>Correo de contacto</label>
                <input v-model="formEmpresa.correoContacto" class="ide-input" placeholder="contacto@empresa.com" type="email" />
              </div>
              <div class="ide-field">
                <label>Teléfono</label>
                <input v-model="formEmpresa.telefono" class="ide-input" placeholder="+591 70000000" />
              </div>
              <div class="ide-field">
                <label>Plan</label>
                <select v-model="formEmpresa.plan" class="ide-select">
                  <option value="basico">Básico</option>
                  <option value="profesional">Profesional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div v-if="editandoEmpresa" class="ide-field" style="display:flex;align-items:center;gap:10px;padding-top:20px;">
                <div class="ide-toggle" :class="{ 'ide-toggle--on': formEmpresa.activo }" @click="formEmpresa.activo = !formEmpresa.activo"><div></div></div>
                <span style="font-size:13px;color:var(--scroll);">{{ formEmpresa.activo ? 'Empresa activa' : 'Empresa inactiva' }}</span>
              </div>
              <div class="ide-field ct-form-full">
                <label>Días de atención</label>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">
                  <label v-for="d in diasOpciones" :key="d.value" class="emp-dia" :class="{ 'emp-dia--on': formEmpresa.diasAtencion.includes(d.value) }" @click="toggleDia(d.value)">{{ d.label }}</label>
                </div>
              </div>
              <div class="ide-field">
                <label>Hora inicio atención</label>
                <input v-model="formEmpresa.horaInicioAtencion" class="ide-input" type="time" />
              </div>
              <div class="ide-field">
                <label>Hora fin atención</label>
                <input v-model="formEmpresa.horaFinAtencion" class="ide-input" type="time" />
              </div>
              <div class="ide-field ct-form-full">
                <label>Servicios (presiona Enter para agregar)</label>
                <input v-model="servicioInput" class="ide-input" placeholder="Ej: Venta al por mayor" @keydown.enter.prevent="agregarServicio" />
                <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;">
                  <span v-for="(s, i) in formEmpresa.servicios" :key="i" class="emp-tag" @click="quitarServicio(i)">{{ s }} ✕</span>
                </div>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="cerrarDialogEmpresa">Cancelar</button>
            <button class="ct-btn-ok" :disabled="guardandoEmpresa" @click="guardarEmpresa">
              {{ guardandoEmpresa ? 'Guardando...' : (editandoEmpresa ? 'Guardar cambios' : 'Crear empresa') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal crear/editar USUARIO -->
    <transition name="modal-fade">
      <div v-if="dialogUsuario" class="ct-modal-backdrop">
        <div class="ct-modal">
          <div class="ct-modal-header">
            <div>
              <span>{{ editandoUsuario ? 'Editar usuario' : 'Nuevo usuario' }}</span>
              <div v-if="empresaSeleccionada" style="font-size:10px;color:var(--t5);margin-top:2px;">{{ empresaSeleccionada.nombre }}</div>
            </div>
            <button class="ct-modal-close" @click="cerrarDialogUsuario">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field">
                <label>Nombres *</label>
                <input v-model="formUsuario.nombres" class="ide-input" placeholder="Nombre completo" />
              </div>
              <div class="ide-field">
                <label>Apellidos</label>
                <input v-model="formUsuario.apellidos" class="ide-input" placeholder="Apellidos" />
              </div>
              <div class="ide-field">
                <label>Usuario (login) *</label>
                <input v-model="formUsuario.usuario" class="ide-input" placeholder="nombre.usuario" :disabled="!!editandoUsuario" />
              </div>
              <div class="ide-field">
                <label>{{ editandoUsuario ? 'Nueva contraseña' : 'Contraseña *' }}</label>
                <input v-model="formUsuario.contrasena" class="ide-input" type="password" :placeholder="editandoUsuario ? 'Dejar vacío para no cambiar' : '••••••••'" />
              </div>
              <div class="ide-field">
                <label>Email</label>
                <input v-model="formUsuario.correoElectronico" class="ide-input" type="email" placeholder="correo@empresa.com" />
              </div>
              <div class="ide-field">
                <label>Rol *</label>
                <select v-model="formUsuario.rol" class="ide-select">
                  <option value="ADMIN_CLIENTE">Administrador</option>
                  <option value="ENCARGADO">Encargado</option>
                  <option value="CAJERO">Cajero</option>
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="COLABORADOR">Colaborador</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Estado</label>
                <select v-model="formUsuario.estado" class="ide-select">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <!-- Sucursales -->
            <div style="margin-top:16px;">
              <div style="font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">
                Sucursales asignadas
              </div>
              <div v-if="!sucursalesEmp.length" style="font-size:12px;color:var(--b3);font-style:italic;">
                No hay sucursales creadas para esta empresa aún.
              </div>
              <div v-else style="display:flex;flex-wrap:wrap;gap:8px;">
                <label
                  v-for="s in sucursalesEmp" :key="s.id"
                  :class="['usr-suc-sel', formUsuario.sucursales.includes(s.id) ? 'usr-suc-sel--on' : '']"
                  @click="toggleSucursalForm(s.id)"
                >
                  <span class="emp-dot-sm" :style="{ background: s.esPrincipal ? '#6366f1' : 'var(--b3)' }"></span>
                  {{ s.nombre }}
                </label>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="cerrarDialogUsuario">Cancelar</button>
            <button class="ct-btn-ok" :disabled="savingUsuario" @click="guardarUsuario">
              {{ savingUsuario ? 'Guardando...' : (editandoUsuario ? 'Actualizar' : 'Crear usuario') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
const DIAS = [
  { value: 'lunes',     label: 'Lun' },
  { value: 'martes',    label: 'Mar' },
  { value: 'miercoles', label: 'Mié' },
  { value: 'jueves',    label: 'Jue' },
  { value: 'viernes',   label: 'Vie' },
  { value: 'sabado',    label: 'Sáb' },
  { value: 'domingo',   label: 'Dom' },
];

const COLORS = ['#6366f1','#c96442','#22c55e','#0ea5e9','#a855f7','#f59e0b','#ef4444'];
const ROL_COLORS = {
  ADMIN_CLIENTE: '#6366f1', ENCARGADO: '#f59e0b',
  CAJERO: '#3b82f6', VENDEDOR: '#22c55e', COLABORADOR: '#8b5cf6',
};

const emptyEmpresa = () => ({
  nombre: '', slug: '', correoContacto: '', telefono: '',
  plan: 'basico', diasAtencion: [],
  horaInicioAtencion: '08:00', horaFinAtencion: '18:00',
  servicios: [], activo: true,
});

const emptyUsuario = () => ({
  nombres: '', apellidos: '', usuario: '', contrasena: '',
  correoElectronico: '', rol: 'VENDEDOR', estado: 'activo', sucursales: [],
});

export default {
  name: 'Empresas',
  data: () => ({
    // ── vista ──
    vista: 'empresas',
    // ── empresas ──
    empresas: [],
    cargando: false,
    dialogEmpresa: false,
    editandoEmpresa: null,
    formEmpresa: emptyEmpresa(),
    servicioInput: '',
    guardandoEmpresa: false,
    diasOpciones: DIAS,
    // ── usuarios ──
    empresaSeleccionada: null,
    usuariosEmp: [],
    sucursalesEmp: [],
    loadingUsuarios: false,
    dialogUsuario: false,
    editandoUsuario: null,
    formUsuario: emptyUsuario(),
    savingUsuario: false,
  }),
  computed: {
    empresaActivaId() { return this.$store.getters.clienteId || null; },
    empresaActiva() {
      if (!this.empresaActivaId) return null;
      return this.empresas.find(e => e.id === this.empresaActivaId) || this.$store.getters.clienteInfo || null;
    },
  },
  async mounted() { await this.cargar(); },
  methods: {

    // ── Helpers ────────────────────────────────────────────

    avatarColor(nombre) { return COLORS[nombre.charCodeAt(0) % COLORS.length]; },
    rolColor(rol) { return ROL_COLORS[rol] || 'var(--t4)'; },
    iniciales(u) {
      return ((u.nombres?.[0] || '') + (u.apellidos?.[0] || u.nombres?.[1] || '')).toUpperCase();
    },

    // Hace una petición HTTP con el ID de empresa específico como header
    async _reqEmp(method, path, data, empresaId) {
      const headers = { 'X-Empresa-Id': empresaId };
      const url = this.$baseServer + path;
      const resp = method === 'get'
        ? await this.$http.get(url, { headers })
        : method === 'post'
          ? await this.$http.post(url, data, { headers })
          : method === 'put'
            ? await this.$http.put(url, data, { headers })
            : await this.$http.delete(url, { headers });
      return resp.data?.datos ?? resp.data;
    },

    // ── EMPRESAS CRUD ───────────────────────────────────────

    async cargar() {
      this.cargando = true;
      try {
        this.empresas = (await this.$service.list('clientes')) || [];
      } catch {
        this.$message.error('Error al cargar empresas');
        this.empresas = [];
      } finally {
        this.cargando = false;
      }
    },

    autoSlug() {
      if (this.editandoEmpresa) return;
      this.formEmpresa.slug = this.formEmpresa.nombre
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    },

    toggleDia(dia) {
      const idx = this.formEmpresa.diasAtencion.indexOf(dia);
      idx >= 0 ? this.formEmpresa.diasAtencion.splice(idx, 1) : this.formEmpresa.diasAtencion.push(dia);
    },
    agregarServicio() {
      const s = this.servicioInput.trim();
      if (s && !this.formEmpresa.servicios.includes(s)) this.formEmpresa.servicios.push(s);
      this.servicioInput = '';
    },
    quitarServicio(i) { this.formEmpresa.servicios.splice(i, 1); },

    abrirCrear() {
      this.editandoEmpresa = null;
      this.formEmpresa = emptyEmpresa();
      this.servicioInput = '';
      this.dialogEmpresa = true;
    },
    abrirEditar(emp) {
      this.editandoEmpresa = emp.id;
      this.formEmpresa = {
        nombre: emp.nombre, slug: emp.slug,
        correoContacto: emp.correoContacto || '', telefono: emp.telefono || '',
        plan: emp.plan || 'basico',
        diasAtencion: [...(emp.diasAtencion || [])],
        horaInicioAtencion: emp.horaInicioAtencion || '08:00',
        horaFinAtencion: emp.horaFinAtencion || '18:00',
        servicios: [...(emp.servicios || [])],
        activo: emp.activo !== false,
      };
      this.servicioInput = '';
      this.dialogEmpresa = true;
    },
    cerrarDialogEmpresa() { this.dialogEmpresa = false; this.editandoEmpresa = null; },

    async guardarEmpresa() {
      if (!this.formEmpresa.nombre.trim() || !this.formEmpresa.slug.trim()) {
        return this.$message.error('Nombre y slug son obligatorios');
      }
      this.guardandoEmpresa = true;
      try {
        if (this.editandoEmpresa) {
          await this.$service.put(`clientes/${this.editandoEmpresa}`, this.formEmpresa);
          this.$message.success('Empresa actualizada');
          if (this.empresaActivaId === this.editandoEmpresa) {
            const actualizada = { ...this.formEmpresa, id: this.editandoEmpresa };
            this.$store.commit('setEmpresaActual', actualizada);
            this.$storage.set('empresaActual', actualizada);
          }
        } else {
          await this.$service.post('clientes', this.formEmpresa);
          this.$message.success('Empresa creada');
        }
        this.cerrarDialogEmpresa();
        await this.cargar();
      } catch (e) {
        this.$message.error(e?.response?.data?.mensaje || e?.message || 'Error al guardar');
      } finally {
        this.guardandoEmpresa = false;
      }
    },

    confirmarEliminar(emp) {
      this.$confirm(`¿Eliminar la empresa "${emp.nombre}"? Esta acción no se puede deshacer.`, async () => {
        try {
          await this.$service.delete('clientes', emp.id);
          this.$message.success('Empresa eliminada');
          if (this.empresaActivaId === emp.id) this.salirContexto();
          await this.cargar();
        } catch (e) {
          this.$message.error(e?.response?.data?.mensaje || e?.message || 'Error al eliminar');
        }
      });
    },

    acceder(emp) {
      this.$store.commit('setEmpresaActual', emp);
      this.$storage.set('empresaActual', emp);
      this.$message.success(`Trabajando en: ${emp.nombre}`);
      this.$router.push({ name: 'home' });
    },
    salirContexto() {
      this.$store.commit('setEmpresaActual', null);
      this.$storage.remove('empresaActual');
      this.$message.success('Contexto de empresa cerrado');
    },

    // ── NAVEGACIÓN USUARIOS ─────────────────────────────────

    async gestionarUsuarios(emp) {
      this.empresaSeleccionada = emp;
      this.usuariosEmp = [];
      this.sucursalesEmp = [];
      this.vista = 'usuarios';
      this.loadingUsuarios = true;
      try {
        const [usuarios, sucursales] = await Promise.all([
          this._reqEmp('get', 'usuarios-sistema', null, emp.id),
          this._reqEmp('get', 'sucursales', null, emp.id),
        ]);
        this.usuariosEmp = usuarios || [];
        this.sucursalesEmp = sucursales || [];
      } catch {
        this.$message.error('Error al cargar usuarios');
      } finally {
        this.loadingUsuarios = false;
      }
    },

    volverEmpresas() {
      this.vista = 'empresas';
      this.empresaSeleccionada = null;
      this.usuariosEmp = [];
    },

    async recargarUsuarios() {
      if (!this.empresaSeleccionada) return;
      this.loadingUsuarios = true;
      try {
        this.usuariosEmp = await this._reqEmp('get', 'usuarios-sistema', null, this.empresaSeleccionada.id) || [];
      } finally {
        this.loadingUsuarios = false;
      }
    },

    // ── USUARIOS CRUD ───────────────────────────────────────

    abrirFormUsuario(u = null) {
      this.editandoUsuario = u;
      this.formUsuario = u ? {
        nombres: u.nombres, apellidos: u.apellidos || '',
        usuario: u.usuario, contrasena: '',
        correoElectronico: u.correoElectronico || '',
        rol: u.rol, estado: u.activo === false ? 'inactivo' : 'activo',
        sucursales: (u.sucursales || []).map(s => s.id),
      } : emptyUsuario();
      this.dialogUsuario = true;
    },
    cerrarDialogUsuario() { this.dialogUsuario = false; this.editandoUsuario = null; },

    toggleSucursalForm(id) {
      const idx = this.formUsuario.sucursales.indexOf(id);
      idx >= 0 ? this.formUsuario.sucursales.splice(idx, 1) : this.formUsuario.sucursales.push(id);
    },

    async guardarUsuario() {
      if (!this.formUsuario.nombres.trim()) return this.$message.error('El nombre es obligatorio');
      if (!this.editandoUsuario && !this.formUsuario.usuario.trim()) return this.$message.error('El usuario es obligatorio');
      if (!this.editandoUsuario && !this.formUsuario.contrasena) return this.$message.error('La contraseña es obligatoria');
      const empId = this.empresaSeleccionada.id;
      this.savingUsuario = true;
      try {
        if (this.editandoUsuario) {
          const payload = { ...this.formUsuario };
          if (payload.contrasena) { payload.nuevaContrasena = payload.contrasena; }
          delete payload.contrasena;
          delete payload.usuario;
          await this._reqEmp('put', `usuarios-sistema/${this.editandoUsuario.id}`, payload, empId);
          this.$message.success('Usuario actualizado');
        } else {
          await this._reqEmp('post', 'usuarios-sistema', this.formUsuario, empId);
          this.$message.success('Usuario creado');
        }
        this.cerrarDialogUsuario();
        await this.recargarUsuarios();
      } catch (e) {
        this.$message.error(e?.response?.data?.mensaje || e?.message || 'Error al guardar usuario');
      } finally {
        this.savingUsuario = false;
      }
    },

    eliminarUsuario(u) {
      this.$confirm(`¿Eliminar al usuario "${u.nombres}"?`, async () => {
        try {
          await this._reqEmp('delete', `usuarios-sistema/${u.id}`, null, this.empresaSeleccionada.id);
          this.$message.success('Usuario eliminado');
          await this.recargarUsuarios();
        } catch (e) {
          this.$message.error(e?.response?.data?.mensaje || e?.message || 'Error al eliminar');
        }
      });
    },
  },
};
</script>

<style scoped>
.section-title    { font-size: 22px; font-weight: 800; color: var(--t1); margin-bottom: 4px; }
.section-subtitle { font-size: 13px; color: var(--t4); margin: 0; }

.ct-new-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border: none; border-radius: 9px;
  padding: 9px 18px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s; white-space: nowrap; font-family: inherit;
}
.ct-new-btn:hover { opacity: 0.88; }

/* Active empresa badge */
.emp-activa-badge {
  display: flex; align-items: center; gap: 6px;
  background: #22c55e18; border: 1px solid #22c55e33;
  border-radius: 8px; padding: 6px 10px;
  font-size: 12px; color: var(--t3); white-space: nowrap;
}
.emp-activa-badge strong { color: #4ade80; }
.emp-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #22c55e; flex-shrink: 0;
  animation: blink 2s infinite;
}
.emp-dot-sm {
  width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0;
}
@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
.emp-salir-btn {
  background: none; border: none; color: var(--t5);
  cursor: pointer; font-size: 11px; padding: 0 2px; border-radius: 3px;
}
.emp-salir-btn:hover { color: #ef4444; }

/* Spinner */
.ct-spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid var(--b1); border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Empresas grid */
.emp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.emp-card { transition: border-color 0.15s; }
.emp-card--activa { border-color: #22c55e44 !important; background: #22c55e06 !important; }
.emp-avatar {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800; flex-shrink: 0;
}
.emp-plan { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.emp-plan--basico      { background: #6366f122; color: #818cf8; }
.emp-plan--profesional { background: #f59e0b22; color: #f59e0b; }
.emp-plan--enterprise  { background: #22c55e22; color: #22c55e; }

.ct-info-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--t3); margin-top: 5px;
}
.ct-info-row svg { flex-shrink: 0; color: var(--t5); }

/* Card buttons */
.emp-acceder-btn {
  display: flex; align-items: center; gap: 5px;
  background: #6366f111; border: 1px solid #6366f133;
  border-radius: 7px; color: #818cf8;
  padding: 5px 10px; font-size: 11px; font-weight: 700;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.emp-acceder-btn:hover:not(:disabled) { background: #6366f122; border-color: #6366f155; }
.emp-acceder-btn--activo { background: #22c55e11; border-color: #22c55e33; color: #4ade80; }
.emp-acceder-btn:disabled { cursor: default; }

.emp-usuarios-btn {
  display: flex; align-items: center; gap: 5px;
  background: #0ea5e911; border: 1px solid #0ea5e933;
  border-radius: 7px; color: #38bdf8;
  padding: 5px 10px; font-size: 11px; font-weight: 700;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.emp-usuarios-btn:hover { background: #0ea5e922; border-color: #0ea5e955; }

.ct-action-btn {
  background: var(--bg-c); border: 1px solid var(--b3);
  border-radius: 7px; color: var(--t4);
  padding: 5px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; transition: all 0.15s;
}
.ct-action-btn:hover { border-color: #6366f1; color: #818cf8; }
.ct-action-btn--danger:hover { border-color: #ef4444; color: #f87171; }

/* Back button */
.emp-back-btn {
  display: flex; align-items: center; gap: 6px;
  background: var(--bg-c); border: 1px solid var(--b3);
  border-radius: 8px; color: var(--t3);
  padding: 7px 12px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.emp-back-btn:hover { border-color: #6366f1; color: #818cf8; }
.emp-breadcrumb-sep { color: var(--b3); font-size: 18px; font-weight: 300; }

/* Usuarios grid */
.usr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.usr-card { transition: border-color 0.15s; }
.usr-avatar {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800; flex-shrink: 0;
}
.usr-rol-badge {
  font-size: 9px; font-weight: 700;
  padding: 2px 7px; border-radius: 4px; border: 1px solid;
  white-space: nowrap;
}
.usr-suc-chip {
  font-size: 10px; font-weight: 600;
  background: #6366f111; color: #818cf8;
  border: 1px solid #6366f133;
  padding: 2px 8px; border-radius: 999px;
}

/* Sucursal selector en form */
.usr-suc-sel {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 10px; border-radius: 8px;
  border: 1px solid var(--b1); background: var(--bg-e);
  color: var(--t4); font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; user-select: none;
}
.usr-suc-sel:hover { border-color: #6366f133; color: var(--t3); }
.usr-suc-sel--on { background: #6366f114; border-color: #6366f144; color: #818cf8; }

/* Dias form */
.emp-dia {
  padding: 4px 10px; border-radius: 6px;
  background: var(--bg-e); border: 1px solid var(--b1);
  font-size: 11px; font-weight: 600; color: var(--t4);
  cursor: pointer; user-select: none; transition: all 0.12s;
}
.emp-dia--on { background: #6366f122; border-color: #6366f144; color: #818cf8; }

.emp-tag {
  font-size: 11px; font-weight: 600; cursor: pointer;
  background: #6366f122; color: #818cf8; border: 1px solid #6366f133;
  padding: 2px 9px; border-radius: 999px;
}
.emp-tag:hover { background: #6366f144; }
</style>
