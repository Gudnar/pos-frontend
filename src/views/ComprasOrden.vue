<template>
  <div class="cp-root">
    <div class="cp-layout">

      <!-- Panel izquierdo -->
      <div class="cp-panel">
        <div class="cp-col-header">
          <div>
            <div class="cp-col-title">Órdenes de Compra</div>
            <div class="cp-col-count">{{ filtrados.length }} registros</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="cp-export-btn" title="Exportar Excel" @click="exportarExcel">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Excel
            </button>
            <button class="cp-add-btn" @click="abrirForm()">+ Nueva</button>
          </div>
        </div>

        <div class="cp-tabs">
          <button v-for="tab in tabs" :key="tab.v" class="cp-tab" :class="{ active: filtroEstado === tab.v }" @click="filtroEstado = tab.v">
            {{ tab.l }}
          </button>
        </div>

        <input v-model="q" class="cp-search" placeholder="Buscar por Nro o proveedor..." />

        <div class="cp-list">
          <div v-if="loading" class="cp-loading"><div class="ct-spinner"></div></div>
          <div v-else-if="!filtrados.length" class="cp-empty">Sin órdenes</div>
          <div v-else v-for="c in filtrados" :key="c.id" class="cp-row" @click="verDetalle(c)">
            <div style="flex:1;min-width:0;">
              <div class="cp-row-title">{{ c.nroCompra }}</div>
              <div class="cp-row-sub">{{ c.fecha }} · {{ nombreProveedor(c.proveedorId) }}</div>
            </div>
            <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
              <div style="text-align:right;">
                <div class="cp-row-monto">Bs {{ formatMonto(c.total) }}</div>
                <span :class="badgeClass(c.estadoCompra)" style="font-size:9px;margin-top:3px;display:inline-block;">{{ labelEstado(c.estadoCompra) }}</span>
              </div>
              <!-- Edit: EN_TRANSITO or PENDIENTE -->
              <button v-if="c.estadoCompra === 'EN_TRANSITO' || c.estadoCompra === 'PENDIENTE'" class="cp-icon-btn" title="Editar" @click.stop="abrirEditar(c)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <!-- Transition buttons -->
              <button v-if="c.estadoCompra === 'EN_TRANSITO'" class="cp-action-btn cp-action--transit" :disabled="accionando === c.id" title="Marcar recibida en almacén" @click.stop="abrirRecibir(c)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button v-if="c.estadoCompra === 'PENDIENTE'" class="cp-action-btn cp-action--finalizar" :disabled="accionando === c.id" title="Finalizar y cargar inventario" @click.stop="abrirFinalizar(c)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <!-- Anular: solo EN_TRANSITO o PENDIENTE -->
              <button v-if="c.estadoCompra === 'EN_TRANSITO' || c.estadoCompra === 'PENDIENTE'" class="cp-action-btn cp-action--anular" :disabled="accionando === c.id" title="Anular orden" @click.stop="anularOrden(c)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════ MODAL: NUEVA / EDITAR ORDEN ═══════════════════════ -->
      <transition name="modal-fade">
        <div v-if="dialog" class="ct-modal-backdrop" @click.self="dialog = false">
          <div class="ct-modal ct-modal--xl">
            <div class="ct-modal-header">
              <span>{{ editandoId ? 'Editar Orden — ' + (ordenActiva && ordenActiva.nroCompra) : 'Nueva Orden de Compra' }}</span>
              <button class="ct-modal-close" @click="dialog = false">✕</button>
            </div>
            <div class="ct-modal-body">
              <div class="ct-form-grid" style="margin-bottom:4px;">
                <div class="ide-field">
                  <label>Proveedor *</label>
                  <select v-model="form.proveedorId" class="ide-select">
                    <option value="">Seleccionar...</option>
                    <option v-for="p in proveedores" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                  </select>
                </div>
                <div class="ide-field">
                  <label>Sucursal *</label>
                  <select v-model="form.sucursalId" class="ide-select">
                    <option value="">Seleccionar...</option>
                    <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
                  </select>
                </div>
                <div class="ide-field">
                  <label>Fecha Orden *</label>
                  <input v-model="form.fecha" class="ide-input" type="date" />
                </div>
                <div class="ide-field">
                  <label>Nro Factura / Ref.</label>
                  <input v-model="form.nroFactura" class="ide-input" placeholder="FAC-001" />
                </div>
                <div class="ide-field">
                  <label>Moneda *</label>
                  <select v-model="form.moneda" class="ide-select">
                    <option v-for="m in monedas" :key="m.id" :value="m.codigo">{{ m.codigo }} — {{ m.nombre }}</option>
                  </select>
                </div>
              </div>
              <div class="cp-section-label">Tránsito y Logística</div>
              <div class="ct-form-grid" style="margin-bottom:4px;">
                <div class="ide-field">
                  <label>Fecha de Envío</label>
                  <input v-model="form.fechaEnvio" class="ide-input" type="date" />
                </div>
                <div class="ide-field">
                  <label>Fecha Est. de Llegada</label>
                  <input v-model="form.fechaEstimadaLlegada" class="ide-input" type="date" />
                </div>
                <div class="ide-field">
                  <label>Nro. Guía / Remisión</label>
                  <input v-model="form.nroGuiaRemision" class="ide-input" placeholder="GR-001" />
                </div>
                <div class="ide-field">
                  <label>Transportista</label>
                  <input v-model="form.transportista" class="ide-input" placeholder="Nombre empresa o persona" />
                </div>
                <div class="ide-field ct-form-full">
                  <label>Observaciones</label>
                  <input v-model="form.observaciones" class="ide-input" placeholder="Notas opcionales..." />
                </div>
              </div>
              <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <span class="cp-section-label" style="margin:0;">Detalle de Productos</span>
              </div>
              <div class="cp-search-wrap" style="position:relative;margin-bottom:10px;">
                <input
                  ref="inputAdd"
                  v-model="busquedaAdd"
                  class="ide-input"
                  placeholder="Buscar producto por nombre, categoría o código..."
                  autocomplete="off"
                  @input="onInputSearch"
                  @keydown="onKeydownSearch"
                  @blur="ocultarDropAdd"
                />
                <div v-if="dropAddVisible && filtrarProductosAdd.length" ref="dropAdd" class="cp-prod-drop" style="position:absolute;top:100%;left:0;right:0;z-index:200;">
                  <div
                    v-for="(p, idx) in filtrarProductosAdd"
                    :key="p.id"
                    class="cp-drop-item"
                    :class="{ 'cp-drop-item--active': idx === dropAddIdx }"
                    @mousedown.prevent="agregarDesdeSearch(p)"
                  >
                    <div style="flex:1;min-width:0;">
                      <div class="cp-drop-nombre">{{ [p.categoriaNombre, p.subcategoriaNombre, p.nombre].filter(Boolean).join(' › ') }}</div>
                    </div>
                    <span v-if="p.codigoBarras || p.codigoTienda" class="cp-drop-code">{{ p.codigoBarras || p.codigoTienda }}</span>
                  </div>
                </div>
              </div>
              <div class="cp-table-wrap">
                <table class="cp-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style="width:120px;">Unidad</th>
                      <th style="width:90px;">Cantidad</th>
                      <th style="width:120px;">Total Compra</th>
                      <th style="width:110px;">P. Unitario</th>
                      <th style="width:90px;">Desc.</th>
                      <th style="width:110px;">Subtotal</th>
                      <th style="width:28px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!form.detalles.length">
                      <td colspan="8" style="text-align:center;color:var(--b3);font-style:italic;padding:16px;">Busca y selecciona productos desde el campo de arriba</td>
                    </tr>
                    <tr v-for="(d, idx) in form.detalles" :key="idx">
                      <td style="min-width:200px;">
                        <span class="cp-prod-path">{{ d._busqueda || '—' }}</span>
                      </td>
                      <td><select v-model="d.unidadId" class="ide-select"><option value="">Base</option><option v-for="u in unidades" :key="u.id" :value="u.id">{{ u.nombre }}</option></select></td>
                      <td><input v-model.number="d.cantidad" class="ide-input" type="number" min="0.001" step="1" /></td>
                      <td><input v-model.number="d.totalCompra" class="ide-input" type="number" min="0" step="0.01" placeholder="0.00" /></td>
                      <td style="text-align:right;color:var(--t3);padding:6px 12px;font-size:12px;">
                        {{ d.cantidad > 0 && d.totalCompra > 0 ? formatPU(d.totalCompra / d.cantidad) : '—' }}
                      </td>
                      <td><input v-model.number="d.descuento" class="ide-input" type="number" min="0" step="0.01" /></td>
                      <td style="font-size:12px;font-weight:700;color:var(--t2);padding:6px 12px;">{{ form.moneda || 'Bs' }} {{ formatMonto((Number(d.totalCompra) || 0) - (d.descuento || 0)) }}</td>
                      <td><button class="cp-del-row-btn" @click="form.detalles.splice(idx,1)">✕</button></td>
                    </tr>
                  </tbody>
                  <tfoot v-if="form.detalles.length">
                    <tr>
                      <td colspan="6" style="text-align:right;font-size:12px;font-weight:700;color:var(--t3);padding:8px 12px;">Total:</td>
                      <td style="font-size:14px;font-weight:800;color:var(--t1);padding:8px 12px;">{{ form.moneda || 'Bs' }} {{ formatMonto(totalForm) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div class="ct-modal-footer">
              <button class="ct-btn-cancel" @click="dialog = false">Cancelar</button>
              <button class="ct-btn-ok" :disabled="saving" @click="guardar">{{ saving ? 'Guardando...' : (editandoId ? 'Guardar Cambios' : 'Crear Orden') }}</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- ═══════════════════════ MODAL: RECIBIR EN ALMACÉN ═══════════════════════ -->
      <transition name="modal-fade">
        <div v-if="recibirDialog" class="ct-modal-backdrop" @click.self="recibirDialog = false">
          <div class="ct-modal" style="max-width:500px;">
            <div class="ct-modal-header">
              <span>Recibir en Almacén — {{ ordenActiva && ordenActiva.nroCompra }}</span>
              <button class="ct-modal-close" @click="recibirDialog = false">✕</button>
            </div>
            <div class="ct-modal-body">
              <div class="cp-trace-info">Registra la llegada física de la mercancía. El estado cambiará a <strong>Pendiente</strong>. Luego podrás revisar y finalizar para cargar el inventario.</div>
              <div class="ct-form-grid">
                <div class="ide-field">
                  <label>Fecha de Recepción *</label>
                  <input v-model="recibirForm.fechaRecepcion" class="ide-input" type="date" />
                </div>
                <div class="ide-field">
                  <label>Condición de la Mercancía</label>
                  <select v-model="recibirForm.condicionMercancia" class="ide-select">
                    <option value="">Sin especificar</option>
                    <option value="BUENA">Buena — sin novedades</option>
                    <option value="DAÑADA">Con daños</option>
                    <option value="PARCIAL">Recepción parcial</option>
                  </select>
                </div>
                <div class="ide-field ct-form-full">
                  <label>Observaciones de Recepción</label>
                  <textarea v-model="recibirForm.observacionesRecepcion" class="ide-input" rows="3" placeholder="Novedades al recibir..." style="resize:vertical;"></textarea>
                </div>
              </div>
            </div>
            <div class="ct-modal-footer">
              <button class="ct-btn-cancel" @click="recibirDialog = false">Cancelar</button>
              <button class="ct-btn-ok" :disabled="accionando" @click="confirmarRecibir">{{ accionando ? 'Procesando...' : 'Confirmar Recepción' }}</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- ═══════════════════════ MODAL: FINALIZAR ═══════════════════════ -->
      <transition name="modal-fade">
        <div v-if="finalizarDialog" class="ct-modal-backdrop" @click.self="finalizarDialog = false">
          <div class="ct-modal" style="max-width:780px;">
            <div class="ct-modal-header">
              <span>Finalizar Compra — {{ ordenActiva && ordenActiva.nroCompra }}</span>
              <button class="ct-modal-close" @click="finalizarDialog = false">✕</button>
            </div>
            <div class="ct-modal-body">
              <div class="cp-trace-info">Asigna lotes y fechas de vencimiento. Al confirmar se registrará el stock en inventario y la compra quedará <strong>Finalizada</strong>.</div>
              <div v-if="ordenActiva && ordenActiva.fechaRecepcion" class="cp-recepcion-badge">
                <div class="cp-trace-row"><span>Recibido el</span><strong>{{ ordenActiva.fechaRecepcion }}</strong></div>
                <div v-if="ordenActiva.condicionMercancia" class="cp-trace-row"><span>Condición</span><span :class="condicionClass(ordenActiva.condicionMercancia)">{{ ordenActiva.condicionMercancia }}</span></div>
                <div v-if="ordenActiva.observacionesRecepcion" class="cp-trace-row"><span>Nota recepción</span><strong>{{ ordenActiva.observacionesRecepcion }}</strong></div>
              </div>
              <div class="cp-table-wrap" style="margin-bottom:12px;">
                <table class="cp-table">
                  <thead><tr><th>Producto</th><th style="width:90px;">Cantidad</th><th style="width:150px;">Nro de Lote</th><th style="width:150px;">Fec. Vencimiento</th></tr></thead>
                  <tbody>
                    <tr v-for="d in finalizarForm.detalles" :key="d.id">
                      <td>{{ nombreProducto(d.productoId) }}</td>
                      <td>{{ d.cantidad }}</td>
                      <td><input v-model="d.nroLote" class="ide-input" placeholder="Opcional" /></td>
                      <td><input v-model="d.fechaVencimiento" class="ide-input" type="date" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="ide-field">
                <label>Observaciones de Finalización</label>
                <textarea v-model="finalizarForm.observacionesFinalizacion" class="ide-input" rows="2" placeholder="Notas adicionales..." style="resize:vertical;"></textarea>
              </div>
            </div>
            <div class="ct-modal-footer">
              <button class="ct-btn-cancel" @click="finalizarDialog = false">Cancelar</button>
              <button class="ct-btn-ok cp-btn-finalizar" :disabled="accionando" @click="confirmarFinalizar">{{ accionando ? 'Finalizando...' : '✓ Finalizar y cargar inventario' }}</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- ═══════════════════════ MODAL: ANULAR ═══════════════════════ -->
      <transition name="modal-fade">
        <div v-if="anularDialog" class="ct-modal-backdrop" @click.self="anularDialog = false">
          <div class="ct-modal" style="max-width:440px;">
            <div class="ct-modal-header">
              <span>Anular Orden — {{ ordenActiva && ordenActiva.nroCompra }}</span>
              <button class="ct-modal-close" @click="anularDialog = false">✕</button>
            </div>
            <div class="ct-modal-body">
              <div class="cp-trace-info" style="border-color:#f8717133;background:#2d1a1a44;color:#f87171;">
                Esta acción cambiará el estado a <strong>ANULADA</strong> y no se podrá deshacer.
              </div>
              <div class="ide-field" style="margin-top:12px;">
                <label>Motivo / Glosa <span style="color:var(--t4);font-weight:400;">(opcional)</span></label>
                <textarea
                  v-model="anularMotivo"
                  class="ide-input"
                  rows="3"
                  placeholder="Describe el motivo de la anulación..."
                  style="resize:vertical;"
                  @keyup.enter.ctrl="confirmarAnular"
                ></textarea>
              </div>
            </div>
            <div class="ct-modal-footer">
              <button class="ct-btn-cancel" @click="anularDialog = false">Cancelar</button>
              <button class="cp-btn-anular" :disabled="accionando" @click="confirmarAnular">
                {{ accionando ? 'Anulando...' : 'Confirmar Anulación' }}
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- ═══════════════════════ MODAL: VER DETALLE ═══════════════════════ -->
      <transition name="modal-fade">
        <div v-if="detalleDialog && detalleActual" class="ct-modal-backdrop" @click.self="detalleDialog = false">
          <div class="ct-modal" style="max-width:760px;">
            <div class="ct-modal-header">
              <div style="display:flex;align-items:center;gap:8px;">
                <span>{{ detalleActual.nroCompra }}</span>
                <span :class="badgeClass(detalleActual.estadoCompra)" style="font-size:10px;">{{ labelEstado(detalleActual.estadoCompra) }}</span>
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                <button class="cp-pdf-dl-btn" :disabled="descargandoPdf" title="Ver PDF en nueva pestaña" @click="descargarPdf(detalleActual)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {{ descargandoPdf ? '...' : 'Ver PDF' }}
                </button>
                <button class="cp-pdf-dl-btn" :disabled="descargandoPdf" title="Descargar PDF" @click="descargarPdfArchivo(detalleActual)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Descargar
                </button>
                <button class="cp-export-btn" title="Imprimir" @click="printOrden(detalleActual)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Imprimir
                </button>
                <button class="ct-modal-close" @click="detalleDialog = false">✕</button>
              </div>
            </div>
            <div class="ct-modal-body" style="max-height:75vh;overflow-y:auto;">

              <!-- Cabecera -->
              <div class="cp-detail-grid">
                <div class="cp-info-item"><span>Proveedor</span><strong>{{ nombreProveedor(detalleActual.proveedorId) }}</strong></div>
                <div class="cp-info-item"><span>Fecha Orden</span><strong>{{ detalleActual.fecha }}</strong></div>
                <div class="cp-info-item"><span>Nro Factura</span><strong>{{ detalleActual.nroFactura || '—' }}</strong></div>
                <div class="cp-info-item"><span>Moneda</span><strong>{{ (detalleActual.detalles && detalleActual.detalles[0]?.moneda) || 'BOB' }}</strong></div>
                <div class="cp-info-item"><span>Total</span><strong>{{ (detalleActual.detalles && detalleActual.detalles[0]?.moneda) || 'Bs' }} {{ formatMonto(detalleActual.total) }}</strong></div>
                <div v-if="detalleActual.observaciones" class="cp-info-item" style="grid-column:span 2"><span>Observaciones</span><strong>{{ detalleActual.observaciones }}</strong></div>
              </div>

              <!-- Tránsito -->
              <div v-if="detalleActual.nroGuiaRemision || detalleActual.transportista || detalleActual.fechaEnvio" class="cp-trace-block">
                <div class="cp-trace-title"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Tránsito</div>
                <div class="cp-detail-grid">
                  <div v-if="detalleActual.fechaEnvio" class="cp-info-item"><span>Fecha Envío</span><strong>{{ detalleActual.fechaEnvio }}</strong></div>
                  <div v-if="detalleActual.fechaEstimadaLlegada" class="cp-info-item"><span>Llegada Estimada</span><strong>{{ detalleActual.fechaEstimadaLlegada }}</strong></div>
                  <div v-if="detalleActual.nroGuiaRemision" class="cp-info-item"><span>Nro Guía</span><strong>{{ detalleActual.nroGuiaRemision }}</strong></div>
                  <div v-if="detalleActual.transportista" class="cp-info-item"><span>Transportista</span><strong>{{ detalleActual.transportista }}</strong></div>
                </div>
              </div>

              <!-- Recepción -->
              <div v-if="detalleActual.fechaRecepcion" class="cp-trace-block">
                <div class="cp-trace-title"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg> Recepción en Almacén</div>
                <div class="cp-detail-grid">
                  <div class="cp-info-item"><span>Fecha Recepción</span><strong>{{ detalleActual.fechaRecepcion }}</strong></div>
                  <div v-if="detalleActual.condicionMercancia" class="cp-info-item"><span>Condición</span><span :class="condicionClass(detalleActual.condicionMercancia)">{{ detalleActual.condicionMercancia }}</span></div>
                  <div v-if="detalleActual.observacionesRecepcion" class="cp-info-item" style="grid-column:span 2"><span>Obs. Recepción</span><strong>{{ detalleActual.observacionesRecepcion }}</strong></div>
                </div>
              </div>

              <!-- Finalización -->
              <div v-if="detalleActual.fechaFinalizacion" class="cp-trace-block">
                <div class="cp-trace-title"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Finalización</div>
                <div class="cp-detail-grid">
                  <div class="cp-info-item"><span>Fecha Finalización</span><strong>{{ detalleActual.fechaFinalizacion }}</strong></div>
                  <div v-if="detalleActual.observacionesFinalizacion" class="cp-info-item" style="grid-column:span 2"><span>Obs. Finalización</span><strong>{{ detalleActual.observacionesFinalizacion }}</strong></div>
                </div>
              </div>

              <!-- Productos -->
              <div style="font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;margin-top:4px;">Productos</div>
              <div v-if="loadingDetalle" class="cp-loading"><div class="ct-spinner"></div></div>
              <table v-else class="cp-table" style="margin-bottom:16px;">
                <thead><tr><th>Producto</th><th>Cant.</th><th>Total Compra</th><th>P. Unitario</th><th>Desc.</th><th>Subtotal</th><th>Lote</th><th>Vencimiento</th></tr></thead>
                <tbody>
                  <tr v-for="d in (detalleActual.detalles || [])" :key="d.id">
                    <td>{{ nombreProducto(d.productoId) }}</td>
                    <td>{{ d.cantidad }}</td>
                    <td>{{ formatMonto(d.totalCompra != null ? d.totalCompra : d.subtotal) }}</td>
                    <td>{{ formatPU((d.totalCompra != null ? Number(d.totalCompra) : Number(d.subtotal)) / Number(d.cantidad)) }}</td>
                    <td>{{ formatMonto(d.descuento) }}</td>
                    <td>{{ formatMonto(d.subtotal) }}</td>
                    <td>{{ d.nroLote || '—' }}</td>
                    <td>{{ d.fechaVencimiento || '—' }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Trazabilidad / Log -->
              <div style="font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Historial de Cambios</div>
              <div v-if="loadingLogs" class="cp-loading"><div class="ct-spinner"></div></div>
              <div v-else-if="!logs.length" style="font-size:11px;color:var(--b3);font-style:italic;padding:8px 0;">Sin registros</div>
              <div v-else class="cp-log-list">
                <div v-for="l in logs" :key="l.id" class="cp-log-row">
                  <div class="cp-log-icon" :class="logIconClass(l.tipo)">
                    <svg v-if="l.tipo === 'ESTADO'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    <svg v-else-if="l.tipo === 'PAGO'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    <svg v-else-if="l.tipo === 'EDICION'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div class="cp-log-desc">{{ l.descripcion }}</div>
                    <div v-if="l.estadoAnterior && l.estadoNuevo" class="cp-log-estados">
                      <span :class="badgeClass(l.estadoAnterior)" style="font-size:9px;">{{ labelEstado(l.estadoAnterior) }}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      <span :class="badgeClass(l.estadoNuevo)" style="font-size:9px;">{{ labelEstado(l.estadoNuevo) }}</span>
                    </div>
                  </div>
                  <div class="cp-log-date">{{ formatFechaLog(l.createdAt) }}</div>
                </div>
              </div>

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
  proveedorId: '', sucursalId: '',
  fecha: new Date().toISOString().split('T')[0],
  nroFactura: '', fechaEnvio: '', fechaEstimadaLlegada: '',
  nroGuiaRemision: '', transportista: '', observaciones: '', moneda: 'BOB', detalles: [],
})
const emptyDetalle = () => ({
  id: null, productoId: '', _busqueda: '',
  _categoriaNombre: '', _subcategoriaNombre: '', _categoriaColor: '#6366f1',
  unidadId: '', cantidad: 1, totalCompra: 0, descuento: 0,
})

export default {
  name: 'ComprasOrden',
  data: () => ({
    compras: [], loading: false, q: '', filtroEstado: '',
    tabs: [
      { v: '', l: 'Todas' },
      { v: 'EN_TRANSITO', l: 'En Tránsito' },
      { v: 'PENDIENTE', l: 'En Almacén' },
      { v: 'FINALIZADO', l: 'Finalizado' },
      { v: 'ANULADA', l: 'Anuladas' },
    ],
    proveedores: [], sucursales: [], productos: [], unidades: [], monedas: [],
    busquedaAdd: '', dropAddVisible: false, dropAddIdx: -1,
    form: emptyForm(), saving: false, dialog: false, editandoId: null,
    recibirDialog: false, recibirForm: { fechaRecepcion: '', condicionMercancia: '', observacionesRecepcion: '' },
    finalizarDialog: false, finalizarForm: { detalles: [], observacionesFinalizacion: '' },
    detalleActual: null, detalleDialog: false, loadingDetalle: false,
    logs: [], loadingLogs: false,
    ordenActiva: null, accionando: false, descargandoPdf: false,
    anularDialog: false, anularMotivo: '',
  }),
  computed: {
    filtrados() {
      let list = this.filtroEstado ? this.compras.filter(c => c.estadoCompra === this.filtroEstado) : this.compras
      if (this.q.trim()) {
        const q = this.q.toLowerCase()
        list = list.filter(c => c.nroCompra.toLowerCase().includes(q) || this.nombreProveedor(c.proveedorId).toLowerCase().includes(q))
      }
      return list
    },
    totalForm() {
      return this.form.detalles.reduce((acc, d) => acc + (Number(d.totalCompra) || 0) - (d.descuento || 0), 0)
    },
    filtrarProductosAdd() {
      const t = (this.busquedaAdd || '').toLowerCase().trim()
      if (!t) return []
      const usados = new Set(this.form.detalles.filter(d => d.productoId).map(d => d.productoId))
      const res = []
      for (const p of this.productos) {
        if (usados.has(p.id)) continue
        if (p.activo === false || p.estado === 'ELIMINADO') continue
        if (
          p.nombre.toLowerCase().includes(t) ||
          (p.codigoBarras && p.codigoBarras.toLowerCase().includes(t)) ||
          (p.codigoTienda && p.codigoTienda.toLowerCase().includes(t)) ||
          (p.subcategoriaNombre && p.subcategoriaNombre.toLowerCase().includes(t)) ||
          (p.categoriaNombre && p.categoriaNombre.toLowerCase().includes(t))
        ) { res.push(p); if (res.length >= 20) break }
      }
      return res
    },
  },
  created() { this.cargar(); this.cargarCatalogos() },
  methods: {
    async cargar() {
      this.loading = true
      try { this.compras = await this.$service.list('compras?tipo=COMPRA') || [] }
      finally { this.loading = false }
    },
    async cargarCatalogos() {
      const [pr, s, p, u, subs, cats, mons] = await Promise.all([
        this.$service.list('proveedores').catch(() => []),
        this.$service.list('sucursales').catch(() => []),
        this.$service.list('productos?soloActivos=true').catch(() => []),
        this.$service.list('unidades-medida').catch(() => []),
        this.$service.list('subcategorias-producto?soloActivos=true').catch(() => []),
        this.$service.list('categorias-producto?soloActivos=true').catch(() => []),
        this.$service.list('logistica-monedas').catch(() => []),
      ])
      this.proveedores = pr || []
      this.sucursales = s || []
      this.unidades = u || []
      this.monedas = (mons || []).filter(m => m.activo !== false)
      const subMap = new Map((subs || []).map(s => [s.id, s]))
      const catMap = new Map((cats || []).map(c => [c.id, c]))
      this.productos = (p || []).map(prod => {
        const sub = subMap.get(prod.subcategoriaId)
        const cat = sub ? catMap.get(sub.categoriaId) : null
        return { ...prod, subcategoriaNombre: sub?.nombre || '', categoriaNombre: cat?.nombre || '', categoriaColor: cat?.color || '#6366f1' }
      })
    },

    // ── Nueva orden ───────────────────────────────────────────────────────────
    abrirForm() {
      this.form = emptyForm()
      if (this.monedas.length) this.form.moneda = this.monedas[0].codigo
      this.editandoId = null
      this.busquedaAdd = ''
      this.dropAddVisible = false
      this.dropAddIdx = -1
      this.dialog = true
    },

    async abrirEditar(compra) {
      this.editandoId = null
      this.form = emptyForm()
      this.ordenActiva = compra
      const data = await this.$service.get(`compras/${compra.id}`)
      this.editandoId = data.id
      this.form.proveedorId = data.proveedorId || ''
      this.form.sucursalId = data.sucursalId || ''
      this.form.fecha = data.fecha || ''
      this.form.nroFactura = data.nroFactura || ''
      this.form.fechaEnvio = data.fechaEnvio || ''
      this.form.fechaEstimadaLlegada = data.fechaEstimadaLlegada || ''
      this.form.nroGuiaRemision = data.nroGuiaRemision || ''
      this.form.transportista = data.transportista || ''
      this.form.observaciones = data.observaciones || ''
      this.form.moneda = (data.detalles && data.detalles[0]?.moneda) || this.monedas[0]?.codigo || 'BOB'
      this.busquedaAdd = ''
      this.dropAddVisible = false
      this.dropAddIdx = -1
      this.form.detalles = (data.detalles || []).map(d => {
        const prod = this.productos.find(p => p.id === d.productoId) || {}
        return {
          id: d.id,
          productoId: d.productoId,
          _busqueda: [prod.categoriaNombre, prod.subcategoriaNombre, prod.nombre].filter(Boolean).join(' › ') || d.productoId,
          _categoriaNombre: prod.categoriaNombre || '',
          _subcategoriaNombre: prod.subcategoriaNombre || '',
          _categoriaColor: prod.categoriaColor || '#6366f1',
          unidadId: d.unidadId || '',
          cantidad: Number(d.cantidad),
          totalCompra: d.totalCompra != null ? Number(d.totalCompra) : Number(d.precioUnitario) * Number(d.cantidad),
          descuento: Number(d.descuento) || 0,
        }
      })
      this.dialog = true
    },

    async guardar() {
      if (!this.form.proveedorId) return this.$message.error('Selecciona un proveedor')
      if (!this.form.sucursalId) return this.$message.error('Selecciona una sucursal')
      if (!this.form.detalles.length) return this.$message.error('Agrega al menos un producto')
      if (this.form.detalles.find(d => !d.productoId)) return this.$message.error('Todos los ítems deben tener un producto seleccionado')
      const monedaCompra = this.form.moneda || 'BOB'
      const detalles = this.form.detalles.map(({ id, productoId, unidadId, cantidad, totalCompra, descuento }) => {
        const tc = Number(totalCompra) || 0
        const precioUnitario = cantidad > 0 ? tc / Number(cantidad) : 0
        return { id, productoId, unidadId: unidadId || undefined, cantidad, precioUnitario, totalCompra: tc, descuento, moneda: monedaCompra }
      })
      const payload = {
        ...this.form,
        fechaEnvio: this.form.fechaEnvio || undefined,
        fechaEstimadaLlegada: this.form.fechaEstimadaLlegada || undefined,
        nroFactura: this.form.nroFactura || undefined,
        nroGuiaRemision: this.form.nroGuiaRemision || undefined,
        transportista: this.form.transportista || undefined,
        observaciones: this.form.observaciones || undefined,
      }
      this.saving = true
      try {
        if (this.editandoId) {
          await this.$service.put(`compras/${this.editandoId}/editar`, { ...payload, detalles })
          this.$message.success('Orden actualizada')
        } else {
          await this.$service.post('compras', { ...payload, tipoCompra: 'COMPRA', detalles })
          this.$message.success('Orden creada (En Tránsito)')
        }
        this.dialog = false
        await this.cargar()
      } finally { this.saving = false }
    },

    // ── Anular ────────────────────────────────────────────────────────────────
    anularOrden(compra) {
      this.ordenActiva = compra
      this.anularMotivo = ''
      this.anularDialog = true
    },
    async confirmarAnular() {
      this.accionando = true
      try {
        await this.$http.delete(`${this.$baseServer}compras/${this.ordenActiva.id}`, {
          data: { motivo: this.anularMotivo || undefined },
        })
        this.$message.success('Orden anulada')
        this.anularDialog = false
        await this.cargar()
      } finally { this.accionando = false }
    },

    // ── Recibir (EN_TRANSITO → PENDIENTE) ────────────────────────────────────
    abrirRecibir(compra) {
      this.ordenActiva = compra
      this.recibirForm = { fechaRecepcion: new Date().toISOString().split('T')[0], condicionMercancia: '', observacionesRecepcion: '' }
      this.recibirDialog = true
    },
    async confirmarRecibir() {
      if (!this.recibirForm.fechaRecepcion) return this.$message.error('Indica la fecha de recepción')
      this.accionando = true
      try {
        await this.$service.post(`compras/${this.ordenActiva.id}/recibir`, this.recibirForm)
        this.$message.success('Mercancía recibida en almacén. Lista para finalizar.')
        this.recibirDialog = false
        await this.cargar()
      } finally { this.accionando = false }
    },

    // ── Finalizar (PENDIENTE → FINALIZADO) ───────────────────────────────────
    async abrirFinalizar(compra) {
      this.ordenActiva = compra
      this.accionando = true
      try {
        const data = await this.$service.get(`compras/${compra.id}`)
        this.ordenActiva = data
        this.finalizarForm = {
          observacionesFinalizacion: '',
          detalles: (data.detalles || []).map(d => ({
            id: d.id, productoId: d.productoId, cantidad: d.cantidad,
            nroLote: d.nroLote || '', fechaVencimiento: d.fechaVencimiento || '',
          })),
        }
        this.finalizarDialog = true
      } finally { this.accionando = false }
    },
    async confirmarFinalizar() {
      this.accionando = true
      try {
        await this.$service.post(`compras/${this.ordenActiva.id}/finalizar`, {
          observacionesFinalizacion: this.finalizarForm.observacionesFinalizacion,
          detalles: this.finalizarForm.detalles.map(d => ({
            id: d.id,
            nroLote: d.nroLote || undefined,
            fechaVencimiento: d.fechaVencimiento || undefined,
          })),
        })
        this.$message.success('Compra finalizada. Inventario actualizado.')
        this.finalizarDialog = false
        await this.cargar()
      } finally { this.accionando = false }
    },

    // ── Ver detalle ───────────────────────────────────────────────────────────
    async verDetalle(compra) {
      this.detalleDialog = true
      this.loadingDetalle = true
      this.detalleActual = compra
      this.logs = []
      this.loadingLogs = true
      try {
        const [data, logsData] = await Promise.all([
          this.$service.get(`compras/${compra.id}`),
          this.$service.list(`compras/${compra.id}/logs`).catch(() => []),
        ])
        this.detalleActual = data
        this.logs = logsData || []
      } finally {
        this.loadingDetalle = false
        this.loadingLogs = false
      }
    },

    // ── PDF: ver / descargar ──────────────────────────────────────────────────
    async _fetchPdfBlob(compra) {
      const url = `${this.$baseServer}compras/${compra.id}/pdf`
      const resp = await this.$http.get(url, { responseType: 'blob' })
      return new Blob([resp.data], { type: 'application/pdf' })
    },
    async descargarPdf(compra) {
      this.descargandoPdf = true
      try {
        const blob = await this._fetchPdfBlob(compra)
        const blobUrl = URL.createObjectURL(blob)
        window.open(blobUrl, '_blank')
        setTimeout(() => URL.revokeObjectURL(blobUrl), 120000)
      } catch { this.$message.error('Error al generar el PDF') }
      finally { this.descargandoPdf = false }
    },
    async descargarPdfArchivo(compra) {
      this.descargandoPdf = true
      try {
        const blob = await this._fetchPdfBlob(compra)
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `orden-${compra.nroCompra}.pdf`
        a.click()
        URL.revokeObjectURL(a.href)
      } catch { this.$message.error('Error al descargar el PDF') }
      finally { this.descargandoPdf = false }
    },

    // ── Exportar Excel ────────────────────────────────────────────────────────
    exportarExcel() {
      const params = new URLSearchParams({ tipo: 'COMPRA' })
      if (this.filtroEstado) params.set('estado', this.filtroEstado)
      const url = `${this.$baseServer}compras/reporte/excel?${params.toString()}`
      this.$http.get(url, { responseType: 'blob' })
        .then(r => {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(r.data)
          a.download = `ordenes-compra-${new Date().toISOString().split('T')[0]}.xlsx`
          a.click()
          URL.revokeObjectURL(a.href)
        })
        .catch(() => this.$message.error('Error al exportar'))
    },

    // ── Imprimir PDF ──────────────────────────────────────────────────────────
    printOrden(compra) {
      const proveedor = this.nombreProveedor(compra.proveedorId)
      const sc = '<' + '/script>'
      const rows = (compra.detalles || []).map(d => `
        <tr>
          <td>${this.nombreProducto(d.productoId)}</td>
          <td style="text-align:right;">${d.cantidad}</td>
          <td style="text-align:right;">Bs ${this.formatMonto(d.precioUnitario)}</td>
          <td style="text-align:right;">Bs ${this.formatMonto(d.descuento)}</td>
          <td style="text-align:right;">Bs ${this.formatMonto(d.subtotal)}</td>
          <td>${d.nroLote || '—'}</td>
        </tr>`).join('')

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${compra.nroCompra}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
        h2 { margin: 0 0 4px; font-size: 18px; }
        .sub { color: #666; font-size: 11px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .field label { font-size: 10px; color: #888; text-transform: uppercase; display: block; }
        .field span { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: var(--b0); color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
        td { padding: 5px 8px; border-bottom: 1px solid #ddd; font-size: 11px; }
        tr:nth-child(even) td { background: #f8f8f8; }
        .total { text-align: right; font-size: 14px; font-weight: bold; margin-top: 8px; }
        .section { font-size: 10px; font-weight: bold; color: #555; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0 6px; border-top: 1px solid #ddd; padding-top: 8px; }
        @media print { body { margin: 12px; } button { display: none; } }
      </style></head><body>
      <h2>Orden de Compra — ${compra.nroCompra}</h2>
      <div class="sub">Generado el ${new Date().toLocaleString()}</div>
      <div class="grid">
        <div class="field"><label>Proveedor</label><span>${proveedor}</span></div>
        <div class="field"><label>Fecha Orden</label><span>${compra.fecha}</span></div>
        <div class="field"><label>Estado</label><span>${this.labelEstado(compra.estadoCompra)}</span></div>
        <div class="field"><label>Nro Factura</label><span>${compra.nroFactura || '—'}</span></div>
        ${compra.nroGuiaRemision ? `<div class="field"><label>Nro Guía</label><span>${compra.nroGuiaRemision}</span></div>` : ''}
        ${compra.transportista ? `<div class="field"><label>Transportista</label><span>${compra.transportista}</span></div>` : ''}
      </div>
      ${compra.fechaRecepcion ? `<div class="section">Recepción</div><div class="grid"><div class="field"><label>Fecha Recepción</label><span>${compra.fechaRecepcion}</span></div><div class="field"><label>Condición</label><span>${compra.condicionMercancia || '—'}</span></div></div>` : ''}
      ${compra.fechaFinalizacion ? `<div class="section">Finalización</div><div class="grid"><div class="field"><label>Fecha</label><span>${compra.fechaFinalizacion}</span></div></div>` : ''}
      <div class="section">Detalle de Productos</div>
      <table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unit.</th><th>Descuento</th><th>Subtotal</th><th>Lote</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="total">Total: Bs ${this.formatMonto(compra.total)}</div>
      <script>window.onload=()=>window.print()${sc}</body></html>`

      const w = window.open('', '_blank')
      if (w) { w.document.write(html); w.document.close() }
    },

    // ── Búsqueda global de productos ──────────────────────────────────────────
    agregarDesdeSearch(p) {
      if (this.form.detalles.find(d => d.productoId === p.id)) {
        this.$message.error('Este producto ya está en la lista')
        return
      }
      const path = [p.categoriaNombre, p.subcategoriaNombre, p.nombre].filter(Boolean).join(' › ')
      const det = {
        ...emptyDetalle(),
        productoId: p.id,
        _busqueda: path,
        _categoriaNombre: p.categoriaNombre || '',
        _subcategoriaNombre: p.subcategoriaNombre || '',
        _categoriaColor: p.categoriaColor || '#6366f1',
      }
      if (this.monedas.length) det.moneda = this.monedas[0].codigo
      this.form.detalles.push(det)
      this.busquedaAdd = ''
      this.dropAddVisible = false
      this.dropAddIdx = -1
    },
    onInputSearch() {
      this.dropAddVisible = !!this.busquedaAdd.trim()
      this.dropAddIdx = -1
    },
    onKeydownSearch(e) {
      const list = this.filtrarProductosAdd
      if (!list.length) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        this.dropAddIdx = (this.dropAddIdx + 1) % list.length
        this.$nextTick(() => { this.$refs.dropAdd?.children[this.dropAddIdx]?.scrollIntoView({ block: 'nearest' }) })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        this.dropAddIdx = (this.dropAddIdx - 1 + list.length) % list.length
        this.$nextTick(() => { this.$refs.dropAdd?.children[this.dropAddIdx]?.scrollIntoView({ block: 'nearest' }) })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (this.dropAddIdx >= 0 && list[this.dropAddIdx]) this.agregarDesdeSearch(list[this.dropAddIdx])
        else if (list.length === 1) this.agregarDesdeSearch(list[0])
      } else if (e.key === 'Escape') {
        this.dropAddVisible = false
        this.dropAddIdx = -1
      }
    },
    ocultarDropAdd() {
      setTimeout(() => { this.dropAddVisible = false; this.dropAddIdx = -1 }, 150)
    },

    // ── Helpers ───────────────────────────────────────────────────────────────
    formatPU(v) { return Number(v || 0).toFixed(3) },
    nombreProveedor(id) { return this.proveedores.find(p => p.id === id)?.nombre || '—' },
    nombreProducto(id) {
      const p = this.productos.find(p => p.id === id)
      if (!p) return id
      return [p.categoriaNombre, p.subcategoriaNombre, p.nombre].filter(Boolean).join(' › ')
    },
    formatMonto(v) { return Number(v || 0).toFixed(2) },
    formatFechaLog(v) {
      if (!v) return ''
      const d = new Date(v)
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    labelEstado(e) {
      return { EN_TRANSITO: 'En Tránsito', PENDIENTE: 'En Almacén', FINALIZADO: 'Finalizado', ANULADA: 'Anulada' }[e] || e
    },
    badgeClass(e) {
      return {
        EN_TRANSITO: 'ct-badge ct-badge--transit',
        PENDIENTE:   'ct-badge ct-badge--warn',
        FINALIZADO:  'ct-badge ct-badge--on',
        ANULADA:     'ct-badge ct-badge--off',
      }[e] || 'ct-badge'
    },
    condicionClass(c) {
      return { BUENA: 'cp-cond cp-cond--ok', DAÑADA: 'cp-cond cp-cond--bad', PARCIAL: 'cp-cond cp-cond--warn' }[c] || 'cp-cond'
    },
    logIconClass(tipo) {
      return { ESTADO: 'cp-log-icon--estado', EDICION: 'cp-log-icon--edicion', PAGO: 'cp-log-icon--pago', CREACION: 'cp-log-icon--creacion' }[tipo] || ''
    },
  },
}
</script>

<style scoped>
.cp-root { height:100%; overflow:hidden; padding:24px; display:flex; flex-direction:column; }
.cp-layout { flex:1; overflow:hidden; display:flex; gap:12px; }
.cp-panel { width:420px; flex-shrink:0; background:var(--bg-s); border:1px solid var(--b1); border-radius:14px; display:flex; flex-direction:column; overflow:hidden; }
.cp-col-header { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 8px; border-bottom:1px solid var(--b2); flex-shrink:0; }
.cp-col-title { font-size:13px; font-weight:800; color:var(--t1); }
.cp-col-count { font-size:10px; color:var(--t5); margin-top:1px; }
.cp-add-btn { background:#6366f122; border:1px solid #6366f133; color:#818cf8; border-radius:7px; padding:3px 9px; font-size:16px; cursor:pointer; font-weight:700; }
.cp-add-btn:hover { background:#6366f133; }
.cp-export-btn { background:#16302222; border:1px solid #34d39933; color:#34d399; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; }
.cp-export-btn:hover { background:#163022; }
.cp-pdf-dl-btn { background:#1e1a3544; border:1px solid #818cf833; color:#818cf8; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; }
.cp-pdf-dl-btn:hover { background:#1e1a35; }
.cp-pdf-dl-btn:disabled { opacity:.5; cursor:default; }
.cp-tabs { display:flex; gap:2px; padding:6px 10px; border-bottom:1px solid var(--b2); flex-shrink:0; overflow-x:auto; }
.cp-tab { background:none; border:1px solid transparent; color:var(--t5); border-radius:5px; padding:3px 8px; font-size:10px; font-weight:700; cursor:pointer; text-transform:uppercase; letter-spacing:.3px; white-space:nowrap; }
.cp-tab:hover { color:var(--t3); border-color:var(--b1); }
.cp-tab.active { background:#6366f122; border-color:#6366f133; color:#818cf8; }
.cp-search { margin:8px 10px 4px; background:var(--bg-e); border:1px solid var(--b1); border-radius:7px; color:var(--t3); font-size:11px; padding:6px 10px; outline:none; flex-shrink:0; }
.cp-list { flex:1; overflow-y:auto; padding:4px 8px 12px; }
.cp-loading { display:flex; justify-content:center; padding:24px; }
.cp-empty { text-align:center; padding:20px; font-size:12px; color:var(--b3); font-style:italic; }
.cp-row { display:flex; align-items:center; gap:8px; padding:10px 8px; border-radius:8px; cursor:pointer; margin-bottom:3px; transition:background 0.15s; border:1px solid transparent; }
.cp-row:hover { background:var(--bg-c); border-color:var(--b1); }
.cp-row-title { font-size:12px; font-weight:700; color:var(--t2); }
.cp-row-sub { font-size:10px; color:var(--t5); margin-top:2px; }
.cp-row-monto { font-size:12px; font-weight:800; color:var(--t1); }
.cp-icon-btn { background:var(--bg-c); border:1px solid var(--b1); color:var(--t4); cursor:pointer; border-radius:5px; padding:4px 5px; display:flex; align-items:center; justify-content:center; }
.cp-icon-btn:hover { border-color:#6366f1; color:#818cf8; }
.cp-action-btn { border:none; border-radius:6px; padding:5px 7px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
.cp-action--transit { background:var(--b1); color:#60a5fa; }
.cp-action--transit:hover { background:var(--b4); }
.cp-action--finalizar { background:#16302222; color:#34d399; }
.cp-action--finalizar:hover { background:#163022; }
.cp-action--anular { background:#2d1a1a44; color:#f87171; }
.cp-action--anular:hover { background:#2d1a1a88; }
.cp-action-btn:disabled { opacity:.4; cursor:default; }
.cp-add-row-btn { background:#6366f122; border:1px solid #6366f133; color:#818cf8; border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer; }
.cp-del-row-btn { background:none; border:none; color:var(--t4); cursor:pointer; font-size:13px; padding:2px 4px; border-radius:4px; }
.cp-del-row-btn:hover { color:#f87171; }
.cp-table-wrap { overflow-x:auto; border-radius:8px; border:1px solid var(--b1); }
.cp-table { width:100%; border-collapse:collapse; font-size:12px; }
.cp-table th { background:var(--bg-e); color:var(--t4); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:8px 12px; text-align:left; white-space:nowrap; }
.cp-table td { padding:6px 8px; border-top:1px solid var(--b2); vertical-align:middle; }
.cp-table tfoot td { background:var(--b1); }
.cp-info-item { display:flex; flex-direction:column; gap:3px; }
.cp-info-item span { font-size:10px; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.cp-info-item strong { font-size:13px; color:var(--t2); }
.cp-section-label { font-size:11px; font-weight:700; color:var(--t4); text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; margin-top:16px; display:block; }
.cp-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
.cp-trace-block { background:var(--bg-e); border:1px solid var(--b1); border-radius:8px; padding:12px 14px; margin-bottom:10px; }
.cp-trace-title { font-size:10px; font-weight:700; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; display:flex; align-items:center; gap:5px; margin-bottom:8px; }
.cp-trace-row { display:flex; gap:10px; align-items:baseline; font-size:12px; margin-bottom:3px; }
.cp-trace-row span:first-child { color:var(--t5); min-width:100px; font-size:11px; }
.cp-trace-info { background:var(--b2); border:1px solid var(--b1); border-radius:7px; padding:10px 14px; font-size:12px; color:var(--t4); margin-bottom:14px; line-height:1.5; }
.cp-recepcion-badge { background:var(--bg-e); border:1px solid var(--b1); border-radius:8px; padding:10px 14px; margin-bottom:12px; }
.cp-cond { font-size:11px; font-weight:700; padding:2px 7px; border-radius:4px; }
.cp-cond--ok   { background:#16302244; color:#34d399; }
.cp-cond--bad  { background:#2d1a1a44; color:#f87171; }
.cp-cond--warn { background:#2d240a44; color:#fbbf24; }
.cp-prod-ok { border-color:#6366f144 !important; }
.cp-sel-cats { margin-top:3px; padding:0 2px; }
.cp-sel-breadcrumb { font-size:10px; color:var(--t5); }
.cp-prod-drop { position:absolute; top:100%; left:0; right:0; z-index:200; background:var(--bg-e); border:1px solid var(--b4); border-radius:8px; max-height:260px; overflow-y:auto; box-shadow:0 8px 24px #00000066; margin-top:2px; }
.cp-drop-item { display:flex; align-items:center; gap:8px; padding:7px 10px; cursor:pointer; }
.cp-drop-item:hover { background:var(--bg-c); }
.cp-drop-item--active { background:var(--bg-c); border-left:2px solid #6366f1; }
.cp-prod-path { font-size:11px; color:var(--t3); font-weight:600; line-height:1.4; display:block; }
.cp-drop-nombre { font-size:12px; font-weight:600; color:var(--t2); overflow:hidden; text-overflow:ellipsis; }
.cp-drop-code { font-size:10px; color:var(--t5); font-family:monospace; flex-shrink:0; padding-top:1px; }
.cp-drop-empty { padding:10px; font-size:11px; color:var(--b3); font-style:italic; text-align:center; }
.ct-spinner { width:24px; height:24px; border-radius:50%; border:3px solid var(--b1); border-top-color:#6366f1; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.cp-btn-finalizar { background:#163022 !important; border-color:#34d39944 !important; color:#34d399 !important; }
.cp-btn-finalizar:hover { background:#1a4030 !important; }
.cp-btn-anular { background:#2d1a1a; border:1px solid #f8717144; color:#f87171; border-radius:8px; padding:7px 16px; font-size:12px; font-weight:700; cursor:pointer; }
.cp-btn-anular:hover { background:#3d1a1a; }
.cp-btn-anular:disabled { opacity:.5; cursor:default; }
/* Log list */
.cp-log-list { display:flex; flex-direction:column; gap:4px; }
.cp-log-row { display:flex; align-items:flex-start; gap:10px; background:var(--bg-e); border:1px solid var(--b2); border-radius:7px; padding:8px 10px; }
.cp-log-icon { width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cp-log-icon--creacion { background:var(--b1); color:#60a5fa; }
.cp-log-icon--estado   { background:#16302244; color:#34d399; }
.cp-log-icon--edicion  { background:var(--bg-c);   color:#818cf8; }
.cp-log-icon--pago     { background:#2d240a44; color:#fbbf24; }
.cp-log-desc { font-size:12px; color:var(--t2); line-height:1.4; }
.cp-log-estados { display:flex; align-items:center; gap:5px; margin-top:4px; }
.cp-log-date { font-size:10px; color:var(--b3); white-space:nowrap; flex-shrink:0; }
/* State badges */
.ct-badge { display:inline-flex; align-items:center; padding:2px 7px; border-radius:4px; font-weight:700; font-size:10px; letter-spacing:.3px; }
.ct-badge--transit { background:var(--b1); color:#60a5fa; }
.ct-badge--warn    { background:#2d240a44; color:#fbbf24; }
.ct-badge--on      { background:#16302244; color:#34d399; }
.ct-badge--off     { background:#2d1a1a44; color:#f87171; }
</style>
