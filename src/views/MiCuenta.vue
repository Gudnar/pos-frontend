<template>
  <div class="ide-mod">

    <!-- Sub-nav -->
    <div class="ide-subnav">
      <div class="ide-sn-hd">
        <div class="ide-sn-ico" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <div class="ide-sn-title">Mi Cuenta</div>
          <div class="ide-sn-sub" style="color:#6366f1;">{{ clienteNombre || 'Empresa' }}</div>
        </div>
      </div>

      <button v-for="s in secciones" :key="s.id" class="ide-sn-btn" :class="seccion === s.id ? 'ide-sn-btn--a' : ''" @click="seccion = s.id">
        <span v-html="s.svg" style="flex-shrink:0; display:flex;"></span>
        {{ s.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="ide-body">

      <!-- ── Empresa ── -->
      <template v-if="seccion === 'empresa'">
        <div class="ide-sec-hd">
          <h2>Información de la Empresa</h2>
          <p>Datos generales visibles en la plataforma</p>
        </div>

        <div v-if="cargando" class="mc-loading">Cargando...</div>
        <template v-else>
          <div style="max-width:640px; display:flex; flex-direction:column; gap:16px;">
            <div class="mc-form-row">
              <div class="ide-field">
                <label>Nombre de la empresa *</label>
                <input v-model="forma.nombre" class="ide-input" placeholder="Ej. MiDoc" />
              </div>
              <div class="ide-field">
                <label>Correo de contacto</label>
                <input v-model="forma.correoContacto" class="ide-input" type="email" placeholder="contacto@empresa.com" />
              </div>
            </div>
            <div class="mc-form-row">
              <div class="ide-field">
                <label>Teléfono</label>
                <input v-model="forma.telefono" class="ide-input" placeholder="+52 55 1234 5678" />
              </div>
              <div class="ide-field">
                <label>URL del logo</label>
                <input v-model="forma.logoUrl" class="ide-input" placeholder="https://..." />
              </div>
            </div>

            <div class="ide-ia-card">
              <div style="font-size:12px; font-weight:700; color:var(--t3); margin-bottom:14px;">Horario de atención</div>
              <div class="mc-horario-grid">
                <div v-for="d in diasSemana" :key="d.val" class="mc-dia-row">
                  <!-- Toggle del día -->
                  <button
                    class="mc-dia-toggle"
                    :class="{ 'mc-dia-toggle--on': diaActivo(d.val) }"
                    @click="toggleDia(d.val)"
                    :title="diaActivo(d.val) ? 'Desactivar' : 'Activar'"
                  >
                    <span class="mc-dia-toggle-label">{{ d.label }}</span>
                  </button>

                  <!-- Franjas horarias -->
                  <div class="mc-franjas">
                    <template v-if="diaActivo(d.val)">
                      <div
                        v-for="(franja, fi) in franjasDelDia(d.val)"
                        :key="fi"
                        class="mc-franja"
                      >
                        <input v-model="franja.inicio" type="time" class="ide-input mc-time-input" />
                        <span class="mc-franja-sep">–</span>
                        <input v-model="franja.fin" type="time" class="ide-input mc-time-input" />
                        <button class="mc-franja-rm" @click="removeFranja(d.val, fi)" title="Eliminar franja">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      <button class="mc-add-franja" @click="addFranja(d.val)">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Agregar franja
                      </button>
                    </template>
                    <span v-else class="mc-dia-off">Cerrado</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="ide-ia-card">
              <div style="font-size:12px; font-weight:700; color:var(--t3); margin-bottom:10px;">Servicios / Especialidades</div>
              <div style="display:flex; gap:8px; margin-bottom:8px;">
                <input v-model="nuevoServicio" class="ide-input" placeholder="Ej. Medicina general" @keydown.enter.prevent="addServicio" style="flex:1;" />
                <button class="mc-btn mc-btn--primary" @click="addServicio">Agregar</button>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                <div v-for="(s, i) in forma.servicios" :key="i" class="mc-tag">
                  {{ s }}
                  <button class="mc-tag-rm" @click="forma.servicios.splice(i, 1)">×</button>
                </div>
              </div>
            </div>

            <div>
              <button class="mc-btn mc-btn--primary" :disabled="guardando" @click="guardarEmpresa">
                {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
              </button>
            </div>
          </div>
        </template>
      </template>

      <!-- ── Roles ── -->
      <template v-else-if="seccion === 'roles'">
        <div class="ide-sec-hd" style="display:flex; align-items:flex-start; justify-content:space-between;">
          <div>
            <h2>Roles y Permisos</h2>
            <p>Define qué puede hacer cada rol en la plataforma</p>
          </div>
          <button class="mc-btn mc-btn--primary mc-btn--sm" @click="abrirDialogoRol()">+ Nuevo rol</button>
        </div>

        <div v-if="cargandoRoles" class="mc-loading">Cargando...</div>
        <template v-else>
          <div v-if="!roles.length" class="mc-empty">No hay roles definidos</div>
          <div class="mc-rol-list">
            <div v-for="r in roles" :key="r.id" class="mc-rol-card">
              <div class="mc-rol-card__header">
                <div class="mc-rol-card__info">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="mc-rol-name">{{ r.nombre }}</span>
                    <span v-if="r.esBase" class="mc-badge mc-badge--base">Base</span>
                  </div>
                  <div class="mc-rol-desc">{{ r.descripcion || '—' }}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="mc-rol-usuarios">{{ r.totalUsuarios }} usuario{{ r.totalUsuarios !== 1 ? 's' : '' }}</span>
                  <button class="mc-act-btn" title="Editar permisos" @click="abrirDialogoRol(r)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button v-if="!r.esBase" class="mc-act-btn mc-act-btn--del" title="Eliminar" @click="confirmarEliminarRol(r)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>

              <!-- Permisos resumen -->
              <div class="mc-permisos-preview">
                <div v-for="mod in modulos" :key="mod.id" class="mc-perm-chip" :class="tieneAlgunPermiso(r, mod.id) ? 'mc-perm-chip--on' : ''">
                  {{ mod.label }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- ── Equipo ── -->
      <template v-else-if="seccion === 'equipo'">
        <div class="ide-sec-hd" style="display:flex; align-items:flex-start; justify-content:space-between;">
          <div>
            <h2>Equipo</h2>
            <p>Usuarios con acceso a la cuenta</p>
          </div>
          <button class="mc-btn mc-btn--primary mc-btn--sm" @click="abrirDialogo()">+ Nuevo usuario</button>
        </div>

        <div v-if="cargandoUsuarios" class="mc-loading">Cargando...</div>
        <template v-else>
          <div v-if="!usuarios.length" class="mc-empty">No hay usuarios registrados</div>
          <div class="mc-user-list">
            <div v-for="u in usuarios" :key="u.id" class="mc-user-card">
              <div class="mc-user-avatar" :style="{ background: avatarColor(u.nombres) }">
                {{ initials(u.nombres) }}
              </div>
              <div class="mc-user-info">
                <div class="mc-user-name">{{ u.nombres }} {{ u.apellidos }}</div>
                <div class="mc-user-meta">@{{ u.usuario }} · {{ u.correoElectronico || '—' }}</div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:3px;">
                <div class="mc-user-rol" :class="u.rol === 'ADMIN_CLIENTE' ? 'mc-rol--admin' : 'mc-rol--colab'">
                  {{ u.rol === 'ADMIN_CLIENTE' ? 'Admin' : 'Colaborador' }}
                </div>
                <div v-if="u.rolClienteNombre" class="mc-user-rol-custom">{{ u.rolClienteNombre }}</div>
              </div>
              <div class="mc-user-actions">
                <button class="mc-act-btn" title="Editar" @click="abrirDialogo(u)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="mc-act-btn mc-act-btn--del" title="Eliminar" @click="confirmarEliminar(u)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <!-- Dialog crear/editar rol -->
    <v-dialog v-model="dialogoRol" max-width="620" persistent content-class="ide-dialog">
      <v-card class="ide-card" style="border-radius:14px; overflow:hidden;">
        <v-card-title class="ide-card-title">
          {{ editandoRol ? 'Editar rol' : 'Nuevo rol' }}
        </v-card-title>
        <v-card-text style="padding:0 24px 8px; max-height:70vh; overflow-y:auto;">
          <div style="display:flex; flex-direction:column; gap:14px; padding-top:8px;">
            <div class="mc-form-row">
              <div class="ide-field">
                <label>Nombre del rol *</label>
                <input v-model="formRol.nombre" class="ide-input" placeholder="Ej. Supervisor" :disabled="editandoRol && editandoRol.esBase" />
              </div>
              <div class="ide-field">
                <label>Descripción</label>
                <input v-model="formRol.descripcion" class="ide-input" placeholder="Para qué sirve este rol" />
              </div>
            </div>

            <!-- Matriz de permisos -->
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--t3); margin-bottom:10px;">PERMISOS</div>
              <div class="mc-matriz">
                <!-- Header -->
                <div class="mc-matriz-header">
                  <div class="mc-mz-mod">Módulo</div>
                  <div v-for="acc in accionesHeader" :key="acc" class="mc-mz-acc">{{ acc }}</div>
                </div>
                <!-- Rows -->
                <div v-for="mod in modulos" :key="mod.id" class="mc-matriz-row">
                  <div class="mc-mz-mod">{{ mod.label }}</div>
                  <div v-for="acc in accionesHeader" :key="acc" class="mc-mz-acc">
                    <template v-if="mod.acciones.includes(acc)">
                      <button
                        class="mc-perm-toggle"
                        :class="{ 'mc-perm-toggle--on': formRol.permisos[mod.id] && formRol.permisos[mod.id][acc] }"
                        @click="togglePermiso(mod.id, acc)"
                        :title="(formRol.permisos[mod.id] && formRol.permisos[mod.id][acc]) ? 'Permitido' : 'Denegado'"
                      >
                        <svg v-if="formRol.permisos[mod.id] && formRol.permisos[mod.id][acc]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </template>
                    <span v-else class="mc-mz-na">—</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions style="padding:16px 24px 20px; gap:8px;">
          <button class="mc-btn mc-btn--ghost" style="flex:1;" @click="dialogoRol = false">Cancelar</button>
          <button class="mc-btn mc-btn--primary" style="flex:1;" :disabled="guardandoRol" @click="guardarRol">
            {{ guardandoRol ? 'Guardando…' : (editandoRol ? 'Actualizar' : 'Crear rol') }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog crear/editar usuario -->
    <v-dialog v-model="dialogo" max-width="480" persistent content-class="ide-dialog">
      <v-card class="ide-card" style="border-radius:14px;">
        <v-card-title class="ide-card-title">
          {{ editando ? 'Editar usuario' : 'Nuevo usuario' }}
        </v-card-title>
        <v-card-text style="padding:0 24px 8px;">
          <div style="display:flex; flex-direction:column; gap:14px; padding-top:8px;">
            <div class="mc-form-row">
              <div class="ide-field">
                <label>Nombres *</label>
                <input v-model="form.nombres" class="ide-input" placeholder="Nombre completo" />
              </div>
              <div class="ide-field">
                <label>Apellidos</label>
                <input v-model="form.apellidos" class="ide-input" placeholder="Apellidos" />
              </div>
            </div>
            <div class="ide-field" v-if="!editando">
              <label>Usuario *</label>
              <input v-model="form.usuario" class="ide-input" placeholder="nombre_usuario" />
            </div>
            <div class="ide-field">
              <label>Correo electrónico</label>
              <input v-model="form.correoElectronico" class="ide-input" type="email" placeholder="usuario@empresa.com" />
            </div>
            <div class="ide-field">
              <label>{{ editando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *' }}</label>
              <input v-model="form.contrasena" class="ide-input" type="password" placeholder="••••••••" />
            </div>
            <div class="mc-form-row">
              <div class="ide-field">
                <label>Nivel de acceso</label>
                <select v-model="form.rol" class="ide-select">
                  <option value="COLABORADOR">Colaborador</option>
                  <option value="ADMIN_CLIENTE">Administrador</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Rol personalizado</label>
                <select v-model="form.rolClienteId" class="ide-select">
                  <option value="">— Sin rol —</option>
                  <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.nombre }}</option>
                </select>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions style="padding:16px 24px 20px; gap:8px;">
          <button class="mc-btn mc-btn--ghost" style="flex:1;" @click="dialogo = false">Cancelar</button>
          <button class="mc-btn mc-btn--primary" style="flex:1;" :disabled="guardandoUsuario" @click="guardarUsuario">
            {{ guardandoUsuario ? 'Guardando…' : (editando ? 'Actualizar' : 'Crear usuario') }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
export default {
  name: 'MiCuenta',
  data: () => ({
    seccion: 'empresa',
    secciones: [
      {
        id: 'empresa',
        label: 'Empresa',
        svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>`,
      },
      {
        id: 'roles',
        label: 'Roles',
        svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
      },
      {
        id: 'equipo',
        label: 'Equipo',
        svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
      },
    ],
    modulos: [
      { id: 'agentes',        label: 'Agentes IA',     acciones: ['ver', 'crear', 'editar', 'eliminar'] },
      { id: 'herramientas',   label: 'Herramientas',   acciones: ['ver', 'gestionar'] },
      { id: 'conversaciones', label: 'Conversaciones', acciones: ['ver', 'responder'] },
      { id: 'reportes',       label: 'Reportes',       acciones: ['ver'] },
      { id: 'configuracion',  label: 'Configuración',  acciones: ['ver', 'editar'] },
    ],
    accionesHeader: ['ver', 'crear', 'editar', 'eliminar', 'gestionar', 'responder'],
    // Roles
    cargandoRoles: false,
    roles: [],
    dialogoRol: false,
    editandoRol: null,
    guardandoRol: false,
    formRol: { nombre: '', descripcion: '', permisos: {} },
    cargando: false,
    guardando: false,
    forma: {
      nombre: '',
      correoContacto: '',
      telefono: '',
      logoUrl: '',
      servicios: [],
      horarios: [],
    },
    nuevoServicio: '',
    diasSemana: [
      { val: 'lunes',     label: 'Lunes'    },
      { val: 'martes',    label: 'Martes'   },
      { val: 'miercoles', label: 'Miércoles'},
      { val: 'jueves',    label: 'Jueves'   },
      { val: 'viernes',   label: 'Viernes'  },
      { val: 'sabado',    label: 'Sábado'   },
      { val: 'domingo',   label: 'Domingo'  },
    ],
    // Equipo
    cargandoUsuarios: false,
    usuarios: [],
    dialogo: false,
    editando: null,
    guardandoUsuario: false,
    form: { nombres: '', apellidos: '', usuario: '', correoElectronico: '', contrasena: '', rol: 'COLABORADOR', rolClienteId: '' },
  }),
  computed: {
    clienteNombre() {
      return this.$store.getters.clienteInfo?.nombre || this.forma.nombre || '';
    },
  },
  mounted() {
    this.cargarEmpresa();
    this.cargarRoles();
    this.cargarUsuarios();
  },
  methods: {
    async cargarEmpresa() {
      this.cargando = true;
      try {
        const data = await this.$service.get('mi-cuenta');
        if (data) {
          this.forma = {
            nombre: data.nombre || '',
            correoContacto: data.correoContacto || '',
            telefono: data.telefono || '',
            logoUrl: data.logoUrl || '',
            servicios: data.servicios || [],
            horarios: data.horarios ? JSON.parse(JSON.stringify(data.horarios)) : [],
          };
          this.$store.commit('setClienteInfo', data);
        }
      } catch {
        // el interceptor de servicio ya muestra el error
      } finally {
        this.cargando = false;
      }
    },
    async guardarEmpresa() {
      if (!this.forma.nombre) {
        this.$message.error('El nombre de la empresa es requerido');
        return;
      }
      this.guardando = true;
      try {
        const data = await this.$service.put('mi-cuenta', this.forma);
        this.$store.commit('setClienteInfo', data);
        this.$message.success('Información guardada correctamente');
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      } finally {
        this.guardando = false;
      }
    },
    diaActivo(dia) {
      return this.forma.horarios.some(h => h.dia === dia);
    },
    franjasDelDia(dia) {
      const entry = this.forma.horarios.find(h => h.dia === dia);
      return entry ? entry.franjas : [];
    },
    toggleDia(dia) {
      const idx = this.forma.horarios.findIndex(h => h.dia === dia);
      if (idx >= 0) {
        this.forma.horarios.splice(idx, 1);
      } else {
        this.forma.horarios.push({ dia, franjas: [{ inicio: '09:00', fin: '18:00' }] });
      }
    },
    addFranja(dia) {
      const entry = this.forma.horarios.find(h => h.dia === dia);
      if (entry) entry.franjas.push({ inicio: '09:00', fin: '18:00' });
    },
    removeFranja(dia, idx) {
      const entry = this.forma.horarios.find(h => h.dia === dia);
      if (!entry) return;
      entry.franjas.splice(idx, 1);
      if (entry.franjas.length === 0) {
        this.forma.horarios.splice(this.forma.horarios.indexOf(entry), 1);
      }
    },
    addServicio() {
      const s = this.nuevoServicio.trim();
      if (s && !this.forma.servicios.includes(s)) this.forma.servicios.push(s);
      this.nuevoServicio = '';
    },
    // ── Roles ──────────────────────────────────────────────────────────────
    async cargarRoles() {
      this.cargandoRoles = true;
      try {
        const data = await this.$service.get('mi-cuenta/roles');
        this.roles = Array.isArray(data) ? data : [];
      } catch {
        this.roles = [];
      } finally {
        this.cargandoRoles = false;
      }
    },
    buildPermisos() {
      const p = {};
      this.modulos.forEach(m => {
        p[m.id] = {};
        m.acciones.forEach(a => { p[m.id][a] = false; });
      });
      return p;
    },
    abrirDialogoRol(rol = null) {
      this.editandoRol = rol;
      if (rol) {
        const permisos = this.buildPermisos();
        this.modulos.forEach(m => {
          if (rol.permisos && rol.permisos[m.id]) {
            m.acciones.forEach(a => {
              permisos[m.id][a] = !!rol.permisos[m.id][a];
            });
          }
        });
        this.formRol = { nombre: rol.nombre, descripcion: rol.descripcion || '', permisos };
      } else {
        this.formRol = { nombre: '', descripcion: '', permisos: this.buildPermisos() };
      }
      this.dialogoRol = true;
    },
    togglePermiso(modId, accion) {
      if (!this.formRol.permisos[modId]) this.$set(this.formRol.permisos, modId, {});
      this.$set(this.formRol.permisos[modId], accion, !this.formRol.permisos[modId][accion]);
    },
    async guardarRol() {
      if (!this.formRol.nombre.trim()) {
        this.$message.error('El nombre del rol es requerido');
        return;
      }
      this.guardandoRol = true;
      try {
        if (this.editandoRol) {
          await this.$service.put(`mi-cuenta/roles/${this.editandoRol.id}`, this.formRol);
          this.$message.success('Rol actualizado');
        } else {
          await this.$service.post('mi-cuenta/roles', this.formRol);
          this.$message.success('Rol creado correctamente');
        }
        this.dialogoRol = false;
        await this.cargarRoles();
      } catch {
        // el interceptor de servicio ya muestra el error del servidor
      } finally {
        this.guardandoRol = false;
      }
    },
    confirmarEliminarRol(r) {
      this.$confirm(`¿Eliminar el rol "${r.nombre}"? Los usuarios asignados quedarán sin rol.`, async () => {
        try {
          await this.$service.delete(`mi-cuenta/roles/${r.id}`);
          await this.cargarRoles();
          this.$message.success('Rol eliminado');
        } catch (e) {
          this.$message.error(e?.mensaje || 'Error al eliminar');
        }
      });
    },
    tieneAlgunPermiso(rol, modId) {
      const perms = rol.permisos && rol.permisos[modId];
      return perms && Object.values(perms).some(v => v === true);
    },

    async cargarUsuarios() {
      this.cargandoUsuarios = true;
      try {
        const data = await this.$service.get('mi-cuenta/usuarios');
        this.usuarios = Array.isArray(data) ? data : [];
      } catch {
        this.usuarios = [];
      } finally {
        this.cargandoUsuarios = false;
      }
    },
    abrirDialogo(usuario = null) {
      this.editando = usuario;
      if (usuario) {
        this.form = {
          nombres: usuario.nombres || '',
          apellidos: usuario.apellidos || '',
          usuario: usuario.usuario || '',
          correoElectronico: usuario.correoElectronico || '',
          contrasena: '',
          rol: usuario.rol || 'COLABORADOR',
          rolClienteId: usuario.rolClienteId || '',
        };
      } else {
        this.form = { nombres: '', apellidos: '', usuario: '', correoElectronico: '', contrasena: '', rol: 'COLABORADOR', rolClienteId: '' };
      }
      this.dialogo = true;
    },
    async guardarUsuario() {
      if (!this.form.nombres || (!this.editando && (!this.form.usuario || !this.form.contrasena))) {
        this.$message.error('Completa los campos requeridos');
        return;
      }
      this.guardandoUsuario = true;
      try {
        const payload = { ...this.form };
        if (this.editando && !payload.contrasena) delete payload.contrasena;
        if (this.editando) {
          delete payload.usuario;
          await this.$service.put(`mi-cuenta/usuarios/${this.editando.id}`, payload);
        } else {
          await this.$service.post('mi-cuenta/usuarios', payload);
        }
        this.dialogo = false;
        await this.cargarUsuarios();
        this.$message.success(this.editando ? 'Usuario actualizado' : 'Usuario creado correctamente');
      } catch {
        // el interceptor de servicio ya muestra el error del servidor
      } finally {
        this.guardandoUsuario = false;
      }
    },
    confirmarEliminar(u) {
      this.$confirm(`¿Eliminar al usuario "${u.nombres}"?`, async () => {
        try {
          await this.$service.delete(`mi-cuenta/usuarios/${u.id}`);
          await this.cargarUsuarios();
          this.$message.success('Usuario eliminado');
        } catch (e) {
          this.$message.error(e?.mensaje || 'Error al eliminar');
        }
      });
    },
    initials(nombres) {
      return (nombres || 'U').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    },
    avatarColor(nombre) {
      const colors = ['#6366f133', '#8b5cf633', '#c9644233', '#06b6d433', '#22c55e33'];
      const idx = (nombre || 'A').charCodeAt(0) % colors.length;
      return colors[idx];
    },
  },
};
</script>

<style scoped>
.ide-mod { display: flex; height: 100%; overflow: hidden; background: var(--bg); }

/* Sub-nav */
.ide-subnav {
  width: 200px; flex-shrink: 0;
  background: var(--bg-s); border-right: 1px solid var(--b2);
  display: flex; flex-direction: column; padding: 20px 12px; gap: 4px;
}
.ide-sn-hd {
  display: flex; align-items: center; gap: 10px;
  padding: 0 4px; margin-bottom: 16px;
}
.ide-sn-ico {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ide-sn-title { font-size: 14px; font-weight: 800; color: var(--t1); }
.ide-sn-sub { font-size: 10px; font-weight: 600; }

.ide-sn-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 10px; border-radius: 8px; border: none; cursor: pointer;
  background: transparent; color: var(--t4); font-size: 12px; font-weight: 500;
  width: 100%; text-align: left; transition: all 0.15s;
}
.ide-sn-btn:hover { background: var(--bg-c); color: var(--t3); }
.ide-sn-btn--a { background: #6366f122; color: #818cf8; font-weight: 700; }

/* Body */
.ide-body { flex: 1; overflow-y: auto; padding: 28px 32px; }

.ide-sec-hd { margin-bottom: 24px; }
.ide-sec-hd h2 { font-size: 18px; font-weight: 800; color: var(--t1); margin: 0 0 4px; }
.ide-sec-hd p { font-size: 12px; color: var(--t4); margin: 0; }

.mc-loading { color: var(--t5); font-size: 13px; padding: 20px 0; }
.mc-empty { color: var(--t5); font-size: 13px; padding: 40px; text-align: center; }

/* Form */
.mc-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.ide-field { display: flex; flex-direction: column; gap: 5px; }
.ide-field label { font-size: 11px; font-weight: 700; color: var(--t3); }
.ide-input {
  background: var(--bg-e); border: 1px solid var(--b0); border-radius: 8px;
  color: var(--t2); font-size: 13px; padding: 9px 11px; outline: none;
  font-family: inherit; transition: border-color 0.15s; width: 100%;
}
.ide-input:focus { border-color: #6366f1; }
.ide-input::placeholder { color: var(--b3); }
.ide-select {
  background: var(--bg-e); border: 1px solid var(--b0); border-radius: 8px;
  color: var(--t2); font-size: 13px; padding: 9px 11px; outline: none;
  font-family: inherit; width: 100%;
}

/* Card */
.ide-ia-card {
  background: var(--bg-e); border: 1px solid var(--b2);
  border-radius: 10px; padding: 16px;
}


/* Tags */
.mc-tag {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--b2); color: var(--t3); font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 6px;
}
.mc-tag-rm {
  background: none; border: none; color: var(--t4); cursor: pointer;
  padding: 0; font-size: 14px; line-height: 1;
}
.mc-tag-rm:hover { color: #ef4444; }

/* User list */
.mc-user-list { display: flex; flex-direction: column; gap: 8px; max-width: 680px; }
.mc-user-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-s); border: 1px solid var(--b2); border-radius: 10px;
  padding: 12px 16px;
}
.mc-user-avatar {
  width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #818cf8;
}
.mc-user-info { flex: 1; min-width: 0; }
.mc-user-name { font-size: 13px; font-weight: 700; color: var(--t2); }
.mc-user-meta { font-size: 11px; color: var(--t4); }

.mc-user-rol {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  flex-shrink: 0;
}
.mc-rol--admin { background: #6366f122; color: #818cf8; }
.mc-rol--colab { background: var(--bg-c); color: var(--t4); }

.mc-user-actions { display: flex; gap: 4px; }
.mc-act-btn {
  background: none; border: none; color: var(--t5); cursor: pointer;
  padding: 5px; border-radius: 6px; transition: color 0.15s;
}
.mc-act-btn:hover { color: var(--t3); }
.mc-act-btn--del:hover { color: #ef4444; }

/* Dialog */
.ide-card { background: var(--bg-c) !important; border: 1px solid var(--b3); }
.ide-card-title { font-size: 15px !important; font-weight: 800 !important; color: var(--t1) !important; padding: 20px 24px 12px !important; }

/* Horario grid */
.mc-horario-grid { display: flex; flex-direction: column; gap: 0; }

.mc-dia-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--b2);
}
.mc-dia-row:last-child { border-bottom: none; }

.mc-dia-toggle {
  flex-shrink: 0 !important; width: 96px !important;
  padding: 7px 10px !important; border-radius: 7px !important;
  border: 1px solid #2d3f5a !important;
  background: var(--bg) !important; color: #4b5e7a !important;
  font-size: 11px !important; font-weight: 700 !important;
  cursor: pointer !important; transition: all 0.15s !important;
  text-align: center !important; outline: none !important;
}
.mc-dia-toggle--on {
  background: rgba(99,102,241,0.15) !important;
  color: #818cf8 !important;
  border-color: #6366f1 !important;
}
.mc-dia-toggle:hover:not(.mc-dia-toggle--on) {
  border-color: #4b5e7a !important; color: var(--t3) !important;
}
.mc-dia-toggle-label { display: block; pointer-events: none; }

.mc-franjas {
  flex: 1; display: flex; flex-direction: column; gap: 6px; padding-top: 2px;
}

.mc-franja {
  display: flex; align-items: center; gap: 8px;
}

.mc-time-input {
  width: 106px !important; padding: 6px 8px !important;
  font-size: 12px !important; flex-shrink: 0;
}

.mc-franja-sep { color: var(--t5) !important; font-size: 13px; flex-shrink: 0; }

.mc-franja-rm {
  background: none !important; border: none !important;
  color: #2d3f5a !important; cursor: pointer !important;
  padding: 4px !important; border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.15s; flex-shrink: 0;
}
.mc-franja-rm:hover { color: #ef4444 !important; }

.mc-add-franja {
  display: inline-flex !important; align-items: center !important; gap: 5px !important;
  background: none !important; border: 1px dashed #2d3f5a !important;
  border-radius: 6px !important; color: #4b5e7a !important;
  font-size: 11px !important; font-weight: 600 !important;
  cursor: pointer !important; padding: 4px 10px !important;
  transition: all 0.15s; align-self: flex-start; margin-top: 2px;
}
.mc-add-franja:hover {
  border-color: #6366f1 !important; color: #818cf8 !important;
}

.mc-dia-off {
  font-size: 11px !important; color: #2d3f5a !important; padding: 6px 0;
}

/* Primary / ghost buttons — override Vuetify dark-theme inheritance */
.mc-btn {
  display: inline-flex !important; align-items: center !important;
  justify-content: center !important; gap: 6px !important;
  border-radius: 8px !important; border: none !important;
  font-size: 13px !important; font-weight: 600 !important;
  padding: 9px 18px !important; cursor: pointer !important;
  transition: background 0.15s, opacity 0.15s !important;
  white-space: nowrap !important; outline: none !important;
  font-family: inherit !important;
}
.mc-btn:disabled { opacity: 0.55 !important; cursor: not-allowed !important; }
.mc-btn--sm { font-size: 12px !important; padding: 7px 14px !important; }

.mc-btn--primary {
  background: #6366f1 !important; color: #ffffff !important;
}
.mc-btn--primary:hover:not(:disabled) { background: #4f46e5 !important; }

.mc-btn--ghost {
  background: var(--bg-c) !important; color: var(--t3) !important;
  border: 1px solid var(--b3) !important;
}
.mc-btn--ghost:hover:not(:disabled) { background: #273548 !important; }

/* Rol list */
.mc-rol-list { display: flex; flex-direction: column; gap: 10px; max-width: 720px; }
.mc-rol-card {
  background: var(--bg-s); border: 1px solid var(--b2); border-radius: 10px; padding: 14px 16px;
}
.mc-rol-card__header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.mc-rol-name { font-size: 14px; font-weight: 700; color: var(--t2); }
.mc-rol-desc { font-size: 11px; color: var(--t4); margin-top: 3px; }
.mc-rol-usuarios { font-size: 11px; color: var(--t5); white-space: nowrap; }

.mc-badge { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
.mc-badge--base { background: var(--b1); color: var(--t4); }

.mc-permisos-preview { display: flex; flex-wrap: wrap; gap: 5px; }
.mc-perm-chip {
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 5px;
  background: var(--bg-e); color: var(--b3); border: 1px solid var(--b2);
}
.mc-perm-chip--on { background: #6366f122; color: #818cf8; border-color: #6366f133; }

/* Matriz de permisos */
.mc-matriz { border: 1px solid var(--b2); border-radius: 8px; overflow: hidden; }
.mc-matriz-header, .mc-matriz-row {
  display: grid;
  grid-template-columns: 140px repeat(6, 1fr);
}
.mc-matriz-header {
  background: var(--bg-e); padding: 8px 10px;
  font-size: 10px; font-weight: 700; color: var(--t5); text-transform: uppercase; letter-spacing: 0.5px;
}
.mc-matriz-row {
  padding: 8px 10px; border-top: 1px solid var(--b2); align-items: center;
}
.mc-matriz-row:hover { background: var(--b1); }
.mc-mz-mod { font-size: 12px; font-weight: 600; color: var(--t3); }
.mc-mz-acc { display: flex; align-items: center; justify-content: center; }
.mc-mz-na { color: var(--b0); font-size: 12px; text-align: center; display: block; width: 100%; }

.mc-perm-toggle {
  width: 24px !important; height: 24px !important;
  border-radius: 5px !important; border: 1px solid var(--b0) !important;
  background: var(--bg) !important; color: var(--b3) !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
  cursor: pointer !important; transition: all 0.15s !important; padding: 0 !important;
}
.mc-perm-toggle--on {
  background: #6366f122 !important; color: #818cf8 !important; border-color: #6366f1 !important;
}
.mc-perm-toggle:hover:not(.mc-perm-toggle--on) { border-color: var(--b3) !important; color: var(--t5) !important; }

.mc-user-rol-custom { font-size: 9px; color: #6366f1; font-weight: 600; }

/* Tag remove */
.mc-tag-rm {
  background: none !important; border: none !important;
  color: var(--t4) !important; cursor: pointer !important;
  padding: 0 !important; font-size: 15px !important; line-height: 1 !important;
}
.mc-tag-rm:hover { color: #ef4444 !important; }
</style>
