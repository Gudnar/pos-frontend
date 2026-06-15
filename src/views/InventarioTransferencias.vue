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
              <span class="inv-mono">{{ m.productoNombre || '—' }}</span>
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
          <div class="ide-field">
            <label>Producto *</label>
            <select v-model="form.productoId" class="ide-select" @change="cargarLotes">
              <option value="">Seleccionar…</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
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
    productos: [], lotes: [],
    form: { sucursalOrigenId: '', sucursalDestinoId: '', productoId: '', loteId: '', cantidad: null, motivo: '' },
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
    sucursalesDestino() { return this.sucursales.filter(s => s.id !== this.form.sucursalOrigenId) },
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
      try { this.productos = await this.$service.list('productos?soloActivos=true') || [] } catch { this.productos = [] }
    },
    async cargarLotes() {
      this.form.loteId = ''; this.lotes = []
      if (!this.form.productoId || !this.form.sucursalOrigenId) return
      try {
        const data = await this.$service.list(`lotes/por-producto?sucursalId=${this.form.sucursalOrigenId}&productoId=${this.form.productoId}`)
        this.lotes = (data || []).filter(l => l.estadoLote === 'ACTIVO' && Number(l.cantidadActual) > 0)
      } catch { this.lotes = [] }
    },
    onOrigenChange() { this.form.productoId = ''; this.form.loteId = ''; this.lotes = [] },
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
      this.lotes = []
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
</style>
