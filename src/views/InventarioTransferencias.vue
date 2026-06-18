<template>
  <div class="inv-root">
    <div class="inv-two-col">

      <!-- Lista izquierda -->
      <div class="inv-panel">
        <div class="inv-panel-header">
          <span>Transferencias recientes</span>
          <button class="inv-refresh-btn" @click="cargarHistorial">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-4"/></svg>
          </button>
        </div>
        <div v-if="loadingH" class="inv-loading"><div class="ct-spinner"></div></div>
        <div v-else-if="!historial.length" class="inv-empty">Sin transferencias registradas</div>
        <div v-else class="inv-hist-list">
          <div v-for="m in historial" :key="m.id" class="inv-hist-item">
            <div class="inv-hist-top">
              <span class="inv-hist-prod">
                <template v-if="rutaMap.get(m.productoId)">
                  <span class="inv-hist-path">{{ [rutaMap.get(m.productoId).categoriaNombre, rutaMap.get(m.productoId).subcategoriaNombre].filter(Boolean).join(' › ') }} ›&nbsp;</span><span class="inv-mono">{{ m.productoNombre }}</span>
                </template>
                <span v-else class="inv-mono">{{ m.productoNombre || '—' }}</span>
              </span>
              <span class="inv-tipo inv-tipo--transf">Transferencia</span>
            </div>
            <div class="inv-hist-sub">
              <span>{{ formatFecha(m.fecha) }}</span>
              <span style="color:#818cf8;">{{ fmt(m.cantidad) }} uds</span>
            </div>
            <div v-if="m.motivo" class="inv-hist-motivo">{{ m.motivo }}</div>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <div class="inv-panel">
        <div class="inv-panel-header">Nueva transferencia</div>
        <div class="inv-form">
          <div class="ide-field">
            <label>Sucursal origen *</label>
            <select v-model="form.sucursalOrigenId" class="ide-select" @change="onOrigenChange">
              <option value="">Seleccionar…</option>
              <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Sucursal destino *</label>
            <select v-model="form.sucursalDestinoId" class="ide-select">
              <option value="">Seleccionar…</option>
              <option v-for="s in sucursalesDestino" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <div class="ide-field" style="position:relative;">
            <label>Producto *</label>
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
              <button v-if="form.productoId || busquedaProd" class="trf-clear-btn" @mousedown.prevent="limpiarProd">✕</button>
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
          <div class="ide-field">
            <label>Lote origen *</label>
            <select v-model="form.loteId" class="ide-select" :disabled="!lotes.length">
              <option value="">{{ lotes.length ? 'Seleccionar lote…' : 'Seleccione sucursal y producto' }}</option>
              <option v-for="l in lotes" :key="l.id" :value="l.id">
                {{ l.nroLote || l.loteInterno }} — Stock: {{ fmt(l.cantidadActual) }}
              </option>
            </select>
          </div>
          <div class="ide-field">
            <label>Cantidad a transferir *</label>
            <input v-model.number="form.cantidad" type="number" min="0.001" step="0.001" class="ide-input" placeholder="0.00" />
          </div>
          <div class="ide-field">
            <label>Motivo</label>
            <input v-model="form.motivo" class="ide-input" placeholder="Motivo de la transferencia…" />
          </div>
          <div class="inv-form-actions">
            <button class="ct-btn-cancel" @click="resetForm">Limpiar</button>
            <button class="ct-btn" :disabled="saving || !formValido" @click="guardar">
              <span v-if="saving"><div class="ct-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;"></div></span>
              <span v-else>Transferir</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'InventarioTransferencias',
  data: () => ({
    historial: [], loadingH: false, saving: false,
    productos: [], lotes: [], rutaMap: new Map(),
    busquedaProd: '', dropProdVisible: false, dropProdIdx: -1,
    form: { sucursalOrigenId: '', sucursalDestinoId: '', productoId: '', loteId: '', cantidad: null, motivo: '' },
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
    sucursalesDestino() { return this.sucursales.filter(s => s.id !== this.form.sucursalOrigenId) },
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
    formValido() {
      const f = this.form
      return f.sucursalOrigenId && f.sucursalDestinoId && f.productoId && f.loteId && f.cantidad > 0
    },
  },
  created() {
    const s = this.$store.getters.sucursalActualId
    if (s) this.form.sucursalOrigenId = s
    this.cargarProductos(); this.cargarHistorial()
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
      this.busquedaProd = ''; this.form.productoId = ''; this.form.loteId = ''
      this.lotes = []; this.dropProdVisible = false; this.dropProdIdx = -1
    },
    seleccionarProducto(p) {
      this.form.productoId = p.id
      this.busquedaProd = [p.categoriaNombre, p.subcategoriaNombre, p.nombre].filter(Boolean).join(' › ')
      this.dropProdVisible = false; this.dropProdIdx = -1
      this.cargarLotes()
    },
    onKeydownProd(e) {
      const list = this.filtrarProductosDrop
      if (!list.length) return
      if (e.key === 'ArrowDown') { e.preventDefault(); this.dropProdVisible = true; this.dropProdIdx = Math.min(this.dropProdIdx + 1, list.length - 1) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.dropProdIdx = Math.max(this.dropProdIdx - 1, 0) }
      else if (e.key === 'Enter') { e.preventDefault(); if (this.dropProdIdx >= 0 && list[this.dropProdIdx]) this.seleccionarProducto(list[this.dropProdIdx]) }
      else if (e.key === 'Escape') { this.dropProdVisible = false; this.dropProdIdx = -1 }
    },
    async cargarLotes() {
      this.form.loteId = ''; this.lotes = []
      if (!this.form.productoId || !this.form.sucursalOrigenId) return
      try {
        const data = await this.$service.list(`lotes/por-producto?sucursalId=${this.form.sucursalOrigenId}&productoId=${this.form.productoId}`)
        this.lotes = (data || []).filter(l => l.estadoLote === 'ACTIVO' && Number(l.cantidadActual) > 0)
      } catch { this.lotes = [] }
    },
    onOrigenChange() {
      this.form.productoId = ''; this.form.loteId = ''; this.lotes = []
      this.busquedaProd = ''; this.dropProdVisible = false; this.dropProdIdx = -1
    },
    async cargarHistorial() {
      this.loadingH = true
      try { this.historial = await this.$service.list('movimientos-stock/kardex?tipo=TRANSFERENCIA_SALIDA') || [] }
      finally { this.loadingH = false }
    },
    async guardar() {
      if (!this.formValido) return
      this.saving = true
      try {
        await this.$service.post('movimientos-stock/transferir', {
          loteId: this.form.loteId,
          sucursalOrigenId: this.form.sucursalOrigenId,
          sucursalDestinoId: this.form.sucursalDestinoId,
          cantidad: this.form.cantidad,
          motivo: this.form.motivo || undefined,
        })
        this.$message.success('Transferencia registrada')
        this.resetForm(); this.cargarHistorial()
      } catch (e) {
        this.$message.error(e?.response?.data?.mensaje || 'Error al registrar transferencia')
      } finally { this.saving = false }
    },
    resetForm() {
      this.form = { sucursalOrigenId: this.form.sucursalOrigenId, sucursalDestinoId: '', productoId: '', loteId: '', cantidad: null, motivo: '' }
      this.lotes = []; this.busquedaProd = ''; this.dropProdVisible = false; this.dropProdIdx = -1
    },
    fmt(v) { return Number(v || 0).toFixed(2) },
    formatFecha(f) { return f ? String(f).slice(0, 16).replace('T', ' ') : '—' },
  },
}
</script>

<style scoped>
.inv-root { height:100%; overflow:hidden; padding:24px; }
.inv-two-col { display:flex; gap:16px; height:100%; }
.inv-panel { background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; display:flex; flex-direction:column; overflow:hidden; flex:1; min-width:0; }
.inv-panel-header { padding:14px 16px; border-bottom:1px solid var(--b1); font-size:12px; font-weight:700; color:var(--t3); text-transform:uppercase; letter-spacing:.4px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
.inv-refresh-btn { background:none; border:none; cursor:pointer; color:var(--t5); padding:4px; border-radius:4px; display:flex; }
.inv-refresh-btn:hover { color:#818cf8; }
.inv-hist-list { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:6px; }
.inv-hist-item { background:var(--bg-e); border:1px solid var(--b2); border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:4px; }
.inv-hist-top { display:flex; justify-content:space-between; align-items:center; }
.inv-hist-sub { display:flex; justify-content:space-between; font-size:11px; color:var(--t4); }
.inv-hist-motivo { font-size:11px; color:var(--t5); font-style:italic; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.inv-form { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; }
.inv-form-actions { display:flex; gap:10px; justify-content:flex-end; padding-top:4px; }
.inv-loading { display:flex; justify-content:center; padding:40px; }
.inv-empty { text-align:center; padding:40px; font-size:13px; color:var(--b3); font-style:italic; }
.inv-mono { font-size:12px; font-weight:600; color:#818cf8; font-family:monospace; }
.inv-tipo { font-size:9px; font-weight:700; padding:2px 7px; border-radius:4px; }
.inv-tipo--transf { background:#6366f122; color:#818cf8; border:1px solid #6366f133; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
/* Autocomplete producto */
.trf-clear-btn { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--t4); font-size:12px; padding:2px 4px; line-height:1; }
.trf-clear-btn:hover { color:var(--t1); }
.cp-prod-drop { position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.35); z-index:200; max-height:240px; overflow-y:auto; }
.cp-drop-item { display:flex; align-items:center; padding:8px 12px; cursor:pointer; font-size:12px; color:var(--t2); transition:background .12s; }
.cp-drop-item:hover, .cp-drop-item--active { background:var(--bg-c); }
.cp-drop-path { color:var(--t4); font-size:11px; font-weight:500; }
.cp-drop-nombre { font-weight:700; color:var(--t1); }
/* Historial producto con ruta */
.inv-hist-prod { display:flex; align-items:baseline; flex-wrap:nowrap; min-width:0; overflow:hidden; }
.inv-hist-path { font-size:10px; color:var(--t5); font-weight:500; white-space:nowrap; margin-right:2px; }
</style>
