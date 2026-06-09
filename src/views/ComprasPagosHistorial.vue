<template>
  <div class="cp-root">

    <!-- Filtros -->
    <div class="cp-filters">
      <div class="ide-field" style="min-width:200px;flex:1;">
        <label>Proveedor</label>
        <select v-model="filtro.proveedorId" class="ide-select" @change="cargar">
          <option value="">Todos los proveedores</option>
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
      <div class="ide-field" style="padding-top:18px;display:flex;gap:8px;">
        <button class="ct-btn-cancel" @click="limpiar">Limpiar</button>
      </div>
    </div>

    <!-- Resumen -->
    <div class="cp-summary-bar">
      <div class="cp-summary-item">
        <span>Total pagos</span>
        <strong>{{ pagos.length }}</strong>
      </div>
      <div class="cp-summary-item">
        <span>Total pagado</span>
        <strong style="color:#4ade80;">Bs {{ formatMonto(totalPagado) }}</strong>
      </div>
      <div v-if="filtro.proveedorId" class="cp-summary-item">
        <span>Proveedor</span>
        <strong>{{ nombreProveedor(filtro.proveedorId) }}</strong>
      </div>
      <div v-if="filtro.fechaDesde || filtro.fechaHasta" class="cp-summary-item">
        <span>Período</span>
        <strong>{{ filtro.fechaDesde || '—' }} → {{ filtro.fechaHasta || '—' }}</strong>
      </div>
    </div>

    <!-- Tabla -->
    <div class="cp-table-container">
      <div v-if="loading" class="cp-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!pagos.length" class="cp-empty">Sin pagos para los filtros seleccionados</div>
      <table v-else class="cp-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Orden</th>
            <th>Factura</th>
            <th>Tipo</th>
            <th>Método</th>
            <th>Referencia</th>
            <th>Notas</th>
            <th style="text-align:right;">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pagos" :key="p.id" class="cp-tr">
            <td>{{ p.fecha }}</td>
            <td>{{ nombreProveedor(p.proveedorId) }}</td>
            <td class="cp-mono">{{ p.nroCompra }}</td>
            <td class="cp-mono">{{ p.nroFactura || '—' }}</td>
            <td>
              <span :class="['cp-tipo', p.tipoCompra === 'INICIAL' ? 'cp-tipo--ini' : 'cp-tipo--com']">
                {{ p.tipoCompra === 'INICIAL' ? 'Inicial' : 'Compra' }}
              </span>
            </td>
            <td>
              <span class="cp-metodo">{{ p.metodoPago }}</span>
            </td>
            <td style="color:#64748b;">{{ p.referencia || '—' }}</td>
            <td style="color:#64748b;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" :title="p.notas">{{ p.notas || '—' }}</td>
            <td style="text-align:right;font-weight:800;color:#4ade80;">Bs {{ formatMonto(p.monto) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="8" style="text-align:right;font-size:11px;font-weight:700;color:#64748b;padding:10px 12px;">Total:</td>
            <td style="text-align:right;font-weight:800;color:#4ade80;padding:10px 12px;">Bs {{ formatMonto(totalPagado) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

  </div>
</template>

<script>
export default {
  name: 'ComprasPagosHistorial',
  data: () => ({
    pagos: [], loading: false,
    proveedores: [],
    filtro: { proveedorId: '', fechaDesde: '', fechaHasta: '' },
  }),
  computed: {
    totalPagado() {
      return this.pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0)
    },
  },
  created() { this.cargar(); this.cargarProveedores() },
  methods: {
    async cargar() {
      this.loading = true
      const params = Object.entries(this.filtro).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&')
      try {
        this.pagos = await this.$service.list(`compras/pagos/historial${params ? '?' + params : ''}`) || []
      } finally { this.loading = false }
    },
    async cargarProveedores() {
      try { this.proveedores = await this.$service.list('proveedores') || [] }
      catch { this.proveedores = [] }
    },
    limpiar() {
      this.filtro = { proveedorId: '', fechaDesde: '', fechaHasta: '' }
      this.cargar()
    },
    nombreProveedor(id) {
      return id ? (this.proveedores.find(p => p.id === id)?.nombre || '—') : '—'
    },
    formatMonto(v) { return Number(v || 0).toFixed(2) },
  },
}
</script>

<style scoped>
.cp-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; gap:12px; }
.cp-filters { display:flex; gap:12px; flex-wrap:wrap; flex-shrink:0; background:#0d1526; border:1px solid #1e3a5f44; border-radius:12px; padding:14px 16px; align-items:flex-end; }
.cp-summary-bar { display:flex; gap:20px; flex-wrap:wrap; flex-shrink:0; background:#0d1526; border:1px solid #1e3a5f44; border-radius:12px; padding:12px 20px; }
.cp-summary-item { display:flex; flex-direction:column; gap:2px; }
.cp-summary-item span { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.4px; }
.cp-summary-item strong { font-size:15px; color:#f1f5f9; }
.cp-table-container { flex:1; background:#0d1526; border:1px solid #1e3a5f44; border-radius:12px; overflow:auto; }
.cp-loading { display:flex; justify-content:center; padding:40px; }
.cp-empty { text-align:center; padding:40px; font-size:13px; color:#334155; font-style:italic; }
.cp-table { width:100%; border-collapse:collapse; font-size:12px; }
.cp-table th { background:#0f172a; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:10px 12px; text-align:left; white-space:nowrap; position:sticky; top:0; z-index:1; }
.cp-table td { padding:10px 12px; border-top:1px solid #1e3a5f22; vertical-align:middle; }
.cp-table tfoot td { background:#0f172a44; border-top:2px solid #1e3a5f44; }
.cp-tr:hover { background:#1e293b; }
.cp-mono { font-family:monospace; font-size:11px; color:#818cf8; }
.cp-tipo { font-size:9px; font-weight:700; padding:2px 7px; border-radius:4px; }
.cp-tipo--ini { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b33; }
.cp-tipo--com { background:#6366f122; color:#818cf8; border:1px solid #6366f133; }
.cp-metodo { font-size:10px; font-weight:700; background:#1e293b; color:#94a3b8; padding:2px 7px; border-radius:4px; border:1px solid #1e3a5f44; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid #1e3a5f44; border-top-color:#6366f1; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
