<template>
  <div class="cp-root">
    <div class="cp-layout">

      <!-- Lista de ingresos iniciales -->
      <div class="cp-panel">
        <div class="cp-col-header">
          <div>
            <div class="cp-col-title">Ingresos Iniciales</div>
            <div class="cp-col-count">{{ ingresos.length }} registros</div>
          </div>
          <button class="cp-add-btn" @click="abrirForm()">+ Nuevo</button>
        </div>
        <input v-model="q" class="cp-search" placeholder="Buscar por Nro..." />
        <div class="cp-list">
          <div v-if="loading" class="cp-loading"><div class="ct-spinner"></div></div>
          <div v-else-if="!filtrados.length" class="cp-empty">Sin ingresos iniciales</div>
          <div v-else v-for="i in filtrados" :key="i.id" class="cp-row" @click="verDetalle(i)">
            <div style="flex:1;min-width:0;">
              <div class="cp-row-title">{{ i.nroCompra }}</div>
              <div class="cp-row-sub">{{ i.fecha }} · {{ i.detallesCount || '?' }} productos</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div class="cp-row-monto">Bs {{ formatMonto(i.total) }}</div>
              <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:4px;">
                <span class="ct-badge ct-badge--on">FINALIZADO</span>
                <button class="cp-edit-btn" title="Editar" @click.stop="abrirForm(i)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="cp-del-btn" title="Eliminar" @click.stop="eliminar(i)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal formulario -->
      <transition name="modal-fade">
        <div v-if="dialog" class="ct-modal-backdrop" @click.self="dialog = false">
          <div class="ct-modal" style="max-width:780px;">
            <div class="ct-modal-header">
              <span>{{ editandoId ? 'Editar Ingreso Inicial' : 'Nuevo Ingreso Inicial de Stock' }}</span>
              <button class="ct-modal-close" @click="dialog = false">✕</button>
            </div>
            <div class="ct-modal-body">
              <div class="ct-form-grid" style="margin-bottom:16px;">
                <div class="ide-field">
                  <label>Sucursal *</label>
                  <select v-model="form.sucursalId" class="ide-select">
                    <option value="">Seleccionar...</option>
                    <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
                  </select>
                </div>
                <div class="ide-field">
                  <label>Fecha *</label>
                  <input v-model="form.fecha" class="ide-input" type="date" />
                </div>
                <div class="ide-field ct-form-full">
                  <label>Observaciones</label>
                  <input v-model="form.observaciones" class="ide-input" placeholder="Notas opcionales..." />
                </div>
              </div>

              <!-- Tabla de productos -->
              <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.5px;">Productos</span>
                <button class="cp-add-row-btn" @click="agregarFila()">+ Agregar producto</button>
              </div>
              <div class="cp-table-wrap">
                <table class="cp-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style="width:130px;">Unidad</th>
                      <th style="width:90px;">Cantidad</th>
                      <th style="width:110px;">Precio Costo</th>
                      <th style="width:110px;">Nro Lote</th>
                      <th style="width:120px;">Fec. Vencimiento</th>
                      <th style="width:28px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!form.detalles.length">
                      <td colspan="7" style="text-align:center;color:var(--b3);font-style:italic;padding:16px;">
                        Agrega productos usando el botón de arriba
                      </td>
                    </tr>
                    <tr v-for="(d, idx) in form.detalles" :key="idx">
                      <td style="position:relative;min-width:220px;">
                        <input
                          v-model="d._busqueda"
                          class="ide-input"
                          :class="{ 'cp-prod-ok': d.productoId }"
                          placeholder="Buscar por nombre o código..."
                          autocomplete="off"
                          @input="onBusqueda(d)"
                          @focus="d._showDrop = !!d._busqueda"
                          @blur="ocultarDrop(d)"
                        />
                        <div v-if="d.productoId && (d._categoriaNombre || d._subcategoriaNombre)" class="cp-sel-cats">
                          <span class="cp-sel-breadcrumb">{{ [d._categoriaNombre, d._subcategoriaNombre].filter(Boolean).join(' ') }}</span>
                        </div>
                        <div v-if="d._showDrop" class="cp-prod-drop">
                          <div v-if="!filtrarProductos(d._busqueda, d).length" class="cp-drop-empty">Sin resultados</div>
                          <div
                            v-for="p in filtrarProductos(d._busqueda, d)"
                            :key="p.id"
                            class="cp-drop-item"
                            @mousedown.prevent="seleccionarProducto(d, p)"
                          >
                            <div style="flex:1;min-width:0;">
                              <div class="cp-drop-nombre">{{ [p.categoriaNombre, p.subcategoriaNombre, p.nombre].filter(Boolean).join(' ') }}</div>
                            </div>
                            <span v-if="p.codigoBarras || p.codigoTienda" class="cp-drop-code">{{ p.codigoBarras || p.codigoTienda }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select v-model="d.unidadId" class="ide-select">
                          <option value="">Base</option>
                          <option v-for="u in unidades" :key="u.id" :value="u.id">{{ u.nombre }}</option>
                        </select>
                      </td>
                      <td><input v-model.number="d.cantidad" class="ide-input" type="number" min="0.001" step="1" /></td>
                      <td><input v-model.number="d.precioUnitario" class="ide-input" type="number" min="0" step="0.01" /></td>
                      <td><input v-model="d.nroLote" class="ide-input" placeholder="Opcional" /></td>
                      <td><input v-model="d.fechaVencimiento" class="ide-input" type="date" /></td>
                      <td>
                        <button class="cp-del-row-btn" @click="form.detalles.splice(idx,1)" title="Eliminar">✕</button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot v-if="form.detalles.length">
                    <tr>
                      <td colspan="3" style="text-align:right;font-size:12px;font-weight:700;color:var(--t3);padding:8px 12px;">Total:</td>
                      <td style="font-size:13px;font-weight:800;color:var(--t1);padding:8px 12px;">Bs {{ formatMonto(totalForm) }}</td>
                      <td colspan="3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div class="ct-modal-footer">
              <button class="ct-btn-cancel" @click="dialog = false">Cancelar</button>
              <button class="ct-btn-ok" :disabled="saving" @click="guardar">
                {{ saving ? 'Guardando...' : (editandoId ? 'Guardar Cambios' : 'Registrar Ingreso') }}
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Modal detalle -->
      <transition name="modal-fade">
        <div v-if="detalleDialog && detalleActual" class="ct-modal-backdrop" @click.self="detalleDialog = false">
          <div class="ct-modal" style="max-width:680px;">
            <div class="ct-modal-header">
              <span>{{ detalleActual.nroCompra }} — Ingreso Inicial</span>
              <button class="ct-modal-close" @click="detalleDialog = false">✕</button>
            </div>
            <div class="ct-modal-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
                <div class="cp-info-item"><span>Fecha</span><strong>{{ detalleActual.fecha }}</strong></div>
                <div class="cp-info-item"><span>Total</span><strong>Bs {{ formatMonto(detalleActual.total) }}</strong></div>
                <div class="cp-info-item ct-form-full"><span>Observaciones</span><strong>{{ detalleActual.observaciones || '—' }}</strong></div>
              </div>
              <div style="font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Productos</div>
              <div v-if="loadingDetalle" class="cp-loading"><div class="ct-spinner"></div></div>
              <table v-else class="cp-table">
                <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th>Lote</th></tr></thead>
                <tbody>
                  <tr v-for="d in detalleActual.detalles" :key="d.id">
                    <td>{{ nombreProducto(d.productoId) }}</td>
                    <td>{{ d.cantidad }}</td>
                    <td>Bs {{ formatMonto(d.precioUnitario) }}</td>
                    <td>Bs {{ formatMonto(d.subtotal) }}</td>
                    <td>{{ d.nroLote || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="ct-modal-footer">
              <button class="ct-btn-cancel" @click="detalleDialog = false">Cerrar</button>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script>
const emptyForm = () => ({
  sucursalId: '', fecha: new Date().toISOString().split('T')[0],
  observaciones: '', detalles: [],
})
const emptyDetalle = () => ({ id: null, productoId: '', _busqueda: '', _showDrop: false, _categoriaNombre: '', _subcategoriaNombre: '', _categoriaColor: '#6366f1', unidadId: '', cantidad: 1, precioUnitario: 0, nroLote: '', fechaVencimiento: '' })

export default {
  name: 'ComprasIngreso',
  data: () => ({
    ingresos: [], loading: false, q: '',
    sucursales: [], productos: [], subcategorias: [], categorias: [], unidades: [],
    form: emptyForm(), saving: false, dialog: false, editandoId: null,
    detalleActual: null, detalleDialog: false, loadingDetalle: false,
  }),
  computed: {
    filtrados() {
      if (!this.q.trim()) return this.ingresos
      const q = this.q.toLowerCase()
      return this.ingresos.filter(i => i.nroCompra.toLowerCase().includes(q))
    },
    totalForm() {
      return this.form.detalles.reduce((acc, d) => acc + (d.cantidad || 0) * (d.precioUnitario || 0), 0)
    },
  },
  created() { this.cargar(); this.cargarCatalogos() },
  methods: {
    async cargar() {
      this.loading = true
      try { this.ingresos = await this.$service.list('compras?tipo=INICIAL') || [] }
      finally { this.loading = false }
    },
    async cargarCatalogos() {
      const [s, p, u, subs, cats] = await Promise.all([
        this.$service.list('sucursales').catch(() => []),
        this.$service.list('productos?soloActivos=true').catch(() => []),
        this.$service.list('unidades-medida').catch(() => []),
        this.$service.list('subcategorias-producto?soloActivos=true').catch(() => []),
        this.$service.list('categorias-producto?soloActivos=true').catch(() => []),
      ])
      this.sucursales = s || []
      this.subcategorias = subs || []
      this.categorias = cats || []
      this.unidades = u || []
      const subMap = new Map((subs || []).map(s => [s.id, s]))
      const catMap = new Map((cats || []).map(c => [c.id, c]))
      this.productos = (p || []).map(prod => {
        const sub = subMap.get(prod.subcategoriaId)
        const cat = sub ? catMap.get(sub.categoriaId) : null
        return {
          ...prod,
          subcategoriaNombre: sub?.nombre || '',
          categoriaNombre: cat?.nombre || '',
          categoriaColor: cat?.color || '#6366f1',
        }
      })
    },
    async abrirForm(ingreso = null) {
      this.editandoId = null
      this.form = emptyForm()
      if (ingreso) {
        const data = await this.$service.get(`compras/${ingreso.id}`)
        this.editandoId = data.id
        this.form.sucursalId = data.sucursalId
        this.form.fecha = data.fecha
        this.form.observaciones = data.observaciones || ''
        this.form.detalles = (data.detalles || []).map(d => {
          const prod = this.productos.find(p => p.id === d.productoId) || {}
          return {
            id: d.id,
            productoId: d.productoId,
            _busqueda: prod.nombre || d.productoId,
            _showDrop: false,
            _categoriaNombre: prod.categoriaNombre || '',
            _subcategoriaNombre: prod.subcategoriaNombre || '',
            _categoriaColor: prod.categoriaColor || '#6366f1',
            unidadId: d.unidadId || '',
            cantidad: Number(d.cantidad),
            precioUnitario: Number(d.precioUnitario),
            descuento: Number(d.descuento) || 0,
            nroLote: d.nroLote || '',
            fechaVencimiento: d.fechaVencimiento || '',
          }
        })
      }
      this.dialog = true
    },
    agregarFila() { this.form.detalles.push(emptyDetalle()) },
    async guardar() {
      if (!this.form.sucursalId) return this.$message.error('Selecciona una sucursal')
      if (!this.form.detalles.length) return this.$message.error('Agrega al menos un producto')
      const invalido = this.form.detalles.find(d => !d.productoId || !d.cantidad)
      if (invalido) return this.$message.error('Todos los productos deben tener producto seleccionado y cantidad')
      const detalles = this.form.detalles.map(({ id, productoId, unidadId, cantidad, precioUnitario, descuento, nroLote, fechaVencimiento }) =>
        ({ id, productoId, unidadId, cantidad, precioUnitario, descuento, nroLote: nroLote || undefined, fechaVencimiento: fechaVencimiento || undefined })
      )
      this.saving = true
      try {
        if (this.editandoId) {
          await this.$service.put(`compras/${this.editandoId}/ingreso`, {
            sucursalId: this.form.sucursalId,
            fecha: this.form.fecha,
            observaciones: this.form.observaciones,
            detalles,
          })
          this.$message.success('Ingreso actualizado')
          this.dialog = false
          await this.cargar()
        } else {
          const nuevo = await this.$service.post('compras', { ...this.form, tipoCompra: 'INICIAL', detalles })
          this.$message.success('Ingreso registrado — revisa y completa los datos si es necesario')
          await this.cargar()
          await this.abrirForm(nuevo)
        }
      } finally { this.saving = false }
    },
    async verDetalle(ingreso) {
      this.loadingDetalle = true
      this.detalleDialog = true
      try {
        const data = await this.$service.get(`compras/${ingreso.id}`)
        this.detalleActual = data
      } finally { this.loadingDetalle = false }
    },
    eliminar(ingreso) {
      this.$confirm(`¿Eliminar el ingreso ${ingreso.nroCompra}? Se eliminarán también los lotes de inventario asociados.`, async () => {
        await this.$service.delete(`compras/${ingreso.id}/ingreso`)
        this.$message.success('Ingreso eliminado')
        await this.cargar()
      })
    },
    filtrarProductos(q, d) {
      if (!q || !q.trim()) return []
      const t = q.toLowerCase()
      const usados = new Set(this.form.detalles.filter(r => r !== d && r.productoId).map(r => r.productoId))
      const res = []
      for (const p of this.productos) {
        if (usados.has(p.id)) continue
        if (
          p.nombre.toLowerCase().includes(t) ||
          (p.codigoBarras && p.codigoBarras.toLowerCase().includes(t)) ||
          (p.codigoTienda && p.codigoTienda.toLowerCase().includes(t)) ||
          (p.codigoProveedor && p.codigoProveedor.toLowerCase().includes(t)) ||
          (p.subcategoriaNombre && p.subcategoriaNombre.toLowerCase().includes(t)) ||
          (p.categoriaNombre && p.categoriaNombre.toLowerCase().includes(t))
        ) {
          res.push(p)
          if (res.length >= 20) break
        }
      }
      return res
    },
    seleccionarProducto(d, p) {
      const duplicado = this.form.detalles.find(r => r !== d && r.productoId === p.id)
      if (duplicado) { this.$message.error('Este producto ya está en la lista'); return }
      d.productoId = p.id
      d._busqueda = p.nombre
      d._showDrop = false
      d._categoriaNombre = p.categoriaNombre || ''
      d._subcategoriaNombre = p.subcategoriaNombre || ''
      d._categoriaColor = p.categoriaColor || '#6366f1'
    },
    onBusqueda(d) {
      d._showDrop = true
      if (!d._busqueda) {
        d.productoId = ''
        d._categoriaNombre = ''
        d._subcategoriaNombre = ''
      }
    },
    ocultarDrop(d) { setTimeout(() => { d._showDrop = false }, 150) },
    nombreProducto(id) { return this.productos.find(p => p.id === id)?.nombre || id },
    formatMonto(v) { return Number(v || 0).toFixed(2) },
  },
}
</script>

<style scoped>
.cp-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; }
.cp-layout { flex:1; overflow:hidden; display:flex; gap:12px; }
.cp-panel { width:380px; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:14px; display:flex; flex-direction:column; overflow:hidden; }
.cp-col-header { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 8px; border-bottom:1px solid var(--b2); flex-shrink:0; }
.cp-col-title { font-size:13px; font-weight:800; color:var(--t1); }
.cp-col-count { font-size:10px; color:var(--t5); margin-top:1px; }
.cp-add-btn { background:#6366f122; border:1px solid #6366f133; color:#818cf8; border-radius:7px; padding:3px 9px; font-size:16px; cursor:pointer; font-weight:700; }
.cp-add-btn:hover { background:#6366f133; }
.cp-search { margin:8px 10px 4px; background:var(--bg-e); border:1px solid var(--b1); border-radius:7px; color:var(--t3); font-size:11px; padding:6px 10px; outline:none; flex-shrink:0; }
.cp-list { flex:1; overflow-y:auto; padding:4px 8px 12px; }
.cp-loading { display:flex; justify-content:center; padding:24px; }
.cp-empty { text-align:center; padding:20px; font-size:12px; color:var(--b3); font-style:italic; }
.cp-row { display:flex; align-items:center; gap:10px; padding:10px 8px; border-radius:8px; cursor:pointer; margin-bottom:3px; transition:background 0.15s; border:1px solid transparent; }
.cp-row:hover { background:var(--bg-c); border-color:var(--b1); }
.cp-row-title { font-size:12px; font-weight:700; color:var(--t2); }
.cp-row-sub { font-size:10px; color:var(--t5); margin-top:2px; }
.cp-row-monto { font-size:12px; font-weight:800; color:var(--t1); }
.cp-add-row-btn { background:#6366f122; border:1px solid #6366f133; color:#818cf8; border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer; }
.cp-add-row-btn:hover { background:#6366f133; }
.cp-del-row-btn { background:none; border:none; color:var(--t4); cursor:pointer; font-size:13px; padding:2px 4px; border-radius:4px; }
.cp-del-row-btn:hover { color:#f87171; }
.cp-edit-btn { background:var(--bg-c); border:1px solid var(--b1); color:var(--t4); cursor:pointer; border-radius:5px; padding:3px 5px; display:flex; align-items:center; justify-content:center; }
.cp-edit-btn:hover { border-color:#6366f1; color:#818cf8; }
.cp-del-btn { background:var(--bg-c); border:1px solid var(--b1); color:var(--t4); cursor:pointer; border-radius:5px; padding:3px 5px; display:flex; align-items:center; justify-content:center; }
.cp-del-btn:hover { border-color:#ef4444; color:#f87171; }
.cp-table-wrap { overflow-x:auto; border-radius:8px; border:1px solid var(--b1); }
.cp-table { width:100%; border-collapse:collapse; font-size:12px; }
.cp-table th { background:var(--bg-e); color:var(--t4); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:8px 12px; text-align:left; white-space:nowrap; }
.cp-table td { padding:6px 8px; border-top:1px solid var(--b2); vertical-align:middle; }
.cp-table tfoot td { background:var(--b1); }
.cp-info-item { display:flex; flex-direction:column; gap:3px; }
.cp-info-item span { font-size:10px; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.cp-info-item strong { font-size:13px; color:var(--t2); }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.cp-prod-ok { border-color:#6366f144 !important; }
.cp-sel-cats { margin-top:3px; padding:0 2px; }
.cp-sel-breadcrumb { font-size:10px; color:var(--t5); }
.cp-prod-drop { position:absolute; top:100%; left:0; right:0; z-index:200; background:var(--bg-e); border:1px solid var(--b4); border-radius:8px; max-height:260px; overflow-y:auto; box-shadow:0 8px 24px #00000066; margin-top:2px; }
.cp-drop-item { display:flex; align-items:center; gap:8px; padding:7px 10px; cursor:pointer; }
.cp-drop-item:hover { background:var(--bg-c); }
.cp-drop-nombre { font-size:12px; font-weight:600; color:var(--t2); overflow:hidden; text-overflow:ellipsis; }
.cp-drop-code { font-size:10px; color:var(--t5); font-family:monospace; flex-shrink:0; padding-top:1px; }
.cp-drop-empty { padding:10px; font-size:11px; color:var(--b3); font-style:italic; text-align:center; }
</style>
