<template>
  <div class="ide-view fuentes-view">

    <!-- Panel izquierdo: lista de fuentes -->
    <div class="fuentes-sidebar">
      <div class="fuentes-sidebar__header">
        <span class="fuentes-sidebar__title">Fuentes de Fondos</span>
        <button class="ide-btn ide-btn--primary ide-btn--sm" @click="abrirFuenteDialog()">+ Nueva</button>
      </div>
      <div v-if="loadingFuentes" class="ide-loading" style="padding:24px 0;">Cargando...</div>
      <div v-else-if="!fuentes.length" class="ide-empty" style="padding:24px 16px;">Sin fuentes registradas.</div>
      <div v-else class="fuentes-list">
        <div
          v-for="f in fuentes"
          :key="f.id"
          class="fuente-card"
          :class="{ 'fuente-card--active': fuenteSeleccionada && fuenteSeleccionada.id === f.id }"
          @click="seleccionarFuente(f)"
        >
          <div class="fuente-card__top">
            <span class="fuente-card__nombre">{{ f.nombre }}</span>
            <span class="ide-chip" :class="chipTipo(f.tipo)" style="font-size:9px;">{{ labelTipo(f.tipo) }}</span>
          </div>
          <div v-if="f.banco" class="fuente-card__banco">{{ f.banco }}</div>
          <div v-if="f.titular" class="fuente-card__titular">{{ f.titular }}</div>
          <div class="fuente-card__saldo">
            <span class="fuente-card__moneda">{{ monedaCodigo(f.monedaId) }}</span>
            <strong :class="Number(f.saldoActual) >= 0 ? 'saldo--pos' : 'saldo--neg'">
              {{ fmtNum(f.saldoActual) }}
            </strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho: movimientos de la fuente seleccionada -->
    <div class="fuentes-main">
      <div v-if="!fuenteSeleccionada" class="ide-empty" style="padding:80px 0;">
        Selecciona una fuente para ver sus movimientos.
      </div>
      <template v-else>
        <!-- Header del panel -->
        <div class="mov-header">
          <div class="mov-header__info">
            <h2>{{ fuenteSeleccionada.nombre }}</h2>
            <span v-if="fuenteSeleccionada.banco" class="det-meta">{{ fuenteSeleccionada.banco }}</span>
            <span v-if="fuenteSeleccionada.numeroCuenta" class="det-meta">{{ fuenteSeleccionada.numeroCuenta }}</span>
            <span v-if="fuenteSeleccionada.titular" class="det-meta">{{ fuenteSeleccionada.titular }}</span>
          </div>
          <div class="mov-header__saldo">
            <div class="saldo-kpi__label">Saldo actual</div>
            <div class="saldo-kpi__val" :class="Number(fuenteSeleccionada.saldoActual) >= 0 ? 'saldo--pos' : 'saldo--neg'">
              {{ monedaCodigo(fuenteSeleccionada.monedaId) }} {{ fmtNum(fuenteSeleccionada.saldoActual) }}
            </div>
          </div>
          <div class="mov-header__actions">
            <button class="ide-btn ide-btn--sm ide-btn--outline" @click="abrirFuenteDialog(fuenteSeleccionada)">Editar fuente</button>
            <button class="ide-btn ide-btn--sm ide-btn--danger" @click="eliminarFuente(fuenteSeleccionada)">Eliminar</button>
          </div>
        </div>

        <!-- Toolbar de filtros y acciones -->
        <div class="mov-toolbar">
          <div class="mov-toolbar__filters">
            <input v-model="filtroDesde" class="ide-input mov-filter-date" type="date" @change="cargarMovimientos" />
            <span style="color:var(--b3);font-size:12px;">—</span>
            <input v-model="filtroHasta" class="ide-input mov-filter-date" type="date" @change="cargarMovimientos" />
            <select v-model="filtroTipo" class="ide-input mov-filter-select" @change="cargarMovimientos">
              <option value="">Todos los tipos</option>
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
              <option value="TRANSFERENCIA_SALIDA">Transfer. salida</option>
              <option value="TRANSFERENCIA_ENTRADA">Transfer. entrada</option>
            </select>
            <select v-model="filtroCategoria" class="ide-input mov-filter-select" @change="cargarMovimientos">
              <option value="">Todas las categorías</option>
              <option value="PAGO_PROVEEDOR">Pago proveedor</option>
              <option value="GASTO_LOGISTICA">Gasto logística</option>
              <option value="INGRESO_VENTA">Ingreso venta</option>
              <option value="RETIRO">Retiro</option>
              <option value="DEPOSITO">Depósito</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="OTRO">Otro</option>
            </select>
            <input
              v-model="filtroConcepto"
              class="ide-input mov-filter-concepto"
              type="text"
              placeholder="Buscar concepto..."
              @input="onConceptoInput"
            />
          </div>
          <div class="mov-toolbar__btns">
            <button class="ide-btn ide-btn--sm ide-btn--success" @click="abrirMovDialog('INGRESO')">+ Ingreso</button>
            <button class="ide-btn ide-btn--sm ide-btn--danger" @click="abrirMovDialog('EGRESO')">− Egreso</button>
            <button class="ide-btn ide-btn--sm ide-btn--outline" @click="abrirTransferenciaDialog">⇄ Transferir</button>
          </div>
        </div>

        <!-- Tabla de movimientos -->
        <div class="mov-body">
          <div v-if="loadingMov" class="ide-loading">Cargando movimientos...</div>
          <div v-else-if="!movimientos.length" class="ide-empty">Sin movimientos con los filtros seleccionados.</div>
          <table v-else class="ide-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Concepto</th>
                <th>Referencia</th>
                <th style="text-align:right;">Monto</th>
                <th style="text-align:right;">TC</th>
                <th style="text-align:right;">Monto Nativo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in movimientos" :key="m.id">
                <td style="white-space:nowrap;">{{ m.fecha }}</td>
                <td><span class="ide-chip" :class="chipTipoMov(m.tipo)" style="font-size:10px;">{{ labelTipoMov(m.tipo) }}</span></td>
                <td><span v-if="m.categoria" style="font-size:11px;color:var(--t4);">{{ labelCategoria(m.categoria) }}</span><span v-else style="color:var(--b3);">—</span></td>
                <td style="max-width:220px;">
                  <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.concepto }}</div>
                  <div v-if="m.origenTipo" style="font-size:10px;color:var(--t5);">{{ m.origenTipo }} {{ m.origenId ? '→ vinculado' : '' }}</div>
                </td>
                <td style="color:var(--t4);font-size:12px;">{{ m.referencia || '—' }}</td>
                <td style="text-align:right;">
                  <span :class="esIngreso(m.tipo) ? 'mov-monto--ing' : 'mov-monto--egr'">
                    {{ esIngreso(m.tipo) ? '+' : '−' }}{{ fmtNum(m.monto) }}
                  </span>
                  <div v-if="m.monedaId" style="font-size:10px;color:var(--t5);">{{ monedaCodigo(m.monedaId) }}</div>
                </td>
                <td style="text-align:right;color:var(--t4);font-size:12px;">{{ Number(m.tipoCambio) !== 1 ? fmtNum6(m.tipoCambio) : '—' }}</td>
                <td style="text-align:right;font-weight:700;" :class="esIngreso(m.tipo) ? 'mov-monto--ing' : 'mov-monto--egr'">
                  {{ esIngreso(m.tipo) ? '+' : '−' }}{{ fmtNum(m.montoNativo) }}
                </td>
                <td class="ide-actions">
                  <button class="ide-btn ide-btn--sm" @click="abrirEditarMovDialog(m)">Editar</button>
                  <button class="ide-btn ide-btn--sm ide-btn--danger" @click="eliminarMovimiento(m)">✕</button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="7" style="text-align:right;font-size:11px;color:var(--t4);padding:8px 12px;">
                  Flujo neto del período:
                </td>
                <td style="text-align:right;font-weight:700;padding:8px 12px;" :class="flujoNeto >= 0 ? 'mov-monto--ing' : 'mov-monto--egr'">
                  {{ flujoNeto >= 0 ? '+' : '' }}{{ fmtNum(flujoNeto) }}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>
    </div>

    <!-- ── DIALOG FUENTE ──────────────────────────────────────── -->
    <div v-if="fuenteDialog" class="ide-modal-overlay">
      <div class="ide-modal ide-modal--sm">
        <div class="ide-modal__header">
          <h3>{{ editandoFuente ? 'Editar Fuente' : 'Nueva Fuente de Fondos' }}</h3>
          <button class="ide-modal__close" @click="fuenteDialog = false">✕</button>
        </div>
        <div class="ide-modal__body ide-form-grid">
          <div class="ide-field ide-field--full">
            <label>Nombre *</label>
            <input v-model="fuenteForm.nombre" class="ide-input" placeholder="Ej: Cuenta BCP Principal" />
          </div>
          <div class="ide-field">
            <label>Tipo</label>
            <select v-model="fuenteForm.tipo" class="ide-input">
              <option value="CUENTA_BANCARIA">Cuenta Bancaria</option>
              <option value="CAJA">Caja</option>
              <option value="BILLETERA_DIGITAL">Billetera Digital</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Moneda nativa</label>
            <select v-model="fuenteForm.monedaId" class="ide-input">
              <option value="">— Sin especificar —</option>
              <option v-for="m in monedas" :key="m.id" :value="m.id">{{ m.codigo }} — {{ m.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Banco / Institución</label>
            <input v-model="fuenteForm.banco" class="ide-input" placeholder="Ej: BCP, BBVA, PayPal" />
          </div>
          <div class="ide-field">
            <label>N° de Cuenta</label>
            <input v-model="fuenteForm.numeroCuenta" class="ide-input" placeholder="Últimos 4 dígitos o código" />
          </div>
          <div class="ide-field ide-field--full">
            <label>Titular</label>
            <input v-model="fuenteForm.titular" class="ide-input" placeholder="Persona o empresa propietaria" />
          </div>
          <div class="ide-field">
            <label>Saldo inicial</label>
            <input v-model.number="fuenteForm.saldoInicial" class="ide-input" type="number" min="0" step="0.01" />
          </div>
          <div class="ide-field">
            <label>Estado</label>
            <select v-model="fuenteForm.activo" class="ide-input">
              <option :value="true">Activo</option>
              <option :value="false">Inactivo</option>
            </select>
          </div>
          <div class="ide-field ide-field--full">
            <label>Descripción / Notas</label>
            <textarea v-model="fuenteForm.descripcion" class="ide-input" rows="2" />
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="fuenteDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarFuente">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── DIALOG MOVIMIENTO (ingreso/egreso) ────────────────── -->
    <div v-if="movDialog" class="ide-modal-overlay">
      <div class="ide-modal ide-modal--sm">
        <div class="ide-modal__header">
          <h3>{{ editandoMov ? 'Editar Movimiento' : (movForm.tipo === 'INGRESO' ? 'Registrar Ingreso' : 'Registrar Egreso') }}</h3>
          <button class="ide-modal__close" @click="movDialog = false">✕</button>
        </div>
        <div class="ide-modal__body ide-form-grid">
          <div class="ide-field ide-field--full">
            <label>Concepto *</label>
            <input v-model="movForm.concepto" class="ide-input" placeholder="Descripción del movimiento" />
          </div>
          <div class="ide-field">
            <label>Moneda</label>
            <select v-model="movForm.monedaId" class="ide-input">
              <option value="">— Moneda nativa de la fuente —</option>
              <option v-for="m in monedas" :key="m.id" :value="m.id">{{ m.codigo }} — {{ m.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Monto *</label>
            <input v-model.number="movForm.monto" class="ide-input" type="number" min="0" step="0.01" />
          </div>
          <!-- TC en dos pasos -->
          <div class="ide-field ide-field--full">
            <div class="tc-cadena-toggle" :class="{ 'tc-cadena-toggle--on': movTcCadena }" @click="movTcCadena = !movTcCadena">
              <span class="tc-cadena-toggle__icon">⇄</span>
              <span>TC en dos pasos</span>
              <span class="tc-cadena-badge">{{ movTcCadena ? 'activo' : 'inactivo' }}</span>
            </div>
          </div>
          <template v-if="movTcCadena">
            <div class="ide-field">
              <label>TC paso 1</label>
              <input v-model.number="movTc1" class="ide-input" type="number" min="0" step="0.000001" @input="recalcTcMov" />
            </div>
            <div class="ide-field">
              <label>TC paso 2</label>
              <input v-model.number="movTc2" class="ide-input" type="number" min="0" step="0.000001" @input="recalcTcMov" />
            </div>
            <div v-if="movTc1 && movTc2" class="ide-field ide-field--full">
              <div class="tc-cadena-result">
                <span>{{ fmtNum6(movTc1) }} × {{ fmtNum6(movTc2) }}</span>
                <strong>= {{ fmtNum6(movTc1 * movTc2) }}</strong>
              </div>
            </div>
          </template>
          <div class="ide-field">
            <label>Tipo de Cambio (→ nativa fuente)</label>
            <input v-model.number="movForm.tipoCambio" class="ide-input" type="number" min="0" step="0.000001" :readonly="movTcCadena" :class="{ 'ide-input--readonly': movTcCadena }" />
          </div>
          <div class="ide-field">
            <label>Fecha *</label>
            <input v-model="movForm.fecha" class="ide-input" type="date" />
          </div>
          <div class="ide-field">
            <label>Categoría</label>
            <select v-model="movForm.categoria" class="ide-input">
              <option value="">— Sin categoría —</option>
              <option value="DEPOSITO">Depósito</option>
              <option value="RETIRO">Retiro</option>
              <option value="PAGO_PROVEEDOR">Pago proveedor</option>
              <option value="GASTO_LOGISTICA">Gasto logística</option>
              <option value="INGRESO_VENTA">Ingreso venta</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Referencia / N° Operación</label>
            <input v-model="movForm.referencia" class="ide-input" />
          </div>
          <div v-if="movForm.monto && movForm.tipoCambio" class="ide-field ide-field--full">
            <div class="ide-preview-calc">
              Monto nativo: <strong>{{ fmtNum(movForm.monto * movForm.tipoCambio) }}</strong>
              {{ monedaCodigo(fuenteSeleccionada.monedaId) }}
            </div>
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="movDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarMovimiento">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── DIALOG TRANSFERENCIA ──────────────────────────────── -->
    <div v-if="transfDialog" class="ide-modal-overlay">
      <div class="ide-modal ide-modal--sm">
        <div class="ide-modal__header">
          <h3>Transferencia entre Fuentes</h3>
          <button class="ide-modal__close" @click="transfDialog = false">✕</button>
        </div>
        <div class="ide-modal__body ide-form-grid">
          <div class="ide-field ide-field--full">
            <label>Origen</label>
            <div class="ide-preview-calc">{{ fuenteSeleccionada.nombre }} — {{ monedaCodigo(fuenteSeleccionada.monedaId) }}</div>
          </div>
          <div class="ide-field ide-field--full">
            <label>Destino *</label>
            <select v-model="transfForm.fuenteDestinoId" class="ide-input">
              <option value="">— Seleccionar fuente destino —</option>
              <option v-for="f in fuentesDestino" :key="f.id" :value="f.id">{{ f.nombre }} ({{ monedaCodigo(f.monedaId) }})</option>
            </select>
          </div>
          <div class="ide-field ide-field--full">
            <label>Concepto *</label>
            <input v-model="transfForm.concepto" class="ide-input" placeholder="Motivo de la transferencia" />
          </div>
          <div class="ide-field">
            <label>Moneda del movimiento</label>
            <select v-model="transfForm.monedaId" class="ide-input">
              <option value="">— Moneda nativa —</option>
              <option v-for="m in monedas" :key="m.id" :value="m.id">{{ m.codigo }} — {{ m.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Monto *</label>
            <input v-model.number="transfForm.monto" class="ide-input" type="number" min="0" step="0.01" />
          </div>
          <div class="ide-field">
            <label>TC en origen (→ nativa origen)</label>
            <input v-model.number="transfForm.tipoCambio" class="ide-input" type="number" min="0" step="0.000001" />
          </div>
          <div class="ide-field">
            <label>TC en destino (→ nativa destino)</label>
            <input v-model.number="transfForm.tipoCambioDestino" class="ide-input" type="number" min="0" step="0.000001" />
          </div>
          <div class="ide-field">
            <label>Fecha *</label>
            <input v-model="transfForm.fecha" class="ide-input" type="date" />
          </div>
          <div class="ide-field">
            <label>Referencia</label>
            <input v-model="transfForm.referencia" class="ide-input" />
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="transfDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarTransferencia">
            {{ saving ? 'Guardando...' : 'Registrar Transferencia' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'Fuentes',
  data: () => ({
    fuentes: [], loadingFuentes: false,
    fuenteSeleccionada: null,
    monedas: [],
    movimientos: [], loadingMov: false,
    filtroDesde: '', filtroHasta: '', filtroTipo: '', filtroCategoria: '', filtroConcepto: '',
    conceptoTimer: null,
    // Dialogs
    fuenteDialog: false, editandoFuente: null, fuenteForm: {},
    movDialog: false, editandoMov: null, movForm: {},
    movTcCadena: false, movTc1: '', movTc2: '',
    transfDialog: false, transfForm: {},
    saving: false,
  }),
  computed: {
    fuentesDestino() {
      if (!this.fuenteSeleccionada) return []
      return this.fuentes.filter(f => f.id !== this.fuenteSeleccionada.id)
    },
    flujoNeto() {
      return this.movimientos.reduce((s, m) => {
        return s + (this.esIngreso(m.tipo) ? Number(m.montoNativo) : -Number(m.montoNativo))
      }, 0)
    },
  },
  created() {
    this.cargarMonedas()
    this.cargarFuentes()
  },
  methods: {
    fmtNum(v) {
      if (v == null) return '—'
      return Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    fmtNum6(v) {
      if (v == null) return '—'
      return Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
    },
    monedaCodigo(id) {
      const m = this.monedas.find(x => x.id === id)
      return m ? m.codigo : ''
    },
    labelTipo(t) {
      const map = { CUENTA_BANCARIA: 'Banco', CAJA: 'Caja', BILLETERA_DIGITAL: 'Digital', OTRO: 'Otro' }
      return map[t] || t
    },
    chipTipo(t) {
      const map = { CUENTA_BANCARIA: 'ide-chip--blue', CAJA: 'ide-chip--orange', BILLETERA_DIGITAL: 'ide-chip--purple', OTRO: 'ide-chip--grey' }
      return map[t] || 'ide-chip--grey'
    },
    labelTipoMov(t) {
      const map = { INGRESO: 'Ingreso', EGRESO: 'Egreso', TRANSFERENCIA_SALIDA: 'Transf. salida', TRANSFERENCIA_ENTRADA: 'Transf. entrada' }
      return map[t] || t
    },
    chipTipoMov(t) {
      if (t === 'INGRESO' || t === 'TRANSFERENCIA_ENTRADA') return 'ide-chip--success'
      if (t === 'EGRESO') return 'ide-chip--danger'
      return 'ide-chip--blue'
    },
    labelCategoria(c) {
      const map = { PAGO_PROVEEDOR: 'Pago proveedor', GASTO_LOGISTICA: 'Gasto logística', INGRESO_VENTA: 'Ingreso venta', RETIRO: 'Retiro', DEPOSITO: 'Depósito', TRANSFERENCIA: 'Transferencia', OTRO: 'Otro' }
      return map[c] || c
    },
    esIngreso(tipo) {
      return tipo === 'INGRESO' || tipo === 'TRANSFERENCIA_ENTRADA'
    },
    async cargarMonedas() {
      try { this.monedas = await this.$service.list('logistica-monedas') || [] } catch (_) { /* ok */ }
    },
    async cargarFuentes() {
      this.loadingFuentes = true
      try {
        this.fuentes = await this.$service.list('fuentes') || []
        if (this.fuenteSeleccionada) {
          const updated = this.fuentes.find(f => f.id === this.fuenteSeleccionada.id)
          if (updated) this.fuenteSeleccionada = updated
        }
      } finally { this.loadingFuentes = false }
    },
    async seleccionarFuente(f) {
      this.fuenteSeleccionada = f
      this.filtroDesde = ''; this.filtroHasta = ''; this.filtroTipo = ''; this.filtroCategoria = ''; this.filtroConcepto = ''
      await this.cargarMovimientos()
    },
    async cargarMovimientos() {
      if (!this.fuenteSeleccionada) return
      this.loadingMov = true
      try {
        const params = new URLSearchParams()
        if (this.filtroDesde) params.append('desde', this.filtroDesde)
        if (this.filtroHasta) params.append('hasta', this.filtroHasta)
        if (this.filtroTipo) params.append('tipo', this.filtroTipo)
        if (this.filtroCategoria) params.append('categoria', this.filtroCategoria)
        if (this.filtroConcepto.trim()) params.append('concepto', this.filtroConcepto.trim())
        const qs = params.toString()
        this.movimientos = await this.$service.list(`fuentes/${this.fuenteSeleccionada.id}/movimientos${qs ? '?' + qs : ''}`) || []
      } finally { this.loadingMov = false }
    },

    onConceptoInput() {
      clearTimeout(this.conceptoTimer)
      this.conceptoTimer = setTimeout(() => this.cargarMovimientos(), 350)
    },

    // ── Fuentes CRUD ─────────────────────────────────────────
    emptyFuenteForm() {
      return { nombre: '', tipo: 'CUENTA_BANCARIA', banco: '', numeroCuenta: '', monedaId: '', titular: '', descripcion: '', saldoInicial: 0, activo: true }
    },
    abrirFuenteDialog(f = null) {
      this.editandoFuente = f
      this.fuenteForm = f
        ? { nombre: f.nombre, tipo: f.tipo, banco: f.banco || '', numeroCuenta: f.numeroCuenta || '', monedaId: f.monedaId || '', titular: f.titular || '', descripcion: f.descripcion || '', saldoInicial: Number(f.saldoInicial), activo: f.activo }
        : this.emptyFuenteForm()
      this.fuenteDialog = true
      if (!this.monedas.length) this.cargarMonedas()
    },
    async guardarFuente() {
      if (!this.fuenteForm.nombre.trim()) return this.$message.error('El nombre es obligatorio.')
      this.saving = true
      try {
        const payload = { ...this.fuenteForm }
        if (!payload.monedaId) delete payload.monedaId
        if (!payload.banco) delete payload.banco
        if (!payload.numeroCuenta) delete payload.numeroCuenta
        if (!payload.titular) delete payload.titular
        if (!payload.descripcion) delete payload.descripcion
        if (this.editandoFuente) {
          await this.$service.put(`fuentes/${this.editandoFuente.id}`, payload)
          this.$message.success('Fuente actualizada.')
        } else {
          await this.$service.post('fuentes', payload)
          this.$message.success('Fuente creada.')
        }
        this.fuenteDialog = false
        await this.cargarFuentes()
      } finally { this.saving = false }
    },
    eliminarFuente(f) {
      this.$confirm(`¿Eliminar la fuente "${f.nombre}"? Se perderán todos sus movimientos registrados.`, async () => {
        await this.$service.delete(`fuentes/${f.id}`)
        this.$message.success('Fuente eliminada.')
        this.fuenteSeleccionada = null
        await this.cargarFuentes()
      })
    },

    // ── Movimientos CRUD ─────────────────────────────────────
    emptyMovForm(tipo) {
      return { tipo, concepto: '', monedaId: '', monto: 0, tipoCambio: 1, fecha: new Date().toISOString().slice(0, 10), categoria: '', referencia: '' }
    },
    abrirMovDialog(tipo) {
      this.editandoMov = null
      this.movTcCadena = false; this.movTc1 = ''; this.movTc2 = ''
      this.movForm = this.emptyMovForm(tipo)
      this.movDialog = true
      if (!this.monedas.length) this.cargarMonedas()
    },
    abrirEditarMovDialog(m) {
      this.editandoMov = m
      this.movTcCadena = false; this.movTc1 = ''; this.movTc2 = ''
      this.movForm = { tipo: m.tipo, concepto: m.concepto, monedaId: m.monedaId || '', monto: Number(m.monto), tipoCambio: Number(m.tipoCambio), fecha: m.fecha, categoria: m.categoria || '', referencia: m.referencia || '' }
      this.movDialog = true
    },
    recalcTcMov() {
      if (this.movTc1 && this.movTc2) this.movForm.tipoCambio = Number(this.movTc1) * Number(this.movTc2)
    },
    async guardarMovimiento() {
      if (!this.movForm.concepto.trim()) return this.$message.error('El concepto es obligatorio.')
      if (!this.movForm.monto || this.movForm.monto <= 0) return this.$message.error('El monto debe ser mayor a 0.')
      if (!this.movForm.fecha) return this.$message.error('La fecha es obligatoria.')
      this.saving = true
      try {
        const payload = { ...this.movForm }
        if (!payload.monedaId) delete payload.monedaId
        if (!payload.categoria) delete payload.categoria
        if (!payload.referencia) delete payload.referencia
        if (this.editandoMov) {
          await this.$service.put(`fuentes/${this.fuenteSeleccionada.id}/movimientos/${this.editandoMov.id}`, payload)
          this.$message.success('Movimiento actualizado.')
        } else {
          await this.$service.post(`fuentes/${this.fuenteSeleccionada.id}/movimientos`, payload)
          this.$message.success('Movimiento registrado.')
        }
        this.movDialog = false
        await this.cargarMovimientos()
        await this.cargarFuentes()
      } finally { this.saving = false }
    },
    eliminarMovimiento(m) {
      this.$confirm('¿Eliminar este movimiento?', async () => {
        await this.$service.delete(`fuentes/${this.fuenteSeleccionada.id}/movimientos/${m.id}`)
        this.$message.success('Movimiento eliminado.')
        await this.cargarMovimientos()
        await this.cargarFuentes()
      })
    },

    // ── Transferencia ────────────────────────────────────────
    abrirTransferenciaDialog() {
      this.transfForm = { fuenteDestinoId: '', concepto: '', monedaId: '', monto: 0, tipoCambio: 1, tipoCambioDestino: 1, fecha: new Date().toISOString().slice(0, 10), referencia: '' }
      this.transfDialog = true
    },
    async guardarTransferencia() {
      if (!this.transfForm.fuenteDestinoId) return this.$message.error('Selecciona la fuente destino.')
      if (!this.transfForm.concepto.trim()) return this.$message.error('El concepto es obligatorio.')
      if (!this.transfForm.monto || this.transfForm.monto <= 0) return this.$message.error('El monto debe ser mayor a 0.')
      if (!this.transfForm.fecha) return this.$message.error('La fecha es obligatoria.')
      this.saving = true
      try {
        const payload = { ...this.transfForm }
        if (!payload.monedaId) delete payload.monedaId
        if (!payload.referencia) delete payload.referencia
        await this.$service.post(`fuentes/${this.fuenteSeleccionada.id}/transferencia`, payload)
        this.$message.success('Transferencia registrada en ambas fuentes.')
        this.transfDialog = false
        await this.cargarMovimientos()
        await this.cargarFuentes()
      } finally { this.saving = false }
    },
  },
}
</script>

<style scoped>
/* ── Layout dos paneles ──────────────────────────────────────────────── */
.fuentes-view { display: flex; flex-direction: row; height: 100%; overflow: hidden; }

.fuentes-sidebar {
  width: 280px; flex-shrink: 0;
  border-right: 1px solid var(--b1);
  display: flex; flex-direction: column; overflow: hidden;
}
.fuentes-sidebar__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; border-bottom: 1px solid var(--b2); flex-shrink: 0;
}
.fuentes-sidebar__title { font-size: 12px; font-weight: 700; color: var(--t4); text-transform: uppercase; letter-spacing: .5px; }
.fuentes-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }

.fuente-card {
  padding: 12px 14px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--b1); background: var(--bg-n);
  transition: all .15s;
}
.fuente-card:hover { border-color: #6366f155; background: var(--bg-c); }
.fuente-card--active { border-color: #6366f1; background: #6366f110; }
.fuente-card__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.fuente-card__nombre { font-size: 13px; font-weight: 700; color: var(--t2); }
.fuente-card__banco { font-size: 11px; color: var(--t5); margin-bottom: 2px; }
.fuente-card__titular { font-size: 11px; color: var(--b3); margin-bottom: 6px; }
.fuente-card__saldo { display: flex; align-items: baseline; gap: 6px; margin-top: 6px; border-top: 1px solid var(--b2); padding-top: 6px; }
.fuente-card__moneda { font-size: 10px; color: var(--t5); font-weight: 700; }

.saldo--pos { color: #4ade80; }
.saldo--neg { color: #f87171; }

/* ── Panel principal ─────────────────────────────────────────────────── */
.fuentes-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.mov-header { display: flex; align-items: center; gap: 16px; padding: 16px 24px; border-bottom: 1px solid var(--b1); flex-wrap: wrap; flex-shrink: 0; }
.mov-header__info { flex: 1; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mov-header__info h2 { font-size: 16px; font-weight: 700; margin: 0; color: var(--t1); }
.det-meta { font-size: 12px; color: var(--t5); }
.mov-header__saldo { text-align: right; }
.saldo-kpi__label { font-size: 10px; color: var(--t5); text-transform: uppercase; letter-spacing: .4px; }
.saldo-kpi__val { font-size: 20px; font-weight: 800; }
.mov-header__actions { display: flex; gap: 6px; }

.mov-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 24px; border-bottom: 1px solid var(--b2); gap: 12px; flex-wrap: wrap; flex-shrink: 0;
}
.mov-toolbar__filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mov-toolbar__btns { display: flex; gap: 6px; flex-shrink: 0; }
.mov-filter-date { width: 140px; }
.mov-filter-select { width: 160px; }
.mov-filter-concepto { width: 180px; }

.mov-body { flex: 1; overflow: auto; padding: 16px 24px 24px; }

/* ── Colores de movimiento ───────────────────────────────────────────── */
.mov-monto--ing { color: #4ade80; }
.mov-monto--egr { color: #f87171; }
.ide-chip--danger { background: #ef444422; color: #f87171; border-color: #ef444444; }
.ide-btn--success { background: #22c55e22; color: #4ade80; border-color: #22c55e44; }
.ide-btn--success:hover:not(:disabled) { background: #22c55e33; }

/* ── Tabla ───────────────────────────────────────────────────────────── */
.ide-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ide-table th { text-align: left; padding: 8px 12px; background: var(--bg-n); color: var(--t4); font-weight: 700; border-bottom: 1px solid var(--b1); white-space: nowrap; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
.ide-table td { padding: 10px 12px; border-bottom: 1px solid var(--b2); vertical-align: middle; color: var(--scroll); }
.ide-table tr:hover td { background: var(--b1); }
.ide-table tfoot td { background: var(--bg-n); }
.ide-actions { display: flex; gap: 6px; white-space: nowrap; }

/* ── Estados ─────────────────────────────────────────────────────────── */
.ide-loading { color: var(--t5); font-size: 13px; padding: 48px 0; text-align: center; }
.ide-empty { color: var(--b3); font-size: 13px; padding: 48px 0; text-align: center; font-style: italic; }

/* ── Chips ───────────────────────────────────────────────────────────── */
.ide-chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid; }
.ide-chip--grey   { background: var(--b2); color: var(--t3); border-color: var(--b1); }
.ide-chip--blue   { background: #3b82f622; color: #60a5fa; border-color: #3b82f644; }
.ide-chip--orange { background: #f9731622; color: #fb923c; border-color: #f9731644; }
.ide-chip--purple { background: #a855f722; color: #c084fc; border-color: #a855f744; }
.ide-chip--success{ background: #22c55e22; color: #4ade80; border-color: #22c55e44; }

/* ── Botones ─────────────────────────────────────────────────────────── */
.ide-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--b0); background: var(--b2); color: var(--t3); cursor: pointer; font-size: 12px; font-weight: 600; transition: all .15s; }
.ide-btn:disabled { opacity: .4; cursor: not-allowed; }
.ide-btn:hover:not(:disabled) { border-color: #6366f155; color: var(--scroll); }
.ide-btn--primary { background: #6366f1; color: #fff; border-color: #6366f1; }
.ide-btn--primary:hover:not(:disabled) { background: #4f46e5; border-color: #4f46e5; }
.ide-btn--danger { color: #f87171; border-color: #ef444444; background: #ef444411; }
.ide-btn--danger:hover:not(:disabled) { background: #ef444422; }
.ide-btn--outline { background: transparent; color: #818cf8; border-color: #6366f155; }
.ide-btn--outline:hover { background: #6366f110; }
.ide-btn--sm { padding: 4px 10px; font-size: 11px; }

/* ── Inputs ──────────────────────────────────────────────────────────── */
.ide-input { width: 100%; padding: 8px 12px; border: 1px solid var(--b1); border-radius: 8px; background: var(--bg); color: var(--t2); font-size: 13px; outline: none; box-sizing: border-box; transition: border-color .15s; }
.ide-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px #6366f120; }
.ide-input::placeholder { color: var(--b3); }
.ide-input--readonly { opacity: .7; cursor: default; border-style: dashed; }

/* ── Modal ───────────────────────────────────────────────────────────── */
.ide-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.ide-modal { background: var(--bg-s); border: 1px solid var(--b4); border-radius: 14px; width: 600px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
.ide-modal--sm { width: 460px; }
.ide-modal__header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--b1); }
.ide-modal__header h3 { font-size: 15px; font-weight: 700; margin: 0; color: var(--t1); }
.ide-modal__close { background: none; border: none; font-size: 16px; cursor: pointer; color: var(--t5); padding: 4px; transition: color .15s; }
.ide-modal__close:hover { color: var(--t2); }
.ide-modal__body { padding: 20px 24px; }
.ide-modal__footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 20px; border-top: 1px solid var(--b1); }
.ide-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ide-field { display: flex; flex-direction: column; gap: 4px; }
.ide-field--full { grid-column: 1 / -1; }
.ide-field label { font-size: 11px; font-weight: 700; color: var(--t4); text-transform: uppercase; letter-spacing: .4px; }
.ide-preview-calc { background: var(--bg-n); border: 1px solid var(--b1); border-radius: 6px; padding: 8px 12px; font-size: 12px; color: var(--t4); }

/* ── TC cadena ───────────────────────────────────────────────────────── */
.tc-cadena-toggle { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 8px; cursor: pointer; border: 1px dashed var(--b0); background: transparent; font-size: 12px; color: var(--t5); transition: all .15s; user-select: none; }
.tc-cadena-toggle:hover { border-color: #6366f155; color: var(--t3); }
.tc-cadena-toggle--on { border-color: #6366f1; background: #6366f110; color: #818cf8; }
.tc-cadena-toggle__icon { font-size: 15px; }
.tc-cadena-badge { margin-left: 4px; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 999px; background: var(--b1); color: var(--t4); }
.tc-cadena-toggle--on .tc-cadena-badge { background: #6366f133; color: #818cf8; }
.tc-cadena-result { display: flex; align-items: center; justify-content: space-between; background: #6366f110; border: 1px solid #6366f133; border-radius: 8px; padding: 8px 14px; font-size: 12px; color: var(--t3); }
.tc-cadena-result strong { font-size: 14px; color: #818cf8; }
</style>
