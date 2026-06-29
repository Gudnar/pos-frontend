<template>
  <div class="cj-root">

    <!-- Tab bar -->
    <div class="cj-tabs">
      <button :class="['cj-tab', subTab === 'dia' && 'cj-tab--active']" @click="subTab = 'dia'">
        Apertura del Día
        <span v-if="sesionesAbiertas" class="cj-tab-badge cj-tab-badge--open">{{ sesionesAbiertas }} abiertas</span>
      </button>
      <button :class="['cj-tab', subTab === 'gestion' && 'cj-tab--active']" @click="subTab = 'gestion'">
        Gestión de Cajas
        <span class="cj-tab-count">{{ cajas.length }}</span>
      </button>
    </div>

    <!-- ── TAB: APERTURA DEL DÍA ─────────────────────────────── -->
    <div v-show="subTab === 'dia'" class="cj-panel">

      <!-- Toolbar -->
      <div class="cj-toolbar">
        <div class="cj-toolbar__left">
          <div class="cj-fecha-label">{{ fechaDiaLabel }}</div>
          <input v-model="fechaDia" class="cj-fecha-input" type="date" @change="cargarSesionesDia" />
          <button class="cj-btn-icon" title="Actualizar" @click="cargarSesionesDia">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          </button>
        </div>
        <button class="cj-btn-primary" @click="abrirAbrirModal">+ Abrir Caja</button>
      </div>

      <!-- Banner sesión activa del usuario -->
      <div v-if="sesionActiva" class="cj-banner-activa">
        <div class="cj-banner-dot"></div>
        <div class="cj-banner-info">
          <span class="cj-banner-caja">{{ sesionActivaNombreCaja }}</span>
          <span class="cj-banner-sep">·</span>
          <span>Desde <strong>{{ formatHora(sesionActiva.fechaApertura) }}</strong></span>
          <span class="cj-banner-sep">·</span>
          <span><strong style="color:#818cf8;">{{ sesionActiva.nroVentas }}</strong> ventas</span>
          <span class="cj-banner-sep">·</span>
          <span>Bs. <strong style="color:#818cf8;">{{ fmtMonto(sesionActiva.totalVentas) }}</strong></span>
        </div>
        <button class="cj-btn-cerrar-activa" @click="iniciarCierrePropia">Cerrar mi sesión</button>
      </div>

      <!-- Tabla -->
      <div v-if="loadingSesiones" class="cj-loading">
        <div class="cj-spinner"></div> Cargando sesiones...
      </div>
      <div v-else-if="!sesionesDia.length" class="cj-empty">
        Sin aperturas registradas para este día.
      </div>
      <div v-else class="cj-table-wrap">
        <table class="cj-table">
          <thead>
            <tr>
              <th>Caja</th>
              <th>Sucursal</th>
              <th>Usuario</th>
              <th>Apertura</th>
              <th style="text-align:right;">M. Inicial (Bs.)</th>
              <th style="text-align:right;">Ventas</th>
              <th>Estado</th>
              <th style="text-align:right;">M. Cierre (Bs.)</th>
              <th style="text-align:right;">Diferencia</th>
              <th>Cierre</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sesionesDia" :key="s.id" :class="esMiSesion(s) && 'cj-row--mine'">
              <td>
                <strong>{{ s.nombreCaja }}</strong>
              </td>
              <td style="color:var(--t4);font-size:11px;">{{ sucursalNombre(s.sucursalId) }}</td>
              <td style="font-size:11px;">{{ s.nombreUsuario || '—' }}</td>
              <td style="font-size:11px;color:var(--t3);">{{ formatFechaHora(s.fechaApertura) }}</td>
              <td style="text-align:right;font-weight:600;">{{ fmtMonto(s.montoInicial) }}</td>
              <td style="text-align:right;">
                <div style="font-size:12px;color:var(--scroll);">{{ s.nroVentas }}</div>
                <div style="font-size:10px;color:#6366f1;">Bs. {{ fmtMonto(s.totalVentas) }}</div>
              </td>
              <td>
                <span :class="['cj-badge', s.estadoSesion === 'ABIERTA' ? 'cj-badge--open' : 'cj-badge--closed']">
                  {{ s.estadoSesion === 'ABIERTA' ? 'Abierta' : 'Cerrada' }}
                </span>
              </td>
              <td style="text-align:right;">
                <span v-if="s.montoFinal != null" style="font-weight:600;">{{ fmtMonto(s.montoFinal) }}</span>
                <span v-else style="color:var(--b3);">—</span>
              </td>
              <td style="text-align:right;">
                <span
                  v-if="s.diferencia != null"
                  :style="{ color: Number(s.diferencia) >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }"
                >
                  {{ Number(s.diferencia) >= 0 ? '+' : '' }}{{ fmtMonto(s.diferencia) }}
                </span>
                <span v-else style="color:var(--b3);">—</span>
              </td>
              <td style="font-size:10px;color:var(--t5);">
                <span v-if="s.fechaCierre">{{ formatHora(s.fechaCierre) }}</span>
                <span v-else>—</span>
              </td>
              <td>
                <button
                  v-if="s.estadoSesion === 'ABIERTA'"
                  class="cj-btn-sm cj-btn-danger"
                  @click="iniciarCierre(s)"
                >Cerrar</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="cj-tfoot">
              <td colspan="4" style="text-align:right;font-size:11px;color:var(--t5);padding:10px 12px;">Totales del día</td>
              <td style="text-align:right;font-weight:700;color:var(--t2);padding:10px 12px;">{{ fmtMonto(totalInicialDia) }}</td>
              <td style="text-align:right;padding:10px 12px;">
                <div style="font-size:12px;color:var(--scroll);">{{ totalVentasNro }}</div>
                <div style="font-size:10px;color:#6366f1;">Bs. {{ fmtMonto(totalVentasMonto) }}</div>
              </td>
              <td></td>
              <td style="text-align:right;font-weight:700;color:var(--t2);padding:10px 12px;">{{ fmtMonto(totalCierreDia) }}</td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ── TAB: GESTIÓN DE CAJAS ─────────────────────────────── -->
    <div v-show="subTab === 'gestion'" class="cj-panel cj-panel--gestion">
      <div class="cp-uni-layout">

        <!-- Lista -->
        <div class="cp-uni-list-col">
          <div class="cp-col-header" style="border-radius:14px 14px 0 0;">
            <div>
              <div class="cp-col-title">Cajas Registradoras</div>
              <div class="cp-col-count">{{ cajas.length }} cajas</div>
            </div>
            <button class="cp-add-btn" @click="abrirFormCaja()">+ Nueva</button>
          </div>
          <input v-model="q" class="cp-search" placeholder="Buscar caja..." />
          <div class="cp-list">
            <div v-if="loading" class="cp-loading"><div class="ct-spinner"></div></div>
            <div v-else-if="!filtradas.length" class="cp-empty">Sin cajas registradas</div>
            <div
              v-else
              v-for="c in filtradas" :key="c.id"
              :class="['cp-uni-row', editando && editando.id === c.id ? 'cp-uni-row--active' : '']"
              @click="abrirFormCaja(c)"
            >
              <div class="cp-dot" :style="`background:${c.activo ? '#6366f1' : 'var(--b3)'};flex-shrink:0;`"></div>
              <div style="flex:1;min-width:0;">
                <div class="cp-uni-name">{{ c.nombre }}</div>
                <div style="font-size:10px;color:var(--t5);margin-top:1px;">{{ sucursalNombre(c.sucursalId) }}</div>
              </div>
              <span :class="['ct-badge', !c.activo ? 'ct-badge--off' : 'ct-badge--on']" style="font-size:9px;flex-shrink:0;">
                {{ c.activo ? 'Activa' : 'Inactiva' }}
              </span>
              <button class="cp-icon-btn cp-icon-btn--danger" style="flex-shrink:0;" @click.stop="eliminar(c)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Form -->
        <div class="cp-uni-form-col">
          <div class="cp-col-header" style="border-radius:14px 14px 0 0;">
            <div class="cp-col-title">{{ editando ? 'Editar Caja' : 'Nueva Caja' }}</div>
            <button v-if="editando" class="cp-icon-btn" @click="abrirFormCaja()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div style="padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div class="ide-field">
              <label>Nombre *</label>
              <input v-model="form.nombre" class="ide-input" placeholder="Ej: Caja 1, Caja Principal..." />
            </div>
            <div class="ide-field">
              <label>Descripción</label>
              <input v-model="form.descripcion" class="ide-input" placeholder="Descripción opcional" />
            </div>
            <div class="ide-field">
              <label>Sucursal *</label>
              <select v-model="form.sucursalId" class="ide-select">
                <option value="">Seleccionar...</option>
                <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
              </select>
            </div>
            <div class="ide-field" style="flex-direction:row;align-items:center;gap:8px;">
              <input id="chk-activa" v-model="form.activo" type="checkbox" style="width:15px;height:15px;cursor:pointer;" />
              <label for="chk-activa" style="cursor:pointer;margin:0;font-size:12px;">Caja activa</label>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px;">
              <button v-if="editando" class="ct-btn-cancel" style="flex:1;" @click="abrirFormCaja()">Cancelar</button>
              <button class="ct-btn-ok" style="flex:2;" :disabled="saving" @click="guardar">
                {{ saving ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear Caja') }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ── MODAL: ABRIR SESIÓN ────────────────────────────────── -->
    <transition name="modal-fade">
      <div v-if="abrirModal" class="ct-modal-backdrop">
        <div class="ct-modal" style="max-width:380px;">
          <div class="ct-modal-header">
            <span>Apertura de Caja</span>
            <button class="ct-modal-close" @click="abrirModal = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div class="ide-field">
                <label>Caja *</label>
                <select v-model="abrirForm.cajaId" class="ide-select">
                  <option value="">— Seleccionar caja —</option>
                  <option v-for="c in cajasActivas" :key="c.id" :value="c.id">
                    {{ c.nombre }} — {{ sucursalNombre(c.sucursalId) }}
                  </option>
                </select>
              </div>
              <div class="ide-field">
                <label>Monto inicial — Efectivo en caja (Bs.)</label>
                <input v-model.number="abrirForm.montoInicial" class="ide-input" type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
              <div class="ide-field">
                <label>Observaciones de apertura (opcional)</label>
                <textarea v-model="abrirForm.observaciones" class="ide-textarea" rows="2" placeholder="Ej: Turno mañana, efectivo recibido de gerencia..."></textarea>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="abrirModal = false">Cancelar</button>
            <button class="ct-btn-ok" style="background:#22c55e;" :disabled="savingSesion" @click="abrirSesion">
              {{ savingSesion ? 'Abriendo...' : 'Abrir Sesión' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── MODAL: CIERRE DE SESIÓN ────────────────────────────── -->
    <transition name="modal-fade">
      <div v-if="cierreModal" class="ct-modal-backdrop">
        <div class="ct-modal" style="max-width:420px;">
          <div class="ct-modal-header">
            <div>
              <div>Cierre de Caja</div>
              <div style="font-size:11px;color:var(--t5);font-weight:400;margin-top:2px;">{{ cierreSesion && cierreSesion.nombreCaja }}</div>
            </div>
            <button class="ct-modal-close" @click="cierreModal = false">✕</button>
          </div>
          <div class="ct-modal-body" v-if="cierreSesion">

            <!-- Datos de trazabilidad -->
            <div class="cj-resumen-cierre">
              <div class="cj-resumen-fila">
                <span>Sucursal</span>
                <strong>{{ sucursalNombre(cierreSesion.sucursalId) }}</strong>
              </div>
              <div class="cj-resumen-fila">
                <span>Usuario que abrió</span>
                <strong>{{ cierreSesion.nombreUsuario || '—' }}</strong>
              </div>
              <div class="cj-resumen-fila">
                <span>Hora de apertura</span>
                <strong>{{ formatFechaHora(cierreSesion.fechaApertura) }}</strong>
              </div>
              <div class="cj-resumen-fila">
                <span>Monto inicial</span>
                <strong>Bs. {{ fmtMonto(cierreSesion.montoInicial) }}</strong>
              </div>
              <div class="cj-resumen-fila">
                <span>Ventas del turno ({{ cierreSesion.nroVentas }})</span>
                <strong style="color:#818cf8;">+ Bs. {{ fmtMonto(cierreSesion.totalVentas) }}</strong>
              </div>
              <div class="cj-resumen-fila cj-resumen-fila--total">
                <span>Efectivo esperado</span>
                <strong style="color:var(--t2);">Bs. {{ fmtMonto(montoEsperadoCierre) }}</strong>
              </div>
            </div>

            <!-- Conteo real -->
            <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px;">
              <div class="ide-field">
                <label>Efectivo contado físicamente en caja (Bs.) *</label>
                <input v-model.number="cierreForm.montoFinal" class="ide-input" type="number" min="0" step="0.01" placeholder="0.00" />
              </div>

              <!-- Diferencia en tiempo real -->
              <div class="cj-diferencia-box"
                :class="diferenciaCierrePositivo ? 'cj-diferencia-box--pos' : diferenciaNota === 'Faltante' ? 'cj-diferencia-box--neg' : 'cj-diferencia-box--ok'">
                <span class="cj-diferencia-label">Diferencia</span>
                <strong class="cj-diferencia-val">
                  {{ diferenciaCierrePositivo ? '+' : '' }}Bs. {{ fmtMonto(diferenciaCierre) }}
                </strong>
                <span class="cj-diferencia-nota">
                  {{ diferenciaNota }}
                </span>
              </div>

              <div class="ide-field">
                <label>Observaciones de cierre</label>
                <textarea v-model="cierreForm.observaciones" class="ide-textarea" rows="2" placeholder="Incidencias, notas del turno..."></textarea>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="cierreModal = false">Cancelar</button>
            <button class="ct-btn-ok" style="background:#ef4444;" :disabled="savingSesion" @click="cerrarSesion">
              {{ savingSesion ? 'Cerrando...' : 'Confirmar Cierre' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
const emptyForm = () => ({ nombre: '', descripcion: '', sucursalId: '', activo: true })
const todayStr = () => new Date().toISOString().split('T')[0]

export default {
  name: 'Caja',
  data: () => ({
    subTab: 'dia',
    // Tab día
    fechaDia: todayStr(),
    sesionesDia: [],
    loadingSesiones: false,
    sesionActiva: null,
    // Abrir modal
    abrirModal: false,
    abrirForm: { cajaId: '', montoInicial: 0, observaciones: '' },
    savingSesion: false,
    // Cierre modal
    cierreModal: false,
    cierreSesion: null,
    cierreForm: { montoFinal: 0, observaciones: '' },
    // Gestión
    cajas: [],
    loading: false,
    q: '',
    editando: null,
    form: emptyForm(),
    saving: false,
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
    sucursalActualId() { return this.$store.getters.sucursalActualId },
    filtradas() {
      const q = this.q.toLowerCase()
      return this.cajas.filter(c => !q || c.nombre.toLowerCase().includes(q))
    },
    cajasActivas() {
      return this.cajas.filter(c => c.activo)
    },
    sesionesAbiertas() {
      return this.sesionesDia.filter(s => s.estadoSesion === 'ABIERTA').length
    },
    sesionActivaEnTabla() {
      if (!this.sesionActiva) return null
      return this.sesionesDia.find(s => s.id === this.sesionActiva.id) || null
    },
    sesionActivaNombreCaja() {
      if (!this.sesionActiva) return ''
      const c = this.cajas.find(x => x.id === this.sesionActiva.cajaId)
      return c ? c.nombre : 'Caja'
    },
    fechaDiaLabel() {
      try {
        return new Date(this.fechaDia + 'T12:00:00').toLocaleDateString('es-BO', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
      } catch { return this.fechaDia }
    },
    totalInicialDia() {
      return this.sesionesDia.reduce((s, x) => s + Number(x.montoInicial || 0), 0)
    },
    totalVentasNro() {
      return this.sesionesDia.reduce((s, x) => s + Number(x.nroVentas || 0), 0)
    },
    totalVentasMonto() {
      return this.sesionesDia.reduce((s, x) => s + Number(x.totalVentas || 0), 0)
    },
    totalCierreDia() {
      return this.sesionesDia
        .filter(s => s.montoFinal != null)
        .reduce((s, x) => s + Number(x.montoFinal || 0), 0)
    },
    montoEsperadoCierre() {
      if (!this.cierreSesion) return 0
      return Number(this.cierreSesion.montoInicial || 0) + Number(this.cierreSesion.totalVentas || 0)
    },
    diferenciaCierre() {
      return Number(this.cierreForm.montoFinal || 0) - this.montoEsperadoCierre
    },
    diferenciaNota() {
      if (this.diferenciaCierre > 0.005) return 'Sobrante'
      if (this.diferenciaCierre < -0.005) return 'Faltante'
      return '✓ Cuadrado'
    },
    diferenciaCierrePositivo() {
      return this.diferenciaCierre > 0.005
    },
  },
  mounted() {
    this.cargar()
    this.cargarSesionesDia()
    this.cargarSesionActiva()
  },
  methods: {
    sucursalNombre(id) {
      const s = this.sucursales.find(x => x.id === id)
      return s ? s.nombre : '—'
    },
    esMiSesion(s) {
      return this.sesionActiva && this.sesionActiva.id === s.id
    },
    fmtMonto(v) {
      return Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    formatFechaHora(d) {
      if (!d) return '—'
      return new Date(d).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    formatHora(d) {
      if (!d) return '—'
      return new Date(d).toLocaleString('es-BO', { hour: '2-digit', minute: '2-digit' })
    },

    // ── Tab Día ──────────────────────────────────────────────
    async cargarSesionesDia() {
      this.loadingSesiones = true
      try {
        let params = `?fecha=${this.fechaDia}`
        if (this.sucursalActualId) params += `&sucursalId=${this.sucursalActualId}`
        this.sesionesDia = await this.$service.list(`caja/sesiones/dia${params}`) || []
      } finally { this.loadingSesiones = false }
    },
    async cargarSesionActiva() {
      try { this.sesionActiva = await this.$service.get('caja/sesion/activa') } catch { this.sesionActiva = null }
    },
    abrirAbrirModal() {
      this.abrirForm = { cajaId: '', montoInicial: 0, observaciones: '' }
      this.abrirModal = true
    },
    async abrirSesion() {
      if (!this.abrirForm.cajaId) return this.$message.error('Selecciona una caja')
      this.savingSesion = true
      try {
        const payload = { cajaId: this.abrirForm.cajaId, montoInicial: this.abrirForm.montoInicial || 0 }
        if (this.abrirForm.observaciones) payload.observaciones = this.abrirForm.observaciones
        await this.$service.post('caja/sesion/abrir', payload)
        this.$message.success('Sesión abierta correctamente')
        this.abrirModal = false
        await Promise.all([this.cargarSesionesDia(), this.cargarSesionActiva()])
      } finally { this.savingSesion = false }
    },
    iniciarCierrePropia() {
      if (!this.sesionActiva) return
      const caja = this.cajas.find(c => c.id === this.sesionActiva.cajaId)
      this.iniciarCierre({
        ...this.sesionActiva,
        nombreCaja: caja ? caja.nombre : this.sesionActivaNombreCaja,
      })
    },
    iniciarCierre(s) {
      if (!s) return
      this.cierreSesion = s
      this.cierreForm = { montoFinal: 0, observaciones: '' }
      this.cierreModal = true
    },
    async cerrarSesion() {
      if (!this.cierreSesion) return
      this.savingSesion = true
      try {
        await this.$service.put(`caja/sesion/${this.cierreSesion.id}/cerrar`, this.cierreForm)
        this.$message.success('Sesión cerrada')
        // Navigate to the session's date so the closed session is visible in the list
        if (this.cierreSesion.fechaApertura) {
          const sessionDate = new Date(this.cierreSesion.fechaApertura).toISOString().split('T')[0]
          if (sessionDate !== this.fechaDia) this.fechaDia = sessionDate
        }
        this.cierreModal = false
        this.cierreSesion = null
        await Promise.all([this.cargarSesionesDia(), this.cargarSesionActiva()])
      } finally { this.savingSesion = false }
    },

    // ── Gestión ──────────────────────────────────────────────
    async cargar() {
      this.loading = true
      try {
        const params = this.sucursalActualId ? `?sucursalId=${this.sucursalActualId}` : ''
        this.cajas = await this.$service.list(`caja${params}`) || []
      } finally { this.loading = false }
    },
    abrirFormCaja(c = null) {
      this.editando = c
      this.form = c
        ? { nombre: c.nombre, descripcion: c.descripcion || '', sucursalId: c.sucursalId, activo: c.activo }
        : emptyForm()
      if (this.sucursalActualId && !this.form.sucursalId) this.form.sucursalId = this.sucursalActualId
    },
    async guardar() {
      if (!this.form.nombre.trim()) return this.$message.error('El nombre es obligatorio')
      if (!this.form.sucursalId) return this.$message.error('Selecciona una sucursal')
      this.saving = true
      try {
        if (this.editando) {
          await this.$service.put(`caja/${this.editando.id}`, this.form)
          this.$message.success('Caja actualizada')
        } else {
          await this.$service.post('caja', this.form)
          this.$message.success('Caja creada')
          this.abrirFormCaja()
        }
        await this.cargar()
      } finally { this.saving = false }
    },
    eliminar(c) {
      this.$confirm(`¿Eliminar la caja "${c.nombre}"?`, async () => {
        await this.$service.delete(`caja/${c.id}`)
        this.$message.success('Caja eliminada')
        if (this.editando?.id === c.id) this.abrirFormCaja()
        await this.cargar()
      })
    },
  },
}
</script>

<style scoped>
/* ── Raíz y tabs ──────────────────────────────────────────────────────── */
.cj-root { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.cj-tabs {
  display: flex; gap: 4px; padding: 0 20px;
  border-bottom: 1px solid var(--b1); background: var(--bg-s); flex-shrink: 0;
}
.cj-tab {
  padding: 10px 18px; border: none; background: none; cursor: pointer;
  font-size: 13px; color: var(--t4); border-bottom: 2px solid transparent;
  transition: all .15s; display: flex; align-items: center; gap: 7px;
}
.cj-tab--active { color: #818cf8; border-bottom-color: #6366f1; font-weight: 600; }
.cj-tab-count {
  background: var(--b1); color: var(--t4); padding: 1px 6px;
  border-radius: 999px; font-size: 11px; font-weight: 600;
}
.cj-tab-badge--open {
  background: #22c55e22; color: #4ade80; padding: 1px 7px;
  border-radius: 999px; font-size: 10px; font-weight: 700; border: 1px solid #22c55e33;
}

/* ── Panels ───────────────────────────────────────────────────────────── */
.cj-panel { flex: 1; overflow-y: auto; padding: 16px 20px 24px; display: flex; flex-direction: column; gap: 12px; }
.cj-panel--gestion { padding: 16px 20px; }

/* ── Toolbar del día ──────────────────────────────────────────────────── */
.cj-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
}
.cj-toolbar__left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cj-fecha-label { font-size: 14px; font-weight: 700; color: var(--t2); text-transform: capitalize; }
.cj-fecha-input {
  padding: 5px 9px; border-radius: 7px; border: 1px solid var(--b1);
  background: var(--bg); color: var(--t3); font-size: 12px; outline: none;
}
.cj-btn-icon {
  padding: 5px 7px; border-radius: 7px; border: 1px solid var(--b1);
  background: var(--b2); color: var(--t5); cursor: pointer; display: flex; align-items: center;
  transition: all .15s;
}
.cj-btn-icon:hover { color: var(--t3); border-color: var(--b4); }
.cj-btn-primary {
  padding: 7px 16px; border-radius: 8px; background: #6366f1; color: #fff;
  border: none; cursor: pointer; font-size: 12px; font-weight: 600; transition: background .15s;
}
.cj-btn-primary:hover { background: #4f46e5; }

/* ── Banner sesión activa ─────────────────────────────────────────────── */
.cj-banner-activa {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 10px 14px; border-radius: 10px;
  background: #0d2b1a; border: 1px solid #22c55e44;
}
.cj-banner-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #4ade80;
  box-shadow: 0 0 6px #4ade80; flex-shrink: 0; animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.cj-banner-info { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; font-size: 12px; color: var(--t3); }
.cj-banner-caja { font-weight: 700; color: #4ade80; }
.cj-banner-sep { color: var(--b0); }
.cj-btn-cerrar-activa {
  padding: 5px 12px; border-radius: 7px; background: #ef444422; color: #f87171;
  border: 1px solid #ef444444; cursor: pointer; font-size: 11px; font-weight: 600;
  flex-shrink: 0; transition: background .15s;
}
.cj-btn-cerrar-activa:hover { background: #ef444433; }

/* ── Tabla de sesiones del día ────────────────────────────────────────── */
.cj-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid var(--b1); }
.cj-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.cj-table th {
  text-align: left; padding: 9px 12px; background: var(--bg-n); color: var(--t4);
  font-weight: 700; border-bottom: 1px solid var(--b1); white-space: nowrap;
  font-size: 10px; text-transform: uppercase; letter-spacing: .4px;
}
.cj-table td { padding: 10px 12px; border-bottom: 1px solid var(--b2); color: var(--scroll); vertical-align: middle; }
.cj-table tr:hover td { background: var(--b1); }
.cj-row--mine td { background: #6366f108; }
.cj-tfoot td { background: var(--bg-n); color: var(--t4); font-size: 11px; border-top: 2px solid var(--b1); }

.cj-badge {
  display: inline-block; padding: 2px 8px; border-radius: 5px; font-size: 10px;
  font-weight: 700; letter-spacing: .3px;
}
.cj-badge--open  { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e33; }
.cj-badge--closed{ background: var(--b2); color: var(--t4); border: 1px solid var(--b1); }

.cj-btn-sm {
  padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
  cursor: pointer; border: 1px solid; transition: all .15s; white-space: nowrap;
}
.cj-btn-danger { background: #ef444411; color: #f87171; border-color: #ef444444; }
.cj-btn-danger:hover { background: #ef444422; }

/* ── Estados vacíos y carga ───────────────────────────────────────────── */
.cj-loading { display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: var(--t5); font-size: 13px; }
.cj-empty   { padding: 50px; text-align: center; color: var(--b3); font-size: 13px; font-style: italic; }
.cj-spinner { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--b0); border-top-color: #6366f1; animation: spin .7s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Resumen cierre modal ─────────────────────────────────────────────── */
.cj-resumen-cierre {
  background: var(--bg-n); border: 1px solid var(--b1); border-radius: 10px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 6px;
}
.cj-resumen-fila {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: var(--t4);
}
.cj-resumen-fila strong { color: var(--scroll); font-size: 12px; }
.cj-resumen-fila--total {
  border-top: 1px solid var(--b1); margin-top: 4px; padding-top: 8px;
  font-weight: 700; color: var(--t3);
}
.cj-resumen-fila--total strong { font-size: 15px; }

.cj-diferencia-box {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  border-radius: 8px; font-size: 12px;
}
.cj-diferencia-box--pos  { background: #22c55e11; border: 1px solid #22c55e33; color: #4ade80; }
.cj-diferencia-box--neg  { background: #ef444411; border: 1px solid #ef444433; color: #f87171; }
.cj-diferencia-box--ok   { background: #6366f111; border: 1px solid #6366f133; color: #818cf8; }
.cj-diferencia-label { font-weight: 600; flex-shrink: 0; }
.cj-diferencia-val   { font-size: 16px; font-weight: 800; }
.cj-diferencia-nota  { font-size: 11px; opacity: .8; }

/* ── Gestión de cajas (reutiliza estilos heredados) ───────────────────── */
.cp-uni-layout { display: flex; gap: 14px; height: 100%; }
.cp-uni-list-col { width: 300px; flex-shrink: 0; background: var(--bg-s); border: 1px solid var(--b1); border-radius: 14px; display: flex; flex-direction: column; overflow: hidden; }
.cp-uni-form-col { flex: 1; background: var(--bg-s); border: 1px solid var(--b1); border-radius: 14px; overflow-y: auto; }
.cp-col-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-n); border-bottom: 1px solid var(--b1); }
.cp-col-title  { font-size: 13px; font-weight: 700; color: var(--t2); }
.cp-col-count  { font-size: 10px; color: var(--t5); margin-top: 1px; }
.cp-add-btn { font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 8px; background: #6366f1; color: #fff; border: none; cursor: pointer; }
.cp-add-btn:hover { background: #4f46e5; }
.cp-search { width: 100%; padding: 8px 12px; font-size: 12px; background: var(--bg); border: none; border-bottom: 1px solid var(--b1); color: var(--t2); outline: none; box-sizing: border-box; }
.cp-search::placeholder { color: var(--b3); }
.cp-list { flex: 1; overflow-y: auto; }
.cp-loading { display: flex; align-items: center; justify-content: center; padding: 30px; }
.cp-empty { padding: 20px; text-align: center; color: var(--b3); font-size: 12px; }
.cp-uni-row { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #0d1a2d; transition: background .15s; }
.cp-uni-row:hover { background: var(--bg-n); }
.cp-uni-row--active { background: var(--b2); border-left: 2px solid #6366f1; }
.cp-uni-name { font-size: 12px; font-weight: 600; color: var(--t2); }
.cp-dot { width: 8px; height: 8px; border-radius: 50%; }
.cp-icon-btn { padding: 5px; border-radius: 6px; background: var(--b1); border: 1px solid var(--b0); color: var(--t4); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.cp-icon-btn:hover { background: var(--b4); color: var(--t3); }
.cp-icon-btn--danger:hover { background: #ef444422; color: #f87171; border-color: #ef444444; }
.ct-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
.ct-badge--on  { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e44; }
.ct-badge--off { background: var(--b2); color: var(--t4); border: 1px solid var(--b1); }

/* ── Formulario inputs ────────────────────────────────────────────────── */
.ide-field { display: flex; flex-direction: column; gap: 4px; }
.ide-field label { font-size: 10px; color: var(--t4); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
.ide-input  { padding: 7px 10px; border-radius: 8px; border: 1px solid var(--b0); background: var(--bg); color: var(--t2); font-size: 12px; outline: none; transition: border-color .15s; width: 100%; box-sizing: border-box; }
.ide-input:focus  { border-color: #6366f1; }
.ide-select { padding: 7px 10px; border-radius: 8px; border: 1px solid var(--b0); background: var(--bg); color: var(--t2); font-size: 12px; outline: none; width: 100%; box-sizing: border-box; }
.ide-textarea { padding: 7px 10px; border-radius: 8px; border: 1px solid var(--b0); background: var(--bg); color: var(--t2); font-size: 12px; outline: none; resize: vertical; width: 100%; box-sizing: border-box; }

/* ── Modal ────────────────────────────────────────────────────────────── */
.ct-modal-backdrop { position: fixed; inset: 0; background: #00000099; display: flex; align-items: center; justify-content: center; z-index: 200; }
.ct-modal { background: var(--bg-s); border: 1px solid var(--b4); border-radius: 16px; width: 90%; max-height: 88vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px #00000088; }
.ct-modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--b1); font-size: 14px; font-weight: 700; color: var(--t2); }
.ct-modal-close  { background: none; border: none; color: var(--t5); cursor: pointer; font-size: 14px; }
.ct-modal-close:hover { color: var(--t2); }
.ct-modal-body   { flex: 1; overflow-y: auto; padding: 14px 16px; }
.ct-modal-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 12px 16px; border-top: 1px solid var(--b1); }
.ct-btn-cancel { padding: 8px 16px; border-radius: 8px; background: var(--b1); color: var(--t4); border: 1px solid var(--b0); cursor: pointer; font-size: 12px; }
.ct-btn-ok     { padding: 8px 18px; border-radius: 8px; background: #6366f1; color: #fff; border: none; cursor: pointer; font-size: 12px; font-weight: 600; }
.ct-btn-ok:disabled { opacity: .5; cursor: not-allowed; }
.ct-btn-ok:hover:not(:disabled) { filter: brightness(1.1); }
.ct-spinner { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--b0); border-top-color: #6366f1; animation: spin .7s linear infinite; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
</style>
