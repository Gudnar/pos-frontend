<template>
  <div class="inv-root">

    <!-- Cabecera -->
    <div class="inv-header-bar">
      <div class="ide-field" style="min-width:200px;">
        <label>Sucursal *</label>
        <select v-model="sucursalId" class="ide-select" @change="cargarLotes">
          <option value="">Seleccionar sucursal…</option>
          <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
        </select>
      </div>
      <div class="ide-field">
        <label>Fecha de toma</label>
        <input v-model="fechaToma" type="date" class="ide-input" />
      </div>
      <div class="ide-field" style="padding-top:18px;display:flex;gap:8px;">
        <button v-if="filas.length" class="ct-btn-cancel" @click="limpiar">Cancelar</button>
        <button
          v-if="filasConDiferencia.length"
          class="ct-btn"
          :disabled="procesando"
          @click="procesarAjustes"
        >
          <span v-if="procesando"><div class="ct-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;"></div></span>
          <span v-else>Aplicar ajustes ({{ filasConDiferencia.length }})</span>
        </button>
      </div>
    </div>

    <!-- Info -->
    <div v-if="!sucursalId" class="inv-empty" style="background:var(--bg-s);border:1px solid var(--b1);border-radius:12px;padding:40px;">
      Seleccione una sucursal para cargar el inventario actual
    </div>

    <div v-else-if="loading" class="inv-empty" style="background:var(--bg-s);border:1px solid var(--b1);border-radius:12px;padding:40px;">
      <div class="ct-spinner"></div>
    </div>

    <template v-else>

      <!-- Resumen diferencias -->
      <div v-if="filas.length" class="inv-summary-bar">
        <div class="inv-summary-item">
          <span>Lotes cargados</span>
          <strong>{{ filas.length }}</strong>
        </div>
        <div class="inv-summary-item">
          <span>Con diferencia</span>
          <strong :style="filasConDiferencia.length ? 'color:#fbbf24' : 'color:#4ade80'">{{ filasConDiferencia.length }}</strong>
        </div>
        <div class="inv-summary-item">
          <span>Ajustes positivos</span>
          <strong style="color:#4ade80;">{{ ajustesPositivos }}</strong>
        </div>
        <div class="inv-summary-item">
          <span>Ajustes negativos</span>
          <strong style="color:#f87171;">{{ ajustesNegativos }}</strong>
        </div>
      </div>

      <!-- Tabla conteo -->
      <div class="inv-table-wrap">
        <div v-if="!filas.length" class="inv-empty">No hay lotes activos en esta sucursal</div>
        <table v-else class="inv-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Lote #</th>
              <th>Interno</th>
              <th style="text-align:right;">Stock sistema</th>
              <th style="text-align:right;min-width:120px;">Conteo físico</th>
              <th style="text-align:right;">Diferencia</th>
              <th>Motivo ajuste</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in filas" :key="f.id" :class="['inv-tr', f.diferencia !== 0 ? (f.diferencia > 0 ? 'inv-tr--pos' : 'inv-tr--neg') : '']">
              <td style="font-weight:600;color:var(--t2);">{{ f.productoNombre || '—' }}</td>
              <td class="inv-mono">{{ f.nroLote || '—' }}</td>
              <td class="inv-mono" style="color:var(--t4);">{{ f.loteInterno || '—' }}</td>
              <td style="text-align:right;color:var(--t3);">{{ fmt(f.cantidadSistema) }}</td>
              <td style="text-align:right;padding:4px 8px;">
                <input
                  v-model.number="f.conteo"
                  type="number" min="0" step="0.001"
                  class="inv-conteo-input"
                  @input="calcDif(f)"
                />
              </td>
              <td style="text-align:right;font-weight:800;" :class="f.diferencia > 0 ? 'inv-qty--pos' : f.diferencia < 0 ? 'inv-qty--neg' : ''">
                {{ f.diferencia > 0 ? '+' : '' }}{{ f.diferencia !== null ? fmt(f.diferencia) : '—' }}
              </td>
              <td>
                <input
                  v-if="f.diferencia !== 0 && f.diferencia !== null"
                  v-model="f.motivo"
                  class="ide-input" style="padding:4px 8px;font-size:11px;"
                  placeholder="Motivo…"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

  </div>
</template>

<script>
export default {
  name: 'InventarioToma',
  data: () => ({
    sucursalId: '', fechaToma: new Date().toISOString().slice(0, 10),
    filas: [], loading: false, procesando: false,
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales || [] },
    filasConDiferencia() { return this.filas.filter(f => f.diferencia !== null && f.diferencia !== 0) },
    ajustesPositivos() { return this.filasConDiferencia.filter(f => f.diferencia > 0).length },
    ajustesNegativos() { return this.filasConDiferencia.filter(f => f.diferencia !== null && f.diferencia !== 0 && !(f.diferencia > 0)).length },
  },
  created() {
    const s = this.$store.getters.sucursalActualId
    if (s) { this.sucursalId = s; this.cargarLotes() }
  },
  methods: {
    async cargarLotes() {
      if (!this.sucursalId) return
      this.loading = true; this.filas = []
      try {
        const data = await this.$service.list(`lotes/todos?sucursalId=${this.sucursalId}&estadoLote=ACTIVO`) || []
        this.filas = data.map(l => ({
          id: l.id,
          nroLote: l.nroLote, loteInterno: l.loteInterno,
          productoNombre: l.productoNombre,
          cantidadSistema: Number(l.cantidadActual),
          conteo: null, diferencia: null, motivo: 'Toma de inventario',
        }))
      } finally { this.loading = false }
    },
    calcDif(fila) {
      fila.diferencia = fila.conteo !== null && fila.conteo !== '' ? Number(fila.conteo) - fila.cantidadSistema : null
    },
    limpiar() { this.filas = []; this.sucursalId = '' },
    async procesarAjustes() {
      const filasValidas = this.filasConDiferencia.filter(f => f.motivo?.trim())
      if (filasValidas.length < this.filasConDiferencia.length) {
        this.$message.error('Todas las filas con diferencia deben tener motivo')
        return
      }
      this.procesando = true
      let ok = 0; let err = 0
      for (const f of filasValidas) {
        const tipo = f.diferencia > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO'
        const cantidad = Math.abs(f.diferencia)
        try {
          await this.$service.save('movimientos-stock', {
            loteId: f.id, sucursalId: this.sucursalId,
            tipo, cantidad, motivo: f.motivo, tipoDocumento: 'TOMA_INVENTARIO',
          })
          ok++
        } catch { err++ }
      }
      this.procesando = false
      if (ok > 0) this.$message.success(`${ok} ajuste(s) aplicado(s)`)
      if (err > 0) this.$message.error(`${err} ajuste(s) fallaron`)
      await this.cargarLotes()
    },
    fmt(v) { return Number(v || 0).toFixed(2) },
  },
}
</script>

<style scoped>
.inv-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; gap:12px; }
.inv-header-bar { display:flex; gap:12px; flex-wrap:wrap; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:14px 16px; align-items:flex-end; }
.inv-summary-bar { display:flex; gap:20px; flex-wrap:wrap; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:12px 20px; }
.inv-summary-item { display:flex; flex-direction:column; gap:2px; }
.inv-summary-item span { font-size:10px; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.inv-summary-item strong { font-size:15px; color:var(--t1); }
.inv-table-wrap { flex:1; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; overflow:auto; }
.inv-empty { text-align:center; padding:40px; font-size:13px; color:var(--b3); font-style:italic; display:flex; justify-content:center; align-items:center; }
.inv-table { width:100%; border-collapse:collapse; font-size:12px; }
.inv-table th { background:var(--bg-e); color:var(--t4); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:10px 12px; text-align:left; white-space:nowrap; position:sticky; top:0; z-index:1; }
.inv-table td { padding:6px 12px; border-top:1px solid var(--b2); vertical-align:middle; }
.inv-tr:hover { background:var(--b2); }
.inv-tr--pos td { background:#4ade8008; }
.inv-tr--neg td { background:#f8717108; }
.inv-mono { font-family:monospace; font-size:11px; color:#818cf8; }
.inv-qty--pos { color:#4ade80; }
.inv-qty--neg { color:#f87171; }
.inv-conteo-input { background:var(--bg-e); border:1px solid var(--b1); border-radius:6px; color:var(--t2); font-size:12px; padding:4px 8px; width:90px; text-align:right; outline:none; }
.inv-conteo-input:focus { border-color:#6366f1; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
