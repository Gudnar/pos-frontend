<template>
  <div class="cp-root">

    <!-- Filtros -->
    <div class="cp-filters">
      <div class="ide-field" style="min-width:130px;">
        <label>Tipo</label>
        <select v-model="filtro.tipo" class="ide-select" @change="cargar">
          <option value="">Todos</option>
          <option value="INICIAL">Ingreso Inicial</option>
          <option value="COMPRA">Compra</option>
        </select>
      </div>
      <div class="ide-field" style="min-width:140px;">
        <label>Estado</label>
        <select v-model="filtro.estado" class="ide-select" @change="cargar">
          <option value="">Todos</option>
          <option value="EN_TRANSITO">En Tránsito</option>
          <option value="PENDIENTE">En Almacén</option>
          <option value="FINALIZADO">Finalizado</option>
          <option value="ANULADA">Anulada</option>
        </select>
      </div>
      <div class="ide-field" style="min-width:150px;">
        <label>Proveedor</label>
        <select v-model="filtro.proveedorId" class="ide-select" @change="cargar">
          <option value="">Todos</option>
          <option v-for="p in proveedores" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
      </div>
      <div class="ide-field">
        <label>Desde</label>
        <input v-model="filtro.fechaDesde" class="ide-input" type="date" @change="cargar" />
      </div>
      <div class="ide-field">
        <label>Hasta</label>
        <input v-model="filtro.fechaHasta" class="ide-input" type="date" @change="cargar" />
      </div>
      <div class="ide-field" style="justify-content:flex-end;padding-top:18px;gap:8px;display:flex;">
        <button class="ct-btn-cancel" @click="limpiarFiltros">Limpiar</button>
        <button class="cp-excel-btn" :disabled="exportando" @click="exportarExcel">
          {{ exportando ? '...' : 'Excel' }}
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="cp-table-container">
      <div v-if="loading" class="cp-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!compras.length" class="cp-empty">Sin registros para los filtros seleccionados</div>
      <table v-else class="cp-table">
        <thead>
          <tr>
            <th>Nro</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Proveedor</th>
            <th>Factura</th>
            <th style="text-align:right;">Total</th>
            <th style="text-align:right;">Pagado</th>
            <th style="text-align:right;">Saldo</th>
            <th>Estado</th>
            <th>Pago</th>
            <th style="width:40px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in compras" :key="c.id" class="cp-tr" @click="verDetalle(c)">
            <td class="cp-mono">{{ c.nroCompra }}</td>
            <td>{{ c.fecha }}</td>
            <td>
              <span :class="['cp-tipo', c.tipoCompra === 'INICIAL' ? 'cp-tipo--ini' : 'cp-tipo--com']">
                {{ c.tipoCompra === 'INICIAL' ? 'Inicial' : 'Compra' }}
              </span>
            </td>
            <td>{{ nombreProveedor(c.proveedorId) }}</td>
            <td class="cp-mono">{{ c.nroFactura || '—' }}</td>
            <td style="text-align:right;font-weight:700;">Bs {{ formatMonto(c.total) }}</td>
            <td style="text-align:right;color:#4ade80;">Bs {{ formatMonto(c.montoPagado) }}</td>
            <td style="text-align:right;" :style="saldo(c) > 0 ? 'color:#f87171;' : 'color:var(--t4);'">
              Bs {{ formatMonto(saldo(c)) }}
            </td>
            <td><span :class="['ct-badge', estadoBadge(c.estadoCompra)]">{{ labelEstado(c.estadoCompra) }}</span></td>
            <td><span :class="['ct-badge', pagoBadge(c.estadoPago)]">{{ c.estadoPago }}</span></td>
            <td @click.stop>
              <button class="cp-icon-btn" title="Ver detalle" @click="verDetalle(c)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="text-align:right;font-size:11px;font-weight:700;color:var(--t4);padding:10px 12px;">Totales:</td>
            <td style="text-align:right;font-weight:800;color:var(--t1);padding:10px 12px;">Bs {{ formatMonto(totales.total) }}</td>
            <td style="text-align:right;color:#4ade80;padding:10px 12px;">Bs {{ formatMonto(totales.pagado) }}</td>
            <td style="text-align:right;color:#f87171;padding:10px 12px;">Bs {{ formatMonto(totales.saldo) }}</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Modal detalle -->
    <transition name="modal-fade">
      <div v-if="detalleDialog && detalleActual" class="ct-modal-backdrop">
        <div class="ct-modal" style="max-width:750px;">
          <div class="ct-modal-header">
            <span>{{ detalleActual.nroCompra }} — Detalle</span>
            <button class="ct-modal-close" @click="detalleDialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
              <div class="cp-info-item"><span>Fecha</span><strong>{{ detalleActual.fecha }}</strong></div>
              <div class="cp-info-item"><span>Proveedor</span><strong>{{ nombreProveedor(detalleActual.proveedorId) }}</strong></div>
              <div class="cp-info-item"><span>Factura</span><strong>{{ detalleActual.nroFactura || '—' }}</strong></div>
              <div class="cp-info-item"><span>Total</span><strong style="color:var(--t1);">Bs {{ formatMonto(detalleActual.total) }}</strong></div>
              <div class="cp-info-item"><span>Pagado</span><strong style="color:#4ade80;">Bs {{ formatMonto(detalleActual.montoPagado) }}</strong></div>
              <div class="cp-info-item"><span>Saldo</span><strong style="color:#f87171;">Bs {{ formatMonto(saldo(detalleActual)) }}</strong></div>
              <div class="cp-info-item"><span>Estado</span><span :class="['ct-badge', estadoBadge(detalleActual.estadoCompra)]">{{ labelEstado(detalleActual.estadoCompra) }}</span></div>
              <div v-if="detalleActual.transportista" class="cp-info-item"><span>Transportista</span><strong>{{ detalleActual.transportista }}</strong></div>
              <div v-if="detalleActual.nroGuiaRemision" class="cp-info-item"><span>Guía Remisión</span><strong>{{ detalleActual.nroGuiaRemision }}</strong></div>
            </div>

            <!-- Trazabilidad por etapas -->
            <div v-if="detalleActual.fechaRecepcion || detalleActual.fechaFinalizacion" class="cp-traza-block">
              <div v-if="detalleActual.fechaRecepcion" class="cp-traza-section">
                <div class="cp-traza-label">Recepción en Almacén</div>
                <div style="display:flex;gap:16px;flex-wrap:wrap;">
                  <div class="cp-info-item"><span>Fecha Recepción</span><strong>{{ detalleActual.fechaRecepcion }}</strong></div>
                  <div v-if="detalleActual.condicionMercancia" class="cp-info-item"><span>Condición</span><strong>{{ detalleActual.condicionMercancia }}</strong></div>
                  <div v-if="detalleActual.observacionesRecepcion" class="cp-info-item" style="flex:1;min-width:180px;"><span>Obs. Recepción</span><strong>{{ detalleActual.observacionesRecepcion }}</strong></div>
                </div>
              </div>
              <div v-if="detalleActual.fechaFinalizacion" class="cp-traza-section">
                <div class="cp-traza-label">Finalización</div>
                <div style="display:flex;gap:16px;flex-wrap:wrap;">
                  <div class="cp-info-item"><span>Fecha Finalización</span><strong>{{ detalleActual.fechaFinalizacion }}</strong></div>
                  <div v-if="detalleActual.observacionesFinalizacion" class="cp-info-item" style="flex:1;min-width:180px;"><span>Obs. Finalización</span><strong>{{ detalleActual.observacionesFinalizacion }}</strong></div>
                </div>
              </div>
            </div>

            <div style="font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Productos</div>
            <table class="cp-table" style="margin-bottom:20px;">
              <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Desc.</th><th>Subtotal</th><th>Lote</th></tr></thead>
              <tbody>
                <tr v-for="d in (detalleActual.detalles || [])" :key="d.id">
                  <td>{{ nombreProducto(d.productoId) }}</td>
                  <td>{{ d.cantidad }}</td>
                  <td>Bs {{ formatMonto(d.precioUnitario) }}</td>
                  <td>Bs {{ formatMonto(d.descuento) }}</td>
                  <td>Bs {{ formatMonto(d.subtotal) }}</td>
                  <td>{{ d.nroLote || '—' }}</td>
                </tr>
              </tbody>
            </table>

            <div style="font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Pagos Registrados</div>
            <div v-if="!(detalleActual.pagos && detalleActual.pagos.length)" style="font-size:12px;color:var(--b3);font-style:italic;padding:8px 0;">Sin pagos registrados.</div>
            <table v-else class="cp-table">
              <thead><tr><th>Fecha</th><th>Método</th><th>Referencia</th><th style="text-align:right;">Monto</th></tr></thead>
              <tbody>
                <tr v-for="p in detalleActual.pagos" :key="p.id">
                  <td>{{ p.fecha }}</td>
                  <td>{{ p.metodoPago }}</td>
                  <td>{{ p.referencia || '—' }}</td>
                  <td style="text-align:right;font-weight:700;color:#4ade80;">Bs {{ formatMonto(p.monto) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="detalleDialog = false">Cerrar</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
export default {
  name: 'ComprasHistorial',
  data: () => ({
    compras: [], loading: false,
    proveedores: [], productos: [],
    filtro: { tipo: '', estado: '', proveedorId: '', fechaDesde: '', fechaHasta: '' },
    detalleActual: null, detalleDialog: false, exportando: false,
  }),
  computed: {
    totales() {
      return this.compras.reduce((acc, c) => {
        acc.total += Number(c.total || 0)
        acc.pagado += Number(c.montoPagado || 0)
        acc.saldo += Number(c.total || 0) - Number(c.montoPagado || 0)
        return acc
      }, { total: 0, pagado: 0, saldo: 0 })
    },
  },
  created() { this.cargar(); this.cargarCatalogos() },
  methods: {
    async cargar() {
      this.loading = true
      const params = Object.entries(this.filtro).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&')
      try { this.compras = await this.$service.list(`compras${params ? '?' + params : ''}`) || [] }
      finally { this.loading = false }
    },
    async cargarCatalogos() {
      const [pr, p] = await Promise.all([
        this.$service.list('proveedores').catch(() => []),
        this.$service.list('productos?soloActivos=true').catch(() => []),
      ])
      this.proveedores = pr || []
      this.productos = p || []
    },
    limpiarFiltros() {
      this.filtro = { tipo: '', estado: '', proveedorId: '', fechaDesde: '', fechaHasta: '' }
      this.cargar()
    },
    async verDetalle(compra) {
      this.detalleDialog = true
      const data = await this.$service.get(`compras/${compra.id}`)
      this.detalleActual = data
    },
    saldo(c) { return Number(c.total || 0) - Number(c.montoPagado || 0) },
    nombreProveedor(id) { return id ? (this.proveedores.find(p => p.id === id)?.nombre || '—') : 'Sin proveedor' },
    nombreProducto(id) { return this.productos.find(p => p.id === id)?.nombre || id },
    formatMonto(v) { return Number(v || 0).toFixed(2) },
    estadoBadge(e) {
      return { EN_TRANSITO: 'ct-badge--transit', PENDIENTE: 'ct-badge--warn', FINALIZADO: 'ct-badge--on', ANULADA: 'ct-badge--off' }[e] || 'ct-badge--off'
    },
    labelEstado(e) {
      return { EN_TRANSITO: 'En Tránsito', PENDIENTE: 'En Almacén', FINALIZADO: 'Finalizado', ANULADA: 'Anulada' }[e] || e
    },
    pagoBadge(e) {
      return { PAGADO: 'ct-badge--on', PARCIAL: 'ct-badge--warn', PENDIENTE: 'ct-badge--off' }[e] || 'ct-badge--off'
    },
    async exportarExcel() {
      this.exportando = true
      try {
        const params = Object.entries(this.filtro).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&')
        const url = `${this.$baseServer}compras/reporte/excel${params ? '?' + params : ''}`
        const resp = await this.$http.get(url, { responseType: 'blob' })
        const blob = new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `ordenes-compra-${new Date().toISOString().split('T')[0]}.xlsx`
        a.click()
        URL.revokeObjectURL(a.href)
      } catch { this.$message.error('Error al exportar Excel') }
      finally { this.exportando = false }
    },
  },
}
</script>

<style scoped>
.cp-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; gap:14px; }
.cp-filters { display:flex; gap:12px; flex-wrap:wrap; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:14px 16px; align-items:flex-end; }
.cp-table-container { flex:1; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; overflow:auto; }
.cp-loading { display:flex; justify-content:center; padding:40px; }
.cp-empty { text-align:center; padding:40px; font-size:13px; color:var(--b3); font-style:italic; }
.cp-table { width:100%; border-collapse:collapse; font-size:12px; }
.cp-table th { background:var(--bg-e); color:var(--t4); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:10px 12px; text-align:left; white-space:nowrap; position:sticky; top:0; z-index:1; }
.cp-table td { padding:10px 12px; border-top:1px solid var(--b2); vertical-align:middle; }
.cp-table tfoot td { background:var(--b1); border-top:2px solid var(--b1); }
.cp-tr { cursor:pointer; transition:background 0.15s; }
.cp-tr:hover { background:var(--bg-c); }
.cp-mono { font-family:monospace; font-size:11px; color:#818cf8; }
.cp-tipo { font-size:9px; font-weight:700; padding:2px 7px; border-radius:4px; }
.cp-tipo--ini { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b33; }
.cp-tipo--com { background:#6366f122; color:#818cf8; border:1px solid #6366f133; }
.cp-icon-btn { background:var(--bg-e); border:1px solid var(--b1); border-radius:6px; padding:5px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--t4); }
.cp-icon-btn:hover { border-color:#6366f1; color:#818cf8; }
.cp-info-item { display:flex; flex-direction:column; gap:3px; }
.cp-info-item span { font-size:10px; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.cp-info-item strong { font-size:13px; color:var(--t2); }
.ct-badge--warn { background:#f59e0b22; color:#fbbf24; border-color:#f59e0b44; }
.ct-badge--transit { background:#3b82f622; color:#60a5fa; border-color:#3b82f644; }
.cp-excel-btn { background:#16a34a22; border:1px solid #16a34a44; color:#4ade80; border-radius:7px; padding:4px 12px; font-size:11px; font-weight:700; cursor:pointer; }
.cp-excel-btn:hover { background:#16a34a33; }
.cp-traza-block { background:var(--bg-e); border:1px solid var(--b1); border-radius:8px; padding:12px 14px; margin-bottom:16px; display:flex; flex-direction:column; gap:10px; }
.cp-traza-section { display:flex; flex-direction:column; gap:6px; }
.cp-traza-label { font-size:10px; font-weight:700; color:#6366f1; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
