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
      <div class="ide-field" style="min-width:140px;">
        <label>Estado lote</label>
        <select v-model="filtro.estadoLote" class="ide-select" @change="cargar">
          <option value="">Todos</option>
          <option value="ACTIVO">Activo</option>
          <option value="AGOTADO">Agotado</option>
          <option value="VENCIDO">Vencido</option>
          <option value="CUARENTENA">Cuarentena</option>
          <option value="RETIRADO">Retirado</option>
        </select>
      </div>
      <div class="ide-field" style="min-width:220px;flex:2;">
        <label>Buscar (producto, lote, interno)</label>
        <input v-model="filtro.search" class="ide-input" placeholder="Buscar…" @input="buscarConDebounce" />
      </div>
      <div class="ide-field" style="padding-top:18px;">
        <button class="ct-btn-cancel" @click="limpiar">Limpiar</button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="inv-table-wrap">
      <div v-if="loading" class="inv-loading"><div class="ct-spinner"></div></div>
      <div v-else-if="!lotes.length" class="inv-empty">Sin lotes para los filtros seleccionados</div>
      <table v-else class="inv-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Lote #</th>
            <th>Interno</th>
            <th>Ingreso</th>
            <th>Vencimiento</th>
            <th style="text-align:right;">Inicial</th>
            <th style="text-align:right;">Actual</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in lotes" :key="l.id" class="inv-tr">
            <td style="font-weight:600;color:#e2e8f0;">{{ l.productoNombre || '—' }}</td>
            <td class="inv-mono">{{ l.nroLote || '—' }}</td>
            <td class="inv-mono" style="color:#64748b;">{{ l.loteInterno || '—' }}</td>
            <td style="color:#94a3b8;font-size:11px;">{{ l.fechaIngreso || '—' }}</td>
            <td>
              <span v-if="l.fechaVencimiento" :class="['inv-venc', isVencProximo(l.fechaVencimiento) ? 'inv-venc--warn' : '']">
                {{ l.fechaVencimiento }}
              </span>
              <span v-else style="color:#334155;">—</span>
            </td>
            <td style="text-align:right;color:#64748b;">{{ fmt(l.cantidadInicial) }}</td>
            <td style="text-align:right;font-weight:800;color:#4ade80;">{{ fmt(l.cantidadActual) }}</td>
            <td><span :class="['inv-estado', estadoCss(l.estadoLote)]">{{ l.estadoLote }}</span></td>
            <td>
              <button class="inv-detail-btn" @click="verDetalle(l)" title="Ver trazabilidad">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal trazabilidad -->
    <div v-if="modalLote" class="ct-modal-bg" @click.self="modalLote = null">
      <div class="ct-modal" style="width:640px;max-height:80vh;overflow:auto;">
        <div class="ct-modal-header">
          <span>Trazabilidad — {{ modalLote.lote?.loteInterno || 'Lote' }}</span>
          <button class="ct-modal-close" @click="modalLote = null">✕</button>
        </div>
        <div class="ct-modal-body" style="padding:16px;">
          <div v-if="loadingDetalle" class="inv-loading"><div class="ct-spinner"></div></div>
          <template v-else>
            <!-- Info lote -->
            <div class="inv-traza-grid">
              <div><span>Producto</span><strong>{{ modalLote.lote?.productoId }}</strong></div>
              <div><span>Estado</span><strong>{{ modalLote.lote?.estadoLote }}</strong></div>
              <div><span>Lote #</span><strong>{{ modalLote.lote?.nroLote || '—' }}</strong></div>
              <div><span>Cantidad inicial</span><strong>{{ fmt(modalLote.lote?.cantidadInicial) }}</strong></div>
              <div><span>Cantidad actual</span><strong style="color:#4ade80;">{{ fmt(modalLote.lote?.cantidadActual) }}</strong></div>
              <div><span>Vencimiento</span><strong>{{ modalLote.lote?.fechaVencimiento || '—' }}</strong></div>
            </div>
            <!-- Movimientos -->
            <div class="inv-traza-title">Movimientos</div>
            <div v-if="!modalLote.movimientos?.length" style="color:#334155;font-size:12px;padding:8px 0;">Sin movimientos registrados</div>
            <table v-else class="inv-table" style="font-size:11px;">
              <thead>
                <tr>
                  <th>Fecha</th><th>Tipo</th><th style="text-align:right;">Cantidad</th>
                  <th style="text-align:right;">Anterior</th><th style="text-align:right;">Posterior</th><th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in modalLote.movimientos" :key="m.id" class="inv-tr">
                  <td style="color:#64748b;">{{ formatFecha(m.fechaCreacion || m._fechaCreacion) }}</td>
                  <td><span :class="['inv-tipo', tipoCss(m.tipo)]">{{ labelTipo(m.tipo) }}</span></td>
                  <td style="text-align:right;">{{ fmt(m.cantidad) }}</td>
                  <td style="text-align:right;color:#64748b;">{{ fmt(m.cantidadAnterior) }}</td>
                  <td style="text-align:right;color:#94a3b8;">{{ fmt(m.cantidadPosterior) }}</td>
                  <td style="color:#64748b;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ m.motivo || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
const TIPO_LABELS = {
  INGRESO:'Ingreso',SALIDA:'Salida',AJUSTE_POSITIVO:'Ajuste+',AJUSTE_NEGATIVO:'Ajuste-',
  RETIRO:'Retiro',TRANSFERENCIA_SALIDA:'Transf.↑',TRANSFERENCIA_ENTRADA:'Transf.↓',
  DEVOLUCION_PROVEEDOR:'Dev.Prov',DEVOLUCION_CLIENTE:'Dev.Cli',
}
const TIPO_CSS = {
  INGRESO:'inv-tipo--in',AJUSTE_POSITIVO:'inv-tipo--in',TRANSFERENCIA_ENTRADA:'inv-tipo--in',DEVOLUCION_CLIENTE:'inv-tipo--in',
  SALIDA:'inv-tipo--out',AJUSTE_NEGATIVO:'inv-tipo--adj',RETIRO:'inv-tipo--ret',
  TRANSFERENCIA_SALIDA:'inv-tipo--transf',DEVOLUCION_PROVEEDOR:'inv-tipo--dev',
}

export default {
  name: 'InventarioLotes',
  data: () => ({
    lotes: [], loading: false,
    filtro: { sucursalId: '', estadoLote: 'ACTIVO', search: '' },
    modalLote: null, loadingDetalle: false,
    debounceTimer: null,
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
  },
  created() {
    const s = this.$store.getters.sucursalActualId
    if (s) this.filtro.sucursalId = s
    this.cargar()
  },
  methods: {
    async cargar() {
      this.loading = true
      const f = this.filtro
      const parts = []
      if (f.sucursalId)  parts.push(`sucursalId=${f.sucursalId}`)
      if (f.estadoLote)  parts.push(`estadoLote=${f.estadoLote}`)
      if (f.search)      parts.push(`search=${encodeURIComponent(f.search)}`)
      const qs = parts.length ? '?' + parts.join('&') : ''
      try {
        this.lotes = await this.$service.list(`lotes/todos${qs}`) || []
      } finally { this.loading = false }
    },
    buscarConDebounce() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => this.cargar(), 400)
    },
    limpiar() {
      this.filtro = { sucursalId: '', estadoLote: 'ACTIVO', search: '' }
      this.cargar()
    },
    async verDetalle(lote) {
      this.modalLote = { lote: null, movimientos: [] }
      this.loadingDetalle = true
      try {
        const resp = await this.$service.list(`lotes/${lote.id}/trazabilidad`)
        this.modalLote = resp
      } finally { this.loadingDetalle = false }
    },
    fmt(v) { return Number(v || 0).toFixed(2) },
    formatFecha(f) { return f ? String(f).slice(0, 16).replace('T', ' ') : '—' },
    isVencProximo(fecha) {
      const dias = Math.ceil((new Date(fecha) - new Date()) / 86400000)
      return dias <= 30
    },
    estadoCss(e) {
      return { ACTIVO:'inv-estado--on', AGOTADO:'inv-estado--off', VENCIDO:'inv-estado--venc', CUARENTENA:'inv-estado--quar', RETIRADO:'inv-estado--ret' }[e] || ''
    },
    labelTipo(t) { return TIPO_LABELS[t] || t },
    tipoCss(t) { return TIPO_CSS[t] || '' },
  },
}
</script>

<style scoped>
.inv-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; gap:12px; }
.inv-filters { display:flex; gap:12px; flex-wrap:wrap; flex-shrink:0; background:#0d1526; border:1px solid #1e3a5f44; border-radius:12px; padding:14px 16px; align-items:flex-end; }
.inv-table-wrap { flex:1; background:#0d1526; border:1px solid #1e3a5f44; border-radius:12px; overflow:auto; }
.inv-loading { display:flex; justify-content:center; padding:40px; }
.inv-empty { text-align:center; padding:40px; font-size:13px; color:#334155; font-style:italic; }
.inv-table { width:100%; border-collapse:collapse; font-size:12px; }
.inv-table th { background:#0f172a; color:#64748b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:10px 12px; text-align:left; white-space:nowrap; position:sticky; top:0; z-index:1; }
.inv-table td { padding:9px 12px; border-top:1px solid #1e3a5f22; vertical-align:middle; }
.inv-tr:hover { background:#1e293b; }
.inv-mono { font-family:monospace; font-size:11px; color:#818cf8; }
.inv-venc { font-size:11px; }
.inv-venc--warn { color:#fbbf24; font-weight:700; }
.inv-estado { font-size:9px; font-weight:700; padding:2px 7px; border-radius:4px; }
.inv-estado--on   { background:#4ade8022; color:#4ade80; border:1px solid #4ade8033; }
.inv-estado--off  { background:#33415522; color:#64748b; border:1px solid #33415533; }
.inv-estado--venc { background:#f8717122; color:#f87171; border:1px solid #f8717133; }
.inv-estado--quar { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b33; }
.inv-estado--ret  { background:#6366f122; color:#818cf8; border:1px solid #6366f133; }
.inv-tipo { font-size:9px; font-weight:700; padding:2px 6px; border-radius:4px; }
.inv-tipo--in    { background:#4ade8022; color:#4ade80; border:1px solid #4ade8033; }
.inv-tipo--out   { background:#f8717122; color:#f87171; border:1px solid #f8717133; }
.inv-tipo--adj   { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b33; }
.inv-tipo--ret   { background:#ef444422; color:#f87171; border:1px solid #ef444433; }
.inv-tipo--transf{ background:#6366f122; color:#818cf8; border:1px solid #6366f133; }
.inv-tipo--dev   { background:#8b5cf622; color:#a78bfa; border:1px solid #8b5cf633; }
.inv-detail-btn { background:none; border:none; cursor:pointer; color:#4466aa; padding:4px; border-radius:4px; display:flex; align-items:center; justify-content:center; }
.inv-detail-btn:hover { color:#818cf8; background:#1e293b; }
.inv-traza-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:16px; }
.inv-traza-grid > div { display:flex; flex-direction:column; gap:2px; }
.inv-traza-grid span { font-size:10px; color:#64748b; text-transform:uppercase; }
.inv-traza-grid strong { font-size:13px; color:#e2e8f0; }
.inv-traza-title { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.4px; margin-bottom:8px; margin-top:4px; }
.ct-modal-bg { position:fixed; inset:0; background:#000a; z-index:50; display:flex; align-items:center; justify-content:center; }
.ct-modal { background:#0d1526; border:1px solid #1e3a5f44; border-radius:12px; display:flex; flex-direction:column; }
.ct-modal-header { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-bottom:1px solid #1e3a5f44; font-size:13px; font-weight:700; color:#e2e8f0; }
.ct-modal-close { background:none; border:none; cursor:pointer; color:#64748b; font-size:16px; }
.ct-modal-close:hover { color:#f87171; }
.ct-modal-body { padding:16px 18px; overflow:auto; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid #1e3a5f44; border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
