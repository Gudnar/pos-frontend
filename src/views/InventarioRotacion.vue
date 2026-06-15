<template>
  <div class="inv-root">

    <!-- Filtros -->
    <div class="inv-filters">
      <div class="ide-field" style="min-width:180px;">
        <label>Sucursal</label>
        <select v-model="filtro.sucursalId" class="ide-select" @change="cargar">
          <option value="">Todas</option>
          <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
        </select>
      </div>
      <div class="ide-field">
        <label>Desde</label>
        <input v-model="filtro.fechaDesde" type="date" class="ide-input" @change="cargar" />
      </div>
      <div class="ide-field">
        <label>Hasta</label>
        <input v-model="filtro.fechaHasta" type="date" class="ide-input" @change="cargar" />
      </div>
      <div class="ide-field" style="padding-top:18px;">
        <button class="ct-btn-cancel" @click="limpiar">Limpiar</button>
      </div>
    </div>

    <!-- Resumen -->
    <div class="inv-summary-bar">
      <div class="inv-summary-item">
        <span>Productos con movimiento</span>
        <strong>{{ datos.length }}</strong>
      </div>
      <div class="inv-summary-item">
        <span>Total movimientos</span>
        <strong>{{ totalMov }}</strong>
      </div>
      <div class="inv-summary-item">
        <span>Total entradas</span>
        <strong style="color:#4ade80;">{{ fmt(totalEntradas) }}</strong>
      </div>
      <div class="inv-summary-item">
        <span>Total salidas</span>
        <strong style="color:#f87171;">{{ fmt(totalSalidas) }}</strong>
      </div>
    </div>

    <!-- Tabla -->
    <div class="inv-table-wrap">
      <div v-if="loading" class="inv-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!datos.length" class="inv-empty">Sin movimientos para los filtros seleccionados</div>
      <table v-else class="inv-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Código</th>
            <th>Producto</th>
            <th style="text-align:right;">Total movimientos</th>
            <th style="text-align:right;">Entradas</th>
            <th style="text-align:right;">Salidas</th>
            <th style="text-align:right;">Ajustes</th>
            <th style="text-align:right;">Transferencias</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in datos" :key="r.productoId" class="inv-tr">
            <td style="color:var(--b3);font-size:11px;">{{ i + 1 }}</td>
            <td class="inv-mono">{{ r.codigo || '—' }}</td>
            <td style="font-weight:600;color:var(--t2);">{{ r.productoNombre || '—' }}</td>
            <td style="text-align:right;font-weight:800;">
              <div class="inv-bar-wrap">
                <div class="inv-bar" :style="barWidth(r.totalMovimientos)"></div>
                <span>{{ r.totalMovimientos }}</span>
              </div>
            </td>
            <td style="text-align:right;color:#4ade80;font-weight:700;">{{ fmt(r.totalEntradas) }}</td>
            <td style="text-align:right;color:#f87171;font-weight:700;">{{ fmt(r.totalSalidas) }}</td>
            <td style="text-align:right;color:#fbbf24;">{{ r.totalAjustes }}</td>
            <td style="text-align:right;color:#818cf8;">{{ r.totalTransferencias }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
export default {
  name: 'InventarioRotacion',
  data: () => ({
    datos: [], loading: false,
    filtro: { sucursalId: '', fechaDesde: '', fechaHasta: '' },
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
    maxMov() { return Math.max(...this.datos.map(r => Number(r.totalMovimientos || 0)), 1) },
    totalMov() { return this.datos.reduce((a, r) => a + Number(r.totalMovimientos || 0), 0) },
    totalEntradas() { return this.datos.reduce((a, r) => a + Number(r.totalEntradas || 0), 0) },
    totalSalidas() { return this.datos.reduce((a, r) => a + Number(r.totalSalidas || 0), 0) },
  },
  created() {
    const s = this.$store.getters.sucursalActualId
    if (s) this.filtro.sucursalId = s
    const hoy = new Date().toISOString().slice(0, 10)
    const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    this.filtro.fechaDesde = hace30; this.filtro.fechaHasta = hoy
    this.cargar()
  },
  methods: {
    async cargar() {
      this.loading = true
      const f = this.filtro
      const parts = []
      if (f.sucursalId) parts.push(`sucursalId=${f.sucursalId}`)
      if (f.fechaDesde) parts.push(`fechaDesde=${f.fechaDesde}`)
      if (f.fechaHasta) parts.push(`fechaHasta=${f.fechaHasta}`)
      const qs = parts.length ? '?' + parts.join('&') : ''
      try {
        this.datos = await this.$service.list(`movimientos-stock/reporte-rotacion${qs}`) || []
      } finally { this.loading = false }
    },
    limpiar() {
      this.filtro = { sucursalId: '', fechaDesde: '', fechaHasta: '' }
      this.cargar()
    },
    barWidth(v) {
      const pct = Math.round((Number(v) / this.maxMov) * 100)
      return `width:${pct}%;`
    },
    fmt(v) { return Number(v || 0).toFixed(2) },
  },
}
</script>

<style scoped>
.inv-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; gap:12px; }
.inv-filters { display:flex; gap:12px; flex-wrap:wrap; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:14px 16px; align-items:flex-end; }
.inv-summary-bar { display:flex; gap:20px; flex-wrap:wrap; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:12px 20px; }
.inv-summary-item { display:flex; flex-direction:column; gap:2px; }
.inv-summary-item span { font-size:10px; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.inv-summary-item strong { font-size:15px; color:var(--t1); }
.inv-table-wrap { flex:1; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; overflow:auto; }
.inv-loading { display:flex; justify-content:center; padding:40px; }
.inv-empty { text-align:center; padding:40px; font-size:13px; color:var(--b3); font-style:italic; }
.inv-table { width:100%; border-collapse:collapse; font-size:12px; }
.inv-table th { background:var(--bg-e); color:var(--t4); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:10px 12px; text-align:left; white-space:nowrap; position:sticky; top:0; z-index:1; }
.inv-table td { padding:10px 12px; border-top:1px solid var(--b2); vertical-align:middle; }
.inv-tr:hover { background:var(--bg-c); }
.inv-mono { font-family:monospace; font-size:11px; color:#818cf8; }
.inv-bar-wrap { display:flex; align-items:center; gap:8px; justify-content:flex-end; }
.inv-bar { height:6px; border-radius:3px; background:linear-gradient(90deg, #6366f1, #818cf8); min-width:2px; max-width:80px; transition:width .3s; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
