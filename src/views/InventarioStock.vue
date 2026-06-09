<template>
  <div class="inv-root">

    <!-- Filtros -->
    <div class="inv-filters">
      <div class="ide-field" style="min-width:200px;flex:1;">
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

    <!-- Resumen -->
    <div class="inv-summary-bar">
      <div class="inv-summary-item">
        <span>Productos</span>
        <strong>{{ filasFiltradas.length }}</strong>
      </div>
      <div class="inv-summary-item">
        <span>Total lotes</span>
        <strong>{{ totalLotes }}</strong>
      </div>
      <div class="inv-summary-item">
        <span>Unidades en stock</span>
        <strong style="color:#4ade80;">{{ totalUnidades }}</strong>
      </div>
    </div>

    <!-- Tabla -->
    <div class="inv-table-wrap">
      <div v-if="loading" class="inv-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!filasFiltradas.length" class="inv-empty">Sin registros para los filtros seleccionados</div>
      <table v-else class="inv-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th style="text-align:right;">Stock Total</th>
            <th style="text-align:center;"># Lotes</th>
            <th>Próx. Vencimiento</th>
            <th>Picking</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filasFiltradas" :key="r.productoId + r.sucursalId" class="inv-tr">
            <td class="inv-mono">{{ r.codigo || '—' }}</td>
            <td style="font-weight:600;color:#e2e8f0;">{{ r.nombre }}</td>
            <td style="text-align:right;font-weight:800;color:#4ade80;">{{ fmt(r.stockTotal) }}</td>
            <td style="text-align:center;color:#94a3b8;">{{ r.nroLotes }}</td>
            <td>
              <span v-if="r.proximoVencimiento" :class="['inv-venc', diasParaVencer(r.proximoVencimiento) <= 30 ? 'inv-venc--warn' : '']">
                {{ r.proximoVencimiento }} ({{ diasParaVencer(r.proximoVencimiento) }}d)
              </span>
              <span v-else style="color:#334155;">—</span>
            </td>
            <td><span class="inv-badge">{{ r.metodoPicking || 'FEFO' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
export default {
  name: 'InventarioStock',
  data: () => ({
    filas: [], filasFiltradas: [], loading: false,
    filtro: { sucursalId: '' },
    busqueda: '',
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
    totalLotes() { return this.filasFiltradas.reduce((a, r) => a + Number(r.nroLotes || 0), 0) },
    totalUnidades() { return this.filasFiltradas.reduce((a, r) => a + Number(r.stockTotal || 0), 0).toFixed(2) },
  },
  created() {
    const s = this.$store.getters.sucursalActualId
    if (s) this.filtro.sucursalId = s
    this.cargar()
  },
  methods: {
    async cargar() {
      this.loading = true
      const params = this.filtro.sucursalId ? `?sucursalId=${this.filtro.sucursalId}` : ''
      try {
        this.filas = await this.$service.list(`lotes/stock${params}`) || []
        this.filtrarLocal()
      } finally { this.loading = false }
    },
    filtrarLocal() {
      const q = this.busqueda.toLowerCase()
      this.filasFiltradas = q
        ? this.filas.filter(r => r.nombre?.toLowerCase().includes(q) || r.codigo?.toLowerCase().includes(q))
        : [...this.filas]
    },
    limpiar() {
      this.filtro.sucursalId = ''; this.busqueda = ''
      this.cargar()
    },
    fmt(v) { return Number(v || 0).toFixed(2) },
    diasParaVencer(fecha) {
      const hoy = new Date(); const d = new Date(fecha)
      return Math.ceil((d - hoy) / 86400000)
    },
  },
}
</script>

<style scoped>
.inv-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; gap:12px; }
.inv-filters { display:flex; gap:12px; flex-wrap:wrap; flex-shrink:0; background:#0d1526; border:1px solid #1e3a5f44; border-radius:12px; padding:14px 16px; align-items:flex-end; }
.inv-summary-bar { display:flex; gap:20px; flex-wrap:wrap; flex-shrink:0; background:#0d1526; border:1px solid #1e3a5f44; border-radius:12px; padding:12px 20px; }
.inv-summary-item { display:flex; flex-direction:column; gap:2px; }
.inv-summary-item span { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.4px; }
.inv-summary-item strong { font-size:15px; color:#f1f5f9; }
.inv-table-wrap { flex:1; background:#0d1526; border:1px solid #1e3a5f44; border-radius:12px; overflow:auto; }
.inv-loading { display:flex; justify-content:center; padding:40px; }
.inv-empty { text-align:center; padding:40px; font-size:13px; color:#334155; font-style:italic; }
.inv-table { width:100%; border-collapse:collapse; font-size:12px; }
.inv-table th { background:#0f172a; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:10px 12px; text-align:left; white-space:nowrap; position:sticky; top:0; z-index:1; }
.inv-table td { padding:10px 12px; border-top:1px solid #1e3a5f22; vertical-align:middle; }
.inv-tr:hover { background:#1e293b; }
.inv-mono { font-family:monospace; font-size:11px; color:#818cf8; }
.inv-badge { font-size:9px; font-weight:700; background:#1e293b; color:#94a3b8; padding:2px 7px; border-radius:4px; border:1px solid #1e3a5f44; }
.inv-venc { font-size:11px; color:#e2e8f0; }
.inv-venc--warn { color:#fbbf24; font-weight:700; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid #1e3a5f44; border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
