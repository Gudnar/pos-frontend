<template>
  <div class="fin-root">
    <!-- Cabecera -->
    <div class="fin-header">
      <div>
        <div class="fin-title">Ingresos</div>
        <div class="fin-subtitle">Registro de adelantos, cambios, sueldos y pagos de servicios</div>
      </div>
      <button class="fin-btn-primary" @click="abrirNuevo">+ Nuevo Ingreso</button>
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
          v-for="t in tiposIngreso"
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
      <div v-else-if="!items.length" class="fin-empty">No hay ingresos registrados</div>
      <table v-else class="fin-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Contacto</th>
            <th>Descripción</th>
            <th>Referencia</th>
            <th class="fin-th-right">Monto</th>
            <th class="fin-th-right">Disponible</th>
            <th>Estado</th>
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
              <span class="fin-badge fin-badge--cat" :class="badgeCat(item.categoria)">{{ item.categoria }}</span>
            </td>
            <td>{{ item.nombreContacto || '—' }}</td>
            <td class="fin-td-desc">{{ item.descripcion || '—' }}</td>
            <td class="fin-td-mono">{{ item.referencia || '—' }}</td>
            <td class="fin-td-right fin-td-money">{{ formatMonto(item.monto) }}</td>
            <td class="fin-td-right fin-td-money" :class="item.tipo === 'ADELANTO' ? 'fin-td-avail' : ''">
              {{ item.tipo === 'ADELANTO' ? formatMonto(item.montoDisponible) : '—' }}
            </td>
            <td>
              <span v-if="item.tipo === 'ADELANTO'" class="fin-badge" :class="badgeEstado(item.estadoIngreso)">
                {{ item.estadoIngreso }}
              </span>
              <span v-else class="fin-td-mono" style="color:var(--t4)">—</span>
            </td>
            <td>
              <div style="display:flex;gap:6px;justify-content:flex-end;">
                <button
                  v-if="item.estadoIngreso !== 'ANULADO'"
                  class="fin-btn-icon fin-btn-icon--edit"
                  title="Editar"
                  @click="abrirEditar(item)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button
                  v-if="item.estadoIngreso !== 'ANULADO' && item.estadoIngreso !== 'UTILIZADO'"
                  class="fin-btn-icon fin-btn-icon--del"
                  title="Anular"
                  @click="confirmarAnular(item)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog crear/editar -->
    <div v-if="dialog" class="fin-overlay">
      <div class="fin-dialog">
        <div class="fin-dialog-head">
          <span>{{ editandoId ? 'Editar Ingreso' : 'Nuevo Ingreso' }}</span>
          <button class="fin-dialog-close" @click="dialog = false">✕</button>
        </div>
        <div class="fin-dialog-body">
          <div class="fin-form-grid">
            <div v-if="!editandoId" class="fin-field">
              <label>Tipo *</label>
              <select v-model="form.tipo" class="fin-select">
                <option v-for="t in tiposIngreso.filter(x => x.value !== 'TODOS')" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div v-if="!editandoId" class="fin-field">
              <label>Categoría *</label>
              <select v-model="form.categoria" class="fin-select">
                <option value="PERSONAL">Personal</option>
                <option value="TRABAJO">Trabajo</option>
              </select>
            </div>
            <div v-if="!editandoId" class="fin-field">
              <label>Monto (Bs) *</label>
              <input v-model.number="form.monto" type="number" min="0.01" step="0.01" class="fin-input" />
            </div>
            <div v-if="!editandoId" class="fin-field">
              <label>Fecha *</label>
              <input v-model="form.fecha" type="date" class="fin-input" />
            </div>
            <div class="fin-field fin-field--full">
              <label>Descripción</label>
              <textarea v-model="form.descripcion" class="fin-input fin-textarea" rows="2" />
            </div>
            <div class="fin-field">
              <label>Referencia / Nro. recibo</label>
              <input v-model="form.referencia" class="fin-input" placeholder="Opcional" />
            </div>
            <div v-if="!editandoId" class="fin-field">
              <label>Nombre contacto</label>
              <input v-model="form.nombreContacto" class="fin-input" placeholder="Nombre del cliente o persona" />
            </div>
            <div v-else class="fin-field">
              <label>Nombre contacto</label>
              <input v-model="form.nombreContacto" class="fin-input" />
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
  name: 'Ingresos',
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
      tiposIngreso: [
        { value: 'TODOS',        label: 'Todos' },
        { value: 'ADELANTO',     label: 'Adelanto' },
        { value: 'CAMBIO',       label: 'Cambio' },
        { value: 'PAGO_SERVICIO', label: 'Pago Servicio' },
        { value: 'SUELDO',       label: 'Sueldo' },
      ],
    }
  },
  created() {
    this.cargar()
  },
  methods: {
    emptyForm() {
      return {
        tipo: 'ADELANTO',
        categoria: 'TRABAJO',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        referencia: '',
        nombreContacto: '',
      }
    },

    async cargar() {
      this.cargando = true
      try {
        const params = {}
        if (this.filtroTipo !== 'TODOS') params.tipo = this.filtroTipo
        if (this.filtroCategoria !== 'TODOS') params.categoria = this.filtroCategoria
        this.items = (await this.$service.list('ingresos', params)) || []
      } catch (e) {
        this.$message.error('Error al cargar ingresos')
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
        descripcion: item.descripcion || '',
        referencia: item.referencia || '',
        nombreContacto: item.nombreContacto || '',
      }
      this.dialog = true
    },

    async guardar() {
      if (!this.editandoId) {
        if (!this.form.tipo || !this.form.categoria || !this.form.monto || !this.form.fecha) {
          return this.$message.error('Completa los campos obligatorios')
        }
      }
      this.guardando = true
      try {
        if (this.editandoId) {
          await this.$service.put(`ingresos/${this.editandoId}`, this.form)
        } else {
          await this.$service.post('ingresos', this.form)
        }
        this.$message.success('Ingreso guardado correctamente')
        this.dialog = false
        await this.cargar()
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar')
      } finally {
        this.guardando = false
      }
    },

    confirmarAnular(item) {
      this.$confirm(`¿Anular el ingreso de Bs ${this.formatMonto(item.monto)}?`, async () => {
        try {
          await this.$service.put(`ingresos/${item.id}/anular`, {})
          this.$message.success('Ingreso anulado')
          await this.cargar()
        } catch (e) {
          this.$message.error(e?.mensaje || 'Error al anular')
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
      const map = { ADELANTO: 'Adelanto', CAMBIO: 'Cambio', PAGO_SERVICIO: 'Pago Serv.', SUELDO: 'Sueldo' }
      return map[tipo] || tipo
    },

    badgeTipo(tipo) {
      const map = {
        ADELANTO: 'fin-badge--adelanto',
        CAMBIO: 'fin-badge--cambio',
        PAGO_SERVICIO: 'fin-badge--pago',
        SUELDO: 'fin-badge--sueldo',
      }
      return map[tipo] || ''
    },

    badgeCat(cat) {
      return cat === 'PERSONAL' ? 'fin-badge--personal' : 'fin-badge--trabajo'
    },

    badgeEstado(estado) {
      const map = {
        DISPONIBLE: 'fin-badge--ok',
        PARCIAL: 'fin-badge--parcial',
        UTILIZADO: 'fin-badge--used',
        ANULADO: 'fin-badge--anulado',
      }
      return map[estado] || ''
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
.fin-title { font-size:18px; font-weight:800; color:var(--t1); }
.fin-subtitle { font-size:12px; color:var(--t5); margin-top:2px; }

.fin-btn-primary {
  padding:7px 16px; border-radius:8px; background:#22c55e; border:none;
  color:#fff; font-size:12px; font-weight:700; cursor:pointer; transition:background .15s; white-space:nowrap;
}
.fin-btn-primary:hover { background:#16a34a; }
.fin-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
.fin-btn-ghost {
  padding:7px 16px; border-radius:8px; background:transparent;
  border:1px solid var(--b0); color:var(--t3); font-size:12px; font-weight:600; cursor:pointer;
}
.fin-btn-ghost:hover { border-color:#6366f1; color:#818cf8; }

.fin-filters {
  display:flex; flex-direction:column; gap:6px;
  margin:0 16px 10px; padding:10px 14px;
  background:var(--bg-s); border:1px solid var(--b2); border-radius:10px;
}
.fin-filter-group { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.fin-filter-label { font-size:10px; font-weight:700; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; min-width:60px; }
.fin-chip {
  padding:3px 10px; border-radius:999px; border:1px solid var(--b1);
  background:transparent; color:var(--t4); font-size:11px; font-weight:600; cursor:pointer; transition:all .15s;
}
.fin-chip:hover { border-color:#6366f1; color:#818cf8; }
.fin-chip--active { background:#6366f122; border-color:#6366f1; color:#818cf8; }

.fin-table-wrap {
  margin:0 16px; background:var(--bg-s); border:1px solid var(--b2); border-radius:10px; overflow:auto;
}
.fin-empty { padding:40px; text-align:center; color:var(--t5); font-size:13px; }
.fin-table { width:100%; border-collapse:collapse; font-size:12px; }
.fin-table thead th {
  padding:9px 12px; text-align:left; font-size:10px; font-weight:700;
  color:var(--t4); text-transform:uppercase; letter-spacing:.4px;
  border-bottom:1px solid var(--b2); white-space:nowrap;
}
.fin-th-right { text-align:right !important; }
.fin-table tbody tr { border-bottom:1px solid var(--b2); transition:background .1s; }
.fin-table tbody tr:hover { background:var(--b1); }
.fin-table td { padding:9px 12px; color:var(--scroll); vertical-align:middle; }
.fin-td-mono { font-family:monospace; font-size:11px; }
.fin-td-right { text-align:right; }
.fin-td-money { font-weight:600; font-family:monospace; }
.fin-td-avail { color:#22c55e; }
.fin-td-desc { max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.fin-badge {
  display:inline-block; padding:2px 8px; border-radius:999px;
  font-size:10px; font-weight:700; text-transform:uppercase;
}
.fin-badge--adelanto { background:#6366f122; color:#818cf8; }
.fin-badge--cambio { background:#f59e0b22; color:#fbbf24; }
.fin-badge--pago { background:#0ea5e922; color:#38bdf8; }
.fin-badge--sueldo { background:#8b5cf622; color:#a78bfa; }
.fin-badge--cat {}
.fin-badge--personal { background:#ec489922; color:#f472b6; }
.fin-badge--trabajo { background:#22c55e22; color:#4ade80; }
.fin-badge--ok { background:#22c55e22; color:#4ade80; }
.fin-badge--parcial { background:#f59e0b22; color:#fbbf24; }
.fin-badge--used { background:#6366f122; color:#818cf8; }
.fin-badge--anulado { background:#ef444422; color:#f87171; }

.fin-btn-icon {
  width:26px; height:26px; border-radius:6px; border:none;
  display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s;
}
.fin-btn-icon--edit { background:#6366f122; color:#818cf8; }
.fin-btn-icon--edit:hover { background:#6366f155; }
.fin-btn-icon--del { background:#ef444422; color:#f87171; }
.fin-btn-icon--del:hover { background:#ef444455; }

/* Dialog */
.fin-overlay {
  position:fixed; inset:0; background:#00000088; z-index:200;
  display:flex; align-items:center; justify-content:center;
}
.fin-dialog {
  width:100%; max-width:520px; background:var(--bg-s);
  border:1px solid var(--b1); border-radius:14px; overflow:hidden;
  display:flex; flex-direction:column; max-height:90vh;
}
.fin-dialog-head {
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 20px; border-bottom:1px solid var(--b2);
  font-size:15px; font-weight:700; color:var(--t1);
}
.fin-dialog-close {
  background:none; border:none; color:var(--t5); font-size:16px; cursor:pointer; padding:2px 6px;
}
.fin-dialog-close:hover { color:#ef4444; }
.fin-dialog-body { padding:20px; overflow-y:auto; }
.fin-dialog-foot {
  display:flex; justify-content:flex-end; gap:8px;
  padding:14px 20px; border-top:1px solid var(--b2);
}

.fin-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.fin-field { display:flex; flex-direction:column; gap:4px; }
.fin-field--full { grid-column:1 / -1; }
.fin-field label { font-size:10px; font-weight:700; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.fin-input {
  padding:7px 10px; border-radius:7px; border:1px solid var(--b1);
  background:var(--bg); color:var(--t2); font-size:13px; outline:none; transition:border-color .15s;
  width:100%; box-sizing:border-box;
}
.fin-input:focus { border-color:#6366f1; }
.fin-select { padding:7px 10px; border-radius:7px; border:1px solid var(--b1); background:var(--bg); color:var(--t2); font-size:13px; outline:none; width:100%; }
.fin-textarea { resize:vertical; min-height:56px; font-family:inherit; }
</style>
