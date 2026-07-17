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
      <div class="ide-field" style="min-width:220px;flex:2;position:relative;">
        <label>Buscar producto</label>
        <input
          v-model="busqueda"
          class="ide-input"
          placeholder="Nombre o código…"
          @input="actualizarSugerencias"
          @keydown="onBusquedaKeydown"
          @focus="dropdownAbierto = busqueda.length > 0"
        />
        <!-- Dropdown autocomplete -->
        <div v-if="dropdownAbierto && productosFiltrados.length > 0" class="autocomplete-dropdown">
          <div
            v-for="(prod, idx) in productosFiltrados.slice(0, 8)"
            :key="prod.productoId"
            :class="['autocomplete-item', { 'autocomplete-item--active': idx === highlightIndex }]"
            @click="seleccionarProducto(prod)"
            @mouseenter="highlightIndex = idx"
          >
            <div class="autocomplete-item__path">{{ [prod.categoriaNombre, prod.subcategoriaNombre, prod.nombre].filter(Boolean).join(' › ') }}</div>
            <div class="autocomplete-item__info">Stock: {{ fmt(prod.stockTotal) }}</div>
          </div>
        </div>
      </div>
      <div class="ide-field" style="padding-top:18px;">
        <button class="ide-btn ide-btn--primary" @click="aplicarBusqueda" style="margin-right:8px;">🔍 Buscar</button>
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
            <td class="inv-prod-cell">
              <span v-if="r.categoriaNombre || r.subcategoriaNombre" class="inv-prod-path">{{ [r.categoriaNombre, r.subcategoriaNombre].filter(Boolean).join(' › ') }} ›&nbsp;</span><span class="inv-prod-nombre">{{ r.nombre }}</span>
            </td>
            <td style="text-align:right;font-weight:800;color:#4ade80;">{{ fmt(r.stockTotal) }}</td>
            <td style="text-align:center;color:var(--t3);">{{ r.nroLotes }}</td>
            <td>
              <span v-if="r.proximoVencimiento" :class="['inv-venc', diasParaVencer(r.proximoVencimiento) <= 30 ? 'inv-venc--warn' : '']">
                {{ r.proximoVencimiento }} ({{ diasParaVencer(r.proximoVencimiento) }}d)
              </span>
              <span v-else style="color:var(--b3);">—</span>
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
    dropdownAbierto: false,
    highlightIndex: -1,
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
    totalLotes() { return this.filasFiltradas.reduce((a, r) => a + Number(r.nroLotes || 0), 0) },
    totalUnidades() { return this.filasFiltradas.reduce((a, r) => a + Number(r.stockTotal || 0), 0).toFixed(2) },
    productosFiltrados() {
      const q = this.busqueda.toLowerCase().trim()
      if (!q) return []
      return this.filas.filter(r =>
        r.nombre?.toLowerCase().includes(q) ||
        r.codigo?.toLowerCase().includes(q) ||
        r.categoriaNombre?.toLowerCase().includes(q) ||
        r.subcategoriaNombre?.toLowerCase().includes(q))
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
      const params = this.filtro.sucursalId ? `?sucursalId=${this.filtro.sucursalId}` : ''
      try {
        const [rows, prods, subs, cats] = await Promise.all([
          this.$service.list(`lotes/stock${params}`).catch(() => []),
          this.$service.list('productos?soloActivos=true').catch(() => []),
          this.$service.list('subcategorias-producto?soloActivos=true').catch(() => []),
          this.$service.list('categorias-producto?soloActivos=true').catch(() => []),
        ])
        const subMap = new Map((subs || []).map(s => [s.id, s]))
        const catMap = new Map((cats || []).map(c => [c.id, c]))
        const prodMap = new Map((prods || []).map(p => [p.id, p]))
        this.filas = (rows || []).map(r => {
          if (r.categoriaNombre || r.subcategoriaNombre) return r
          const prod = prodMap.get(r.productoId)
          const sub = prod ? subMap.get(prod.subcategoriaId) : null
          const cat = sub ? catMap.get(sub.categoriaId) : null
          return { ...r, subcategoriaNombre: sub?.nombre || '', categoriaNombre: cat?.nombre || '' }
        })
        this.filasFiltradas = [...this.filas]
      } finally { this.loading = false }
    },
    actualizarSugerencias() {
      const q = this.busqueda.toLowerCase().trim()
      this.dropdownAbierto = q.length > 0 && this.productosFiltrados.length > 0
      this.highlightIndex = -1
    },
    aplicarBusqueda() {
      const q = this.busqueda.toLowerCase().trim()
      this.filasFiltradas = q
        ? this.filas.filter(r =>
            r.nombre?.toLowerCase().includes(q) ||
            r.codigo?.toLowerCase().includes(q) ||
            r.categoriaNombre?.toLowerCase().includes(q) ||
            r.subcategoriaNombre?.toLowerCase().includes(q))
        : [...this.filas]
      this.dropdownAbierto = false
      this.highlightIndex = -1
    },
    onBusquedaKeydown(e) {
      if (!this.dropdownAbierto || this.productosFiltrados.length === 0) return
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault()
          this.highlightIndex = Math.min(this.highlightIndex + 1, Math.min(this.productosFiltrados.length - 1, 7))
          break
        case 'ArrowUp':
          e.preventDefault()
          this.highlightIndex = Math.max(this.highlightIndex - 1, -1)
          break
        case 'Enter':
          e.preventDefault()
          if (this.highlightIndex >= 0 && this.highlightIndex < this.productosFiltrados.length) {
            this.seleccionarProducto(this.productosFiltrados[this.highlightIndex])
          } else {
            this.aplicarBusqueda()
          }
          break
        case 'Escape':
          e.preventDefault()
          this.dropdownAbierto = false
          this.highlightIndex = -1
          break
      }
    },
    seleccionarProducto(prod) {
      this.busqueda = prod.nombre
      this.aplicarBusqueda()
    },
    limpiar() {
      this.filtro.sucursalId = ''
      this.busqueda = ''
      this.dropdownAbierto = false
      this.highlightIndex = -1
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
.inv-badge { font-size:9px; font-weight:700; background:var(--bg-c); color:var(--t3); padding:2px 7px; border-radius:4px; border:1px solid var(--b1); }
.inv-venc { font-size:11px; color:var(--t2); }
.inv-venc--warn { color:#fbbf24; font-weight:700; }
.inv-prod-cell { max-width:320px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.inv-prod-path { font-size:11px; color:var(--t4); font-weight:500; }
.inv-prod-nombre { font-size:12px; font-weight:700; color:var(--t2); }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
/* Autocomplete dropdown */
.autocomplete-dropdown { position:absolute; top:100%; left:0; right:0; margin-top:4px; background:var(--bg-s); border:1px solid var(--b1); border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:10; max-height:300px; overflow-y:auto; }
.autocomplete-item { padding:10px 12px; cursor:pointer; border-bottom:1px solid var(--b2); transition:background-color 0.15s; }
.autocomplete-item:last-child { border-bottom:none; }
.autocomplete-item:hover, .autocomplete-item--active { background:var(--bg-c); }
.autocomplete-item__path { font-size:12px; font-weight:600; color:var(--t2); margin-bottom:4px; word-break:break-word; }
.autocomplete-item__info { font-size:11px; color:var(--t4); }
</style>
