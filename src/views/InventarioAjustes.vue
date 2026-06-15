<template>
  <div class="inv-root">
    <div class="inv-two-col">

      <!-- Panel izquierdo: lista reciente -->
      <div class="inv-panel">
        <div class="inv-panel-header">
          <span>Ajustes recientes</span>
          <button class="inv-refresh-btn" @click="cargarHistorial">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-4"/></svg>
          </button>
        </div>
        <div v-if="loadingH" class="inv-loading"><div class="ct-spinner"></div></div>
        <div v-else-if="!historial.length" class="inv-empty">Sin ajustes registrados</div>
        <div v-else class="inv-hist-list">
          <div v-for="m in historial" :key="m.id" class="inv-hist-item">
            <div class="inv-hist-top">
              <span class="inv-mono">{{ m.productoNombre || m.productoId || '—' }}</span>
              <span :class="['inv-tipo', m.tipo === 'AJUSTE_POSITIVO' ? 'inv-tipo--in' : 'inv-tipo--adj']">
                {{ m.tipo === 'AJUSTE_POSITIVO' ? 'Ajuste +' : 'Ajuste −' }}
              </span>
            </div>
            <div class="inv-hist-sub">
              <span>{{ formatFecha(m.fecha) }}</span>
              <span :class="m.tipo === 'AJUSTE_POSITIVO' ? 'inv-qty--pos' : 'inv-qty--neg'">
                {{ m.tipo === 'AJUSTE_POSITIVO' ? '+' : '−' }}{{ fmt(m.cantidad) }}
              </span>
            </div>
            <div v-if="m.motivo" class="inv-hist-motivo">{{ m.motivo }}</div>
          </div>
        </div>
      </div>

      <!-- Panel derecho: formulario -->
      <div class="inv-panel">
        <div class="inv-panel-header">Nuevo ajuste</div>
        <div class="inv-form">
          <div class="ide-field">
            <label>Sucursal *</label>
            <select v-model="form.sucursalId" class="ide-select" @change="resetLote">
              <option value="">Seleccionar…</option>
              <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Producto *</label>
            <select v-model="form.productoId" class="ide-select" @change="cargarLotes">
              <option value="">Seleccionar…</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Lote *</label>
            <select v-model="form.loteId" class="ide-select" :disabled="!lotes.length">
              <option value="">{{ lotes.length ? 'Seleccionar lote…' : 'Seleccione producto primero' }}</option>
              <option v-for="l in lotes" :key="l.id" :value="l.id">
                {{ l.nroLote || l.loteInterno }} — Stock: {{ fmt(l.cantidadActual) }}
              </option>
            </select>
          </div>
          <div class="ide-field">
            <label>Tipo de ajuste *</label>
            <select v-model="form.tipo" class="ide-select">
              <option value="AJUSTE_POSITIVO">Ajuste positivo (sumar stock)</option>
              <option value="AJUSTE_NEGATIVO">Ajuste negativo (restar stock)</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Cantidad *</label>
            <input v-model.number="form.cantidad" type="number" min="0.001" step="0.001" class="ide-input" placeholder="0.00" />
          </div>
          <div class="ide-field">
            <label>Motivo / Descripción *</label>
            <textarea v-model="form.motivo" class="ide-input" rows="3" placeholder="Indique el motivo del ajuste…" style="resize:vertical;"></textarea>
          </div>
          <div class="inv-form-actions">
            <button class="ct-btn-cancel" @click="resetForm">Limpiar</button>
            <button class="ct-btn" :disabled="saving || !formValido" @click="guardar">
              <span v-if="saving"><div class="ct-spinner" style="width:14px;height:14px;border-width:2px;"></div></span>
              <span v-else>Registrar ajuste</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InventarioAjustes',
  data: () => ({
    historial: [], loadingH: false, saving: false,
    productos: [], lotes: [],
    form: { sucursalId: '', productoId: '', loteId: '', tipo: 'AJUSTE_POSITIVO', cantidad: null, motivo: '' },
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
    formValido() {
      const f = this.form
      return f.sucursalId && f.productoId && f.loteId && f.tipo && f.cantidad > 0 && f.motivo.trim()
    },
  },
  created() {
    const s = this.$store.getters.sucursalActualId
    if (s) this.form.sucursalId = s
    this.cargarProductos()
    this.cargarHistorial()
  },
  methods: {
    async cargarProductos() {
      try { this.productos = await this.$service.list('productos?soloActivos=true') || [] } catch { this.productos = [] }
    },
    async cargarLotes() {
      this.form.loteId = ''; this.lotes = []
      if (!this.form.productoId || !this.form.sucursalId) return
      try {
        const data = await this.$service.list(`lotes/por-producto?sucursalId=${this.form.sucursalId}&productoId=${this.form.productoId}`)
        this.lotes = (data || []).filter(l => l.estadoLote === 'ACTIVO')
      } catch { this.lotes = [] }
    },
    async cargarHistorial() {
      this.loadingH = true
      try {
        this.historial = await this.$service.list('movimientos-stock/kardex?tipo=AJUSTE_POSITIVO') || []
        const neg = await this.$service.list('movimientos-stock/kardex?tipo=AJUSTE_NEGATIVO') || []
        this.historial = [...this.historial, ...neg].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 50)
      } finally { this.loadingH = false }
    },
    async guardar() {
      if (!this.formValido) return
      this.saving = true
      try {
        await this.$service.save('movimientos-stock', {
          loteId: this.form.loteId,
          sucursalId: this.form.sucursalId,
          tipo: this.form.tipo,
          cantidad: this.form.cantidad,
          motivo: this.form.motivo,
          tipoDocumento: 'AJUSTE',
        })
        this.$message.success('Ajuste registrado')
        this.resetForm()
        this.cargarLotes()
        this.cargarHistorial()
      } catch (e) {
        this.$message.error(e?.response?.data?.mensaje || 'Error al registrar ajuste')
      } finally { this.saving = false }
    },
    resetForm() {
      this.form = { sucursalId: this.form.sucursalId, productoId: '', loteId: '', tipo: 'AJUSTE_POSITIVO', cantidad: null, motivo: '' }
      this.lotes = []
    },
    resetLote() { this.form.productoId = ''; this.form.loteId = ''; this.lotes = [] },
    fmt(v) { return Number(v || 0).toFixed(2) },
    formatFecha(f) { return f ? String(f).slice(0, 16).replace('T', ' ') : '—' },
  },
}
</script>

<style scoped>
.inv-root { height:100%; overflow:hidden; padding:24px; }
.inv-two-col { display:flex; gap:16px; height:100%; }
.inv-panel { background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; display:flex; flex-direction:column; overflow:hidden; }
.inv-panel:first-child { flex:1; min-width:0; }
.inv-panel:last-child { flex:1.4; min-width:0; }
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
.inv-tipo--in  { background:#4ade8022; color:#4ade80; border:1px solid #4ade8033; }
.inv-tipo--adj { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b33; }
.inv-qty--pos { color:#4ade80; font-weight:700; }
.inv-qty--neg { color:#f87171; font-weight:700; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
