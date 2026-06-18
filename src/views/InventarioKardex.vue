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
          <button v-if="filtro.productoId || busquedaProd" class="inv-clear-btn" @mousedown.prevent="limpiarProd">✕</button>
        </div>
        <div v-if="dropProdVisible && filtrarProductosDrop.length" ref="dropProd" class="cp-prod-drop" style="position:absolute;top:100%;left:0;right:0;z-index:200;">
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
      <div class="ide-field" style="min-width:140px;">
        <label>Tipo</label>
        <select v-model="filtro.tipo" class="ide-select" @change="cargar">
          <option value="">Todos</option>
          <option value="INGRESO">Ingreso</option>
          <option value="SALIDA">Salida</option>
          <option value="AJUSTE_POSITIVO">Ajuste +</option>
          <option value="AJUSTE_NEGATIVO">Ajuste -</option>
          <option value="RETIRO">Retiro</option>
          <option value="TRANSFERENCIA_SALIDA">Transf. Salida</option>
          <option value="TRANSFERENCIA_ENTRADA">Transf. Entrada</option>
          <option value="DEVOLUCION_PROVEEDOR">Dev. Proveedor</option>
          <option value="DEVOLUCION_CLIENTE">Dev. Cliente</option>
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
        <span>Movimientos</span>
        <strong>{{ movimientos.length }}</strong>
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
      <div v-else-if="!movimientos.length" class="inv-empty">Sin movimientos para los filtros seleccionados</div>
      <table v-else class="inv-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Lote</th>
            <th style="text-align:right;">Cantidad</th>
            <th style="text-align:right;">Anterior</th>
            <th style="text-align:right;">Posterior</th>
            <th>Referencia</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in movimientos" :key="m.id" class="inv-tr">
            <td style="white-space:nowrap;color:var(--t3);font-size:11px;">{{ formatFecha(m.fecha) }}</td>
            <td class="inv-prod-cell">
              <template v-if="rutaMap.get(m.productoId)">
                <span class="inv-prod-path">{{ [rutaMap.get(m.productoId).categoriaNombre, rutaMap.get(m.productoId).subcategoriaNombre].filter(Boolean).join(' › ') }} ›&nbsp;</span><span class="inv-prod-nombre">{{ m.productoNombre || '—' }}</span>
              </template>
              <span v-else class="inv-prod-nombre">{{ m.productoNombre || '—' }}</span>
            </td>
            <td><span :class="['inv-tipo', tipoCss(m.tipo)]">{{ labelTipo(m.tipo) }}</span></td>
            <td class="inv-mono">{{ m.nroLote || m.loteInterno || '—' }}</td>
            <td :class="['inv-qty', esEntrada(m.tipo) ? 'inv-qty--pos' : 'inv-qty--neg']" style="text-align:right;font-weight:800;">
              {{ esEntrada(m.tipo) ? '+' : '-' }}{{ fmt(m.cantidad) }}
            </td>
            <td style="text-align:right;color:var(--t4);">{{ fmt(m.cantidadAnterior) }}</td>
            <td style="text-align:right;color:var(--t3);">{{ fmt(m.cantidadPosterior) }}</td>
            <td style="color:var(--t4);font-size:11px;">{{ m.referenciaDocumento || '—' }}</td>
            <td style="color:var(--t4);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" :title="m.motivo">{{ m.motivo || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
const TIPOS_ENTRADA = ['INGRESO', 'AJUSTE_POSITIVO', 'TRANSFERENCIA_ENTRADA', 'DEVOLUCION_CLIENTE']
const TIPO_LABELS = {
  INGRESO: 'Ingreso', SALIDA: 'Salida', AJUSTE_POSITIVO: 'Ajuste+', AJUSTE_NEGATIVO: 'Ajuste-',
  RETIRO: 'Retiro', TRANSFERENCIA_SALIDA: 'Transf.↑', TRANSFERENCIA_ENTRADA: 'Transf.↓',
  DEVOLUCION_PROVEEDOR: 'Dev.Prov', DEVOLUCION_CLIENTE: 'Dev.Cli',
}
const TIPO_CSS = {
  INGRESO: 'inv-tipo--in', AJUSTE_POSITIVO: 'inv-tipo--in', TRANSFERENCIA_ENTRADA: 'inv-tipo--in', DEVOLUCION_CLIENTE: 'inv-tipo--in',
  SALIDA: 'inv-tipo--out', AJUSTE_NEGATIVO: 'inv-tipo--adj', RETIRO: 'inv-tipo--ret',
  TRANSFERENCIA_SALIDA: 'inv-tipo--transf', DEVOLUCION_PROVEEDOR: 'inv-tipo--dev',
}

export default {
  name: 'InventarioKardex',
  data: () => ({
    movimientos: [], loading: false, productos: [],
    rutaMap: new Map(),
    busquedaProd: '', dropProdVisible: false, dropProdIdx: -1,
    filtro: { sucursalId: '', productoId: '', tipo: '', fechaDesde: '', fechaHasta: '' },
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
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
    totalEntradas() {
      return this.movimientos.filter(m => TIPOS_ENTRADA.includes(m.tipo)).reduce((a, m) => a + Number(m.cantidad || 0), 0)
    },
    totalSalidas() {
      return this.movimientos.filter(m => !TIPOS_ENTRADA.includes(m.tipo)).reduce((a, m) => a + Number(m.cantidad || 0), 0)
    },
  },
  created() {
    const s = this.$store.getters.sucursalActualId
    if (s) this.filtro.sucursalId = s
    this.cargarProductos()
    this.cargar()
  },
  methods: {
    async cargar() {
      this.loading = true
      const f = this.filtro
      const parts = []
      if (f.sucursalId) parts.push(`sucursalId=${f.sucursalId}`)
      if (f.productoId) parts.push(`productoId=${f.productoId}`)
      if (f.tipo)       parts.push(`tipo=${f.tipo}`)
      if (f.fechaDesde) parts.push(`fechaDesde=${f.fechaDesde}`)
      if (f.fechaHasta) parts.push(`fechaHasta=${f.fechaHasta}`)
      const qs = parts.length ? '?' + parts.join('&') : ''
      try {
        this.movimientos = await this.$service.list(`movimientos-stock/kardex${qs}`) || []
      } finally { this.loading = false }
    },
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
      } catch { this.productos = [] }
    },
    limpiar() {
      this.filtro = { sucursalId: '', productoId: '', tipo: '', fechaDesde: '', fechaHasta: '' }
      this.busquedaProd = ''; this.dropProdVisible = false; this.dropProdIdx = -1
      this.cargar()
    },
    limpiarProd() {
      this.filtro.productoId = ''; this.busquedaProd = ''
      this.dropProdVisible = false; this.dropProdIdx = -1
      this.cargar()
    },
    onInputProd() { this.dropProdVisible = true; this.dropProdIdx = -1 },
    ocultarDropProd() { setTimeout(() => { this.dropProdVisible = false; this.dropProdIdx = -1 }, 150) },
    seleccionarProducto(p) {
      this.filtro.productoId = p.id
      this.busquedaProd = [p.categoriaNombre, p.subcategoriaNombre, p.nombre].filter(Boolean).join(' › ')
      this.dropProdVisible = false; this.dropProdIdx = -1
      this.cargar()
    },
    onKeydownProd(e) {
      const items = this.filtrarProductosDrop
      if (!this.dropProdVisible || !items.length) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        this.dropProdIdx = this.dropProdIdx < items.length - 1 ? this.dropProdIdx + 1 : 0
        this.$nextTick(() => { const el = this.$refs.dropProd?.children[this.dropProdIdx]; el?.scrollIntoView({ block: 'nearest' }) })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        this.dropProdIdx = this.dropProdIdx > 0 ? this.dropProdIdx - 1 : items.length - 1
        this.$nextTick(() => { const el = this.$refs.dropProd?.children[this.dropProdIdx]; el?.scrollIntoView({ block: 'nearest' }) })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const sel = this.dropProdIdx >= 0 ? items[this.dropProdIdx] : (items.length === 1 ? items[0] : null)
        if (sel) this.seleccionarProducto(sel)
      } else if (e.key === 'Escape') {
        this.dropProdVisible = false; this.dropProdIdx = -1
      }
    },
    rutaProducto(nombre) {
      const r = this.rutaMap.get(nombre)
      if (!r) return nombre
      const path = [r.categoriaNombre, r.subcategoriaNombre].filter(Boolean).join(' › ')
      return path ? path + ' › ' + nombre : nombre
    },
    esEntrada(tipo) { return TIPOS_ENTRADA.includes(tipo) },
    labelTipo(tipo) { return TIPO_LABELS[tipo] || tipo },
    tipoCss(tipo) { return TIPO_CSS[tipo] || '' },
    fmt(v) { return Number(v || 0).toFixed(2) },
    formatFecha(f) { return f ? String(f).slice(0, 16).replace('T', ' ') : '—' },
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
.inv-table td { padding:9px 12px; border-top:1px solid var(--b2); vertical-align:middle; }
.inv-tr:hover { background:var(--bg-c); }
.inv-mono { font-family:monospace; font-size:11px; color:#818cf8; }
.inv-tipo { font-size:9px; font-weight:700; padding:2px 7px; border-radius:4px; }
.inv-tipo--in    { background:#4ade8022; color:#4ade80; border:1px solid #4ade8033; }
.inv-tipo--out   { background:#f8717122; color:#f87171; border:1px solid #f8717133; }
.inv-tipo--adj   { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b33; }
.inv-tipo--ret   { background:#ef444422; color:#f87171; border:1px solid #ef444433; }
.inv-tipo--transf{ background:#6366f122; color:#818cf8; border:1px solid #6366f133; }
.inv-tipo--dev   { background:#8b5cf622; color:#a78bfa; border:1px solid #8b5cf633; }
.inv-qty { font-size:12px; }
.inv-qty--pos { color:#4ade80; }
.inv-qty--neg { color:#f87171; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.inv-prod-cell { max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.inv-prod-path { font-size:11px; color:var(--t4); font-weight:500; }
.inv-prod-nombre { font-size:12px; font-weight:700; color:var(--t2); }
.inv-clear-btn { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--t4); cursor:pointer; font-size:11px; padding:2px 4px; line-height:1; }
.inv-clear-btn:hover { color:var(--t2); }
.cp-prod-drop { background:var(--bg-s); border:1px solid var(--b1); border-radius:8px; box-shadow:0 8px 24px #0006; max-height:260px; overflow-y:auto; }
.cp-drop-item { display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; border-bottom:1px solid var(--b2); }
.cp-drop-item:last-child { border-bottom:none; }
.cp-drop-item:hover, .cp-drop-item--active { background:var(--bg-c); }
.cp-drop-path { font-size:10px; color:var(--t4); }
.cp-drop-nombre { font-size:12px; font-weight:600; color:var(--t2); }
</style>
