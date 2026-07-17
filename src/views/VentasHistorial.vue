<template>
  <div class="vh-root">

    <!-- Filtros -->
    <div class="vh-filters-container">
      <div class="vh-filters-row">
        <div class="vh-filter-group">
          <label>Desde:</label>
          <input v-model="filtros.fechaDesde" class="ide-input" type="date" @change="cargar" />
        </div>
        <div class="vh-filter-group">
          <label>Hasta:</label>
          <input v-model="filtros.fechaHasta" class="ide-input" type="date" @change="cargar" />
        </div>
        <div class="vh-filter-group">
          <label>Sucursal:</label>
          <select v-model="filtros.sucursalId" class="ide-select" @change="cargar">
            <option value="">Todas</option>
            <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </div>
        <div class="vh-filter-group">
          <label>Estado:</label>
          <select v-model="filtros.estadoVenta" class="ide-select" @change="cargar">
            <option value="">Todos</option>
            <option value="PAGADA">Pagada</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>
        <div class="vh-filter-group">
          <label>Saldo:</label>
          <select v-model="filtros.conSaldo" class="ide-select" @change="cargar">
            <option value="">Todos</option>
            <option value="true">Con deuda</option>
            <option value="false">Pagadas</option>
          </select>
        </div>
      </div>
      <div class="vh-filters-row">
        <div class="vh-filter-group" style="flex:1;">
          <label>Cliente:</label>
          <input v-model="filtros.nombreCliente" class="ide-input" placeholder="Buscar cliente..." @change="cargar" />
        </div>
        <div style="display:flex;gap:8px;align-items:flex-end;padding-bottom:2px;">
          <button class="cp-add-btn" @click="cargar">🔍 Aplicar</button>
          <button class="cp-cancel-btn" @click="limpiarFiltros">Limpiar</button>
        </div>
      </div>
      <div class="vh-summary">
        <span style="font-size:11px;color:var(--t5);">{{ ventas.length }} ventas</span>
        <span style="font-size:12px;font-weight:700;color:#6366f1;">Total: Bs. {{ formatNum(totalDia) }}</span>
        <span v-if="totalSaldoPendiente > 0" style="font-size:12px;font-weight:700;color:#f97316;">Saldo pendiente: Bs. {{ formatNum(totalSaldoPendiente) }}</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="vh-table-wrap">
      <div v-if="loading" class="cp-loading" style="padding:60px;"><div class="ct-spinner"></div></div>
      <div v-else-if="!ventas.length" class="cp-empty" style="padding:60px;">Sin ventas en el período seleccionado</div>
      <table v-else class="vh-table">
        <thead>
          <tr>
            <th>Nro. Venta</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Método</th>
            <th style="text-align:right;">Total</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in ventas" :key="v.id" class="vh-row" @click="abrirDetalle(v)">
            <td style="font-weight:700;color:#818cf8;">{{ v.nroVenta }}</td>
            <td style="color:var(--t3);font-size:11px;">{{ formatFecha(v.fecha) }}</td>
            <td style="color:var(--scroll);">{{ v.nombreCliente || '—' }}</td>
            <td>
              <span v-if="v.metodoPago" :class="['vh-badge', `vh-badge--${(v.metodoPago).toLowerCase()}`]">{{ v.metodoPago }}</span>
              <span v-else style="color:var(--b3);font-size:10px;">—</span>
            </td>
            <td style="text-align:right;font-weight:700;color:#6366f1;">Bs. {{ formatNum(v.total) }}</td>
            <td>
              <span :class="['vh-estado', `vh-estado--${v.estadoVenta.toLowerCase()}`]">{{ v.estadoVenta }}</span>
            </td>
            <td @click.stop>
              <button v-if="v.estadoVenta !== 'ANULADA'" class="cp-icon-btn cp-icon-btn--danger" title="Anular" @click.stop="anular(v)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══ MODAL DETALLE ══ -->
    <transition name="modal-fade">
      <div v-if="detalleModal" class="ct-modal-backdrop">
        <div class="ct-modal" style="max-width:560px;">
          <div class="ct-modal-header">
            <span>{{ detalle && detalle.venta ? detalle.venta.nroVenta : '' }}</span>
            <button class="ct-modal-close" @click="detalleModal = false">✕</button>
          </div>
          <div class="ct-modal-body" style="padding:0;">
            <div v-if="loadingDetalle" class="cp-loading" style="padding:40px;"><div class="ct-spinner"></div></div>
            <template v-else-if="detalle">
              <!-- Cabecera venta -->
              <div style="padding:14px 16px;border-bottom:1px solid var(--b1);display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div><div style="font-size:9px;color:var(--t4);">Fecha</div><div style="font-size:12px;color:var(--t2);">{{ formatFecha(detalle.venta.fecha) }}</div></div>
                <div><div style="font-size:9px;color:var(--t4);">Estado</div><span :class="['vh-estado', `vh-estado--${detalle.venta.estadoVenta.toLowerCase()}`]">{{ detalle.venta.estadoVenta }}</span></div>
                <div><div style="font-size:9px;color:var(--t4);">Cliente</div><div style="font-size:12px;color:var(--t2);">{{ detalle.venta.nombreCliente || '—' }}</div></div>
                <div><div style="font-size:9px;color:var(--t4);">Método de pago</div><div style="font-size:12px;color:var(--t2);">{{ detalle.venta.metodoPago || '—' }}</div></div>
                <div v-if="detalle.venta.observaciones" style="grid-column:1/-1;"><div style="font-size:9px;color:var(--t4);">Observaciones</div><div style="font-size:12px;color:var(--t3);">{{ detalle.venta.observaciones }}</div></div>
              </div>
              <!-- Items -->
              <div style="padding:10px 16px;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead><tr style="color:var(--t5);font-size:10px;text-transform:uppercase;">
                    <th style="text-align:left;padding:4px 0;">Producto</th>
                    <th style="text-align:right;padding:4px 0;">Cant.</th>
                    <th style="text-align:right;padding:4px 0;">Precio</th>
                    <th style="text-align:right;padding:4px 0;">Subtotal</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="d in detalle.detalles" :key="d.id" style="border-top:1px solid #0d1a2d;">
                      <td style="padding:6px 0;color:var(--scroll);">{{ d.nombreProducto }}</td>
                      <td style="text-align:right;color:var(--t3);">{{ formatCant(d.cantidad) }}</td>
                      <td style="text-align:right;color:var(--t3);font-size:11px;">
                        <div>Bs. {{ formatNum(d.precioUnitario) }}</div>
                        <div v-if="d.porcentajeFactura > 0" style="color:var(--t5);font-size:10px;">
                          (+ IVA: Bs. {{ formatNum(d.precioUnitario * (1 + d.porcentajeFactura / 100)) }})
                        </div>
                      </td>
                      <td style="text-align:right;color:#6366f1;font-weight:600;">Bs. {{ formatNum(d.subtotal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Totales -->
              <div style="padding:10px 16px;border-top:1px solid var(--b1);display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--t4);"><span>Subtotal</span><span>Bs. {{ formatNum(detalle.venta.subtotal) }}</span></div>
                <div v-if="detalle.venta.descuento > 0" style="display:flex;justify-content:space-between;font-size:11px;color:var(--t4);"><span>Descuento</span><span>- Bs. {{ formatNum(detalle.venta.descuento) }}</span></div>
                <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;color:var(--t2);padding-top:4px;border-top:1px solid var(--b1);"><span>TOTAL</span><span style="color:#6366f1;">Bs. {{ formatNum(detalle.venta.total) }}</span></div>
                <div v-if="detalle.venta.montoPagado" style="display:flex;justify-content:space-between;font-size:11px;color:var(--t4);"><span>Pagado</span><span>Bs. {{ formatNum(detalle.venta.montoPagado) }}</span></div>
                <div v-if="detalle.venta.cambio > 0" style="display:flex;justify-content:space-between;font-size:11px;color:#4ade80;"><span>Cambio</span><span>Bs. {{ formatNum(detalle.venta.cambio) }}</span></div>
              </div>
            </template>
          </div>
          <div class="ct-modal-footer" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;">
            <div style="display:flex;gap:8px;">
              <button class="ct-btn-print" title="Imprimir nota de venta" @click="imprimirNotaVenta(detalle.venta)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path></svg>
                Nota
              </button>
              <button class="ct-btn-print" title="Imprimir recibo" @click="imprimirRecibo(detalle.venta)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11H7.5A1.5 1.5 0 0 0 6 12.5v3A1.5 1.5 0 0 0 7.5 17H9"></path><path d="M15 11h1.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H15"></path><line x1="12" y1="6" x2="12" y2="20"></line></svg>
                Recibo
              </button>
              <button class="ct-btn-print" title="Imprimir ticket" @click="imprimirTicket(detalle.venta)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path><line x1="12" y1="9" x2="12" y2="15"></line><line x1="9" y1="12" x2="15" y2="12"></line></svg>
                Ticket
              </button>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="ct-btn-cancel" @click="detalleModal = false">Cerrar</button>
              <button v-if="detalle && detalle.venta && detalle.venta.estadoVenta !== 'ANULADA'" class="ct-btn-ok" style="background:#ef4444;" @click="anular(detalle.venta); detalleModal = false">Anular Venta</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'VentasHistorial',
  data: () => ({
    ventas: [], loading: false,
    sucursales: [],
    filtros: {
      fechaDesde: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      fechaHasta: new Date().toISOString().split('T')[0],
      sucursalId: '',
      estadoVenta: '',
      nombreCliente: '',
      conSaldo: '',
    },
    detalleModal: false, detalle: null, loadingDetalle: false,
  }),
  computed: {
    sucursalActualId() { return this.$store.getters.sucursalActualId },
    totalDia() { return this.ventas.filter(v => v.estadoVenta !== 'ANULADA').reduce((s, v) => s + Number(v.total), 0) },
    totalSaldoPendiente() { return this.ventas.filter(v => v.estadoVenta !== 'ANULADA').reduce((s, v) => s + Math.max(0, Number(v.total) - Number(v.montoPagado || 0)), 0) },
  },
  mounted() {
    this.cargarSucursales()
    this.cargar()
  },
  watch: {
    sucursalActualId() { this.cargar() },
  },
  methods: {
    async cargarSucursales() {
      try {
        this.sucursales = await this.$service.list('sucursales?soloActivas=true') || []
      } catch (e) { console.error(e) }
    },
    async cargar() {
      this.loading = true
      try {
        let url = 'ventas?'
        const sucId = this.filtros.sucursalId || this.sucursalActualId
        if (sucId) url += `sucursalId=${sucId}&`
        if (this.filtros.fechaDesde) url += `fechaDesde=${this.filtros.fechaDesde}&`
        if (this.filtros.fechaHasta) url += `fechaHasta=${this.filtros.fechaHasta}&`
        if (this.filtros.estadoVenta) url += `estadoVenta=${this.filtros.estadoVenta}&`
        if (this.filtros.nombreCliente) url += `nombreCliente=${encodeURIComponent(this.filtros.nombreCliente)}&`
        if (this.filtros.conSaldo) url += `conSaldo=${this.filtros.conSaldo}&`
        this.ventas = await this.$service.list(url) || []
      } finally { this.loading = false }
    },
    limpiarFiltros() {
      this.filtros.fechaDesde = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
      this.filtros.fechaHasta = new Date().toISOString().split('T')[0]
      this.filtros.sucursalId = ''
      this.filtros.estadoVenta = ''
      this.filtros.nombreCliente = ''
      this.filtros.conSaldo = ''
      this.cargar()
    },
    async abrirDetalle(v) {
      this.detalle = null
      this.detalleModal = true
      this.loadingDetalle = true
      try { this.detalle = await this.$service.get(`ventas/${v.id}`) }
      finally { this.loadingDetalle = false }
    },
    anular(v) {
      this.$confirm(`¿Anular la venta ${v.nroVenta}? Se revertirá el stock.`, async () => {
        try {
          await this.$service.put(`ventas/${v.id}/anular`, { motivo: '' })
          this.$message.success('Venta anulada')
          await this.cargar()
          if (this.detalleModal && this.detalle?.venta?.id === v.id) this.detalleModal = false
        } catch (e) { this.$message.error(e?.message || 'Error al anular') }
      })
    },
    imprimirNotaVenta(venta) {
      const w = window.open('', '_blank')
      const detalles = this.detalle?.detalles || []
      let html = `
        <html>
          <head>
            <title>Nota de Venta ${venta.nroVenta}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; font-size: 24px; margin: 0; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
              th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
              th { background: #f5f5f5; font-weight: bold; }
              .totales { margin-top: 20px; text-align: right; }
              .total-final { font-size: 16px; font-weight: bold; margin-top: 10px; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>NOTA DE VENTA</h1>
              <p>Nro: ${venta.nroVenta}</p>
            </div>
            <div class="info">
              <div><strong>Fecha:</strong> ${this.formatFecha(venta.fecha)}</div>
              <div><strong>Cliente:</strong> ${venta.nombreCliente || '—'}</div>
              <div><strong>Estado:</strong> ${venta.estadoVenta}</div>
              <div><strong>Método:</strong> ${venta.metodoPago || '—'}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align:right;">Cant.</th>
                  <th style="text-align:right;">Precio</th>
                  <th style="text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${detalles.map(d => `
                  <tr>
                    <td>${d.nombreProducto}</td>
                    <td style="text-align:right;">${this.formatCant(d.cantidad)}</td>
                    <td style="text-align:right;">Bs. ${this.formatNum(d.precioUnitario)}</td>
                    <td style="text-align:right;">Bs. ${this.formatNum(d.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totales">
              <div>Subtotal: Bs. ${this.formatNum(venta.subtotal)}</div>
              <div>Descuento: Bs. ${this.formatNum(venta.descuento)}</div>
              <div class="total-final">TOTAL: Bs. ${this.formatNum(venta.total)}</div>
            </div>
            <button onclick="window.print()">Imprimir</button>
          </body>
        </html>
      `
      w.document.write(html)
      w.document.close()
    },
    imprimirRecibo(venta) {
      const w = window.open('', '_blank')
      const detalles = this.detalle?.detalles || []
      let html = `
        <html>
          <head>
            <title>Recibo ${venta.nroVenta}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .recibo { max-width: 400px; margin: 0 auto; }
              h1 { text-align: center; font-size: 18px; margin: 0; }
              .header { text-align: center; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 10px; }
              .info { font-size: 11px; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
              th, td { padding: 5px; border: 1px solid #ddd; text-align: left; }
              th { background: #f5f5f5; font-weight: bold; }
              .totales { margin-top: 10px; font-size: 11px; }
              .total-final { text-align: right; font-weight: bold; margin-top: 5px; font-size: 14px; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="recibo">
              <div class="header">
                <h1>RECIBO</h1>
                <p style="margin: 2px;">Nro: ${venta.nroVenta}</p>
                <p style="margin: 2px;">Fecha: ${this.formatFecha(venta.fecha)}</p>
              </div>
              <div class="info">
                <p style="margin: 2px;"><strong>Cliente:</strong> ${venta.nombreCliente || '—'}</p>
                <p style="margin: 2px;"><strong>Pagado:</strong> Bs. ${this.formatNum(venta.montoPagado || 0)}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align:right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${detalles.map(d => `
                    <tr>
                      <td style="font-size:10px;">${d.nombreProducto}</td>
                      <td style="text-align:right;">Bs. ${this.formatNum(d.subtotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="totales">
                <div style="text-align:right;">Subtotal: Bs. ${this.formatNum(venta.subtotal)}</div>
                <div style="text-align:right;">Descuento: Bs. ${this.formatNum(venta.descuento)}</div>
                <div class="total-final" style="text-align:right;">TOTAL: Bs. ${this.formatNum(venta.total)}</div>
              </div>
            </div>
            <button onclick="window.print()">Imprimir</button>
          </body>
        </html>
      `
      w.document.write(html)
      w.document.close()
    },
    imprimirTicket(venta) {
      const w = window.open('', '_blank')
      const detalles = this.detalle?.detalles || []
      let html = `
        <html>
          <head>
            <title>Ticket ${venta.nroVenta}</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 0; padding: 10px; }
              .ticket { width: 280px; margin: 0 auto; font-size: 11px; }
              h1 { text-align: center; margin: 5px 0; font-size: 14px; }
              .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
              .line { text-align: center; font-size: 10px; }
              table { width: 100%; margin: 5px 0; border-collapse: collapse; }
              td { padding: 2px 0; }
              .item { text-align: left; font-size: 10px; }
              .price { text-align: right; font-size: 10px; }
              .sep { border-top: 1px dashed #000; margin: 5px 0; }
              .total { text-align: right; font-weight: bold; font-size: 12px; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>TICKET DE CAJA</h1>
                <div class="line">Nro: ${venta.nroVenta}</div>
                <div class="line">${this.formatFecha(venta.fecha)}</div>
              </div>
              <div style="margin: 5px 0;">
                ${detalles.map(d => `
                  <div class="sep" style="border: none; margin: 3px 0;"></div>
                  <div class="item">${d.nombreProducto}</div>
                  <table>
                    <tr>
                      <td class="item">${this.formatCant(d.cantidad)} x Bs. ${this.formatNum(d.precioUnitario)}</td>
                      <td class="price">Bs. ${this.formatNum(d.subtotal)}</td>
                    </tr>
                  </table>
                `).join('')}
              </div>
              <div class="sep"></div>
              <table>
                <tr>
                  <td>TOTAL:</td>
                  <td class="total">Bs. ${this.formatNum(venta.total)}</td>
                </tr>
              </table>
              <div style="text-align: center; font-size: 9px; margin-top: 10px;">
                Gracias por su compra
              </div>
            </div>
            <button onclick="window.print()" style="margin-top: 10px;">Imprimir</button>
          </body>
        </html>
      `
      w.document.write(html)
      w.document.close()
    },
    formatNum(v) { return Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    formatCant(v) { const n = Number(v || 0); return n % 1 === 0 ? n.toString() : n.toFixed(3) },
    formatFecha(d) { if (!d) return ''; return new Date(d + 'T00:00:00').toLocaleDateString('es-BO', { day:'2-digit', month:'short', year:'numeric' }) },
  },
}
</script>

<style scoped>
.vh-root { display:flex; flex-direction:column; height:100%; gap:10px; }
.vh-filters-container { background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:12px 14px; }
.vh-filters-row { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px; align-items:flex-end; }
.vh-filter-group { display:flex; flex-direction:column; gap:4px; }
.vh-filter-group label { font-size:10px; font-weight:600; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.vh-filter-group input, .vh-filter-group select { width:140px; }
.vh-summary { display:flex; gap:16px; padding-top:8px; border-top:1px solid var(--b1); font-size:12px; }
.cp-cancel-btn { font-size:11px; font-weight:600; padding:5px 12px; border-radius:8px; background:var(--b1); color:var(--t4); border:1px solid var(--b0); cursor:pointer; }
.cp-cancel-btn:hover { background:var(--b2); }
.vh-table-wrap { flex:1; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; overflow:auto; }
.vh-table { width:100%; border-collapse:collapse; font-size:12px; }
.vh-table thead { background:var(--bg-n); position:sticky; top:0; }
.vh-table th { padding:10px 12px; text-align:left; font-size:10px; color:var(--t5); font-weight:600; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid var(--b1); }
.vh-row { cursor:pointer; border-bottom:1px solid #0d1a2d; transition:background .12s; }
.vh-row:hover { background:var(--bg-n); }
.vh-row td { padding:10px 12px; }
.vh-estado { font-size:9px; font-weight:700; padding:2px 6px; border-radius:4px; }
.vh-estado--pagada { background:#22c55e22; color:#4ade80; border:1px solid #22c55e44; }
.vh-estado--pendiente { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b44; }
.vh-estado--anulada { background:#ef444422; color:#f87171; border:1px solid #ef444444; }
.vh-badge { font-size:9px; font-weight:600; padding:2px 6px; border-radius:4px; background:var(--b1); color:var(--t4); }
.vh-badge--efectivo { background:#22c55e11; color:#4ade80; }
.vh-badge--tarjeta { background:#6366f111; color:#818cf8; }
.vh-badge--qr { background:#f59e0b11; color:#fbbf24; }
.vh-badge--transferencia { background:#3b82f611; color:#60a5fa; }

/* reuse */
.ide-input { padding:7px 10px; border-radius:8px; border:1px solid var(--b0); background:var(--bg); color:var(--t2); font-size:12px; outline:none; }
.ide-input:focus { border-color:#6366f1; }
.ide-select { padding:7px 10px; border-radius:8px; border:1px solid var(--b0); background:var(--bg); color:var(--t2); font-size:12px; outline:none; }
.cp-add-btn { font-size:11px; font-weight:600; padding:5px 12px; border-radius:8px; background:#6366f1; color:#fff; border:none; cursor:pointer; }
.cp-add-btn:hover { background:#4f46e5; }
.cp-icon-btn { padding:5px; border-radius:6px; background:var(--b1); border:1px solid var(--b0); color:var(--t4); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
.cp-icon-btn--danger:hover { background:#ef444422; color:#f87171; border-color:#ef444444; }
.cp-loading { display:flex; align-items:center; justify-content:center; }
.cp-empty { display:flex; align-items:center; justify-content:center; color:var(--b3); font-size:12px; }
.ct-spinner { width:22px; height:22px; border-radius:50%; border:2px solid var(--b0); border-top-color:#6366f1; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.ct-modal-backdrop { position:fixed; inset:0; background:#00000099; display:flex; align-items:center; justify-content:center; z-index:200; }
.ct-modal { background:var(--bg-s); border:1px solid var(--b4); border-radius:16px; width:90%; max-height:88vh; display:flex; flex-direction:column; box-shadow:0 20px 60px #00000088; }
.ct-modal-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--b1); font-size:14px; font-weight:700; color:var(--t2); }
.ct-modal-close { background:none; border:none; color:var(--t5); cursor:pointer; font-size:14px; }
.ct-modal-close:hover { color:var(--t2); }
.ct-modal-body { flex:1; overflow-y:auto; }
.ct-modal-footer { display:flex; gap:8px; justify-content:flex-end; padding:12px 16px; border-top:1px solid var(--b1); }
.ct-btn-cancel { padding:8px 16px; border-radius:8px; background:var(--b1); color:var(--t4); border:1px solid var(--b0); cursor:pointer; font-size:12px; }
.ct-btn-ok { padding:8px 18px; border-radius:8px; background:#6366f1; color:#fff; border:none; cursor:pointer; font-size:12px; font-weight:600; }
.ct-btn-ok:hover { background:#4f46e5; }
.ct-btn-print { padding:8px 12px; border-radius:8px; background:#3b82f6; color:#fff; border:none; cursor:pointer; font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; }
.ct-btn-print:hover { background:#2563eb; }
.modal-fade-enter-active, .modal-fade-leave-active { transition:opacity .2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity:0; }
</style>
