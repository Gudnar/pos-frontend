<template>
  <div class="fin-root">
    <!-- Cabecera -->
    <div class="fin-header">
      <div>
        <div class="fin-title">Gastos</div>
        <div class="fin-subtitle">Registro de alimentación, transporte, servicios y otros gastos</div>
      </div>
      <button class="fin-btn-primary" @click="abrirNuevo">+ Nuevo Gasto</button>
    </div>

    <!-- Filtros -->
    <div class="fin-filters">
      <div class="fin-filter-group">
        <span class="fin-filter-label">Categoría:</span>
        <button
          v-for="cat in ['TODOS', 'PERSONAL', 'TRABAJO']"
          :key="cat"
          class="fin-chip"
          :class="{ 'fin-chip--active': filtroCategoria === cat }"
          @click="filtroCategoria = cat; cargar()"
        >{{ cat }}</button>
      </div>
      <div class="fin-filter-group">
        <span class="fin-filter-label">Tipo:</span>
        <button
          v-for="t in tiposGasto"
          :key="t.value"
          class="fin-chip"
          :class="{ 'fin-chip--active': filtroTipo === t.value }"
          @click="filtroTipo = t.value; cargar()"
        >{{ t.label }}</button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="fin-table-wrap">
      <div v-if="cargando" class="fin-empty">Cargando...</div>
      <div v-else-if="!items.length" class="fin-empty">No hay gastos registrados</div>
      <table v-else class="fin-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Referencia</th>
            <th class="fin-th-right">Monto</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td class="fin-td-mono">{{ formatFecha(item.fecha) }}</td>
            <td>
              <span class="fin-badge" :class="badgeTipo(item.tipo)">{{ labelTipo(item.tipo) }}</span>
            </td>
            <td>
              <span class="fin-badge" :class="badgeCat(item.categoria)">{{ item.categoria }}</span>
            </td>
            <td class="fin-td-desc">{{ item.descripcion }}</td>
            <td class="fin-td-mono">{{ item.referencia || '—' }}</td>
            <td class="fin-td-right fin-td-money fin-td-gasto">{{ formatMonto(item.monto) }}</td>
            <td>
              <div style="display:flex;gap:6px;justify-content:flex-end;">
                <button class="fin-btn-icon fin-btn-icon--edit" title="Editar" @click="abrirEditar(item)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="fin-btn-icon fin-btn-icon--del" title="Eliminar" @click="confirmarEliminar(item)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog crear/editar -->
    <div v-if="dialog" class="fin-overlay" @click.self="dialog = false">
      <div class="fin-dialog">
        <div class="fin-dialog-head">
          <span>{{ editandoId ? 'Editar Gasto' : 'Nuevo Gasto' }}</span>
          <button class="fin-dialog-close" @click="dialog = false">✕</button>
        </div>
        <div class="fin-dialog-body">
          <div class="fin-form-grid">
            <div class="fin-field">
              <label>Tipo *</label>
              <select v-model="form.tipo" class="fin-select">
                <option v-for="t in tiposGasto.filter(x => x.value !== 'TODOS')" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="fin-field">
              <label>Categoría *</label>
              <select v-model="form.categoria" class="fin-select">
                <option value="PERSONAL">Personal</option>
                <option value="TRABAJO">Trabajo</option>
              </select>
            </div>
            <div class="fin-field">
              <label>Monto (Bs) *</label>
              <input v-model.number="form.monto" type="number" min="0.01" step="0.01" class="fin-input" />
            </div>
            <div class="fin-field">
              <label>Fecha *</label>
              <input v-model="form.fecha" type="date" class="fin-input" />
            </div>
            <div class="fin-field fin-field--full">
              <label>Descripción *</label>
              <textarea v-model="form.descripcion" class="fin-input fin-textarea" rows="2" placeholder="Detalle del gasto" />
            </div>
            <div class="fin-field fin-field--full">
              <label>Referencia / Nro. recibo</label>
              <input v-model="form.referencia" class="fin-input" placeholder="Opcional" />
            </div>
          </div>
        </div>
        <div class="fin-dialog-foot">
          <button class="fin-btn-ghost" @click="dialog = false">Cancelar</button>
          <button class="fin-btn-primary" :disabled="guardando" @click="guardar">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Gastos',
  data() {
    return {
      items: [],
      cargando: false,
      guardando: false,
      dialog: false,
      editandoId: null,
      filtroCategoria: 'TODOS',
      filtroTipo: 'TODOS',
      form: this.emptyForm(),
      tiposGasto: [
        { value: 'TODOS',         label: 'Todos' },
        { value: 'ALIMENTACION',  label: 'Alimentación' },
        { value: 'TRANSPORTE',    label: 'Transporte' },
        { value: 'SERVICIOS',     label: 'Servicios' },
        { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
        { value: 'OTROS',         label: 'Otros' },
      ],
    }
  },
  created() {
    this.cargar()
  },
  methods: {
    emptyForm() {
      return {
        tipo: 'ALIMENTACION',
        categoria: 'TRABAJO',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        referencia: '',
      }
    },

    async cargar() {
      this.cargando = true
      try {
        const params = {}
        if (this.filtroTipo !== 'TODOS') params.tipo = this.filtroTipo
        if (this.filtroCategoria !== 'TODOS') params.categoria = this.filtroCategoria
        this.items = (await this.$service.list('gastos', params)) || []
      } catch (e) {
        this.$message.error('Error al cargar gastos')
      } finally {
        this.cargando = false
      }
    },

    abrirNuevo() {
      this.editandoId = null
      this.form = this.emptyForm()
      this.dialog = true
    },

    abrirEditar(item) {
      this.editandoId = item.id
      this.form = {
        tipo: item.tipo,
        categoria: item.categoria,
        monto: Number(item.monto),
        fecha: item.fecha,
        descripcion: item.descripcion,
        referencia: item.referencia || '',
      }
      this.dialog = true
    },

    async guardar() {
      if (!this.form.tipo || !this.form.categoria || !this.form.monto || !this.form.fecha || !this.form.descripcion) {
        return this.$message.error('Completa los campos obligatorios')
      }
      this.guardando = true
      try {
        if (this.editandoId) {
          await this.$service.put(`gastos/${this.editandoId}`, this.form)
        } else {
          await this.$service.post('gastos', this.form)
        }
        this.$message.success('Gasto guardado correctamente')
        this.dialog = false
        await this.cargar()
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar')
      } finally {
        this.guardando = false
      }
    },

    confirmarEliminar(item) {
      this.$confirm(`¿Eliminar el gasto de Bs ${this.formatMonto(item.monto)}?`, async () => {
        try {
          await this.$service.delete(`gastos/${item.id}`)
          this.$message.success('Gasto eliminado')
          await this.cargar()
        } catch (e) {
          this.$message.error(e?.mensaje || 'Error al eliminar')
        }
      })
    },

    formatFecha(f) {
      if (!f) return '—'
      const [y, m, d] = f.split('-')
      return `${d}/${m}/${y}`
    },

    formatMonto(v) {
      return 'Bs ' + Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },

    labelTipo(tipo) {
      const map = {
        ALIMENTACION: 'Alimentación',
        TRANSPORTE: 'Transporte',
        SERVICIOS: 'Servicios',
        MANTENIMIENTO: 'Mantenimiento',
        OTROS: 'Otros',
      }
      return map[tipo] || tipo
    },

    badgeTipo(tipo) {
      const map = {
        ALIMENTACION: 'fin-badge--alim',
        TRANSPORTE: 'fin-badge--trans',
        SERVICIOS: 'fin-badge--serv',
        MANTENIMIENTO: 'fin-badge--mant',
        OTROS: 'fin-badge--otros',
      }
      return map[tipo] || ''
    },

    badgeCat(cat) {
      return cat === 'PERSONAL' ? 'fin-badge--personal' : 'fin-badge--trabajo'
    },
  },
}
</script>

<style scoped>
.fin-root { display:flex; flex-direction:column; height:100%; overflow-y:auto; background:#070d1a; padding:0 0 24px; gap:0; }

.fin-header {
  display:flex; align-items:flex-start; justify-content:space-between;
  padding:16px 20px 10px;
}
.fin-title { font-size:18px; font-weight:800; color:#f1f5f9; }
.fin-subtitle { font-size:12px; color:#475569; margin-top:2px; }

.fin-btn-primary {
  padding:7px 16px; border-radius:8px; background:#ef4444; border:none;
  color:#fff; font-size:12px; font-weight:700; cursor:pointer; transition:background .15s; white-space:nowrap;
}
.fin-btn-primary:hover { background:#dc2626; }
.fin-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
.fin-btn-ghost {
  padding:7px 16px; border-radius:8px; background:transparent;
  border:1px solid #1e3a5f; color:#94a3b8; font-size:12px; font-weight:600; cursor:pointer;
}
.fin-btn-ghost:hover { border-color:#6366f1; color:#818cf8; }

.fin-filters {
  display:flex; flex-direction:column; gap:6px;
  margin:0 16px 10px; padding:10px 14px;
  background:#0d1526; border:1px solid #1e3a5f33; border-radius:10px;
}
.fin-filter-group { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.fin-filter-label { font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.4px; min-width:60px; }
.fin-chip {
  padding:3px 10px; border-radius:999px; border:1px solid #1e3a5f55;
  background:transparent; color:#64748b; font-size:11px; font-weight:600; cursor:pointer; transition:all .15s;
}
.fin-chip:hover { border-color:#6366f1; color:#818cf8; }
.fin-chip--active { background:#6366f122; border-color:#6366f1; color:#818cf8; }

.fin-table-wrap {
  margin:0 16px; background:#0d1526; border:1px solid #1e3a5f33; border-radius:10px; overflow:auto;
}
.fin-empty { padding:40px; text-align:center; color:#475569; font-size:13px; }
.fin-table { width:100%; border-collapse:collapse; font-size:12px; }
.fin-table thead th {
  padding:9px 12px; text-align:left; font-size:10px; font-weight:700;
  color:#64748b; text-transform:uppercase; letter-spacing:.4px;
  border-bottom:1px solid #1e3a5f33; white-space:nowrap;
}
.fin-th-right { text-align:right !important; }
.fin-table tbody tr { border-bottom:1px solid #1e3a5f22; transition:background .1s; }
.fin-table tbody tr:hover { background:#1e293b55; }
.fin-table td { padding:9px 12px; color:#cbd5e1; vertical-align:middle; }
.fin-td-mono { font-family:monospace; font-size:11px; }
.fin-td-right { text-align:right; }
.fin-td-money { font-weight:600; font-family:monospace; }
.fin-td-gasto { color:#f87171; }
.fin-td-desc { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.fin-badge {
  display:inline-block; padding:2px 8px; border-radius:999px;
  font-size:10px; font-weight:700; text-transform:uppercase;
}
.fin-badge--alim    { background:#22c55e22; color:#4ade80; }
.fin-badge--trans   { background:#f59e0b22; color:#fbbf24; }
.fin-badge--serv    { background:#0ea5e922; color:#38bdf8; }
.fin-badge--mant    { background:#8b5cf622; color:#a78bfa; }
.fin-badge--otros   { background:#64748b22; color:#94a3b8; }
.fin-badge--personal { background:#ec489922; color:#f472b6; }
.fin-badge--trabajo  { background:#22c55e22; color:#4ade80; }

.fin-btn-icon {
  width:26px; height:26px; border-radius:6px; border:none;
  display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s;
}
.fin-btn-icon--edit { background:#6366f122; color:#818cf8; }
.fin-btn-icon--edit:hover { background:#6366f155; }
.fin-btn-icon--del { background:#ef444422; color:#f87171; }
.fin-btn-icon--del:hover { background:#ef444455; }

.fin-overlay {
  position:fixed; inset:0; background:#00000088; z-index:200;
  display:flex; align-items:center; justify-content:center;
}
.fin-dialog {
  width:100%; max-width:480px; background:#0d1526;
  border:1px solid #1e3a5f55; border-radius:14px; overflow:hidden;
  display:flex; flex-direction:column; max-height:90vh;
}
.fin-dialog-head {
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 20px; border-bottom:1px solid #1e3a5f33;
  font-size:15px; font-weight:700; color:#f1f5f9;
}
.fin-dialog-close {
  background:none; border:none; color:#475569; font-size:16px; cursor:pointer; padding:2px 6px;
}
.fin-dialog-close:hover { color:#ef4444; }
.fin-dialog-body { padding:20px; overflow-y:auto; }
.fin-dialog-foot {
  display:flex; justify-content:flex-end; gap:8px;
  padding:14px 20px; border-top:1px solid #1e3a5f33;
}

.fin-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.fin-field { display:flex; flex-direction:column; gap:4px; }
.fin-field--full { grid-column:1 / -1; }
.fin-field label { font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.4px; }
.fin-input {
  padding:7px 10px; border-radius:7px; border:1px solid #1e3a5f55;
  background:#0a0f1e; color:#e2e8f0; font-size:13px; outline:none; transition:border-color .15s;
  width:100%; box-sizing:border-box;
}
.fin-input:focus { border-color:#6366f1; }
.fin-select { padding:7px 10px; border-radius:7px; border:1px solid #1e3a5f55; background:#0a0f1e; color:#e2e8f0; font-size:13px; outline:none; width:100%; }
.fin-textarea { resize:vertical; min-height:56px; font-family:inherit; }
</style>
