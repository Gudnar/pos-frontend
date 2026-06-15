<template>
  <div class="inv-root">
    <div class="inv-two-col">

      <!-- Lista izquierda -->
      <div class="inv-panel">
        <div class="inv-panel-header">
          <span>Devoluciones recientes</span>
          <button class="inv-refresh-btn" @click="cargarHistorial">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-4"/></svg>
          </button>
        </div>
        <div v-if="loadingH" class="inv-loading"><div class="ct-spinner"></div></div>
        <div v-else-if="!historial.length" class="inv-empty">Sin devoluciones registradas</div>
        <div v-else class="inv-hist-list">
          <div v-for="m in historial" :key="m.id" class="inv-hist-item">
            <div class="inv-hist-top">
              <span class="inv-mono">{{ m.productoNombre || '—' }}</span>
              <span :class="['inv-tipo', m.tipo === 'DEVOLUCION_CLIENTE' ? 'inv-tipo--cli' : 'inv-tipo--prov']">
                {{ m.tipo === 'DEVOLUCION_CLIENTE' ? 'Dev. Cliente' : 'Dev. Proveedor' }}
              </span>
            </div>
            <div class="inv-hist-sub">
              <span>{{ formatFecha(m.fecha) }}</span>
              <span :class="m.tipo === 'DEVOLUCION_CLIENTE' ? 'inv-qty--pos' : 'inv-qty--neg'">{{ fmt(m.cantidad) }}</span>
            </div>
            <div v-if="m.motivo" class="inv-hist-motivo">{{ m.motivo }}</div>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <div class="inv-panel">
        <div class="inv-panel-header">Registrar devolución</div>
        <div class="inv-form">
          <div class="ide-field">
            <label>Tipo de devolución *</label>
            <select v-model="form.tipo" class="ide-select">
              <option value="DEVOLUCION_CLIENTE">Devolución de cliente (reingresa al stock)</option>
              <option value="DEVOLUCION_PROVEEDOR">Devolución a proveedor (sale del stock)</option>
            </select>
          </div>
          <div v-if="form.tipo === 'DEVOLUCION_CLIENTE'" class="inv-info-box inv-info-box--green">
            El stock del lote aumentará con la cantidad devuelta por el cliente.
          </div>
          <div v-else class="inv-info-box inv-info-box--orange">
            El stock del lote disminuirá. La mercadería regresa al proveedor.
          </div>
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
            <label>Cantidad *</label>
            <input v-model.number="form.cantidad" type="number" min="0.001" step="0.001" class="ide-input" placeholder="0.00" />
          </div>
          <div class="ide-field">
            <label>Referencia (Nro. Venta/Factura)</label>
            <input v-model="form.referenciaDocumento" class="ide-input" placeholder="Opcional…" />
          </div>
          <div class="ide-field">
            <label>Motivo *</label>
            <textarea v-model="form.motivo" class="ide-input" rows="2" placeholder="Motivo de la devolución…" style="resize:vertical;"></textarea>
          </div>
          <div class="inv-form-actions">
            <button class="ct-btn-cancel" @click="resetForm">Limpiar</button>
            <button class="ct-btn" :disabled="saving || !formValido" @click="guardar">
              <span v-if="saving"><div class="ct-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;"></div></span>
              <span v-else>Registrar devolución</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InventarioDevoluciones',
  data: () => ({
    historial: [], loadingH: false, saving: false,
    productos: [], lotes: [],
    form: { sucursalId: '', productoId: '', loteId: '', tipo: 'DEVOLUCION_CLIENTE', cantidad: null, motivo: '', referenciaDocumento: '' },
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
    this.cargarProductos(); this.cargarHistorial()
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
        this.lotes = data || []
      } catch { this.lotes = [] }
    },
    async cargarHistorial() {
      this.loadingH = true
      try {
        const cli = await this.$service.list('movimientos-stock/kardex?tipo=DEVOLUCION_CLIENTE') || []
        const prov = await this.$service.list('movimientos-stock/kardex?tipo=DEVOLUCION_PROVEEDOR') || []
        this.historial = [...cli, ...prov].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 50)
      } finally { this.loadingH = false }
    },
    async guardar() {
      if (!this.formValido) return
      this.saving = true
      try {
        await this.$service.save('movimientos-stock', {
          loteId: this.form.loteId, sucursalId: this.form.sucursalId,
          tipo: this.form.tipo, cantidad: this.form.cantidad,
          motivo: this.form.motivo,
          referenciaDocumento: this.form.referenciaDocumento || undefined,
          tipoDocumento: 'DEVOLUCION',
        })
        this.$message.success('Devolución registrada')
        this.resetForm(); this.cargarHistorial()
      } catch (e) {
        this.$message.error(e?.response?.data?.mensaje || 'Error al registrar devolución')
      } finally { this.saving = false }
    },
    resetForm() {
      this.form = { sucursalId: this.form.sucursalId, productoId: '', loteId: '', tipo: 'DEVOLUCION_CLIENTE', cantidad: null, motivo: '', referenciaDocumento: '' }
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
.inv-tipo--cli  { background:#4ade8022; color:#4ade80; border:1px solid #4ade8033; }
.inv-tipo--prov { background:#f8717122; color:#f87171; border:1px solid #f8717133; }
.inv-qty--pos { color:#4ade80; font-weight:700; }
.inv-qty--neg { color:#f87171; font-weight:700; }
.inv-info-box { border-radius:8px; padding:8px 12px; font-size:11px; }
.inv-info-box--green { background:#4ade8022; border:1px solid #4ade8033; color:#86efac; }
.inv-info-box--orange { background:#f59e0b22; border:1px solid #f59e0b33; color:#fcd34d; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
