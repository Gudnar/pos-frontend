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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
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
                  <div style="font-size:13px;font-weight:700;color:#e2e8f0;">{{ c.nroCompra }}</div>
                  <div style="font-size:11px;color:#475569;margin-top:2px;">{{ c.fecha }} · {{ c.nroFactura || 'Sin factura' }}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:12px;color:#94a3b8;">Total: <strong style="color:#f1f5f9;">Bs {{ formatMonto(c.total) }}</strong></div>
                  <div style="font-size:12px;color:#94a3b8;">Pagado: <strong style="color:#4ade80;">Bs {{ formatMonto(c.montoPagado) }}</strong></div>
                  <div style="font-size:12px;color:#94a3b8;">Saldo: <strong style="color:#f87171;">Bs {{ formatMonto(saldo(c)) }}</strong></div>
                </div>
              </div>

              <!-- Pagos existentes -->
              <div v-if="c.pagos && c.pagos.length" style="margin-bottom:8px;">
                <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">Pagos registrados</div>
                <div v-for="p in c.pagos" :key="p.id" class="cp-pago-row">
                  <span style="font-size:11px;color:#94a3b8;">{{ p.fecha }}</span>
                  <span style="font-size:11px;color:#64748b;background:#1e293b;padding:1px 6px;border-radius:4px;">{{ p.metodoPago }}</span>
                  <span style="font-size:11px;color:#4ade80;font-weight:700;">Bs {{ formatMonto(p.monto) }}</span>
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
                <label>Monto * (Saldo: Bs {{ compraParaPago ? formatMonto(saldo(compraParaPago)) : '0.00' }})</label>
                <input v-model.number="pagoForm.monto" class="ide-input" type="number" min="0.01" step="0.01" />
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
const emptyPagoForm = () => ({
  fecha: new Date().toISOString().split('T')[0],
  monto: 0, metodoPago: 'EFECTIVO', referencia: '', notas: '',
})

export default {
  name: 'ComprasPagos',
  data: () => ({
    resumen: [], loading: false,
    proveedores: [],
    selectedProv: null,
    comprasProveedor: [], loadingCompras: false,
    pagoDialog: false, pagoForm: emptyPagoForm(), compraParaPago: null, savingPago: false,
  }),
  created() { this.cargar(); this.cargarProveedores() },
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
    async seleccionar(r) {
      this.selectedProv = r.proveedorId
      this.loadingCompras = true
      try {
        const compras = await this.$service.list(`compras?proveedorId=${r.proveedorId}&estado=FINALIZADO`) || []
        const pendientesPago = compras.filter(c => c.estadoPago !== 'PAGADO')
        this.comprasProveedor = await Promise.all(
          pendientesPago.map(c => this.$service.get(`compras/${c.id}`))
        )
      } finally { this.loadingCompras = false }
    },
    abrirPago(compra) {
      this.compraParaPago = compra
      this.pagoForm = { ...emptyPagoForm(), monto: this.saldo(compra) }
      this.pagoDialog = true
    },
    async guardarPago() {
      if (!this.pagoForm.monto || this.pagoForm.monto <= 0) return this.$message.error('Ingresa un monto válido')
      this.savingPago = true
      try {
        await this.$service.post(`compras/${this.compraParaPago.id}/pagos`, this.pagoForm)
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
    saldo(c) { return Math.max(0, Number(c.total || 0) - Number(c.montoPagado || 0)) },
    nombreProveedor(id) { return this.proveedores.find(p => p.id === id)?.nombre || '—' },
    iniciales(r) {
      const nombre = this.nombreProveedor(r.proveedorId)
      return (nombre[0] || '?').toUpperCase()
    },
    formatMonto(v) { return Number(v || 0).toFixed(2) },
  },
}
</script>

<style scoped>
.cp-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; }
.cp-layout { flex:1; overflow:hidden; display:flex; gap:12px; }
.cp-panel { width:340px; flex-shrink:0; background:#0d1526; border:1px solid #1e3a5f44; border-radius:14px; display:flex; flex-direction:column; overflow:hidden; }
.cp-detail-panel { flex:1; background:#0d1526; border:1px solid #1e3a5f44; border-radius:14px; display:flex; flex-direction:column; overflow:hidden; }
.cp-col-header { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 8px; border-bottom:1px solid #1e3a5f33; flex-shrink:0; }
.cp-col-title { font-size:13px; font-weight:800; color:#f1f5f9; }
.cp-col-count { font-size:10px; color:#475569; margin-top:1px; }
.cp-list { flex:1; overflow-y:auto; padding:4px 8px 12px; }
.cp-loading { display:flex; justify-content:center; padding:24px; }
.cp-empty { text-align:center; padding:24px; font-size:12px; color:#334155; font-style:italic; }
.cp-prov-row { display:flex; align-items:center; gap:10px; padding:10px 8px; border-radius:8px; cursor:pointer; margin-bottom:3px; transition:background 0.15s; border:1px solid transparent; }
.cp-prov-row:hover { background:#1e293b; }
.cp-prov-row--active { background:#6366f114; border-color:#6366f133; }
.cp-prov-avatar { width:32px; height:32px; border-radius:8px; background:#6366f122; color:#818cf8; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; flex-shrink:0; }
.cp-prov-nombre { font-size:12px; font-weight:700; color:#e2e8f0; }
.cp-prov-sub { font-size:10px; color:#475569; margin-top:1px; }
.cp-saldo-monto { font-size:13px; font-weight:800; color:#f87171; }
.cp-placeholder { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color:#1e3a5f; }
.cp-placeholder p { font-size:12px; color:#334155; text-align:center; }
.cp-compra-card { background:#1e293b; border:1px solid #1e3a5f44; border-radius:10px; padding:14px; margin-bottom:10px; }
.cp-pago-row { display:flex; align-items:center; gap:8px; padding:4px 0; }
.cp-abonar-btn { background:#6366f122; border:1px solid #6366f133; color:#818cf8; border-radius:7px; padding:5px 12px; font-size:11px; font-weight:700; cursor:pointer; width:100%; margin-top:4px; }
.cp-abonar-btn:hover { background:#6366f133; }
.cp-del-pago-btn { background:none; border:none; color:#64748b; cursor:pointer; font-size:11px; padding:1px 4px; border-radius:3px; margin-left:auto; }
.cp-del-pago-btn:hover { color:#f87171; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid #1e3a5f44; border-top-color:#6366f1; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
