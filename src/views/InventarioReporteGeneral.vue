<template>
  <div class="inv-root">

    <!-- Filtros -->
    <div class="inv-filters">
      <div class="ide-field" style="min-width:200px;">
        <label>Sucursal</label>
        <select v-model="filtro.sucursalId" class="ide-select" @change="cargar">
          <option value="">Todas las sucursales</option>
          <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
        </select>
      </div>
      <div class="ide-field" style="min-width:220px;flex:2;">
        <label>Buscar producto</label>
        <input v-model="busqueda" class="ide-input" placeholder="Nombre o código…" @input="filtrarLocal" />
      </div>
      <div class="ide-field" style="padding-top:18px;">
        <button class="ct-btn-cancel" @click="limpiar">Limpiar</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="inv-kpi-bar">
      <div class="inv-kpi">
        <span class="inv-kpi-label">Productos distintos</span>
        <span class="inv-kpi-value">{{ filasFiltradas.length }}</span>
      </div>
      <div class="inv-kpi">
        <span class="inv-kpi-label">Total unidades</span>
        <span class="inv-kpi-value" style="color:#4ade80;">{{ totalUnidades }}</span>
      </div>
      <div class="inv-kpi">
        <span class="inv-kpi-label">Valor inventario (costo)</span>
        <span class="inv-kpi-value" style="color:#818cf8;">Bs {{ totalValor }}</span>
      </div>
      <div class="inv-kpi">
        <span class="inv-kpi-label">Total lotes activos</span>
        <span class="inv-kpi-value">{{ totalLotes }}</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="inv-table-wrap">
      <div v-if="loading" class="inv-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!filasFiltradas.length" class="inv-empty">Sin datos de inventario</div>
      <table v-else class="inv-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th style="text-align:right;">Stock total</th>
            <th style="text-align:center;"># Lotes</th>
            <th style="text-align:right;">Costo unit.</th>
            <th style="text-align:right;">Valor total</th>
            <th>Próx. Vencimiento</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filasFiltradas" :key="r.productoId + (r.sucursalId||'')" class="inv-tr">
            <td class="inv-mono">{{ r.codigo || '—' }}</td>
            <td style="font-weight:600;color:var(--t2);">{{ r.productoNombre || '—' }}</td>
            <td style="text-align:right;font-weight:800;color:#4ade80;">{{ fmt(r.stockTotal) }}</td>
            <td style="text-align:center;color:var(--t3);">{{ r.nroLotes }}</td>
            <td style="text-align:right;color:var(--t4);">{{ r.precioCosto ? 'Bs ' + fmt(r.precioCosto) : '—' }}</td>
            <td style="text-align:right;font-weight:700;color:#818cf8;">
              {{ r.precioCosto ? 'Bs ' + fmt(Number(r.stockTotal) * Number(r.precioCosto)) : '—' }}
            </td>
            <td>
              <span v-if="r.proximoVencimiento" style="font-size:11px;color:#fbbf24;">{{ r.proximoVencimiento }}</span>
              <span v-else style="color:var(--b3);">—</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="text-align:right;font-size:11px;font-weight:700;color:var(--t4);padding:10px 12px;">Total:</td>
            <td style="text-align:right;font-weight:800;color:#4ade80;padding:10px 12px;">{{ totalUnidades }}</td>
            <td style="text-align:center;color:var(--t3);padding:10px 12px;">{{ totalLotes }}</td>
            <td></td>
            <td style="text-align:right;font-weight:800;color:#818cf8;padding:10px 12px;">Bs {{ totalValor }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

  </div>
</template>

<script>
export default {
  name: 'InventarioReporteGeneral',
  data: () => ({
    filas: [], filasFiltradas: [], loading: false,
    filtro: { sucursalId: '' },
    busqueda: '',
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
    totalUnidades() { return this.filasFiltradas.reduce((a, r) => a + Number(r.stockTotal || 0), 0).toFixed(2) },
    totalLotes() { return this.filasFiltradas.reduce((a, r) => a + Number(r.nroLotes || 0), 0) },
    totalValor() {
      return this.filasFiltradas.reduce((a, r) => {
        const v = r.precioCosto ? Number(r.stockTotal) * Number(r.precioCosto) : 0
        return a + v
      }, 0).toFixed(2)
    },
  },
  created() {
    const s = this.$store.getters.sucursalActualId
    if (s) this.filtro.sucursalId = s
    this.cargar()
  },
  methods: {
    async cargar() {
      this.loading = true
      const qs = this.filtro.sucursalId ? `?sucursalId=${this.filtro.sucursalId}` : ''
      try {
        this.filas = await this.$service.list(`lotes/reporte-general${qs}`) || []
        this.filtrarLocal()
      } finally { this.loading = false }
    },
    filtrarLocal() {
      const q = this.busqueda.toLowerCase()
      this.filasFiltradas = q
        ? this.filas.filter(r => r.productoNombre?.toLowerCase().includes(q) || r.codigo?.toLowerCase().includes(q))
        : [...this.filas]
    },
    limpiar() { this.filtro.sucursalId = ''; this.busqueda = ''; this.cargar() },
    fmt(v) { return Number(v || 0).toFixed(2) },
  },
}
</script>

<style scoped>
.inv-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; gap:12px; }
.inv-filters { display:flex; gap:12px; flex-wrap:wrap; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:14px 16px; align-items:flex-end; }
.inv-kpi-bar { display:flex; gap:16px; flex-wrap:wrap; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:16px 20px; }
.inv-kpi { display:flex; flex-direction:column; gap:4px; }
.inv-kpi-label { font-size:10px; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.inv-kpi-value { font-size:18px; font-weight:800; color:var(--t1); }
.inv-table-wrap { flex:1; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; overflow:auto; }
.inv-loading { display:flex; justify-content:center; padding:40px; }
.inv-empty { text-align:center; padding:40px; font-size:13px; color:var(--b3); font-style:italic; }
.inv-table { width:100%; border-collapse:collapse; font-size:12px; }
.inv-table th { background:var(--bg-e); color:var(--t4); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:10px 12px; text-align:left; white-space:nowrap; position:sticky; top:0; z-index:1; }
.inv-table td { padding:10px 12px; border-top:1px solid var(--b2); vertical-align:middle; }
.inv-table tfoot td { background:var(--b1); border-top:2px solid var(--b1); }
.inv-tr:hover { background:var(--bg-c); }
.inv-mono { font-family:monospace; font-size:11px; color:#818cf8; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
