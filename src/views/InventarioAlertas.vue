<template>
  <div class="inv-root">

    <!-- Tabs -->
    <div class="inv-tabs">
      <button v-for="t in tabs" :key="t.v" :class="['inv-tab', tab === t.v ? 'inv-tab--active' : '']" @click="cambiarTab(t.v)">
        <span v-if="t.v === 'vencer'" class="inv-tab-dot inv-tab-dot--warn"></span>
        <span v-if="t.v === 'sinmov'" class="inv-tab-dot inv-tab-dot--info"></span>
        <span v-if="t.v === 'minimo'" class="inv-tab-dot inv-tab-dot--err"></span>
        {{ t.l }}
        <span v-if="badgeCount(t.v)" class="inv-tab-badge">{{ badgeCount(t.v) }}</span>
      </button>
      <div style="flex:1;"></div>
      <!-- Filtros según tab -->
      <div v-if="tab !== 'minimo'" class="ide-field" style="margin-bottom:0;">
        <select v-model="filtroSucursal" class="ide-select" @change="cargar">
          <option value="">Todas las sucursales</option>
          <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
        </select>
      </div>
      <div v-if="tab === 'sinmov'" class="ide-field" style="margin-bottom:0;min-width:80px;">
        <select v-model="diasSinMovimiento" class="ide-select" @change="cargar">
          <option :value="7">7 días</option>
          <option :value="15">15 días</option>
          <option :value="30">30 días</option>
          <option :value="60">60 días</option>
          <option :value="90">90 días</option>
        </select>
      </div>
    </div>

    <!-- Tabla por vencer -->
    <div v-if="tab === 'vencer'" class="inv-table-wrap">
      <div v-if="loading" class="inv-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!porVencer.length" class="inv-empty">Sin lotes próximos a vencer</div>
      <table v-else class="inv-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Lote #</th>
            <th>Vencimiento</th>
            <th style="text-align:center;">Días restantes</th>
            <th style="text-align:right;">Stock actual</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in porVencer" :key="l.loteId" class="inv-tr">
            <td class="inv-prod-cell">
              <span v-if="rutaMap.get(l.productoId)" class="inv-prod-path">{{ [rutaMap.get(l.productoId).categoriaNombre, rutaMap.get(l.productoId).subcategoriaNombre].filter(Boolean).join(' › ') }} ›&nbsp;</span><span class="inv-prod-nombre">{{ l.productoNombre }}</span>
            </td>
            <td class="inv-mono">{{ l.nroLote || '—' }}</td>
            <td style="color:#fbbf24;font-weight:700;">{{ l.fechaVencimiento }}</td>
            <td style="text-align:center;">
              <span :class="['inv-dias', classDias(l.diasRestantes)]">
                {{ labelDias(l.diasRestantes) }}
              </span>
            </td>
            <td style="text-align:right;font-weight:800;color:var(--t2);">{{ fmt(l.cantidadActual) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sin movimiento -->
    <div v-if="tab === 'sinmov'" class="inv-table-wrap">
      <div v-if="loading" class="inv-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!sinMovimiento.length" class="inv-empty">No hay productos sin movimiento en los últimos {{ diasSinMovimiento }} días</div>
      <table v-else class="inv-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th style="text-align:right;">Stock total</th>
            <th>Último movimiento</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in sinMovimiento" :key="r.productoId + r.sucursalId" class="inv-tr">
            <td class="inv-mono">{{ r.codigo || '—' }}</td>
            <td class="inv-prod-cell">
              <span v-if="rutaMap.get(r.productoId)" class="inv-prod-path">{{ [rutaMap.get(r.productoId).categoriaNombre, rutaMap.get(r.productoId).subcategoriaNombre].filter(Boolean).join(' › ') }} ›&nbsp;</span><span class="inv-prod-nombre">{{ r.productoNombre }}</span>
            </td>
            <td style="text-align:right;color:var(--t3);">{{ fmt(r.stockTotal) }}</td>
            <td style="color:var(--t4);font-size:11px;">{{ r.ultimoMovimiento ? formatFecha(r.ultimoMovimiento) : 'Nunca' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Stock mínimo -->
    <div v-if="tab === 'minimo'" class="inv-table-wrap">
      <div class="inv-minimo-header">
        <span style="font-size:12px;color:var(--t4);">Umbral de alerta:</span>
        <input v-model.number="stockMinimo" type="number" min="0" class="ide-input" style="width:80px;padding:4px 8px;" @input="filtrarMinimo" />
        <span style="font-size:11px;color:var(--t4);">unidades</span>
        <select v-model="filtroSucursal" class="ide-select" style="max-width:200px;" @change="filtrarMinimo">
          <option value="">Todas las sucursales</option>
          <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
        </select>
      </div>
      <div v-if="loadingStock" class="inv-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!stockBajo.length" class="inv-empty">Sin productos por debajo del umbral</div>
      <table v-else class="inv-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th style="text-align:right;">Stock actual</th>
            <th style="text-align:center;"># Lotes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in stockBajo" :key="r.productoId + r.sucursalId" class="inv-tr">
            <td class="inv-mono">{{ r.codigo || '—' }}</td>
            <td class="inv-prod-cell">
              <span v-if="rutaMap.get(r.productoId)" class="inv-prod-path">{{ [rutaMap.get(r.productoId).categoriaNombre, rutaMap.get(r.productoId).subcategoriaNombre].filter(Boolean).join(' › ') }} ›&nbsp;</span><span class="inv-prod-nombre">{{ r.nombre }}</span>
            </td>
            <td style="text-align:right;font-weight:800;color:#f87171;">{{ fmt(r.stockTotal) }}</td>
            <td style="text-align:center;color:var(--t3);">{{ r.nroLotes }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
export default {
  name: 'InventarioAlertas',
  data: () => ({
    tab: 'vencer',
    tabs: [
      { v: 'vencer', l: 'Próximos a Vencer' },
      { v: 'sinmov', l: 'Sin Movimiento' },
      { v: 'minimo', l: 'Stock Mínimo' },
    ],
    porVencer: [], sinMovimiento: [], allStock: [], stockBajo: [],
    loading: false, loadingStock: false, rutaMap: new Map(),
    filtroSucursal: '', diasSinMovimiento: 30, stockMinimo: 5,
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
  },
  created() {
    const s = this.$store.getters.sucursalActualId
    if (s) this.filtroSucursal = s
    this.cargar()
    this.cargarStock()
    this.cargarRutaMap()
  },
  methods: {
    async cargarRutaMap() {
      try {
        const [prods, subs, cats] = await Promise.all([
          this.$service.list('productos?soloActivos=true').catch(() => []),
          this.$service.list('subcategorias-producto?soloActivos=true').catch(() => []),
          this.$service.list('categorias-producto?soloActivos=true').catch(() => []),
        ])
        const subMap = new Map((subs || []).map(s => [s.id, s]))
        const catMap = new Map((cats || []).map(c => [c.id, c]))
        this.rutaMap = new Map((prods || []).map(p => {
          const sub = subMap.get(p.subcategoriaId)
          const cat = sub ? catMap.get(sub.categoriaId) : null
          return [p.id, { categoriaNombre: cat?.nombre || '', subcategoriaNombre: sub?.nombre || '' }]
        }))
      } catch { this.rutaMap = new Map() }
    },
    cambiarTab(v) { this.tab = v; this.cargar() },
    badgeCount(t) {
      if (t === 'vencer') return this.porVencer.length || null
      if (t === 'sinmov') return this.sinMovimiento.length || null
      if (t === 'minimo') return this.stockBajo.length || null
      return null
    },
    async cargar() {
      if (this.tab === 'vencer') await this.cargarPorVencer()
      else if (this.tab === 'sinmov') await this.cargarSinMovimiento()
      else await this.filtrarMinimo()
    },
    async cargarPorVencer() {
      this.loading = true
      const qs = this.filtroSucursal ? `?sucursalId=${this.filtroSucursal}` : ''
      try { this.porVencer = await this.$service.list(`lotes/proximos-vencer${qs}`) || [] }
      finally { this.loading = false }
    },
    async cargarSinMovimiento() {
      this.loading = true
      const parts = [`dias=${this.diasSinMovimiento}`]
      if (this.filtroSucursal) parts.push(`sucursalId=${this.filtroSucursal}`)
      try { this.sinMovimiento = await this.$service.list(`movimientos-stock/sin-movimiento?${parts.join('&')}`) || [] }
      finally { this.loading = false }
    },
    async cargarStock() {
      this.loadingStock = true
      try { this.allStock = await this.$service.list('lotes/stock') || [] }
      finally { this.loadingStock = false; this.filtrarMinimo() }
    },
    filtrarMinimo() {
      let base = this.allStock
      if (this.filtroSucursal) base = base.filter(r => r.sucursalId === this.filtroSucursal)
      this.stockBajo = base.filter(r => Number(r.stockTotal) <= this.stockMinimo).sort((a, b) => Number(a.stockTotal) - Number(b.stockTotal))
    },
    classDias(d) {
      const n = Number(d)
      if (n <= 0) return 'inv-dias--venc'
      if (n <= 7) return 'inv-dias--crit'
      return 'inv-dias--warn'
    },
    labelDias(d) {
      const n = Number(d)
      return n <= 0 ? 'VENCIDO' : d + 'd'
    },
    fmt(v) { return Number(v || 0).toFixed(2) },
    formatFecha(f) { return f ? String(f).slice(0, 16).replace('T', ' ') : '—' },
  },
}
</script>

<style scoped>
.inv-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; gap:12px; }
.inv-tabs { display:flex; align-items:center; gap:6px; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:8px 12px; }
.inv-tab { background:none; border:none; cursor:pointer; font-size:12px; font-weight:600; color:var(--t4); padding:6px 14px; border-radius:8px; display:flex; align-items:center; gap:6px; transition:all .15s; }
.inv-tab:hover { color:var(--t3); background:var(--b1); }
.inv-tab--active { background:#6366f122; color:#818cf8; }
.inv-tab-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.inv-tab-dot--warn { background:#fbbf24; }
.inv-tab-dot--info { background:#38bdf8; }
.inv-tab-dot--err  { background:#f87171; }
.inv-tab-badge { background:#ef4444; color:#fff; font-size:9px; font-weight:700; padding:1px 5px; border-radius:999px; min-width:16px; text-align:center; }
.inv-table-wrap { flex:1; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; overflow:auto; }
.inv-loading { display:flex; justify-content:center; padding:40px; }
.inv-empty { text-align:center; padding:40px; font-size:13px; color:var(--b3); font-style:italic; }
.inv-table { width:100%; border-collapse:collapse; font-size:12px; }
.inv-table th { background:var(--bg-e); color:var(--t4); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:10px 12px; text-align:left; white-space:nowrap; position:sticky; top:0; z-index:1; }
.inv-table td { padding:10px 12px; border-top:1px solid var(--b2); vertical-align:middle; }
.inv-tr:hover { background:var(--bg-c); }
.inv-mono { font-family:monospace; font-size:11px; color:#818cf8; }
.inv-dias { font-size:10px; font-weight:700; padding:2px 7px; border-radius:4px; }
.inv-dias--warn { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b33; }
.inv-dias--crit { background:#ef444422; color:#f87171; border:1px solid #ef444433; }
.inv-dias--venc { background:#ef444422; color:#f87171; border:1px solid #ef444433; }
.inv-minimo-header { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--b2); flex-shrink:0; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.inv-prod-cell { max-width:280px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.inv-prod-path { font-size:10px; color:var(--t4); font-weight:500; }
.inv-prod-nombre { font-size:12px; font-weight:700; color:var(--t2); }
</style>
