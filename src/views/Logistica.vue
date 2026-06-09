<template>
  <div class="ide-view">
    <div class="ide-view__header">
      <div class="ide-view__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="ide-tab"
          :class="{ 'ide-tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <button v-if="activeTab === 'ordenes'" class="ide-btn ide-btn--primary" @click="abrirOrdenDialog()">
        + Nueva Orden
      </button>
      <button v-if="activeTab === 'monedas'" class="ide-btn ide-btn--primary" @click="abrirMonedaDialog()">
        + Nueva Moneda
      </button>
      <button v-if="activeTab === 'tipos-gasto'" class="ide-btn ide-btn--primary" @click="abrirTipoGastoDialog()">
        + Nuevo Tipo
      </button>
      <button v-if="activeTab === 'paises'" class="ide-btn ide-btn--primary" @click="abrirPaisDialog()">
        + Nuevo País
      </button>
    </div>

    <!-- ── TAB ÓRDENES ────────────────────────────────────── -->
    <div v-show="activeTab === 'ordenes'" class="ide-view__body">
      <div class="ide-search-row">
        <input v-model="qOrdenes" class="ide-input" placeholder="Buscar por número o país..." @input="cargarOrdenes" />
      </div>
      <div v-if="loadingOrdenes" class="ide-loading">Cargando...</div>
      <div v-else-if="!ordenes.length" class="ide-empty">No hay órdenes de importación registradas.</div>
      <table v-else class="ide-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>País Origen</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Total Compra</th>
            <th>Costo Total Base</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in ordenes" :key="o.id">
            <td><strong>{{ o.numero }}</strong></td>
            <td>{{ o.paisOrigen }}</td>
            <td>{{ o.fechaOrden }}</td>
            <td><span class="ide-chip" :class="chipEstado(o.estadoOrden)">{{ o.estadoOrden }}</span></td>
            <td>{{ fmtNum(o.totalProductosMonedaCompra) }}</td>
            <td>{{ fmtNum(o.costoTotalMonedaBase) }}</td>
            <td class="ide-actions">
              <button class="ide-btn ide-btn--sm ide-btn--primary" @click="irDetalle(o.id)" title="Ver detalle">Ver</button>
              <button class="ide-btn ide-btn--sm" @click="abrirOrdenDialog(o)" title="Editar" :disabled="o.estadoOrden === 'CERRADO'">Editar</button>
              <button class="ide-btn ide-btn--sm ide-btn--danger" @click="eliminarOrden(o)" title="Eliminar" :disabled="o.estadoOrden !== 'BORRADOR'">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── TAB MONEDAS ────────────────────────────────────── -->
    <div v-show="activeTab === 'monedas'" class="ide-view__body">
      <div class="ide-search-row">
        <input v-model="qMonedas" class="ide-input" placeholder="Buscar moneda..." />
      </div>
      <div v-if="loadingMonedas" class="ide-loading">Cargando...</div>
      <div v-else-if="!monedasFiltradas.length" class="ide-empty">No hay monedas registradas.</div>
      <table v-else class="ide-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Símbolo</th>
            <th>Moneda Base</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in monedasFiltradas" :key="m.id">
            <td><strong>{{ m.codigo }}</strong></td>
            <td>{{ m.nombre }}</td>
            <td>{{ m.simbolo }}</td>
            <td>
              <span v-if="m.esMonedaBase" class="ide-chip ide-chip--success">BASE</span>
              <button v-else class="ide-btn ide-btn--sm ide-btn--outline" @click="setMonedaBase(m)">Marcar base</button>
            </td>
            <td><span class="ide-chip" :class="m.activo ? 'ide-chip--success' : 'ide-chip--grey'">{{ m.activo ? 'Activo' : 'Inactivo' }}</span></td>
            <td class="ide-actions">
              <button class="ide-btn ide-btn--sm" @click="abrirMonedaDialog(m)">Editar</button>
              <button class="ide-btn ide-btn--sm ide-btn--danger" @click="eliminarMoneda(m)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── TAB TIPOS DE GASTO ─────────────────────────────── -->
    <div v-show="activeTab === 'tipos-gasto'" class="ide-view__body">
      <div class="ide-search-row">
        <input v-model="qTipos" class="ide-input" placeholder="Buscar tipo de gasto..." />
      </div>
      <div v-if="loadingTipos" class="ide-loading">Cargando...</div>
      <div v-else-if="!tiposFiltrados.length" class="ide-empty">No hay tipos de gasto registrados.</div>
      <table v-else class="ide-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tiposFiltrados" :key="t.id">
            <td><strong>{{ t.nombre }}</strong></td>
            <td>{{ t.descripcion || '—' }}</td>
            <td><span class="ide-chip" :class="t.activo ? 'ide-chip--success' : 'ide-chip--grey'">{{ t.activo ? 'Activo' : 'Inactivo' }}</span></td>
            <td class="ide-actions">
              <button class="ide-btn ide-btn--sm" @click="abrirTipoGastoDialog(t)">Editar</button>
              <button class="ide-btn ide-btn--sm ide-btn--danger" @click="eliminarTipoGasto(t)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── TAB PAÍSES ───────────────────────────────────────── -->
    <div v-show="activeTab === 'paises'" class="ide-view__body">
      <div class="ide-search-row">
        <input v-model="qPaises" class="ide-input" placeholder="Buscar país..." />
      </div>
      <div v-if="loadingPaises" class="ide-loading">Cargando...</div>
      <div v-else-if="!paisesFiltrados.length" class="ide-empty">No hay países registrados.</div>
      <table v-else class="ide-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in paisesFiltrados" :key="p.id">
            <td><strong>{{ p.codigo || '—' }}</strong></td>
            <td>{{ p.nombre }}</td>
            <td><span class="ide-chip" :class="p.activo ? 'ide-chip--success' : 'ide-chip--grey'">{{ p.activo ? 'Activo' : 'Inactivo' }}</span></td>
            <td class="ide-actions">
              <button class="ide-btn ide-btn--sm" @click="abrirPaisDialog(p)">Editar</button>
              <button class="ide-btn ide-btn--sm ide-btn--danger" @click="eliminarPais(p)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── DIALOG ORDEN ───────────────────────────────────── -->
    <div v-if="ordenDialog" class="ide-modal-overlay" @click.self="ordenDialog = false">
      <div class="ide-modal">
        <div class="ide-modal__header">
          <h3>{{ editandoOrden ? 'Editar Orden' : 'Nueva Orden de Importación' }}</h3>
          <button class="ide-modal__close" @click="ordenDialog = false">✕</button>
        </div>
        <div class="ide-modal__body ide-form-grid">
          <div class="ide-field">
            <label>País de Origen *</label>
            <select v-model="ordenForm.paisOrigen" class="ide-input">
              <option v-for="p in paises" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Proveedor</label>
            <select v-model="ordenForm.proveedorId" class="ide-input">
              <option value="">— Sin proveedor —</option>
              <option v-for="p in proveedores" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Moneda de Compra</label>
            <select v-model="ordenForm.monedaCompraId" class="ide-input">
              <option value="">— Seleccionar —</option>
              <option v-for="m in monedas" :key="m.id" :value="m.id">{{ m.codigo }} — {{ m.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Fecha de Orden *</label>
            <input v-model="ordenForm.fechaOrden" class="ide-input" type="date" />
          </div>
          <div class="ide-field">
            <label>Fecha Estimada de Llegada</label>
            <input v-model="ordenForm.fechaEstimadaLlegada" class="ide-input" type="date" />
          </div>
          <div class="ide-field">
            <label>Método de Distribución de Costos</label>
            <select v-model="ordenForm.metodoDistribucion" class="ide-input">
              <option value="POR_VALOR">Proporcional al valor</option>
              <option value="POR_CANTIDAD">Proporcional a la cantidad</option>
            </select>
          </div>
          <div class="ide-field ide-field--full" v-if="editandoOrden">
            <label>Estado</label>
            <select v-model="ordenForm.estadoOrden" class="ide-input">
              <option value="BORRADOR">BORRADOR</option>
              <option value="EN_TRANSITO">EN TRÁNSITO</option>
              <option value="EN_ADUANA">EN ADUANA</option>
              <option value="RECIBIDO">RECIBIDO</option>
            </select>
          </div>
          <div class="ide-field ide-field--full">
            <label>Observaciones</label>
            <textarea v-model="ordenForm.observaciones" class="ide-input" rows="2" />
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="ordenDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarOrden">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── DIALOG MONEDA ──────────────────────────────────── -->
    <div v-if="monedaDialog" class="ide-modal-overlay" @click.self="monedaDialog = false">
      <div class="ide-modal ide-modal--sm">
        <div class="ide-modal__header">
          <h3>{{ editandoMoneda ? 'Editar Moneda' : 'Nueva Moneda' }}</h3>
          <button class="ide-modal__close" @click="monedaDialog = false">✕</button>
        </div>
        <div class="ide-modal__body ide-form-grid">
          <div class="ide-field">
            <label>Código *</label>
            <input v-model="monedaForm.codigo" class="ide-input" placeholder="Ej: USD, PEN, CNY" />
          </div>
          <div class="ide-field">
            <label>Nombre *</label>
            <input v-model="monedaForm.nombre" class="ide-input" placeholder="Ej: Dólar Americano" />
          </div>
          <div class="ide-field">
            <label>Símbolo *</label>
            <input v-model="monedaForm.simbolo" class="ide-input" placeholder="Ej: $, S/, ¥" />
          </div>
          <div class="ide-field">
            <label>Estado</label>
            <select v-model="monedaForm.estado" class="ide-input">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="monedaDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarMoneda">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── DIALOG TIPO GASTO ──────────────────────────────── -->
    <div v-if="tipoGastoDialog" class="ide-modal-overlay" @click.self="tipoGastoDialog = false">
      <div class="ide-modal ide-modal--sm">
        <div class="ide-modal__header">
          <h3>{{ editandoTipoGasto ? 'Editar Tipo de Gasto' : 'Nuevo Tipo de Gasto' }}</h3>
          <button class="ide-modal__close" @click="tipoGastoDialog = false">✕</button>
        </div>
        <div class="ide-modal__body">
          <div class="ide-field">
            <label>Nombre *</label>
            <input v-model="tipoGastoForm.nombre" class="ide-input" placeholder="Ej: Flete Internacional" />
          </div>
          <div class="ide-field">
            <label>Descripción</label>
            <textarea v-model="tipoGastoForm.descripcion" class="ide-input" rows="2" />
          </div>
          <div class="ide-field">
            <label>Estado</label>
            <select v-model="tipoGastoForm.estado" class="ide-input">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="tipoGastoDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarTipoGasto">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
    <!-- ── DIALOG PAÍS ──────────────────────────────────────── -->
    <div v-if="paisDialog" class="ide-modal-overlay" @click.self="paisDialog = false">
      <div class="ide-modal ide-modal--sm">
        <div class="ide-modal__header">
          <h3>{{ editandoPais ? 'Editar País' : 'Nuevo País' }}</h3>
          <button class="ide-modal__close" @click="paisDialog = false">✕</button>
        </div>
        <div class="ide-modal__body">
          <div class="ide-form-grid">
            <div class="ide-field">
              <label>Nombre *</label>
              <input v-model="paisForm.nombre" class="ide-input" placeholder="Ej: China, Bolivia..." />
            </div>
            <div class="ide-field">
              <label>Código (2-3 letras)</label>
              <input v-model="paisForm.codigo" class="ide-input" placeholder="Ej: CN, PE, US" maxlength="5" style="text-transform:uppercase;" @input="paisForm.codigo = paisForm.codigo.toUpperCase()" />
            </div>
            <div class="ide-field ide-field--full">
              <label>Estado</label>
              <select v-model="paisForm.estado" class="ide-input">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="paisDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarPais">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Logistica',
  data: () => ({
    activeTab: 'ordenes',
    tabs: [
      { id: 'ordenes', label: 'Órdenes de Importación' },
      { id: 'monedas', label: 'Monedas' },
      { id: 'tipos-gasto', label: 'Tipos de Gasto' },
      { id: 'paises', label: 'Países' },
    ],
    // Órdenes
    ordenes: [], loadingOrdenes: false, qOrdenes: '',
    ordenDialog: false, editandoOrden: null,
    ordenForm: {},
    proveedores: [],
    monedas: [],
    // Monedas
    monedasData: [], loadingMonedas: false, qMonedas: '',
    monedaDialog: false, editandoMoneda: null,
    monedaForm: {},
    // Tipos gasto
    tiposGasto: [], loadingTipos: false, qTipos: '',
    tipoGastoDialog: false, editandoTipoGasto: null,
    tipoGastoForm: {},
    // Países
    paisesData: [], loadingPaises: false, qPaises: '',
    paisDialog: false, editandoPais: null,
    paisForm: {},
    saving: false,
  }),
  computed: {
    monedasFiltradas() {
      const q = this.qMonedas.trim().toLowerCase()
      if (!q) return this.monedasData
      return this.monedasData.filter(m => m.nombre.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q))
    },
    tiposFiltrados() {
      const q = this.qTipos.trim().toLowerCase()
      if (!q) return this.tiposGasto
      return this.tiposGasto.filter(t => t.nombre.toLowerCase().includes(q))
    },
    paisesFiltrados() {
      const q = this.qPaises.trim().toLowerCase()
      if (!q) return this.paisesData
      return this.paisesData.filter(p => p.nombre.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q))
    },
    paises() {
      return this.paisesData.filter(p => p.activo).map(p => p.nombre)
    },
  },
  created() {
    this.cargarOrdenes()
    this.cargarMonedas()
    this.cargarTiposGasto()
    this.cargarProveedores()
    this.cargarPaises()
  },
  methods: {
    // ── Utilidades ───────────────────────────────────────────
    fmtNum(v) {
      if (v == null) return '—'
      return Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    chipEstado(e) {
      const map = {
        BORRADOR: 'ide-chip--grey',
        EN_TRANSITO: 'ide-chip--blue',
        EN_ADUANA: 'ide-chip--orange',
        RECIBIDO: 'ide-chip--purple',
        CERRADO: 'ide-chip--success',
      }
      return map[e] || 'ide-chip--grey'
    },
    emptyOrdenForm() {
      return { paisOrigen: 'China', proveedorId: '', monedaCompraId: '', fechaOrden: '', fechaEstimadaLlegada: '', metodoDistribucion: 'POR_VALOR', estadoOrden: 'BORRADOR', observaciones: '' }
    },
    emptyMonedaForm() { return { codigo: '', nombre: '', simbolo: '', estado: 'activo' } },
    emptyTipoGastoForm() { return { nombre: '', descripcion: '', estado: 'activo' } },

    // ── Órdenes ──────────────────────────────────────────────
    async cargarOrdenes() {
      this.loadingOrdenes = true
      try {
        this.ordenes = await this.$service.list(`logistica-ordenes${this.qOrdenes ? '?q=' + encodeURIComponent(this.qOrdenes) : ''}`) || []
      } finally { this.loadingOrdenes = false }
    },
    async cargarProveedores() {
      // eslint-disable-next-line no-empty
      try { this.proveedores = await this.$service.list('proveedores') || [] } catch (_) { /* opcional */ }
    },
    async cargarMonedas() {
      this.loadingMonedas = true
      try { this.monedasData = await this.$service.list('logistica-monedas') || [] } finally { this.loadingMonedas = false }
      this.monedas = this.monedasData
    },
    irDetalle(id) { this.$router.push({ name: 'logistica-orden-detalle', params: { id } }) },
    abrirOrdenDialog(orden = null) {
      this.editandoOrden = orden
      this.ordenForm = orden
        ? { numero: orden.numero, paisOrigen: orden.paisOrigen, proveedorId: orden.proveedorId || '', monedaCompraId: orden.monedaCompraId || '', fechaOrden: orden.fechaOrden, fechaEstimadaLlegada: orden.fechaEstimadaLlegada || '', metodoDistribucion: orden.metodoDistribucion, estadoOrden: orden.estadoOrden, observaciones: orden.observaciones || '' }
        : this.emptyOrdenForm()
      this.ordenDialog = true
    },
    async guardarOrden() {
      if (!this.ordenForm.paisOrigen.trim()) return this.$message.error('El país de origen es obligatorio.')
      if (!this.ordenForm.fechaOrden) return this.$message.error('La fecha de orden es obligatoria.')
      this.saving = true
      try {
        const payload = { ...this.ordenForm }
        if (!payload.proveedorId) delete payload.proveedorId
        if (!payload.monedaCompraId) delete payload.monedaCompraId
        if (!payload.fechaEstimadaLlegada) delete payload.fechaEstimadaLlegada
        if (this.editandoOrden) {
          await this.$service.put(`logistica-ordenes/${this.editandoOrden.id}`, payload)
          this.$message.success('Orden actualizada.')
        } else {
          await this.$service.post('logistica-ordenes', payload)
          this.$message.success('Orden creada.')
        }
        this.ordenDialog = false
        await this.cargarOrdenes()
      } finally { this.saving = false }
    },
    eliminarOrden(orden) {
      this.$confirm(`¿Eliminar la orden "${orden.numero}"? Esta acción no se puede deshacer.`, async () => {
        await this.$service.delete(`logistica-ordenes/${orden.id}`)
        this.$message.success('Orden eliminada.')
        await this.cargarOrdenes()
      })
    },

    // ── Monedas ──────────────────────────────────────────────
    abrirMonedaDialog(m = null) {
      this.editandoMoneda = m
      this.monedaForm = m ? { codigo: m.codigo, nombre: m.nombre, simbolo: m.simbolo, estado: m.activo ? 'activo' : 'inactivo' } : this.emptyMonedaForm()
      this.monedaDialog = true
    },
    async guardarMoneda() {
      if (!this.monedaForm.codigo.trim()) return this.$message.error('El código es obligatorio.')
      if (!this.monedaForm.nombre.trim()) return this.$message.error('El nombre es obligatorio.')
      if (!this.monedaForm.simbolo.trim()) return this.$message.error('El símbolo es obligatorio.')
      this.saving = true
      try {
        if (this.editandoMoneda) {
          await this.$service.put(`logistica-monedas/${this.editandoMoneda.id}`, this.monedaForm)
          this.$message.success('Moneda actualizada.')
        } else {
          await this.$service.post('logistica-monedas', this.monedaForm)
          this.$message.success('Moneda creada.')
        }
        this.monedaDialog = false
        await this.cargarMonedas()
      } finally { this.saving = false }
    },
    async setMonedaBase(m) {
      await this.$service.patch(`logistica-monedas/${m.id}/set-base`, {})
      this.$message.success(`${m.nombre} marcada como moneda base.`)
      await this.cargarMonedas()
    },
    eliminarMoneda(m) {
      this.$confirm(`¿Eliminar la moneda "${m.nombre}"?`, async () => {
        await this.$service.delete(`logistica-monedas/${m.id}`)
        this.$message.success('Moneda eliminada.')
        await this.cargarMonedas()
      })
    },

    // ── Tipos de Gasto ───────────────────────────────────────
    async cargarTiposGasto() {
      this.loadingTipos = true
      try { this.tiposGasto = await this.$service.list('logistica-tipos-gasto') || [] } finally { this.loadingTipos = false }
    },
    abrirTipoGastoDialog(t = null) {
      this.editandoTipoGasto = t
      this.tipoGastoForm = t ? { nombre: t.nombre, descripcion: t.descripcion || '', estado: t.activo ? 'activo' : 'inactivo' } : this.emptyTipoGastoForm()
      this.tipoGastoDialog = true
    },
    async guardarTipoGasto() {
      if (!this.tipoGastoForm.nombre.trim()) return this.$message.error('El nombre es obligatorio.')
      this.saving = true
      try {
        if (this.editandoTipoGasto) {
          await this.$service.put(`logistica-tipos-gasto/${this.editandoTipoGasto.id}`, this.tipoGastoForm)
          this.$message.success('Tipo de gasto actualizado.')
        } else {
          await this.$service.post('logistica-tipos-gasto', this.tipoGastoForm)
          this.$message.success('Tipo de gasto creado.')
        }
        this.tipoGastoDialog = false
        await this.cargarTiposGasto()
      } finally { this.saving = false }
    },
    eliminarTipoGasto(t) {
      this.$confirm(`¿Eliminar el tipo de gasto "${t.nombre}"?`, async () => {
        await this.$service.delete(`logistica-tipos-gasto/${t.id}`)
        this.$message.success('Tipo de gasto eliminado.')
        await this.cargarTiposGasto()
      })
    },

    // ── Países ───────────────────────────────────────────────
    async cargarPaises() {
      this.loadingPaises = true
      try { this.paisesData = await this.$service.list('logistica-paises') || [] } finally { this.loadingPaises = false }
    },
    emptyPaisForm() { return { nombre: '', codigo: '', estado: 'activo' } },
    abrirPaisDialog(p = null) {
      this.editandoPais = p
      this.paisForm = p ? { nombre: p.nombre, codigo: p.codigo || '', estado: p.activo ? 'activo' : 'inactivo' } : this.emptyPaisForm()
      this.paisDialog = true
    },
    async guardarPais() {
      if (!this.paisForm.nombre.trim()) return this.$message.error('El nombre es obligatorio.')
      this.saving = true
      try {
        const payload = { ...this.paisForm }
        if (!payload.codigo) delete payload.codigo
        if (this.editandoPais) {
          await this.$service.put(`logistica-paises/${this.editandoPais.id}`, payload)
          this.$message.success('País actualizado.')
        } else {
          await this.$service.post('logistica-paises', payload)
          this.$message.success('País creado.')
        }
        this.paisDialog = false
        await this.cargarPaises()
      } finally { this.saving = false }
    },
    eliminarPais(p) {
      this.$confirm(`¿Eliminar el país "${p.nombre}"?`, async () => {
        await this.$service.delete(`logistica-paises/${p.id}`)
        this.$message.success('País eliminado.')
        await this.cargarPaises()
      })
    },
  },
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.ide-view { display: flex; flex-direction: column; height: 100%; gap: 0; }
.ide-view__header { display: flex; align-items: center; gap: 12px; padding: 16px 24px 0; flex-wrap: wrap; }
.ide-view__tabs { display: flex; gap: 4px; flex: 1; }
.ide-view__body { flex: 1; overflow: auto; padding: 16px 24px 24px; }
.ide-search-row { margin-bottom: 16px; }

/* ── Tabs ────────────────────────────────────────────────────────────── */
.ide-tab { background: none; border: none; padding: 8px 16px; border-radius: 8px 8px 0 0; cursor: pointer; font-size: 13px; color: #64748b; border-bottom: 2px solid transparent; transition: all .15s; }
.ide-tab--active { color: #818cf8; border-bottom-color: #6366f1; font-weight: 600; background: #6366f108; }

/* ── Estados ─────────────────────────────────────────────────────────── */
.ide-loading { color: #475569; font-size: 13px; padding: 32px 0; text-align: center; }
.ide-empty   { color: #334155; font-size: 13px; padding: 48px 0; text-align: center; font-style: italic; }

/* ── Tabla ───────────────────────────────────────────────────────────── */
.ide-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ide-table th { text-align: left; padding: 8px 12px; background: #111d35; color: #64748b; font-weight: 700; border-bottom: 1px solid #1e3a5f44; white-space: nowrap; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
.ide-table td { padding: 10px 12px; border-bottom: 1px solid #1e3a5f22; vertical-align: middle; color: #cbd5e1; font-size: 13px; }
.ide-table tr:hover td { background: #1e293b55; }
.ide-actions { display: flex; gap: 6px; white-space: nowrap; }

/* ── Chips de estado ─────────────────────────────────────────────────── */
.ide-chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid; }
.ide-chip--grey   { background: #33415522; color: #94a3b8;  border-color: #33415544; }
.ide-chip--blue   { background: #3b82f622; color: #60a5fa;  border-color: #3b82f644; }
.ide-chip--orange { background: #f9731622; color: #fb923c;  border-color: #f9731644; }
.ide-chip--purple { background: #a855f722; color: #c084fc;  border-color: #a855f744; }
.ide-chip--success{ background: #22c55e22; color: #4ade80;  border-color: #22c55e44; }

/* ── Botones ─────────────────────────────────────────────────────────── */
.ide-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid #1e3a5f; background: #1e3a5f33; color: #94a3b8; cursor: pointer; font-size: 12px; font-weight: 600; transition: all .15s; }
.ide-btn:disabled { opacity: .4; cursor: not-allowed; }
.ide-btn:hover:not(:disabled) { border-color: #6366f155; color: #cbd5e1; }
.ide-btn--primary { background: #6366f1; color: #fff; border-color: #6366f1; }
.ide-btn--primary:hover:not(:disabled) { background: #4f46e5; border-color: #4f46e5; }
.ide-btn--danger { color: #f87171; border-color: #ef444444; background: #ef444411; }
.ide-btn--danger:hover:not(:disabled) { background: #ef444422; }
.ide-btn--outline { background: transparent; color: #818cf8; border-color: #6366f155; }
.ide-btn--outline:hover { background: #6366f110; }
.ide-btn--sm { padding: 4px 10px; font-size: 11px; }

/* ── Inputs / Selects / Textareas ────────────────────────────────────── */
.ide-input {
  width: 100%; padding: 8px 12px;
  border: 1px solid #1e3a5f55; border-radius: 8px;
  background: #0a0f1e; color: #e2e8f0;
  font-size: 13px; outline: none; box-sizing: border-box;
  transition: border-color .15s;
}
.ide-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px #6366f120; }
.ide-input::placeholder { color: #334155; }

/* ── Modal ───────────────────────────────────────────────────────────── */
.ide-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.ide-modal { background: #0d1526; border: 1px solid #1e3a5f66; border-radius: 14px; width: 600px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
.ide-modal--sm { width: 420px; }
.ide-modal__header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #1e3a5f44; }
.ide-modal__header h3 { font-size: 15px; font-weight: 700; margin: 0; color: #f1f5f9; }
.ide-modal__close { background: none; border: none; font-size: 16px; cursor: pointer; color: #475569; padding: 4px; transition: color .15s; }
.ide-modal__close:hover { color: #e2e8f0; }
.ide-modal__body { padding: 20px 24px; }
.ide-modal__footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 20px; border-top: 1px solid #1e3a5f44; }

/* ── Formulario ──────────────────────────────────────────────────────── */
.ide-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ide-field { display: flex; flex-direction: column; gap: 4px; }
.ide-field--full { grid-column: 1 / -1; }
.ide-field label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .4px; }
</style>
