<template>
  <div class="inv-root">

    <!-- Filtros -->
    <div class="inv-filters">
      <div class="ide-field" style="min-width:260px;flex:2;">
        <label>Producto</label>
        <select v-model="filtro.productoId" class="ide-select" @change="cargar">
          <option value="">Todos los productos</option>
          <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
      </div>
      <div class="ide-field" style="padding-top:18px;">
        <button class="ct-btn-cancel" @click="limpiar">Limpiar</button>
      </div>
    </div>

    <!-- Resumen -->
    <div class="inv-summary-bar">
      <div class="inv-summary-item">
        <span>Registros</span>
        <strong>{{ precios.length }}</strong>
      </div>
      <div class="inv-summary-item" v-if="filtro.productoId && precios.length">
        <span>Precio actual vigente</span>
        <strong style="color:#4ade80;">Bs {{ precioVigente }}</strong>
      </div>
    </div>

    <!-- Tabla -->
    <div class="inv-table-wrap">
      <div v-if="loading" class="inv-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!precios.length" class="inv-empty">Sin historial de precios</div>
      <table v-else class="inv-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Tipo</th>
            <th style="text-align:right;">Precio</th>
            <th>Moneda</th>
            <th>Vigencia desde</th>
            <th>Vigencia hasta</th>
            <th>Cant. mín.</th>
            <th>Cant. máx.</th>
            <th style="text-align:center;">Activo</th>
            <th>Registrado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in precios" :key="p.id" :class="['inv-tr', p.activo ? '' : 'inv-tr--inactivo']">
            <td style="font-weight:600;color:var(--t2);">{{ p.productoNombre || '—' }}</td>
            <td><span class="inv-tipo-precio">{{ p.tipo }}</span></td>
            <td style="text-align:right;font-weight:800;color:#818cf8;">Bs {{ fmt(p.precio) }}</td>
            <td style="color:var(--t4);">{{ p.moneda }}</td>
            <td style="color:var(--t3);font-size:11px;">{{ p.fechaVigencia || '—' }}</td>
            <td style="color:var(--t3);font-size:11px;">{{ p.fechaFin || '—' }}</td>
            <td style="text-align:right;color:var(--t4);">{{ p.cantidadMin }}</td>
            <td style="text-align:right;color:var(--t4);">{{ p.cantidadMax || '—' }}</td>
            <td style="text-align:center;">
              <span :class="p.activo ? 'inv-dot--on' : 'inv-dot--off'"></span>
            </td>
            <td style="color:var(--t4);font-size:11px;">{{ formatFecha(p.fechaCreacion) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
export default {
  name: 'InventarioPrecios',
  data: () => ({
    precios: [], loading: false, productos: [],
    filtro: { productoId: '' },
  }),
  computed: {
    precioVigente() {
      const vigentes = this.precios.filter(p => p.activo && p.tipo === 'VENTA')
      if (!vigentes.length) return '—'
      return this.fmt(vigentes[0]?.precio)
    },
  },
  created() {
    this.cargarProductos()
    this.cargar()
  },
  methods: {
    async cargarProductos() {
      try { this.productos = await this.$service.list('productos?soloActivos=true') || [] } catch { this.productos = [] }
    },
    async cargar() {
      this.loading = true
      const qs = this.filtro.productoId ? `?productoId=${this.filtro.productoId}` : ''
      try { this.precios = await this.$service.list(`lotes/historial-precios${qs}`) || [] }
      finally { this.loading = false }
    },
    limpiar() { this.filtro.productoId = ''; this.cargar() },
    fmt(v) { return Number(v || 0).toFixed(2) },
    formatFecha(f) { return f ? String(f).slice(0, 10) : '—' },
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
.inv-tr--inactivo { opacity:.5; }
.inv-tipo-precio { font-size:9px; font-weight:700; background:#6366f122; color:#818cf8; border:1px solid #6366f133; padding:2px 7px; border-radius:4px; }
.inv-dot--on  { display:inline-block; width:8px; height:8px; border-radius:50%; background:#4ade80; }
.inv-dot--off { display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--b3); }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
