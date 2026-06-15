<template>
  <div class="inv-root">

    <!-- ── Panel izquierdo: Productos con stock ── -->
    <div class="inv-col inv-col--products">
      <div class="cp-col-header" style="border-radius:14px 14px 0 0;">
        <div>
          <div class="cp-col-title">Stock por Producto</div>
          <div class="cp-col-count">{{ productosFiltrados.length }} productos</div>
        </div>
        <button class="cp-add-btn" @click="abrirIngreso()">+ Ingresar</button>
      </div>
      <div style="padding:8px 10px;display:flex;gap:6px;align-items:center;border-bottom:1px solid var(--b1);">
        <input v-model="qProd" class="cp-search" style="margin:0;flex:1;" placeholder="Buscar producto..." />
        <button class="cp-icon-btn" title="Actualizar" @click="cargarStock">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        </button>
      </div>

      <div class="cp-list">
        <div v-if="loadingStock" class="cp-loading"><div class="ct-spinner"></div></div>
        <div v-else-if="!productosFiltrados.length" class="cp-empty">
          {{ qProd ? 'Sin resultados' : 'Sin productos con stock' }}
        </div>
        <div
          v-else
          v-for="p in productosFiltrados"
          :key="p.productoId"
          :class="['inv-prod-row', selectedProd && selectedProd.productoId === p.productoId ? 'inv-prod-row--active' : '']"
          @click="seleccionarProducto(p)"
        >
          <div style="flex:1;min-width:0;">
            <div class="inv-prod-name">{{ p.nombre }}</div>
            <div style="font-size:10px;color:var(--t5);margin-top:2px;">
              {{ p.codigo || '' }}
              <span v-if="p.requiereLote" style="margin-left:4px;padding:0 4px;border-radius:3px;background:#6366f122;color:#818cf8;border:1px solid #6366f133;font-size:9px;">LOTES</span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div class="inv-stock-val" :class="p.stockTotal <= 0 ? 'inv-stock-val--zero' : ''">
              {{ formatCant(p.stockTotal) }}
            </div>
            <div style="font-size:9px;color:var(--t4);">{{ p.unidadNombre || 'und' }}</div>
          </div>
        </div>
      </div>

      <!-- Proximos a vencer -->
      <div v-if="vencimientos.length" style="padding:8px 10px;border-top:1px solid var(--b1);">
        <div style="font-size:10px;color:#f59e0b;font-weight:600;margin-bottom:6px;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ vencimientos.length }} lote(s) próximos a vencer
        </div>
        <div v-for="v in vencimientos.slice(0,3)" :key="v.loteId" style="font-size:10px;color:var(--t3);margin-bottom:3px;">
          · {{ v.productoNombre }} — {{ v.nroLote || '—' }} (vence {{ formatFecha(v.fechaVencimiento) }})
        </div>
      </div>
    </div>

    <!-- ── Panel derecho: Lotes del producto seleccionado ── -->
    <div class="inv-col inv-col--lots">
      <template v-if="!selectedProd">
        <div class="inv-empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--b3)" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <div style="margin-top:12px;color:var(--t5);font-size:13px;">Selecciona un producto</div>
          <div style="color:var(--b3);font-size:11px;margin-top:4px;">para ver sus lotes y movimientos</div>
        </div>
      </template>
      <template v-else>
        <!-- Header -->
        <div class="cp-col-header" style="border-radius:14px 14px 0 0;flex-wrap:wrap;gap:6px;">
          <div style="min-width:0;flex:1;">
            <div class="cp-col-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ selectedProd.nombre }}</div>
            <div style="font-size:10px;color:var(--t4);margin-top:1px;">
              Stock total: <strong style="color:#6366f1;">{{ formatCant(selectedProd.stockTotal) }} {{ selectedProd.unidadNombre || 'und' }}</strong>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button class="cp-add-btn" @click="abrirIngreso(selectedProd)">+ Ingresar</button>
            <button class="cp-icon-btn" title="Ver movimientos" @click="abrirMovimientos">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </button>
          </div>
        </div>

        <!-- Tabs: Lotes / Movimientos -->
        <div style="display:flex;border-bottom:1px solid var(--b1);">
          <button
            v-for="t in ['lotes','movimientos']"
            :key="t"
            :class="['inv-tab', detalleTab === t ? 'inv-tab--active' : '']"
            @click="detalleTab = t; t === 'movimientos' && cargarMovimientos()"
          >{{ t === 'lotes' ? 'Lotes' : 'Movimientos' }}</button>
        </div>

        <!-- Tab: Lotes -->
        <div v-if="detalleTab === 'lotes'" class="inv-detail-body">
          <div v-if="loadingLotes" class="cp-loading"><div class="ct-spinner"></div></div>
          <div v-else-if="!lotes.length" class="cp-empty">Sin lotes registrados</div>
          <div v-else v-for="lote in lotes" :key="lote.id" class="inv-lote-card">
            <div style="display:flex;align-items:flex-start;gap:8px;">
              <div :class="['inv-lote-badge', `inv-lote-badge--${lote.estadoLote.toLowerCase()}`]">{{ lote.estadoLote }}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:12px;font-weight:600;color:var(--t2);">
                  {{ lote.nroLote || lote.loteInterno }}
                  <span v-if="lote.nroSerie" style="font-size:10px;color:var(--t4);"> · S/N {{ lote.nroSerie }}</span>
                </div>
                <div style="font-size:10px;color:var(--t4);margin-top:2px;">
                  Ingreso: {{ formatFecha(lote.fechaIngreso) }}
                  <span v-if="lote.fechaVencimiento"> · Vence: <span :style="esProximoVencer(lote.fechaVencimiento) ? 'color:#f59e0b;font-weight:600;' : ''">{{ formatFecha(lote.fechaVencimiento) }}</span></span>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:14px;font-weight:700;color:#6366f1;">{{ formatCant(lote.cantidadActual) }}</div>
                <div style="font-size:9px;color:var(--t5);">de {{ formatCant(lote.cantidadInicial) }}</div>
              </div>
            </div>
            <div v-if="lote.proveedorId || lote.nroFacturaProveedor" style="font-size:10px;color:var(--t5);margin-top:4px;">
              <span v-if="lote.nroFacturaProveedor">Factura: {{ lote.nroFacturaProveedor }}</span>
            </div>
            <div style="display:flex;gap:4px;margin-top:6px;">
              <button
                v-if="lote.estadoLote === 'ACTIVO'"
                class="inv-lote-btn"
                @click="abrirMovimiento(lote)"
              >Registrar salida</button>
              <button
                v-if="lote.estadoLote === 'ACTIVO'"
                class="inv-lote-btn"
                @click="abrirTransferencia(lote)"
              >Transferir</button>
              <button
                v-if="lote.estadoLote === 'ACTIVO'"
                class="inv-lote-btn inv-lote-btn--warn"
                @click="cambiarEstadoLote(lote, 'CUARENTENA')"
              >Cuarentena</button>
              <button
                v-if="lote.estadoLote === 'CUARENTENA'"
                class="inv-lote-btn"
                @click="cambiarEstadoLote(lote, 'ACTIVO')"
              >Reactivar</button>
              <button
                v-if="['ACTIVO','CUARENTENA'].includes(lote.estadoLote)"
                class="inv-lote-btn inv-lote-btn--danger"
                @click="cambiarEstadoLote(lote, 'RETIRADO')"
              >Retirar</button>
              <button class="inv-lote-btn" @click="abrirTrazabilidad(lote)">Trazabilidad</button>
            </div>
          </div>
        </div>

        <!-- Tab: Movimientos -->
        <div v-if="detalleTab === 'movimientos'" class="inv-detail-body">
          <div v-if="loadingMovs" class="cp-loading"><div class="ct-spinner"></div></div>
          <div v-else-if="!movimientos.length" class="cp-empty">Sin movimientos</div>
          <div v-else v-for="m in movimientos" :key="m.id" class="inv-mov-row">
            <div :class="['inv-mov-tipo', tipoClass(m.tipo)]">{{ tipoLabel(m.tipo) }}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:11px;color:var(--scroll);">{{ m.motivo || m.referenciaDocumento || '—' }}</div>
              <div style="font-size:10px;color:var(--t5);margin-top:1px;">{{ formatFechaHora(m.fechaCreacion) }}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div :class="['inv-mov-cant', m.tipo.includes('SALIDA') || m.tipo === 'RETIRO' ? 'inv-mov-cant--neg' : 'inv-mov-cant--pos']">
                {{ m.tipo.includes('SALIDA') || m.tipo === 'RETIRO' || m.tipo === 'AJUSTE_NEGATIVO' ? '-' : '+' }}{{ formatCant(m.cantidad) }}
              </div>
              <div style="font-size:9px;color:var(--t5);">{{ formatCant(m.cantidadPosterior) }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ══ MODAL INGRESAR LOTE ══ -->
    <transition name="modal-fade">
      <div v-if="ingresoModal" class="ct-modal-backdrop" @click.self="ingresoModal = false">
        <div class="ct-modal" style="max-width:560px;">
          <div class="ct-modal-header">
            <span>Ingresar mercadería</span>
            <button class="ct-modal-close" @click="ingresoModal = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field ct-form-full" style="position:relative;">
                <label>Producto *</label>
                <input
                  v-model="ingresoForm._busqueda"
                  class="ide-input"
                  :class="{ 'inv-prod-ok': ingresoForm.productoId }"
                  placeholder="Buscar por nombre, código..."
                  autocomplete="off"
                  @input="onBusquedaIngreso"
                  @focus="ingresoForm._showDrop = !!ingresoForm._busqueda"
                  @blur="ocultarDropIngreso"
                />
                <div v-if="ingresoForm.productoId && (ingresoForm._categoriaNombre || ingresoForm._subcategoriaNombre)" class="inv-sel-cats">
                  <span class="inv-sel-breadcrumb">{{ [ingresoForm._categoriaNombre, ingresoForm._subcategoriaNombre].filter(Boolean).join(' ') }}</span>
                </div>
                <div v-if="ingresoForm._showDrop" class="inv-prod-drop">
                  <div v-if="!filtrarProductosAC(ingresoForm._busqueda).length" class="inv-drop-empty">Sin resultados</div>
                  <div
                    v-for="p in filtrarProductosAC(ingresoForm._busqueda)"
                    :key="p.id"
                    class="inv-drop-item"
                    @mousedown.prevent="elegirProducto(p)"
                  >
                    <div style="flex:1;min-width:0;">
                      <div class="inv-drop-nombre">{{ [p.categoriaNombre, p.subcategoriaNombre, p.nombre].filter(Boolean).join(' ') }}</div>
                    </div>
                    <span v-if="p.codigoBarras || p.codigoTienda" class="inv-drop-code">{{ p.codigoBarras || p.codigoTienda }}</span>
                  </div>
                </div>
              </div>
              <div class="ide-field ct-form-full">
                <label>Sucursal destino *</label>
                <select v-model="ingresoForm.sucursalId" class="ide-select">
                  <option value="">Seleccionar sucursal...</option>
                  <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Cantidad *</label>
                <input v-model.number="ingresoForm.cantidad" class="ide-input" type="number" min="0.0001" step="0.001" placeholder="0.00" />
              </div>
              <div class="ide-field">
                <label>Nro. de Lote</label>
                <input v-model="ingresoForm.nroLote" class="ide-input" placeholder="Ej: LOT-2024-001" />
              </div>
              <div class="ide-field">
                <label>Nro. de Serie</label>
                <input v-model="ingresoForm.nroSerie" class="ide-input" placeholder="Opcional" />
              </div>
              <div class="ide-field">
                <label>Fecha de vencimiento</label>
                <input v-model="ingresoForm.fechaVencimiento" class="ide-input" type="date" />
              </div>
              <div class="ide-field">
                <label>Fecha de fabricación</label>
                <input v-model="ingresoForm.fechaFabricacion" class="ide-input" type="date" />
              </div>
              <div class="ide-field">
                <label>Nro. Factura Proveedor</label>
                <input v-model="ingresoForm.nroFacturaProveedor" class="ide-input" placeholder="Opcional" />
              </div>
              <div class="ide-field">
                <label>Nro. Pedido / OC</label>
                <input v-model="ingresoForm.nroPedidoCompra" class="ide-input" placeholder="Opcional" />
              </div>
              <div class="ide-field">
                <label>País de origen</label>
                <input v-model="ingresoForm.paisOrigen" class="ide-input" placeholder="Opcional" />
              </div>
              <div class="ide-field ct-form-full">
                <label>Notas</label>
                <textarea v-model="ingresoForm.notas" class="ide-textarea" rows="2" placeholder="Observaciones del ingreso..."></textarea>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="ingresoModal = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardarIngreso">{{ saving ? 'Guardando...' : 'Registrar Ingreso' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL SALIDA / AJUSTE ══ -->
    <transition name="modal-fade">
      <div v-if="movModal" class="ct-modal-backdrop" @click.self="movModal = false">
        <div class="ct-modal" style="max-width:420px;">
          <div class="ct-modal-header">
            <span>Registrar movimiento</span>
            <button class="ct-modal-close" @click="movModal = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field ct-form-full">
                <label>Lote: <strong style="color:#6366f1;">{{ movForm.loteInterno || movForm.nroLote }}</strong></label>
                <label>Stock disponible: <strong>{{ formatCant(movForm.stockDisponible) }}</strong></label>
              </div>
              <div class="ide-field ct-form-full">
                <label>Tipo *</label>
                <select v-model="movForm.tipo" class="ide-select">
                  <option value="SALIDA">SALIDA — despacho/venta</option>
                  <option value="AJUSTE_POSITIVO">AJUSTE POSITIVO</option>
                  <option value="AJUSTE_NEGATIVO">AJUSTE NEGATIVO</option>
                  <option value="RETIRO">RETIRO — retirar del inventario</option>
                  <option value="DEVOLUCION_PROVEEDOR">DEVOLUCIÓN A PROVEEDOR</option>
                  <option value="DEVOLUCION_CLIENTE">DEVOLUCIÓN DE CLIENTE</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Cantidad *</label>
                <input v-model.number="movForm.cantidad" class="ide-input" type="number" min="0.0001" step="0.001" placeholder="0.00" />
              </div>
              <div class="ide-field ct-form-full">
                <label>Motivo / Referencia</label>
                <input v-model="movForm.motivo" class="ide-input" placeholder="Motivo del movimiento..." />
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="movModal = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardarMovimiento">{{ saving ? 'Guardando...' : 'Registrar' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL TRANSFERENCIA ══ -->
    <transition name="modal-fade">
      <div v-if="transModal" class="ct-modal-backdrop" @click.self="transModal = false">
        <div class="ct-modal" style="max-width:420px;">
          <div class="ct-modal-header">
            <span>Transferir stock</span>
            <button class="ct-modal-close" @click="transModal = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field ct-form-full">
                <label>Lote: <strong style="color:#6366f1;">{{ transForm.loteInterno || transForm.nroLote }}</strong></label>
                <label>Stock disponible: <strong>{{ formatCant(transForm.stockDisponible) }}</strong></label>
              </div>
              <div class="ide-field ct-form-full">
                <label>Sucursal destino *</label>
                <select v-model="transForm.sucursalDestinoId" class="ide-select">
                  <option value="">Seleccionar...</option>
                  <option v-for="s in sucursalesDestino" :key="s.id" :value="s.id">{{ s.nombre }}</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Cantidad *</label>
                <input v-model.number="transForm.cantidad" class="ide-input" type="number" min="0.0001" step="0.001" placeholder="0.00" />
              </div>
              <div class="ide-field ct-form-full">
                <label>Motivo</label>
                <input v-model="transForm.motivo" class="ide-input" placeholder="Motivo de la transferencia..." />
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="transModal = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardarTransferencia">{{ saving ? 'Guardando...' : 'Transferir' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL TRAZABILIDAD ══ -->
    <transition name="modal-fade">
      <div v-if="trazModal" class="ct-modal-backdrop" @click.self="trazModal = false">
        <div class="ct-modal" style="max-width:600px;">
          <div class="ct-modal-header">
            <span>Trazabilidad del Lote</span>
            <button class="ct-modal-close" @click="trazModal = false">✕</button>
          </div>
          <div class="ct-modal-body" style="padding:0;">
            <div v-if="loadingTraz" class="cp-loading" style="padding:30px;"><div class="ct-spinner"></div></div>
            <div v-else-if="trazabilidad">
              <!-- Info del lote -->
              <div style="padding:14px 16px;border-bottom:1px solid var(--b1);">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <div><div style="font-size:9px;color:var(--t4);">Lote interno</div><div style="font-size:12px;color:var(--t2);">{{ trazabilidad.lote.loteInterno }}</div></div>
                  <div v-if="trazabilidad.lote.nroLote"><div style="font-size:9px;color:var(--t4);">Nro. Lote</div><div style="font-size:12px;color:var(--t2);">{{ trazabilidad.lote.nroLote }}</div></div>
                  <div><div style="font-size:9px;color:var(--t4);">Cant. Inicial</div><div style="font-size:12px;color:#6366f1;font-weight:700;">{{ formatCant(trazabilidad.lote.cantidadInicial) }}</div></div>
                  <div><div style="font-size:9px;color:var(--t4);">Cant. Actual</div><div style="font-size:12px;color:#6366f1;font-weight:700;">{{ formatCant(trazabilidad.lote.cantidadActual) }}</div></div>
                  <div v-if="trazabilidad.lote.fechaVencimiento"><div style="font-size:9px;color:var(--t4);">Vencimiento</div><div style="font-size:12px;color:#f59e0b;">{{ formatFecha(trazabilidad.lote.fechaVencimiento) }}</div></div>
                  <div v-if="trazabilidad.lote.nroFacturaProveedor"><div style="font-size:9px;color:var(--t4);">Factura proveedor</div><div style="font-size:12px;color:var(--t2);">{{ trazabilidad.lote.nroFacturaProveedor }}</div></div>
                </div>
              </div>
              <!-- Línea de tiempo -->
              <div style="padding:10px 16px;">
                <div style="font-size:10px;color:var(--t4);font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;">Historial de movimientos ({{ trazabilidad.movimientos.length }})</div>
                <div v-for="(m, i) in trazabilidad.movimientos" :key="m.id" style="display:flex;gap:10px;margin-bottom:8px;">
                  <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
                    <div :class="['inv-traz-dot', tipoClass(m.tipo)]"></div>
                    <div v-if="i < trazabilidad.movimientos.length-1" style="width:1px;flex:1;background:var(--b0);margin:2px 0;"></div>
                  </div>
                  <div style="flex:1;padding-bottom:4px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span :class="['inv-mov-tipo', tipoClass(m.tipo)]" style="font-size:9px;">{{ tipoLabel(m.tipo) }}</span>
                      <span style="font-size:11px;font-weight:700;" :class="m.tipo.includes('SALIDA') || m.tipo==='RETIRO' ? 'inv-mov-cant--neg' : 'inv-mov-cant--pos'">
                        {{ m.tipo.includes('SALIDA') || m.tipo === 'RETIRO' || m.tipo === 'AJUSTE_NEGATIVO' ? '-' : '+' }}{{ formatCant(m.cantidad) }}
                      </span>
                    </div>
                    <div style="font-size:10px;color:var(--t5);margin-top:1px;">{{ formatFechaHora(m.fechaCreacion) }}{{ m.motivo ? ' — ' + m.motivo : '' }}</div>
                    <div style="font-size:9px;color:var(--b3);margin-top:1px;">Anterior: {{ formatCant(m.cantidadAnterior) }} → Posterior: {{ formatCant(m.cantidadPosterior) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
const emptyIngreso = () => ({
  productoId: '', _busqueda: '', _showDrop: false, _categoriaNombre: '', _subcategoriaNombre: '', _categoriaColor: '#6366f1',
  sucursalId: '', cantidad: null,
  nroLote: '', nroSerie: '', fechaVencimiento: '', fechaFabricacion: '',
  nroFacturaProveedor: '', nroPedidoCompra: '', paisOrigen: '', notas: '',
})

export default {
  name: 'Inventario',
  data: () => ({
    // stock
    stock: [], loadingStock: false, qProd: '',
    todosProductos: [], subcategorias: [], categorias: [],
    vencimientos: [],
    // lotes detalle
    selectedProd: null,
    lotes: [], loadingLotes: false,
    detalleTab: 'lotes',
    // movimientos
    movimientos: [], loadingMovs: false,
    // trazabilidad
    trazModal: false, loadingTraz: false, trazabilidad: null,
    // modals
    ingresoModal: false, ingresoForm: emptyIngreso(),
    movModal: false, movForm: {},
    transModal: false, transForm: {},
    saving: false,
  }),
  computed: {
    sucursales() { return this.$store.getters.sucursales },
    sucursalActualId() { return this.$store.getters.sucursalActualId },
    productosFiltrados() {
      const q = this.qProd.toLowerCase()
      return this.stock.filter(p => !q || p.nombre.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q))
    },
    sucursalesDestino() {
      if (!this.transForm.sucursalOrigenId) return this.sucursales
      return this.sucursales.filter(s => s.id !== this.transForm.sucursalOrigenId)
    },
  },
  mounted() {
    this.cargarStock()
    this.cargarTodosProductos()
    this.cargarVencimientos()
  },
  watch: {
    sucursalActualId() {
      this.selectedProd = null
      this.lotes = []
      this.movimientos = []
      this.cargarStock()
      this.cargarVencimientos()
    },
  },
  methods: {
    async cargarStock() {
      this.loadingStock = true
      try {
        const params = this.sucursalActualId ? `?sucursalId=${this.sucursalActualId}` : ''
        this.stock = await this.$service.list(`lotes/stock${params}`) || []
      } finally { this.loadingStock = false }
    },
    async cargarTodosProductos() {
      try {
        const [p, subs, cats] = await Promise.all([
          this.$service.list('productos?soloActivos=true'),
          this.$service.list('subcategorias-producto?soloActivos=true').catch(() => []),
          this.$service.list('categorias-producto?soloActivos=true').catch(() => []),
        ])
        this.subcategorias = subs || []
        this.categorias = cats || []
        const subMap = new Map((subs || []).map(s => [s.id, s]))
        const catMap = new Map((cats || []).map(c => [c.id, c]))
        this.todosProductos = (p || []).map(prod => {
          const sub = subMap.get(prod.subcategoriaId)
          const cat = sub ? catMap.get(sub.categoriaId) : null
          return { ...prod, subcategoriaNombre: sub?.nombre || '', categoriaNombre: cat?.nombre || '', categoriaColor: cat?.color || '#6366f1' }
        })
      } catch { /**/ }
    },
    async cargarVencimientos() {
      try {
        const params = this.sucursalActualId ? `?sucursalId=${this.sucursalActualId}` : ''
        this.vencimientos = await this.$service.list(`lotes/proximos-vencer${params}`) || []
      } catch { /**/ }
    },
    async seleccionarProducto(prod) {
      this.selectedProd = prod
      this.detalleTab = 'lotes'
      this.movimientos = []
      await this.cargarLotes()
    },
    async cargarLotes() {
      if (!this.selectedProd) return
      this.loadingLotes = true
      try {
        let url = `lotes/por-producto?productoId=${this.selectedProd.productoId}`
        if (this.sucursalActualId) url += `&sucursalId=${this.sucursalActualId}`
        this.lotes = await this.$service.list(url) || []
      } finally { this.loadingLotes = false }
    },
    async cargarMovimientos() {
      if (!this.selectedProd) return
      this.loadingMovs = true
      try {
        let url = `movimientos-stock?productoId=${this.selectedProd.productoId}`
        if (this.sucursalActualId) url += `&sucursalId=${this.sucursalActualId}`
        this.movimientos = await this.$service.list(url) || []
      } finally { this.loadingMovs = false }
    },

    // ── Ingreso ──
    abrirIngreso(prod = null) {
      this.ingresoForm = emptyIngreso()
      if (prod) {
        const p = this.todosProductos.find(p => p.id === prod.productoId) || {}
        this.ingresoForm.productoId = prod.productoId
        this.ingresoForm._busqueda = p.nombre || prod.nombre || ''
        this.ingresoForm._categoriaNombre = p.categoriaNombre || ''
        this.ingresoForm._subcategoriaNombre = p.subcategoriaNombre || ''
        this.ingresoForm._categoriaColor = p.categoriaColor || '#6366f1'
      }
      if (this.sucursalActualId) this.ingresoForm.sucursalId = this.sucursalActualId
      this.ingresoModal = true
    },
    filtrarProductosAC(q) {
      if (!q || !q.trim()) return []
      const t = q.toLowerCase()
      const res = []
      for (const p of this.todosProductos) {
        if (
          p.nombre.toLowerCase().includes(t) ||
          (p.codigoBarras && p.codigoBarras.toLowerCase().includes(t)) ||
          (p.codigoTienda && p.codigoTienda.toLowerCase().includes(t)) ||
          (p.codigoProveedor && p.codigoProveedor.toLowerCase().includes(t)) ||
          (p.subcategoriaNombre && p.subcategoriaNombre.toLowerCase().includes(t)) ||
          (p.categoriaNombre && p.categoriaNombre.toLowerCase().includes(t))
        ) { res.push(p); if (res.length >= 20) break }
      }
      return res
    },
    elegirProducto(p) {
      this.ingresoForm.productoId = p.id
      this.ingresoForm._busqueda = p.nombre
      this.ingresoForm._showDrop = false
      this.ingresoForm._categoriaNombre = p.categoriaNombre || ''
      this.ingresoForm._subcategoriaNombre = p.subcategoriaNombre || ''
      this.ingresoForm._categoriaColor = p.categoriaColor || '#6366f1'
    },
    onBusquedaIngreso() {
      this.ingresoForm._showDrop = true
      if (!this.ingresoForm._busqueda) {
        this.ingresoForm.productoId = ''
        this.ingresoForm._categoriaNombre = ''
        this.ingresoForm._subcategoriaNombre = ''
      }
    },
    ocultarDropIngreso() { setTimeout(() => { this.ingresoForm._showDrop = false }, 150) },

    async guardarIngreso() {
      if (!this.ingresoForm.productoId) return this.$message.error('Selecciona un producto')
      if (!this.ingresoForm.sucursalId) return this.$message.error('Selecciona una sucursal')
      if (!this.ingresoForm.cantidad || this.ingresoForm.cantidad <= 0) return this.$message.error('Ingresa una cantidad válida')
      this.saving = true
      try {
        const payload = { ...this.ingresoForm }
        Object.keys(payload).forEach(k => { if (k.startsWith('_') || payload[k] === '' || payload[k] === null) delete payload[k] })
        await this.$service.post('lotes/ingresar', payload)
        this.$message.success('Ingreso registrado')
        this.ingresoModal = false
        await this.cargarStock()
        if (this.selectedProd && this.selectedProd.productoId === this.ingresoForm.productoId) {
          await this.cargarLotes()
        }
        await this.cargarVencimientos()
      } finally { this.saving = false }
    },

    // ── Movimiento (salida/ajuste) ──
    abrirMovimientos() {
      this.detalleTab = 'movimientos'
      this.cargarMovimientos()
    },
    abrirMovimiento(lote) {
      this.movForm = { loteId: lote.id, loteInterno: lote.loteInterno, nroLote: lote.nroLote, sucursalId: lote.sucursalId, tipo: 'SALIDA', cantidad: null, motivo: '', stockDisponible: lote.cantidadActual }
      this.movModal = true
    },
    async guardarMovimiento() {
      if (!this.movForm.cantidad || this.movForm.cantidad <= 0) return this.$message.error('Ingresa una cantidad válida')
      this.saving = true
      try {
        await this.$service.post('movimientos-stock', {
          loteId: this.movForm.loteId,
          sucursalId: this.movForm.sucursalId,
          tipo: this.movForm.tipo,
          cantidad: this.movForm.cantidad,
          motivo: this.movForm.motivo || undefined,
        })
        this.$message.success('Movimiento registrado')
        this.movModal = false
        await this.cargarStock()
        await this.cargarLotes()
      } finally { this.saving = false }
    },

    // ── Transferencia ──
    abrirTransferencia(lote) {
      this.transForm = { loteId: lote.id, loteInterno: lote.loteInterno, nroLote: lote.nroLote, sucursalOrigenId: lote.sucursalId, sucursalDestinoId: '', cantidad: null, motivo: '', stockDisponible: lote.cantidadActual }
      this.transModal = true
    },
    async guardarTransferencia() {
      if (!this.transForm.sucursalDestinoId) return this.$message.error('Selecciona la sucursal destino')
      if (!this.transForm.cantidad || this.transForm.cantidad <= 0) return this.$message.error('Ingresa una cantidad válida')
      this.saving = true
      try {
        await this.$service.post('movimientos-stock/transferir', {
          loteId: this.transForm.loteId,
          sucursalOrigenId: this.transForm.sucursalOrigenId,
          sucursalDestinoId: this.transForm.sucursalDestinoId,
          cantidad: this.transForm.cantidad,
          motivo: this.transForm.motivo || undefined,
        })
        this.$message.success('Transferencia registrada')
        this.transModal = false
        await this.cargarStock()
        await this.cargarLotes()
      } finally { this.saving = false }
    },

    // ── Estado lote ──
    cambiarEstadoLote(lote, estado) {
      const msg = estado === 'RETIRADO' ? `¿Retirar el lote "${lote.loteInterno}"? Esta acción lo dejará fuera del inventario.`
        : estado === 'CUARENTENA' ? `¿Poner en cuarentena el lote "${lote.loteInterno}"?`
        : `¿Reactivar el lote "${lote.loteInterno}"?`
      this.$confirm(msg, async () => {
        try {
          await this.$service.put(`lotes/${lote.id}/estado`, { estadoLote: estado })
          this.$message.success('Estado actualizado')
          await this.cargarLotes()
          await this.cargarStock()
        } catch (e) {
          this.$message.error(e?.message || 'Error al cambiar estado')
        }
      })
    },

    // ── Trazabilidad ──
    async abrirTrazabilidad(lote) {
      this.trazabilidad = null
      this.trazModal = true
      this.loadingTraz = true
      try {
        this.trazabilidad = await this.$service.get(`lotes/${lote.id}/trazabilidad`)
      } finally { this.loadingTraz = false }
    },

    // ── Helpers ──
    formatCant(v) {
      if (v === null || v === undefined) return '0'
      const n = parseFloat(v)
      return n % 1 === 0 ? n.toLocaleString('es-BO') : n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    },
    formatFecha(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    formatFechaHora(d) {
      if (!d) return ''
      return new Date(d).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    esProximoVencer(fecha) {
      if (!fecha) return false
      const diff = (new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 30
    },
    tipoLabel(tipo) {
      const map = {
        INGRESO: 'INGRESO', SALIDA: 'SALIDA', AJUSTE_POSITIVO: 'AJUSTE +', AJUSTE_NEGATIVO: 'AJUSTE −',
        TRANSFERENCIA_SALIDA: 'TRANSF. SALIDA', TRANSFERENCIA_ENTRADA: 'TRANSF. ENTRADA',
        RETIRO: 'RETIRO', DEVOLUCION_PROVEEDOR: 'DEV. PROVEEDOR', DEVOLUCION_CLIENTE: 'DEV. CLIENTE',
      }
      return map[tipo] || tipo
    },
    tipoClass(tipo) {
      if (tipo === 'INGRESO' || tipo === 'AJUSTE_POSITIVO' || tipo === 'DEVOLUCION_CLIENTE' || tipo === 'TRANSFERENCIA_ENTRADA') return 'inv-mov-tipo--in'
      if (tipo === 'SALIDA' || tipo === 'AJUSTE_NEGATIVO' || tipo === 'DEVOLUCION_PROVEEDOR' || tipo === 'RETIRO') return 'inv-mov-tipo--out'
      return 'inv-mov-tipo--trans'
    },
  },
}
</script>

<style scoped>
.inv-root {
  display: flex;
  height: 100%;
  gap: 14px;
  overflow: hidden;
}

/* Columns */
.inv-col {
  display: flex;
  flex-direction: column;
  background: var(--bg-s);
  border: 1px solid var(--b1);
  border-radius: 14px;
  overflow: hidden;
}
.inv-col--products { width: 340px; flex-shrink: 0; }
.inv-col--lots { flex: 1; min-width: 0; }

/* Product rows */
.inv-prod-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #0d1a2d;
  transition: background .15s;
}
.inv-prod-row:hover { background: var(--bg-n); }
.inv-prod-row--active { background: var(--b2); border-left: 2px solid #6366f1; }
.inv-prod-name { font-size: 12px; font-weight: 600; color: var(--t2); }
.inv-stock-val { font-size: 15px; font-weight: 700; color: #6366f1; }
.inv-stock-val--zero { color: var(--t5); }

/* Detail tabs */
.inv-tab {
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--t5);
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color .15s, border-color .15s;
}
.inv-tab--active { color: #818cf8; border-bottom-color: #6366f1; }
.inv-tab:hover:not(.inv-tab--active) { color: var(--t3); }

.inv-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Lot cards */
.inv-lote-card {
  background: var(--bg-n);
  border: 1px solid var(--b1);
  border-radius: 10px;
  padding: 10px 12px;
}
.inv-lote-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  flex-shrink: 0;
}
.inv-lote-badge--activo    { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e44; }
.inv-lote-badge--agotado   { background: var(--b2); color: var(--t4); border: 1px solid var(--b1); }
.inv-lote-badge--vencido   { background: #ef444422; color: #f87171; border: 1px solid #ef444444; }
.inv-lote-badge--cuarentena{ background: #f59e0b22; color: #fbbf24; border: 1px solid #f59e0b44; }
.inv-lote-badge--retirado  { background: #6366f122; color: #818cf8; border: 1px solid #6366f144; }

.inv-lote-btn {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--b1);
  color: var(--t3);
  border: 1px solid var(--b0);
  cursor: pointer;
  transition: background .15s;
}
.inv-lote-btn:hover { background: var(--b4); color: var(--t2); }
.inv-lote-btn--warn { color: #fbbf24; border-color: #f59e0b44; }
.inv-lote-btn--danger { color: #f87171; border-color: #ef444444; }

/* Movement rows */
.inv-mov-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #0d1a2d;
}
.inv-mov-tipo {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}
.inv-mov-tipo--in    { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e44; }
.inv-mov-tipo--out   { background: #ef444422; color: #f87171; border: 1px solid #ef444444; }
.inv-mov-tipo--trans { background: #6366f122; color: #818cf8; border: 1px solid #6366f144; }
.inv-mov-cant { font-size: 12px; font-weight: 700; }
.inv-mov-cant--pos { color: #4ade80; }
.inv-mov-cant--neg { color: #f87171; }

/* Trazabilidad */
.inv-traz-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.inv-traz-dot.inv-mov-tipo--in    { background: #4ade80; }
.inv-traz-dot.inv-mov-tipo--out   { background: #f87171; }
.inv-traz-dot.inv-mov-tipo--trans { background: #818cf8; }

/* Empty state */
.inv-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px;
}

/* ── Reuse from CatalogoProductos ── */
.cp-col-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-n);
  border-bottom: 1px solid var(--b1);
}
.cp-col-title { font-size: 13px; font-weight: 700; color: var(--t2); }
.cp-col-count  { font-size: 10px; color: var(--t5); margin-top: 1px; }
.cp-add-btn {
  font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 8px;
  background: #6366f1; color: #fff; border: none; cursor: pointer; white-space: nowrap;
}
.cp-add-btn:hover { background: #4f46e5; }
.cp-search {
  width: 100%; padding: 8px 12px; font-size: 12px;
  background: var(--bg); border: none; border-bottom: 1px solid var(--b1);
  color: var(--t2); outline: none; box-sizing: border-box;
}
.cp-search::placeholder { color: var(--b3); }
.cp-list { flex: 1; overflow-y: auto; }
.cp-loading { display:flex; align-items:center; justify-content:center; padding:30px; }
.cp-empty { padding:20px; text-align:center; color:var(--b3); font-size:12px; }
.cp-icon-btn {
  padding:5px; border-radius:6px; background:var(--b1); border:1px solid var(--b0);
  color:var(--t4); cursor:pointer; display:inline-flex; align-items:center; justify-content:center;
}
.cp-icon-btn:hover { background:var(--b4); color:var(--t3); }

/* Modal reutilizado de CatalogoProductos */
.ct-modal-backdrop {
  position: fixed; inset: 0; background: #00000099;
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.ct-modal {
  background: var(--bg-s); border: 1px solid var(--b4); border-radius: 16px;
  width: 90%; max-height: 88vh; display: flex; flex-direction: column;
  box-shadow: 0 20px 60px #00000088;
}
.ct-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--b1);
  font-size: 14px; font-weight: 700; color: var(--t2);
}
.ct-modal-close { background:none; border:none; color:var(--t5); cursor:pointer; font-size:14px; }
.ct-modal-close:hover { color:var(--t2); }
.ct-modal-body { flex:1; overflow-y:auto; padding:14px 16px; }
.ct-modal-footer {
  display:flex; gap:8px; justify-content:flex-end;
  padding:12px 16px; border-top:1px solid var(--b1);
}
.ct-btn-cancel { padding:8px 16px; border-radius:8px; background:var(--b1); color:var(--t4); border:1px solid var(--b0); cursor:pointer; font-size:12px; }
.ct-btn-cancel:hover { color:var(--t3); }
.ct-btn-ok { padding:8px 18px; border-radius:8px; background:#6366f1; color:#fff; border:none; cursor:pointer; font-size:12px; font-weight:600; }
.ct-btn-ok:disabled { opacity:.5; cursor:not-allowed; }
.ct-btn-ok:hover:not(:disabled) { background:#4f46e5; }
.ct-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.ct-form-full { grid-column:1/-1; }
.ide-field { display:flex; flex-direction:column; gap:4px; }
.ide-field label { font-size:10px; color:var(--t4); font-weight:600; }
.ide-input {
  padding:7px 10px; border-radius:8px; border:1px solid var(--b0); background:var(--bg);
  color:var(--t2); font-size:12px; outline:none; transition:border-color .15s;
}
.ide-input:focus { border-color:#6366f1; }
.ide-select {
  padding:7px 10px; border-radius:8px; border:1px solid var(--b0); background:var(--bg);
  color:var(--t2); font-size:12px; outline:none;
}
.ide-textarea {
  padding:7px 10px; border-radius:8px; border:1px solid var(--b0); background:var(--bg);
  color:var(--t2); font-size:12px; outline:none; resize:vertical;
}
.ct-spinner {
  width:22px; height:22px; border-radius:50%;
  border:2px solid var(--b0); border-top-color:#6366f1; animation:spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.inv-prod-ok { border-color:#6366f144 !important; }
.inv-sel-cats { margin-top:3px; padding:0 2px; }
.inv-sel-breadcrumb { font-size:10px; color:var(--t5); }
.inv-prod-drop { position:absolute; top:100%; left:0; right:0; z-index:300; background:var(--bg-e); border:1px solid var(--b4); border-radius:8px; max-height:260px; overflow-y:auto; box-shadow:0 8px 24px #00000066; margin-top:2px; }
.inv-drop-item { display:flex; align-items:center; gap:8px; padding:7px 10px; cursor:pointer; }
.inv-drop-item:hover { background:var(--bg-c); }
.inv-drop-nombre { font-size:12px; font-weight:600; color:var(--t2); overflow:hidden; text-overflow:ellipsis; }
.inv-drop-code { font-size:10px; color:var(--t5); font-family:monospace; flex-shrink:0; padding-top:1px; }
.inv-drop-empty { padding:10px; font-size:11px; color:var(--b3); font-style:italic; text-align:center; }
.modal-fade-enter-active, .modal-fade-leave-active { transition:opacity .2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity:0; }
</style>
