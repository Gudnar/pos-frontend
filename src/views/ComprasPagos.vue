<template>
  <div class="cp-root">
    <div class="cp-layout">

      <!-- Panel izquierdo: proveedores con saldo -->
      <div class="cp-panel">
        <div class="cp-col-header">
          <div>
            <div class="cp-col-title">Proveedores con Saldo</div>
            <div class="cp-col-count">{{ resumen.length }} proveedores</div>
          </div>
        </div>
        <div class="cp-list">
          <div v-if="loading" class="cp-loading"><div class="ct-spinner"></div></div>
          <div v-else-if="!resumen.length" class="cp-empty">Sin saldos pendientes</div>
          <div
            v-else
            v-for="r in resumen" :key="r.proveedorId"
            :class="['cp-prov-row', selectedProv === r.proveedorId ? 'cp-prov-row--active' : '']"
            @click="seleccionar(r)"
          >
            <div class="cp-prov-avatar">{{ iniciales(r) }}</div>
            <div style="flex:1;min-width:0;">
              <div class="cp-prov-nombre">{{ nombreProveedor(r.proveedorId) }}</div>
              <div class="cp-prov-sub">{{ r.nroCompras }} compra(s) pendiente(s)</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div class="cp-saldo-monto">Bs {{ formatMonto(r.saldoPendiente) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel derecho: compras del proveedor seleccionado -->
      <div class="cp-detail-panel">
        <div v-if="!selectedProv" class="cp-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--b0)" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
          <p>Selecciona un proveedor para ver sus compras pendientes de pago</p>
        </div>

        <template v-else>
          <div class="cp-col-header" style="border-radius:14px 14px 0 0;">
            <div>
              <div class="cp-col-title">{{ nombreProveedor(selectedProv) }}</div>
              <div class="cp-col-count">Compras con saldo pendiente</div>
            </div>
          </div>
          <div style="flex:1;overflow-y:auto;padding:12px 16px;">
            <div v-if="loadingCompras" class="cp-loading"><div class="ct-spinner"></div></div>
            <div v-else-if="!comprasProveedor.length" class="cp-empty">Sin compras pendientes de pago</div>
            <div v-else v-for="c in comprasProveedor" :key="c.id" class="cp-compra-card">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:13px;font-weight:700;color:var(--t2);">{{ c.nroCompra }}</span>
                    <span v-if="esMonedaExtranjera(c)" class="cp-moneda-badge">{{ c.moneda }}</span>
                    <span class="cp-estado-badge" :style="estadoColor(c.estadoCompra)">{{ labelEstadoCompra(c.estadoCompra) }}</span>
                  </div>
                  <div style="font-size:11px;color:var(--t5);margin-top:2px;">{{ c.fecha }} · {{ c.nroFactura || 'Sin factura' }}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:12px;color:var(--t3);">
                    Total: <strong style="color:var(--t1);">{{ c.moneda || 'BS' }} {{ formatMonto(c.total) }}</strong>
                    <span v-if="esMonedaExtranjera(c)" style="color:var(--t5);font-size:10px;"> ≈ Bs {{ formatMonto(totalEnBs(c)) }}</span>
                  </div>
                  <div style="font-size:12px;color:var(--t3);">Pagado: <strong style="color:#4ade80;">Bs {{ formatMonto(c.montoPagado) }}</strong></div>
                  <div style="font-size:12px;color:var(--t3);">Saldo: <strong style="color:#f87171;">Bs {{ formatMonto(saldo(c)) }}</strong></div>
                </div>
              </div>

              <!-- Pagos existentes -->
              <div v-if="c.pagos && c.pagos.length" style="margin-bottom:8px;">
                <div style="font-size:10px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">Pagos registrados</div>
                <div v-for="p in c.pagos" :key="p.id" class="cp-pago-row">
                  <span style="font-size:11px;color:var(--t3);">{{ p.fecha }}</span>
                  <span style="font-size:11px;color:var(--t4);background:var(--bg-c);padding:1px 6px;border-radius:4px;">{{ p.metodoPago }}</span>
                  <span v-if="p.monedaCodigo && p.monedaCodigo !== 'BS'" class="cp-pago-moneda" :title="`TC: ${Number(p.tipoCambio).toFixed(4)}`">
                    {{ p.monedaCodigo }} {{ formatMonto(p.monto) }} × {{ Number(p.tipoCambio).toFixed(2) }}
                  </span>
                  <span v-if="p.fuenteNombre" class="cp-pago-fuente" :title="p.fuenteTipo">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    {{ p.fuenteNombre }}
                  </span>
                  <span style="font-size:11px;color:#4ade80;font-weight:700;">Bs {{ formatMonto(p.montoEnBs || p.monto) }}</span>
                  <button class="cp-del-pago-btn" title="Eliminar pago" @click="eliminarPago(c, p)">✕</button>
                </div>
              </div>

              <button class="cp-abonar-btn" @click="abrirPago(c)">+ Registrar Pago</button>
            </div>
          </div>
        </template>
      </div>

    </div>

    <!-- Modal pago -->
    <transition name="modal-fade">
      <div v-if="pagoDialog" class="ct-modal-backdrop" @click.self="pagoDialog = false">
        <div class="ct-modal" style="max-width:420px;">
          <div class="ct-modal-header">
            <span>Registrar Pago — {{ compraParaPago && compraParaPago.nroCompra }}</span>
            <button class="ct-modal-close" @click="pagoDialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field">
                <label>Fecha *</label>
                <input v-model="pagoForm.fecha" class="ide-input" type="date" />
              </div>
              <div class="ide-field">
                <label>Moneda</label>
                <select v-model="pagoForm.monedaId" class="ide-select" @change="onMonedaChange">
                  <option value="">Boliviano (Bs)</option>
                  <option v-for="m in monedasExternas" :key="m.id" :value="m.id">{{ m.nombre }} ({{ m.codigo }})</option>
                </select>
              </div>
              <div class="ide-field" :class="{ 'ct-form-full': !pagoForm.monedaId }">
                <label>Monto {{ pagoForm.monedaId ? '(' + (monedaSeleccionada && monedaSeleccionada.codigo) + ') *' : '* (Saldo: Bs ' + (compraParaPago ? formatMonto(saldo(compraParaPago)) : '0.00') + ')' }}</label>
                <input v-model.number="pagoForm.monto" class="ide-input" type="number" min="0.01" step="0.01" />
              </div>
              <div v-if="pagoForm.monedaId" class="ide-field">
                <label>TC de la transferencia (Bs por {{ monedaSeleccionada && monedaSeleccionada.codigo }}) *</label>
                <input v-model.number="pagoForm.tipoCambio" class="ide-input" type="number" min="0.000001" step="0.01" placeholder="Ej: 7.07" />
              </div>
              <div v-if="pagoForm.monedaId && pagoForm.monto && pagoForm.tipoCambio" class="ide-field ct-form-full">
                <div class="cp-monto-bs-preview">
                  <span style="font-size:10px;color:var(--t4);">Equivalente en Bs</span>
                  <span style="font-size:15px;font-weight:800;color:#4ade80;">Bs {{ formatMonto(pagoForm.monto * pagoForm.tipoCambio) }}</span>
                  <span style="font-size:10px;color:var(--t5);">Saldo: Bs {{ compraParaPago ? formatMonto(saldo(compraParaPago)) : '0.00' }}</span>
                </div>
              </div>
              <div class="ide-field">
                <label>Método de Pago *</label>
                <select v-model="pagoForm.metodoPago" class="ide-select">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="QR">QR</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>
              <div class="ide-field ct-form-full">
                <label>Fuente de Fondos</label>
                <select v-model="pagoForm.fuenteId" class="ide-select">
                  <option value="">— Sin especificar —</option>
                  <option v-for="f in fuentes" :key="f.id" :value="f.id">
                    {{ f.nombre }} <template v-if="f.banco"> · {{ f.banco }}</template>
                  </option>
                </select>
                <div v-if="pagoForm.fuenteId && fuenteSeleccionada" class="cp-fuente-info">
                  <span class="cp-fuente-tipo">{{ labelTipoFuente(fuenteSeleccionada.tipo) }}</span>
                  <span v-if="fuenteSeleccionada.numeroCuenta" style="font-size:10px;color:var(--t4);">Nro: {{ fuenteSeleccionada.numeroCuenta }}</span>
                </div>
              </div>
              <div class="ide-field">
                <label>Referencia</label>
                <input v-model="pagoForm.referencia" class="ide-input" placeholder="Nro cheque, transferencia..." />
              </div>
              <div class="ide-field ct-form-full">
                <label>Notas</label>
                <input v-model="pagoForm.notas" class="ide-input" placeholder="Notas opcionales..." />
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="pagoDialog = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="savingPago" @click="guardarPago">
              {{ savingPago ? 'Guardando...' : 'Registrar Pago' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
const TIPO_FUENTE_LABELS = {
  CUENTA_BANCARIA: 'Cuenta bancaria',
  CAJA: 'Caja',
  BILLETERA_DIGITAL: 'Billetera digital',
  OTRO: 'Otro',
}

const emptyPagoForm = () => ({
  fecha: new Date().toISOString().split('T')[0],
  monto: 0, metodoPago: 'EFECTIVO', referencia: '', notas: '', fuenteId: '',
  monedaId: '', tipoCambio: 1,
})

export default {
  name: 'ComprasPagos',
  data: () => ({
    resumen: [], loading: false,
    proveedores: [], fuentes: [], monedas: [],
    selectedProv: null,
    comprasProveedor: [], loadingCompras: false,
    pagoDialog: false, pagoForm: emptyPagoForm(), compraParaPago: null, savingPago: false,
  }),
  computed: {
    fuenteSeleccionada() { return this.fuentes.find(f => f.id === this.pagoForm.fuenteId) || null },
    monedaSeleccionada() { return this.monedas.find(m => m.id === this.pagoForm.monedaId) || null },
    monedasExternas() { return this.monedas.filter(m => m.codigo !== 'BS' && m.codigo !== 'BOB') },
  },
  created() { this.cargar(); this.cargarProveedores(); this.cargarFuentes(); this.cargarMonedas() },
  methods: {
    async cargar() {
      this.loading = true
      try { this.resumen = await this.$service.list('compras/pagos/resumen-proveedores') || [] }
      finally { this.loading = false }
    },
    async cargarProveedores() {
      try { this.proveedores = await this.$service.list('proveedores') || [] }
      catch { this.proveedores = [] }
    },
    async cargarFuentes() {
      try { this.fuentes = (await this.$service.list('fuentes') || []).filter(f => f.activo !== false) }
      catch { this.fuentes = [] }
    },
    async cargarMonedas() {
      try { this.monedas = await this.$service.list('logistica-monedas') || [] }
      catch { this.monedas = [] }
    },
    onMonedaChange() {
      if (!this.pagoForm.monedaId) { this.pagoForm.tipoCambio = 1 }
    },
    async seleccionar(r) {
      this.selectedProv = r.proveedorId
      this.loadingCompras = true
      try {
        const compras = await this.$service.list(`compras?proveedorId=${r.proveedorId}&tipo=COMPRA`) || []
        const pendientesPago = compras.filter(c => c.estadoPago !== 'PAGADO' && c.estadoCompra !== 'ANULADA')
        this.comprasProveedor = await Promise.all(
          pendientesPago.map(c => this.$service.get(`compras/${c.id}`))
        )
      } finally { this.loadingCompras = false }
    },
    abrirPago(compra) {
      this.compraParaPago = compra
      const saldoActualBs = this.saldo(compra)
      const form = emptyPagoForm()
      // Si la compra es en moneda extranjera, pre-llenar moneda y TC
      if (this.esMonedaExtranjera(compra)) {
        const monedaEncontrada = this.monedas.find(m =>
          m.codigo && compra.moneda && m.codigo.toUpperCase() === compra.moneda.toUpperCase()
        )
        if (monedaEncontrada) {
          form.monedaId = monedaEncontrada.id
          form.tipoCambio = Number(compra.tipoCambio) || 1
          // Monto pre-llenado en la moneda extranjera (saldo Bs ÷ TC)
          const tc = Number(compra.tipoCambio) || 1
          form.monto = tc > 0 ? parseFloat((saldoActualBs / tc).toFixed(4)) : 0
        } else {
          form.monto = saldoActualBs
        }
      } else {
        form.monto = saldoActualBs
      }
      this.pagoForm = form
      this.pagoDialog = true
    },
    async guardarPago() {
      if (!this.pagoForm.monto || this.pagoForm.monto <= 0) return this.$message.error('Ingresa un monto válido')
      if (this.pagoForm.monedaId && (!this.pagoForm.tipoCambio || this.pagoForm.tipoCambio <= 0)) {
        return this.$message.error('Ingresa el tipo de cambio')
      }
      this.savingPago = true
      const payload = {
        ...this.pagoForm,
        monedaId: this.pagoForm.monedaId || undefined,
        tipoCambio: this.pagoForm.monedaId ? Number(this.pagoForm.tipoCambio) : undefined,
        fuenteId: this.pagoForm.fuenteId || undefined,
      }
      try {
        await this.$service.post(`compras/${this.compraParaPago.id}/pagos`, payload)
        this.$message.success('Pago registrado')
        this.pagoDialog = false
        await this.seleccionar({ proveedorId: this.selectedProv })
        await this.cargar()
      } finally { this.savingPago = false }
    },
    eliminarPago(compra, pago) {
      this.$confirm(`¿Eliminar este pago de Bs ${this.formatMonto(pago.monto)}?`, async () => {
        await this.$service.delete(`compras/${compra.id}/pagos/${pago.id}`)
        this.$message.success('Pago eliminado')
        await this.seleccionar({ proveedorId: this.selectedProv })
        await this.cargar()
      })
    },
    totalEnBs(c) { return Number(c.total || 0) * Number(c.tipoCambio || 1) },
    saldo(c) { return Math.max(0, this.totalEnBs(c) - Number(c.montoPagado || 0)) },
    esMonedaExtranjera(c) { return c.moneda && !['BS', 'BOB', 'BOL'].includes((c.moneda || '').toUpperCase()) },
    labelEstadoCompra(est) {
      return { EN_TRANSITO: 'En tránsito', PENDIENTE: 'En almacén', FINALIZADO: 'Finalizado' }[est] || est
    },
    estadoColor(est) {
      const map = { EN_TRANSITO: '#f59e0b', PENDIENTE: '#818cf8', FINALIZADO: '#4ade80' }
      return `color:${map[est] || 'var(--t4)'};background:${map[est] || 'var(--t4)'}18;`
    },
    nombreProveedor(id) { return this.proveedores.find(p => p.id === id)?.nombre || '—' },
    iniciales(r) {
      const nombre = this.nombreProveedor(r.proveedorId)
      return (nombre[0] || '?').toUpperCase()
    },
    formatMonto(v) { return Number(v || 0).toFixed(2) },
    labelTipoFuente(tipo) { return TIPO_FUENTE_LABELS[tipo] || tipo || '—' },
  },
}
</script>

<style scoped>
.cp-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; }
.cp-layout { flex:1; overflow:hidden; display:flex; gap:12px; }
.cp-panel { width:340px; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:14px; display:flex; flex-direction:column; overflow:hidden; }
.cp-detail-panel { flex:1; background:var(--bg-s); border:1px solid var(--b1); border-radius:14px; display:flex; flex-direction:column; overflow:hidden; }
.cp-col-header { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 8px; border-bottom:1px solid var(--b2); flex-shrink:0; }
.cp-col-title { font-size:13px; font-weight:800; color:var(--t1); }
.cp-col-count { font-size:10px; color:var(--t5); margin-top:1px; }
.cp-list { flex:1; overflow-y:auto; padding:4px 8px 12px; }
.cp-loading { display:flex; justify-content:center; padding:24px; }
.cp-empty { text-align:center; padding:24px; font-size:12px; color:var(--b3); font-style:italic; }
.cp-prov-row { display:flex; align-items:center; gap:10px; padding:10px 8px; border-radius:8px; cursor:pointer; margin-bottom:3px; transition:background 0.15s; border:1px solid transparent; }
.cp-prov-row:hover { background:var(--bg-c); }
.cp-prov-row--active { background:#6366f114; border-color:#6366f133; }
.cp-prov-avatar { width:32px; height:32px; border-radius:8px; background:#6366f122; color:#818cf8; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; flex-shrink:0; }
.cp-prov-nombre { font-size:12px; font-weight:700; color:var(--t2); }
.cp-prov-sub { font-size:10px; color:var(--t5); margin-top:1px; }
.cp-saldo-monto { font-size:13px; font-weight:800; color:#f87171; }
.cp-placeholder { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color:var(--b0); }
.cp-placeholder p { font-size:12px; color:var(--b3); text-align:center; }
.cp-compra-card { background:var(--bg-c); border:1px solid var(--b1); border-radius:10px; padding:14px; margin-bottom:10px; }
.cp-pago-row { display:flex; align-items:center; gap:8px; padding:4px 0; }
.cp-abonar-btn { background:#6366f122; border:1px solid #6366f133; color:#818cf8; border-radius:7px; padding:5px 12px; font-size:11px; font-weight:700; cursor:pointer; width:100%; margin-top:4px; }
.cp-abonar-btn:hover { background:#6366f133; }
.cp-del-pago-btn { background:none; border:none; color:var(--t4); cursor:pointer; font-size:11px; padding:1px 4px; border-radius:3px; margin-left:auto; }
.cp-del-pago-btn:hover { color:#f87171; }
.cp-pago-fuente { display:inline-flex; align-items:center; gap:3px; font-size:10px; color:#818cf8; background:#6366f111; border:1px solid #6366f122; border-radius:4px; padding:1px 6px; font-weight:600; }
.cp-pago-moneda { font-size:10px; font-weight:700; color:#f59e0b; background:#f59e0b11; border:1px solid #f59e0b22; border-radius:4px; padding:1px 7px; white-space:nowrap; }
.cp-fuente-info { display:flex; align-items:center; gap:8px; margin-top:4px; }
.cp-fuente-tipo { font-size:10px; font-weight:700; color:#818cf8; background:#6366f111; border:1px solid #6366f122; border-radius:4px; padding:1px 7px; }
.cp-monto-bs-preview { display:flex; align-items:center; gap:10px; background:#4ade8011; border:1px solid #4ade8033; border-radius:7px; padding:8px 12px; }
.cp-moneda-badge { font-size:9px; font-weight:800; color:#f59e0b; background:#f59e0b18; border:1px solid #f59e0b33; border-radius:4px; padding:1px 5px; }
.cp-estado-badge { font-size:9px; font-weight:700; border-radius:4px; padding:1px 6px; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
