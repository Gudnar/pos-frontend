<template>
  <div class="inv-root">

    <!-- Filtros -->
    <div class="inv-filters">
      <div class="ide-field" style="min-width:260px;flex:2;position:relative;">
        <label>Producto</label>
        <div style="position:relative;">
          <input
            v-model="busquedaProd"
            class="ide-input"
            placeholder="Buscar por categoría, subcategoría o producto..."
            autocomplete="off"
            @input="onInputProd"
            @focus="busquedaProd && (dropProdVisible = true)"
            @blur="ocultarDropProd"
            @keydown="onKeydownProd"
          />
          <button v-if="filtro.productoId || busquedaProd" class="prec-clear-btn" @mousedown.prevent="limpiarProd">✕</button>
        </div>
        <div v-if="dropProdVisible && filtrarProductosDrop.length" ref="dropProd" class="cp-prod-drop">
          <div
            v-for="(p, idx) in filtrarProductosDrop"
            :key="p.id"
            class="cp-drop-item"
            :class="{ 'cp-drop-item--active': idx === dropProdIdx }"
            @mousedown.prevent="seleccionarProducto(p)"
          >
            <div style="flex:1;min-width:0;">
              <span v-if="p.categoriaNombre || p.subcategoriaNombre" class="cp-drop-path">{{ [p.categoriaNombre, p.subcategoriaNombre].filter(Boolean).join(' › ') }} › </span><span class="cp-drop-nombre">{{ p.nombre }}</span>
            </div>
          </div>
        </div>
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
            <td class="inv-prod-cell">
              <span v-if="rutaMap.get(p.productoId)" class="inv-prod-path">{{ [rutaMap.get(p.productoId).categoriaNombre, rutaMap.get(p.productoId).subcategoriaNombre].filter(Boolean).join(' › ') }} ›&nbsp;</span><span class="inv-prod-nombre">{{ p.productoNombre || '—' }}</span>
            </td>
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
    precios: [], loading: false,
    productos: [], rutaMap: new Map(),
    busquedaProd: '', dropProdVisible: false, dropProdIdx: -1,
    filtro: { productoId: '' },
  }),
  computed: {
    filtrarProductosDrop() {
      const t = (this.busquedaProd || '').toLowerCase().trim()
      if (!t) return []
      const res = []
      for (const p of this.productos) {
        if (p.activo === false || p.estado === 'ELIMINADO') continue
        if (
          p.nombre.toLowerCase().includes(t) ||
          (p.subcategoriaNombre && p.subcategoriaNombre.toLowerCase().includes(t)) ||
          (p.categoriaNombre && p.categoriaNombre.toLowerCase().includes(t)) ||
          (p.codigoBarras && p.codigoBarras.toLowerCase().includes(t)) ||
          (p.codigoTienda && p.codigoTienda.toLowerCase().includes(t))
        ) { res.push(p); if (res.length >= 20) break }
      }
      return res
    },
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
      try {
        const [prods, subs, cats] = await Promise.all([
          this.$service.list('productos?soloActivos=true').catch(() => []),
          this.$service.list('subcategorias-producto?soloActivos=true').catch(() => []),
          this.$service.list('categorias-producto?soloActivos=true').catch(() => []),
        ])
        const subMap = new Map((subs || []).map(s => [s.id, s]))
        const catMap = new Map((cats || []).map(c => [c.id, c]))
        this.productos = (prods || []).map(p => {
          const sub = subMap.get(p.subcategoriaId)
          const cat = sub ? catMap.get(sub.categoriaId) : null
          return { ...p, subcategoriaNombre: sub?.nombre || '', categoriaNombre: cat?.nombre || '' }
        })
        this.rutaMap = new Map(this.productos.map(p => [p.id, { categoriaNombre: p.categoriaNombre, subcategoriaNombre: p.subcategoriaNombre }]))
      } catch { this.productos = []; this.rutaMap = new Map() }
    },
    onInputProd() { this.dropProdIdx = -1; this.dropProdVisible = true },
    ocultarDropProd() { setTimeout(() => { this.dropProdVisible = false }, 150) },
    limpiarProd() {
      this.busquedaProd = ''; this.filtro.productoId = ''
      this.dropProdVisible = false; this.dropProdIdx = -1
      this.cargar()
    },
    seleccionarProducto(p) {
      this.filtro.productoId = p.id
      this.busquedaProd = [p.categoriaNombre, p.subcategoriaNombre, p.nombre].filter(Boolean).join(' › ')
      this.dropProdVisible = false; this.dropProdIdx = -1
      this.cargar()
    },
    onKeydownProd(e) {
      const list = this.filtrarProductosDrop
      if (!list.length) return
      if (e.key === 'ArrowDown') { e.preventDefault(); this.dropProdVisible = true; this.dropProdIdx = Math.min(this.dropProdIdx + 1, list.length - 1) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.dropProdIdx = Math.max(this.dropProdIdx - 1, 0) }
      else if (e.key === 'Enter') { e.preventDefault(); if (this.dropProdIdx >= 0 && list[this.dropProdIdx]) this.seleccionarProducto(list[this.dropProdIdx]) }
      else if (e.key === 'Escape') { this.dropProdVisible = false; this.dropProdIdx = -1 }
    },
    async cargar() {
      this.loading = true
      const qs = this.filtro.productoId ? `?productoId=${this.filtro.productoId}` : ''
      try { this.precios = await this.$service.list(`lotes/historial-precios${qs}`) || [] }
      finally { this.loading = false }
    },
    limpiar() {
      this.filtro.productoId = ''; this.busquedaProd = ''
      this.dropProdVisible = false; this.dropProdIdx = -1
      this.cargar()
    },
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
/* Autocomplete */
.prec-clear-btn { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--t4); font-size:12px; padding:2px 4px; line-height:1; }
.prec-clear-btn:hover { color:var(--t1); }
.cp-prod-drop { position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.35); z-index:200; max-height:240px; overflow-y:auto; }
.cp-drop-item { display:flex; align-items:center; padding:8px 12px; cursor:pointer; font-size:12px; color:var(--t2); transition:background .12s; }
.cp-drop-item:hover, .cp-drop-item--active { background:var(--bg-c); }
.cp-drop-path { color:var(--t4); font-size:11px; font-weight:500; }
.cp-drop-nombre { font-weight:700; color:var(--t1); }
/* Columna producto */
.inv-prod-cell { max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.inv-prod-path { font-size:10px; color:var(--t4); font-weight:500; }
.inv-prod-nombre { font-size:12px; font-weight:700; color:var(--t2); }
</style>
