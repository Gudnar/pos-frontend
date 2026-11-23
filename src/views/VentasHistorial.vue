<template>
  <div class="vh-root">

    <!-- Pestañas -->
    <div class="vh-tabs">
      <button :class="['vh-tab', { 'vh-tab--on': vista === 'VENTAS' }]" @click="cambiarVista('VENTAS')">Ventas</button>
      <button :class="['vh-tab', { 'vh-tab--on': vista === 'COTIZACIONES' }]" @click="cambiarVista('COTIZACIONES')">Cotizaciones</button>
    </div>

    <!-- Filtros -->
    <div class="vh-filters-container">
      <div class="vh-filters-row">
        <div class="vh-filter-group">
          <label>Desde:</label>
          <input v-model="filtros.fechaDesde" class="ide-input" type="date" @change="cargar" />
        </div>
        <div class="vh-filter-group">
          <label>Hasta:</label>
          <input v-model="filtros.fechaHasta" class="ide-input" type="date" @change="cargar" />
        </div>
        <div class="vh-filter-group">
          <label>Sucursal:</label>
          <select v-model="filtros.sucursalId" class="ide-select" @change="cargar">
            <option value="">Todas</option>
            <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </div>
        <div class="vh-filter-group">
          <label>Estado:</label>
          <select v-if="vista === 'VENTAS'" v-model="filtros.estadoVenta" class="ide-select" @change="cargar">
            <option value="">Todos</option>
            <option value="PAGADA">Pagada</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ANULADA">Anulada</option>
          </select>
          <select v-else v-model="filtros.estadoCotizacion" class="ide-select" @change="cargar">
            <option value="">Todos</option>
            <option value="VIGENTE">Vigente</option>
            <option value="VENCIDA">Vencida</option>
            <option value="CONVERTIDA">Convertida</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>
        <div v-if="vista === 'VENTAS'" class="vh-filter-group">
          <label>Saldo:</label>
          <select v-model="filtros.conSaldo" class="ide-select" @change="cargar">
            <option value="">Todos</option>
            <option value="true">Con deuda</option>
            <option value="false">Pagadas</option>
          </select>
        </div>
      </div>
      <div class="vh-filters-row">
        <div class="vh-filter-group" style="flex:1;">
          <label>Cliente:</label>
          <input v-model="filtros.nombreCliente" class="ide-input" placeholder="Buscar cliente..." @change="cargar" />
        </div>
        <div style="display:flex;gap:8px;align-items:flex-end;padding-bottom:2px;">
          <button class="cp-add-btn" @click="cargar">🔍 Aplicar</button>
          <button class="cp-cancel-btn" @click="limpiarFiltros">Limpiar</button>
        </div>
      </div>
      <div v-if="vista === 'COTIZACIONES'" class="vh-summary">
        <span style="font-size:11px;color:var(--t5);">{{ cotizaciones.length }} cotizaciones</span>
        <span style="font-size:12px;font-weight:700;color:#6366f1;">Vigentes: Bs. {{ formatNum(totalCotizacionesVigentes) }}</span>
      </div>
      <div v-else class="vh-summary">
        <span style="font-size:11px;color:var(--t5);">{{ ventas.length }} ventas</span>
        <span style="font-size:12px;font-weight:700;color:#6366f1;">Total: Bs. {{ formatNum(totalDia) }}</span>
        <span v-if="totalSaldoPendiente > 0" style="font-size:12px;font-weight:700;color:#f97316;">Saldo pendiente: Bs. {{ formatNum(totalSaldoPendiente) }}</span>
      </div>
    </div>

    <!-- Tabla de cotizaciones -->
    <div v-if="vista === 'COTIZACIONES'" class="vh-table-wrap">
      <div v-if="loadingCot" class="cp-loading" style="padding:60px;"><div class="ct-spinner"></div></div>
      <div v-else-if="!cotizaciones.length" class="cp-empty" style="padding:60px;">Sin cotizaciones en el período seleccionado</div>
      <table v-else class="vh-table">
        <thead>
          <tr>
            <th>Nro. Cotización</th>
            <th>Fecha</th>
            <th>Válida hasta</th>
            <th>Cliente</th>
            <th style="text-align:right;">Total</th>
            <th>Estado</th>
            <th>Venta</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cotizaciones" :key="c.id" class="vh-row" @click="abrirCotizacion(c.id)">
            <td class="vh-td-titulo" style="font-weight:700;color:#818cf8;">{{ c.nroCotizacion }}</td>
            <td data-label="Fecha" style="color:var(--t3);font-size:11px;">{{ formatFecha(c.fecha) }}</td>
            <td data-label="Válida hasta" style="color:var(--t3);font-size:11px;">{{ c.validoHasta ? formatFecha(c.validoHasta) : '—' }}</td>
            <td data-label="Cliente" style="color:var(--scroll);">{{ c.nombreCliente || '—' }}</td>
            <td data-label="Total" style="text-align:right;font-weight:700;color:#6366f1;">Bs. {{ formatNum(c.total) }}</td>
            <td data-label="Estado"><span :class="['vh-estado', `vh-estado--${c.estadoCotizacion.toLowerCase()}`]">{{ c.estadoCotizacion }}</span></td>
            <td data-label="Venta" @click.stop>
              <a v-if="c.ventaId" class="vh-link" @click="abrirDetalle({ id: c.ventaId })">{{ c.nroVenta }}</a>
              <span v-else style="color:var(--b3);font-size:10px;">—</span>
            </td>
            <td class="vh-td-acciones" @click.stop style="white-space:nowrap;">
              <button class="cp-icon-btn" title="Imprimir cotización" @click="imprimirCotizacion(c)">🖨</button>
              <button v-if="esConvertible(c)" class="cp-icon-btn" title="Convertir en venta" style="margin-left:4px;" @click="convertirCotizacion(c)">⇄</button>
              <button v-if="esConvertible(c) && puedeEliminarDoc" class="cp-icon-btn cp-icon-btn--danger" title="Anular" style="margin-left:4px;" @click="anularCotizacion(c)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tabla -->
    <div v-else class="vh-table-wrap">
      <div v-if="loading" class="cp-loading" style="padding:60px;"><div class="ct-spinner"></div></div>
      <div v-else-if="!ventas.length" class="cp-empty" style="padding:60px;">Sin ventas en el período seleccionado</div>
      <table v-else class="vh-table">
        <thead>
          <tr>
            <th>Nro. Venta</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Método</th>
            <th style="text-align:right;">Total</th>
            <th>Estado</th>
            <th>Docs</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in ventas" :key="v.id" class="vh-row" @click="abrirDetalle(v)">
            <td class="vh-td-titulo" style="font-weight:700;color:#818cf8;">{{ v.nroVenta }}</td>
            <td data-label="Fecha" style="color:var(--t3);font-size:11px;">{{ formatFecha(v.fecha) }}</td>
            <td data-label="Cliente" style="color:var(--scroll);">{{ v.nombreCliente || '—' }}</td>
            <td data-label="Método">
              <span v-if="v.metodoPago" :class="['vh-badge', `vh-badge--${(v.metodoPago).toLowerCase()}`]">{{ v.metodoPago }}</span>
              <span v-else style="color:var(--b3);font-size:10px;">—</span>
            </td>
            <td data-label="Total" style="text-align:right;font-weight:700;color:#6366f1;">Bs. {{ formatNum(v.total) }}</td>
            <td data-label="Estado">
              <span :class="['vh-estado', `vh-estado--${v.estadoVenta.toLowerCase()}`]">{{ v.estadoVenta }}</span>
            </td>
            <td data-label="Documentos" @click.stop>
              <div class="vh-docs">
                <button
                  v-for="t in tiposDoc" :key="t.codigo"
                  :class="['vh-doc-chip', { 'vh-doc-chip--on': tieneDoc(v, t.codigo) }]"
                  :style="tieneDoc(v, t.codigo) ? { color: t.color, borderColor: t.color + '66', background: t.color + '1a' } : null"
                  :title="tieneDoc(v, t.codigo) ? `Ver ${t.etiqueta}${contarDocs(v, t.codigo) > 1 ? ` (${contarDocs(v, t.codigo)})` : ''}` : `${t.etiqueta}: sin cargar`"
                  :disabled="!tieneDoc(v, t.codigo)"
                  @click.stop="verDocumento(v, t)"
                >{{ t.corto }}<sup v-if="contarDocs(v, t.codigo) > 1" class="vh-doc-count">{{ contarDocs(v, t.codigo) }}</sup></button>
              </div>
            </td>
            <td class="vh-td-acciones" @click.stop>
              <button v-if="v.estadoVenta !== 'ANULADA'" class="cp-icon-btn cp-icon-btn--danger" title="Anular" @click.stop="anular(v)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══ MODAL DETALLE ══ -->
    <transition name="modal-fade">
      <div v-if="detalleModal" class="ct-modal-backdrop">
        <div class="ct-modal" style="max-width:560px;">
          <div class="ct-modal-header">
            <span>{{ detalle && detalle.venta ? detalle.venta.nroVenta : '' }}</span>
            <button class="ct-modal-close" @click="detalleModal = false">✕</button>
          </div>
          <div class="ct-modal-body" style="padding:0;">
            <div v-if="loadingDetalle" class="cp-loading" style="padding:40px;"><div class="ct-spinner"></div></div>
            <template v-else-if="detalle">
              <!-- Cabecera venta -->
              <div style="padding:14px 16px;border-bottom:1px solid var(--b1);display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div><div style="font-size:9px;color:var(--t4);">Fecha</div><div style="font-size:12px;color:var(--t2);">{{ formatFecha(detalle.venta.fecha) }}</div></div>
                <div><div style="font-size:9px;color:var(--t4);">Estado</div><span :class="['vh-estado', `vh-estado--${detalle.venta.estadoVenta.toLowerCase()}`]">{{ detalle.venta.estadoVenta }}</span></div>
                <div><div style="font-size:9px;color:var(--t4);">Cliente</div><div style="font-size:12px;color:var(--t2);">{{ detalle.venta.nombreCliente || '—' }}</div></div>
                <div><div style="font-size:9px;color:var(--t4);">Método de pago</div><div style="font-size:12px;color:var(--t2);">{{ detalle.venta.metodoPago || '—' }}</div></div>
                <div v-if="detalle.cotizacion" style="grid-column:1/-1;"><div style="font-size:9px;color:var(--t4);">Cotización de origen</div><a class="vh-link" @click="abrirCotizacion(detalle.cotizacion.id)">{{ detalle.cotizacion.nroCotizacion }}</a> <span style="font-size:11px;color:var(--t4);">del {{ formatFecha(detalle.cotizacion.fecha) }}</span></div>
                <div v-if="detalle.venta.observaciones" style="grid-column:1/-1;"><div style="font-size:9px;color:var(--t4);">Observaciones</div><div style="font-size:12px;color:var(--t3);">{{ detalle.venta.observaciones }}</div></div>
              </div>
              <!-- Items -->
              <div style="padding:10px 16px;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead><tr style="color:var(--t5);font-size:10px;text-transform:uppercase;">
                    <th style="text-align:left;padding:4px 0;">Producto</th>
                    <th style="text-align:right;padding:4px 0;">Cant.</th>
                    <th style="text-align:right;padding:4px 0;">Precio</th>
                    <th style="text-align:right;padding:4px 0;">Subtotal</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="d in detalle.detalles" :key="d.id" style="border-top:1px solid #0d1a2d;">
                      <td style="padding:6px 0;color:var(--scroll);">{{ d.nombreProducto }}</td>
                      <td style="text-align:right;color:var(--t3);">{{ formatCant(d.cantidad) }}</td>
                      <td style="text-align:right;color:var(--t3);font-size:11px;">
                        <div>Bs. {{ formatNum(d.precioUnitario) }}</div>
                        <div v-if="d.porcentajeFactura > 0" style="color:var(--t5);font-size:10px;">
                          (+ IVA: Bs. {{ formatNum(d.precioUnitario * (1 + d.porcentajeFactura / 100)) }})
                        </div>
                      </td>
                      <td style="text-align:right;color:#6366f1;font-weight:600;">Bs. {{ formatNum(d.subtotal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Totales -->
              <div style="padding:10px 16px;border-top:1px solid var(--b1);display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--t4);"><span>Subtotal</span><span>Bs. {{ formatNum(detalle.venta.subtotal) }}</span></div>
                <div v-if="detalle.venta.descuento > 0" style="display:flex;justify-content:space-between;font-size:11px;color:var(--t4);"><span>Descuento</span><span>- Bs. {{ formatNum(detalle.venta.descuento) }}</span></div>
                <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;color:var(--t2);padding-top:4px;border-top:1px solid var(--b1);"><span>TOTAL</span><span style="color:#6366f1;">Bs. {{ formatNum(detalle.venta.total) }}</span></div>
                <div v-if="detalle.venta.montoPagado" style="display:flex;justify-content:space-between;font-size:11px;color:var(--t4);"><span>Pagado</span><span>Bs. {{ formatNum(detalle.venta.montoPagado) }}</span></div>
                <div v-if="detalle.venta.cambio > 0" style="display:flex;justify-content:space-between;font-size:11px;color:#4ade80;"><span>Cambio</span><span>Bs. {{ formatNum(detalle.venta.cambio) }}</span></div>
              </div>
              <!-- Pagos -->
              <div class="vh-docs-section">
                <div class="vh-docs-title">Pagos <span>Cada pago puede tener su comprobante</span></div>
                <div v-if="loadingPagos" class="ct-spinner" style="width:16px;height:16px;"></div>
                <template v-else-if="pagosInfo">
                  <div class="vh-pagos-resumen">
                    <div><span>Total</span><b>Bs. {{ formatNum(pagosInfo.total) }}</b></div>
                    <div><span>Pagado</span><b style="color:#4ade80;">Bs. {{ formatNum(pagosInfo.pagado) }}</b></div>
                    <div><span>Saldo</span><b :style="{ color: pagosInfo.saldo > 0 ? '#f87171' : 'var(--t3)' }">Bs. {{ formatNum(pagosInfo.saldo) }}</b></div>
                  </div>
                  <div v-if="pagosInfo.pagoInicialSinDetalle > 0" class="vh-doc-row">
                    <div class="vh-doc-info">
                      <div class="vh-doc-name">Pago al registrar la venta</div>
                      <div class="vh-doc-file">{{ formatFecha(detalle.venta.fecha) }} · {{ etiquetaMetodo(detalle.venta.metodoPago) || '—' }}</div>
                      <div class="vh-doc-file vh-doc-file--empty">Sin comprobante</div>
                    </div>
                    <div class="vh-pago-monto">Bs. {{ formatNum(pagosInfo.pagoInicialSinDetalle) }}</div>
                    <div class="vh-doc-actions">
                      <div v-if="subiendoComprobante === 'inicial'" class="ct-spinner" style="width:16px;height:16px;"></div>
                      <button v-else class="vh-doc-btn vh-doc-btn--primary" :disabled="!!subiendoComprobante" title="Subir el comprobante del pago hecho al vender" @click="elegirComprobante({ inicial: true })">📎 Subir</button>
                    </div>
                  </div>
                  <div v-if="!pagosInfo.pagos.length && !(pagosInfo.pagoInicialSinDetalle > 0)" class="vh-doc-file vh-doc-file--empty" style="padding:4px 0;">Sin pagos registrados</div>
                  <div v-for="pg in pagosInfo.pagos" :key="pg.id" class="vh-doc-row">
                    <div class="vh-doc-info">
                      <div class="vh-doc-name">
                        {{ etiquetaMetodo(pg.metodoPago) }}
                        <span :class="['vh-pago-origen', `vh-pago-origen--${pg.origen.toLowerCase()}`]">{{ pg.origen === 'POS' ? 'Al vender' : 'Abono' }}</span>
                      </div>
                      <div class="vh-doc-file">
                        {{ formatFecha(pg.fecha) }}<span v-if="pg.fuenteNombre"> · {{ pg.fuenteNombre }}</span><span v-if="pg.referencia"> · Ref. {{ pg.referencia }}</span><span v-if="pg.observaciones"> · {{ pg.observaciones }}</span>
                      </div>
                      <div class="vh-doc-file" :title="pg.comprobanteNombre || ''">
                        <template v-if="pg.comprobanteNombre">📎 {{ pg.comprobanteNombre }} · {{ formatTamano(pg.comprobanteTamano) }}</template>
                        <span v-else class="vh-doc-file--empty">Sin comprobante</span>
                      </div>
                    </div>
                    <div class="vh-pago-monto">Bs. {{ formatNum(pg.monto) }}</div>
                    <div class="vh-doc-actions">
                      <div v-if="subiendoComprobante === pg.id" class="ct-spinner" style="width:16px;height:16px;"></div>
                      <template v-else>
                        <button v-if="pg.comprobanteNombre" class="vh-doc-btn" @click="verComprobante(pg)">Ver</button>
                        <button class="vh-doc-btn vh-doc-btn--primary" :disabled="!!subiendoComprobante" :title="pg.comprobanteNombre ? 'Reemplazar comprobante' : 'Subir comprobante'" @click="elegirComprobante(pg)">{{ pg.comprobanteNombre ? 'Cambiar' : '📎 Subir' }}</button>
                        <button v-if="pg.comprobanteNombre && puedeEliminarDoc" class="vh-doc-btn vh-doc-btn--danger" title="Quitar comprobante" @click="eliminarComprobante(pg)">🗑</button>
                        <button v-if="esAdmin && pg.origen === 'ABONO'" class="vh-doc-btn vh-doc-btn--danger" title="Eliminar pago (revierte el ingreso en la fuente)" @click="eliminarPago(pg)">✕</button>
                      </template>
                    </div>
                  </div>
                  <input ref="comprobanteInput" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" style="display:none;" @change="onComprobanteSeleccionado" />

                  <div v-if="esAdmin && pagosInfo.saldo > 0 && detalle.venta.estadoVenta !== 'ANULADA'">
                    <button v-if="!pagoForm.abierto" class="vh-doc-btn vh-doc-btn--primary" style="margin-top:8px;" @click="abrirFormPago">+ Registrar pago</button>
                    <div v-else class="vh-com-form">
                      <div class="vh-field"><label>Monto (Bs.)</label><input v-model.number="pagoForm.monto" class="ide-input" type="number" min="0" step="0.01" /></div>
                      <div class="vh-field"><label>Fecha</label><input v-model="pagoForm.fecha" class="ide-input" type="date" /></div>
                      <div class="vh-field">
                        <label>Método</label>
                        <select v-model="pagoForm.metodoPago" class="ide-select">
                          <option v-for="m in metodosAbono" :key="m.value" :value="m.value">{{ m.label }}</option>
                        </select>
                      </div>
                      <div class="vh-field"><label>Referencia</label><input v-model="pagoForm.referencia" class="ide-input" placeholder="Nro. transacción, cheque..." /></div>
                      <div class="vh-field" style="grid-column:1/-1;">
                        <label>Fuente de fondos (donde entra el dinero)</label>
                        <select v-model="pagoForm.fuenteId" class="ide-select">
                          <option value="">Seleccionar fuente...</option>
                          <option v-for="f in fuentes" :key="f.id" :value="f.id">{{ f.nombre }}</option>
                        </select>
                      </div>
                      <div class="vh-field" style="grid-column:1/-1;"><label>Observaciones</label><input v-model="pagoForm.observaciones" class="ide-input" placeholder="Opcional" /></div>
                      <div class="vh-field" style="grid-column:1/-1;">
                        <label>Comprobante (opcional)</label>
                        <input ref="pagoComprobanteNuevo" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" class="ide-input" style="padding:5px;" />
                      </div>
                      <div style="grid-column:1/-1;display:flex;gap:6px;justify-content:flex-end;">
                        <button class="vh-doc-btn" @click="pagoForm.abierto = false">Cancelar</button>
                        <button class="vh-doc-btn vh-doc-btn--primary" :disabled="guardandoPago" @click="registrarPago">{{ guardandoPago ? 'Guardando...' : 'Registrar pago' }}</button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <!-- Documentos -->
              <div class="vh-docs-section">
                <div class="vh-docs-title">Documentos <span>PDF, JPG, PNG o WEBP · máx. 5 MB</span></div>
                <div v-for="t in tiposDoc" :key="t.codigo" class="vh-doc-grupo">
                  <div class="vh-doc-row">
                    <span class="vh-doc-chip vh-doc-chip--on" :style="{ color: t.color, borderColor: t.color + '66', background: t.color + '1a' }">{{ t.corto }}</span>
                    <div class="vh-doc-info">
                      <div class="vh-doc-name">{{ t.etiqueta }}<span v-if="t.multiple && docsDe(t.codigo).length" style="font-weight:400;color:var(--t4);"> · {{ docsDe(t.codigo).length }}</span></div>
                      <template v-if="!t.multiple">
                        <div v-if="docsDe(t.codigo)[0]" class="vh-doc-file" :title="docsDe(t.codigo)[0].nombreOriginal">
                          {{ docsDe(t.codigo)[0].nombreOriginal }} · {{ formatTamano(docsDe(t.codigo)[0].tamano) }}
                        </div>
                        <div v-else class="vh-doc-file vh-doc-file--empty">Sin cargar</div>
                      </template>
                      <div v-else-if="!docsDe(t.codigo).length" class="vh-doc-file vh-doc-file--empty">Sin cargar · puedes subir varias</div>
                    </div>
                    <div class="vh-doc-actions">
                      <div v-if="subiendoTipo === t.codigo" class="ct-spinner" style="width:16px;height:16px;"></div>
                      <template v-else>
                        <template v-if="!t.multiple && docsDe(t.codigo)[0]">
                          <button class="vh-doc-btn" @click="verDocumento(detalle.venta, t, docsDe(t.codigo)[0])">Ver</button>
                        </template>
                        <button
                          v-if="detalle.venta.estadoVenta !== 'ANULADA'"
                          class="vh-doc-btn vh-doc-btn--primary"
                          :disabled="!!subiendoTipo"
                          @click="elegirArchivo(t.codigo)"
                        >{{ t.multiple ? '+ Agregar' : (docsDe(t.codigo)[0] ? 'Reemplazar' : 'Subir') }}</button>
                        <button v-if="!t.multiple && docsDe(t.codigo)[0] && puedeEliminarDoc" class="vh-doc-btn vh-doc-btn--danger" title="Eliminar" @click="eliminarDocumento(docsDe(t.codigo)[0], t)">✕</button>
                      </template>
                    </div>
                  </div>
                  <!-- Archivos de los tipos múltiples (tablillas de pesaje) -->
                  <template v-if="t.multiple">
                    <div v-for="(doc, i) in docsDe(t.codigo)" :key="doc.id" class="vh-doc-row vh-doc-row--sub">
                      <div class="vh-doc-info">
                        <div class="vh-doc-file" :title="doc.nombreOriginal">{{ i + 1 }}. {{ doc.nombreOriginal }} · {{ formatTamano(doc.tamano) }}</div>
                      </div>
                      <div class="vh-doc-actions">
                        <button class="vh-doc-btn" @click="verDocumento(detalle.venta, t, doc)">Ver</button>
                        <button v-if="puedeEliminarDoc" class="vh-doc-btn vh-doc-btn--danger" title="Eliminar" @click="eliminarDocumento(doc, t)">✕</button>
                      </div>
                    </div>
                  </template>
                </div>
                <input ref="docInput" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" style="display:none;" @change="onDocSeleccionado" />
              </div>
              <!-- Comisiones al personal del cliente -->
              <div v-if="esAdmin" class="vh-docs-section">
                <div class="vh-docs-title">Comisiones <span>Se registran como egreso en la fuente de fondos elegida</span></div>
                <div v-if="loadingComisiones" class="ct-spinner" style="width:16px;height:16px;"></div>
                <template v-else>
                  <div v-if="!comisiones.length" class="vh-doc-file vh-doc-file--empty" style="padding:4px 0;">Sin comisiones registradas</div>
                  <div v-for="c in comisiones" :key="c.id" class="vh-doc-row">
                    <div class="vh-doc-info">
                      <div class="vh-doc-name">{{ c.beneficiarioNombre }}<span v-if="c.beneficiarioCargo" style="font-weight:400;color:var(--t4);"> · {{ c.beneficiarioCargo }}</span></div>
                      <div class="vh-doc-file">{{ formatFecha(c.fecha) }} · {{ c.fuenteNombre || 'Fuente' }}<span v-if="c.observaciones"> · {{ c.observaciones }}</span></div>
                    </div>
                    <div style="font-weight:700;color:#f59e0b;font-size:12px;">Bs. {{ formatNum(c.monto) }}</div>
                    <button class="vh-doc-btn vh-doc-btn--danger" title="Eliminar comisión (revierte el egreso)" @click="eliminarComision(c)">✕</button>
                  </div>
                  <div v-if="comisiones.length > 1" style="text-align:right;font-size:11px;color:var(--t4);padding-top:4px;">Total comisiones: <b>Bs. {{ formatNum(totalComisiones) }}</b></div>

                  <div v-if="detalle.venta.estadoVenta !== 'ANULADA'">
                    <button v-if="!comisionForm.abierto" class="vh-doc-btn vh-doc-btn--primary" style="margin-top:8px;" @click="abrirFormComision">+ Pagar comisión</button>
                    <div v-else class="vh-com-form">
                      <div v-if="!detalle.venta.contactoClienteId" class="vh-field" style="grid-column:1/-1;">
                        <label>Cliente</label>
                        <select v-model="comisionForm.contactoId" class="ide-select" @change="cargarRepresentantes(comisionForm.contactoId)">
                          <option value="">Seleccionar cliente...</option>
                          <option v-for="c in contactos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                        </select>
                      </div>
                      <div class="vh-field" style="grid-column:1/-1;">
                        <label>Personal del cliente</label>
                        <select v-model="comisionForm.representanteId" class="ide-select">
                          <option value="">{{ representantes.length ? 'Seleccionar...' : 'El cliente no tiene representantes registrados' }}</option>
                          <option v-for="r in representantes" :key="r.id" :value="r.id">{{ r.nombre }}{{ r.cargo ? ` — ${r.cargo}` : '' }}{{ r.activo ? '' : ' (inactivo)' }}</option>
                        </select>
                      </div>
                      <div class="vh-field">
                        <label>Monto (Bs.)</label>
                        <input v-model.number="comisionForm.monto" class="ide-input" type="number" min="0" step="0.01" />
                      </div>
                      <div class="vh-field">
                        <label>Fecha</label>
                        <input v-model="comisionForm.fecha" class="ide-input" type="date" />
                      </div>
                      <div class="vh-field" style="grid-column:1/-1;">
                        <label>Fuente de fondos</label>
                        <select v-model="comisionForm.fuenteId" class="ide-select">
                          <option value="">Seleccionar fuente...</option>
                          <option v-for="f in fuentes" :key="f.id" :value="f.id">{{ f.nombre }}{{ f.saldoActual != null ? ` — Saldo Bs. ${formatNum(f.saldoActual)}` : '' }}</option>
                        </select>
                      </div>
                      <div class="vh-field" style="grid-column:1/-1;">
                        <label>Observaciones</label>
                        <input v-model="comisionForm.observaciones" class="ide-input" placeholder="Opcional" />
                      </div>
                      <div style="grid-column:1/-1;display:flex;gap:6px;justify-content:flex-end;">
                        <button class="vh-doc-btn" @click="comisionForm.abierto = false">Cancelar</button>
                        <button class="vh-doc-btn vh-doc-btn--primary" :disabled="guardandoComision" @click="registrarComision">{{ guardandoComision ? 'Guardando...' : 'Registrar pago' }}</button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </div>
          <div class="ct-modal-footer" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;">
            <div style="display:flex;gap:8px;">
              <button class="ct-btn-print" title="Imprimir nota de venta" :disabled="!detalle || imprimiendo" @click="imprimirNotaVenta(detalle.venta)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path></svg>
                Nota de venta
              </button>
              <button class="ct-btn-print" style="background:#0f766e;" title="Hoja de ruta para el transporte" :disabled="!detalle" @click="abrirHojaRuta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Hoja de ruta
              </button>
              <button class="ct-btn-print" style="background:var(--b1);color:var(--t3);" title="NIT, teléfonos, dirección, N° de pesaje y factura" :disabled="!detalle" @click="abrirDatosNota">
                Datos nota
              </button>
              <button class="ct-btn-print" title="Imprimir ticket" @click="imprimirTicket(detalle.venta)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path><line x1="12" y1="9" x2="12" y2="15"></line><line x1="9" y1="12" x2="15" y2="12"></line></svg>
                Ticket
              </button>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="ct-btn-cancel" @click="detalleModal = false">Cerrar</button>
              <button v-if="detalle && detalle.venta && detalle.venta.estadoVenta !== 'ANULADA'" class="ct-btn-ok" style="background:#ef4444;" @click="anular(detalle.venta); detalleModal = false">Anular Venta</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL DATOS DE LA NOTA ══ -->
    <transition name="modal-fade">
      <div v-if="datosNota.abierto" class="ct-modal-backdrop" style="z-index:210;">
        <div class="ct-modal" style="max-width:520px;">
          <div class="ct-modal-header">
            <span>Datos para la nota de venta</span>
            <button class="ct-modal-close" @click="datosNota.abierto = false">✕</button>
          </div>
          <div class="ct-modal-body vh-form-grid">
            <div class="vh-field" style="grid-column:1/-1;">
              <label>Cliente registrado (para representante y comisiones)</label>
              <select v-model="datosNota.form.contactoClienteId" class="ide-select" @change="onContactoNotaChange">
                <option value="">Sin vincular</option>
                <option v-for="c in contactos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </div>
            <div class="vh-field" style="grid-column:1/-1;"><label>Nombre en la nota</label><input v-model="datosNota.form.nombreCliente" class="ide-input" /></div>
            <div class="vh-field"><label>NIT / C.I.</label><input v-model="datosNota.form.nitCi" class="ide-input" /></div>
            <div class="vh-field"><label>Teléfonos</label><input v-model="datosNota.form.telefonoCliente" class="ide-input" /></div>
            <div class="vh-field" style="grid-column:1/-1;"><label>Dirección</label><input v-model="datosNota.form.direccionCliente" class="ide-input" /></div>
            <div class="vh-field"><label>N° de pesaje / tablilla</label><input v-model="datosNota.form.nroPesaje" class="ide-input" /></div>
            <div class="vh-field"><label>N° de factura</label><input v-model="datosNota.form.nroFactura" class="ide-input" /></div>
            <div class="vh-field" style="grid-column:1/-1;"><label>Observaciones</label><input v-model="datosNota.form.observaciones" class="ide-input" /></div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="datosNota.abierto = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="datosNota.guardando" @click="guardarDatosNota">{{ datosNota.guardando ? 'Guardando...' : 'Guardar' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL HOJA DE RUTA ══ -->
    <transition name="modal-fade">
      <div v-if="hojaRuta.abierto" class="ct-modal-backdrop" style="z-index:210;">
        <div class="ct-modal" style="max-width:560px;">
          <div class="ct-modal-header">
            <span>Hoja de ruta{{ hojaRuta.nro ? ` N° ${hojaRuta.nro}` : '' }} · {{ detalle && detalle.venta ? detalle.venta.nroVenta : '' }}</span>
            <button class="ct-modal-close" @click="hojaRuta.abierto = false">✕</button>
          </div>
          <div v-if="hojaRuta.cargando" class="cp-loading" style="padding:40px;"><div class="ct-spinner"></div></div>
          <div v-else class="ct-modal-body vh-form-grid">
            <div class="vh-field" style="grid-column:1/-1;"><label>Empresa de transporte</label><input v-model="hojaRuta.form.empresaTransporte" class="ide-input" /></div>
            <div class="vh-field"><label>Conductor</label><input v-model="hojaRuta.form.conductor" class="ide-input" /></div>
            <div class="vh-field"><label>C.I. conductor</label><input v-model="hojaRuta.form.conductorCi" class="ide-input" /></div>
            <div class="vh-field"><label>Celular conductor</label><input v-model="hojaRuta.form.conductorCelular" class="ide-input" /></div>
            <div class="vh-field"><label>Placa</label><input v-model="hojaRuta.form.placa" class="ide-input" /></div>
            <div class="vh-field" style="grid-column:1/-1;"><label>Vehículo (marca / tipo)</label><input v-model="hojaRuta.form.vehiculo" class="ide-input" /></div>
            <div class="vh-field"><label>Origen</label><input v-model="hojaRuta.form.origen" class="ide-input" /></div>
            <div class="vh-field"><label>Destino</label><input v-model="hojaRuta.form.destino" class="ide-input" /></div>
            <div class="vh-field"><label>Fecha de salida</label><input v-model="hojaRuta.form.fechaSalida" class="ide-input" type="date" /></div>
            <div class="vh-field" style="grid-column:1/-1;"><label>Observaciones</label><input v-model="hojaRuta.form.observaciones" class="ide-input" /></div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="hojaRuta.abierto = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="hojaRuta.guardando || hojaRuta.cargando" @click="guardarHojaRuta">{{ hojaRuta.guardando ? 'Guardando...' : 'Guardar e imprimir' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL DETALLE COTIZACIÓN ══ -->
    <transition name="modal-fade">
      <div v-if="cotDetalle.abierto" class="ct-modal-backdrop" style="z-index:205;">
        <div class="ct-modal" style="max-width:560px;">
          <div class="ct-modal-header">
            <span>{{ cotDetalle.datos ? cotDetalle.datos.cotizacion.nroCotizacion : 'Cotización' }}</span>
            <button class="ct-modal-close" @click="cotDetalle.abierto = false">✕</button>
          </div>
          <div class="ct-modal-body" style="padding:0;">
            <div v-if="cotDetalle.cargando" class="cp-loading" style="padding:40px;"><div class="ct-spinner"></div></div>
            <template v-else-if="cotDetalle.datos">
              <div style="padding:14px 16px;border-bottom:1px solid var(--b1);display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div><div class="vh-lbl">Fecha</div><div class="vh-val">{{ formatFecha(cotDetalle.datos.cotizacion.fecha) }}</div></div>
                <div><div class="vh-lbl">Estado</div><span :class="['vh-estado', `vh-estado--${cotDetalle.datos.cotizacion.estadoCotizacion.toLowerCase()}`]">{{ cotDetalle.datos.cotizacion.estadoCotizacion }}</span></div>
                <div><div class="vh-lbl">Cliente</div><div class="vh-val">{{ cotDetalle.datos.cotizacion.nombreCliente || '—' }}</div></div>
                <div><div class="vh-lbl">Válida hasta</div><div class="vh-val">{{ cotDetalle.datos.cotizacion.validoHasta ? formatFecha(cotDetalle.datos.cotizacion.validoHasta) : '—' }}</div></div>
                <div v-if="cotDetalle.datos.cotizacion.nitCi"><div class="vh-lbl">NIT / C.I.</div><div class="vh-val">{{ cotDetalle.datos.cotizacion.nitCi }}</div></div>
                <div v-if="cotDetalle.datos.cotizacion.telefonoCliente"><div class="vh-lbl">Teléfono</div><div class="vh-val">{{ cotDetalle.datos.cotizacion.telefonoCliente }}</div></div>
                <div v-if="cotDetalle.datos.cotizacion.ventaId" style="grid-column:1/-1;">
                  <div class="vh-lbl">Convertida en venta</div>
                  <a class="vh-link" @click="cotDetalle.abierto = false; abrirDetalle({ id: cotDetalle.datos.cotizacion.ventaId })">{{ cotDetalle.datos.cotizacion.nroVenta }}</a>
                </div>
                <div v-if="cotDetalle.datos.cotizacion.observaciones" style="grid-column:1/-1;"><div class="vh-lbl">Observaciones</div><div style="font-size:12px;color:var(--t3);">{{ cotDetalle.datos.cotizacion.observaciones }}</div></div>
              </div>
              <div style="padding:10px 16px;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead><tr style="color:var(--t5);font-size:10px;text-transform:uppercase;">
                    <th style="text-align:left;padding:4px 0;">Producto</th>
                    <th style="text-align:right;padding:4px 0;">Cant.</th>
                    <th style="text-align:right;padding:4px 0;">Precio</th>
                    <th style="text-align:right;padding:4px 0;">Subtotal</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="d in cotDetalle.datos.detalles" :key="d.id" style="border-top:1px solid #0d1a2d;">
                      <td style="padding:6px 0;color:var(--scroll);">{{ [d.categoria, d.subcategoria, d.nombreProducto].filter(Boolean).join(' ') }}</td>
                      <td style="text-align:right;color:var(--t3);">{{ formatCant(d.cantidad) }}</td>
                      <td style="text-align:right;color:var(--t3);font-size:11px;">Bs. {{ formatNum(d.precioUnitario) }}</td>
                      <td style="text-align:right;color:#6366f1;font-weight:600;">Bs. {{ formatNum(d.subtotal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="padding:10px 16px;border-top:1px solid var(--b1);display:flex;justify-content:space-between;font-size:14px;font-weight:800;color:var(--t2);">
                <span>TOTAL COTIZADO</span><span style="color:#6366f1;">Bs. {{ formatNum(cotDetalle.datos.cotizacion.total) }}</span>
              </div>
            </template>
          </div>
          <div v-if="cotDetalle.datos" class="ct-modal-footer" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;">
            <button class="ct-btn-print" @click="imprimirCotizacion(cotDetalle.datos.cotizacion)">Imprimir</button>
            <div style="display:flex;gap:8px;">
              <button v-if="esConvertible(cotDetalle.datos.cotizacion) && puedeEliminarDoc" class="ct-btn-cancel" style="color:#f87171;" @click="anularCotizacion(cotDetalle.datos.cotizacion)">Anular</button>
              <button v-if="esConvertible(cotDetalle.datos.cotizacion)" class="ct-btn-ok" @click="convertirCotizacion(cotDetalle.datos.cotizacion)">Convertir en venta</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL VISTA PREVIA DOCUMENTO ══ -->
    <transition name="modal-fade">
      <div v-if="preview.abierto" class="ct-modal-backdrop" style="z-index:210;" @click.self="cerrarPreview">
        <div class="ct-modal" style="max-width:900px;height:88vh;">
          <div class="ct-modal-header">
            <span>{{ preview.titulo }}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <template v-if="preview.items.length > 1">
                <button class="vh-doc-btn" :disabled="preview.idx === 0 || preview.cargando" @click="moverPreview(-1)">‹</button>
                <span style="font-size:11px;color:var(--t4);">{{ preview.idx + 1 }} / {{ preview.items.length }}</span>
                <button class="vh-doc-btn" :disabled="preview.idx === preview.items.length - 1 || preview.cargando" @click="moverPreview(1)">›</button>
              </template>
              <button class="ct-modal-close" @click="cerrarPreview">✕</button>
            </div>
          </div>
          <div class="ct-modal-body vh-preview-body">
            <div v-if="preview.cargando" class="ct-spinner"></div>
            <img v-else-if="preview.url && preview.esImagen" :src="preview.url" :alt="preview.titulo" class="vh-preview-img" />
            <iframe v-else-if="preview.url" :src="preview.url" :title="preview.titulo" class="vh-preview-frame"></iframe>
            <div v-else class="cp-empty">No se pudo cargar el documento</div>
          </div>
          <div class="ct-modal-footer">
            <button v-if="preview.url" class="ct-btn-cancel" @click="abrirPreviewPestana">Abrir en pestaña nueva</button>
            <button v-if="preview.url" class="ct-btn-ok" @click="descargarPreview">Descargar</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { htmlNotaVenta, htmlHojaRuta, htmlCotizacion, escribirDocumento, abrirVentanaPendiente } from '@/common/impresion-venta'

const TIPOS_DOC = [
  { codigo: 'TABLILLA_PESAJE', etiqueta: 'Tablilla de pesaje', corto: 'P', color: '#22c55e', multiple: true },
  { codigo: 'OTROS', etiqueta: 'Otros', corto: 'O', color: '#f59e0b' },
]
const MAX_TAMANO_DOC = 5 * 1024 * 1024
const MIME_DOC = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export default {
  name: 'VentasHistorial',
  data: () => ({
    ventas: [], loading: false,
    sucursales: [],
    filtros: {
      fechaDesde: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      fechaHasta: new Date().toISOString().split('T')[0],
      sucursalId: '',
      estadoVenta: '',
      estadoCotizacion: '',
      nombreCliente: '',
      conSaldo: '',
    },
    vista: 'VENTAS',
    cotizaciones: [], loadingCot: false,
    cotDetalle: { abierto: false, cargando: false, datos: null },
    detalleModal: false, detalle: null, loadingDetalle: false,
    tiposDoc: TIPOS_DOC,
    tipoDocPendiente: null, subiendoTipo: null,
    preview: { abierto: false, cargando: false, url: null, esImagen: false, titulo: '', nombre: '', items: [], idx: 0 },
    imprimiendo: false,
    pagosInfo: null, loadingPagos: false, guardandoPago: false, subiendoComprobante: null, pagoComprobantePendiente: null,
    pagoForm: { abierto: false, monto: null, fecha: '', metodoPago: 'EFECTIVO', fuenteId: '', referencia: '', observaciones: '' },
    metodosAbono: [
      { value: 'EFECTIVO', label: 'Efectivo' }, { value: 'TRANSFERENCIA', label: 'Transferencia' },
      { value: 'QR', label: 'QR' }, { value: 'CHEQUE', label: 'Cheque' }, { value: 'TARJETA', label: 'Tarjeta' },
    ],
    contactos: [], representantes: [], fuentes: [],
    comisiones: [], loadingComisiones: false, guardandoComision: false,
    comisionForm: { abierto: false, contactoId: '', representanteId: '', monto: null, fuenteId: '', fecha: '', observaciones: '' },
    datosNota: { abierto: false, guardando: false, form: {} },
    hojaRuta: { abierto: false, cargando: false, guardando: false, nro: null, form: {} },
  }),
  computed: {
    sucursalActualId() { return this.$store.getters.sucursalActualId },
    esAdmin() { return ['ADMIN_CLIENTE', 'SUPER_ADMIN'].includes(this.$store.getters.currentRol) },
    totalComisiones() { return this.comisiones.reduce((s, c) => s + Number(c.monto || 0), 0) },
    puedeEliminarDoc() { return ['ADMIN_CLIENTE', 'SUPER_ADMIN', 'ENCARGADO'].includes(this.$store.getters.currentRol) },
    totalCotizacionesVigentes() { return this.cotizaciones.filter(c => c.estadoCotizacion === 'VIGENTE').reduce((s, c) => s + Number(c.total), 0) },
    totalDia() { return this.ventas.filter(v => v.estadoVenta !== 'ANULADA').reduce((s, v) => s + Number(v.total), 0) },
    totalSaldoPendiente() { return this.ventas.filter(v => v.estadoVenta !== 'ANULADA').reduce((s, v) => s + Math.max(0, Number(v.total) - Number(v.montoPagado || 0)), 0) },
  },
  mounted() {
    this.cargarSucursales()
    try { if (localStorage.getItem('vh-vista') === 'COTIZACIONES') this.vista = 'COTIZACIONES' } catch (e) { /* sin almacenamiento */ }
    this.cargar()
  },
  watch: {
    sucursalActualId() { this.cargar() },
  },
  methods: {
    async cargarSucursales() {
      try {
        this.sucursales = await this.$service.list('sucursales?soloActivas=true') || []
      } catch (e) { console.error(e) }
    },
    cambiarVista(v) {
      if (this.vista === v) return
      this.vista = v
      try { localStorage.setItem('vh-vista', v) } catch (e) { /* sin almacenamiento */ }
      this.cargar()
    },
    async cargar() {
      if (this.vista === 'COTIZACIONES') return this.cargarCotizaciones()
      this.loading = true
      try {
        let url = 'ventas?'
        const sucId = this.filtros.sucursalId || this.sucursalActualId
        if (sucId) url += `sucursalId=${sucId}&`
        if (this.filtros.fechaDesde) url += `fechaDesde=${this.filtros.fechaDesde}&`
        if (this.filtros.fechaHasta) url += `fechaHasta=${this.filtros.fechaHasta}&`
        if (this.filtros.estadoVenta) url += `estadoVenta=${this.filtros.estadoVenta}&`
        if (this.filtros.nombreCliente) url += `nombreCliente=${encodeURIComponent(this.filtros.nombreCliente)}&`
        if (this.filtros.conSaldo) url += `conSaldo=${this.filtros.conSaldo}&`
        this.ventas = await this.$service.list(url) || []
      } finally { this.loading = false }
    },
    limpiarFiltros() {
      this.filtros.fechaDesde = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
      this.filtros.fechaHasta = new Date().toISOString().split('T')[0]
      this.filtros.sucursalId = ''
      this.filtros.estadoVenta = ''
      this.filtros.estadoCotizacion = ''
      this.filtros.nombreCliente = ''
      this.filtros.conSaldo = ''
      this.cargar()
    },
    async abrirDetalle(v) {
      this.detalle = null
      this.detalleModal = true
      this.loadingDetalle = true
      this.comisiones = []
      this.comisionForm.abierto = false
      this.pagosInfo = null
      this.pagoForm.abierto = false
      try { this.detalle = await this.$service.get(`ventas/${v.id}`) }
      finally { this.loadingDetalle = false }
      if (this.detalle) this.cargarPagos()
      if (this.esAdmin && this.detalle) this.cargarComisiones()
    },
    anular(v) {
      this.$confirm(`¿Anular la venta ${v.nroVenta}? Se revertirá el stock.`, async () => {
        try {
          await this.$service.put(`ventas/${v.id}/anular`, { motivo: '' })
          this.$message.success('Venta anulada')
          await this.cargar()
          if (this.detalleModal && this.detalle?.venta?.id === v.id) this.detalleModal = false
        } catch (e) { this.$message.error(e?.message || 'Error al anular') }
      })
    },
    // ── Cotizaciones ────────────────────────────────────────────────────────
    async cargarCotizaciones() {
      this.loadingCot = true
      try {
        const q = []
        const sucId = this.filtros.sucursalId || this.sucursalActualId
        if (sucId) q.push(`sucursalId=${sucId}`)
        if (this.filtros.fechaDesde) q.push(`fechaDesde=${this.filtros.fechaDesde}`)
        if (this.filtros.fechaHasta) q.push(`fechaHasta=${this.filtros.fechaHasta}`)
        if (this.filtros.estadoCotizacion) q.push(`estado=${this.filtros.estadoCotizacion}`)
        if (this.filtros.nombreCliente) q.push(`nombreCliente=${encodeURIComponent(this.filtros.nombreCliente)}`)
        this.cotizaciones = await this.$service.list(`cotizaciones?${q.join('&')}`) || []
      } finally { this.loadingCot = false }
    },
    esConvertible(c) { return ['VIGENTE', 'VENCIDA'].includes(c.estadoCotizacion) },
    async abrirCotizacion(id) {
      this.cotDetalle = { abierto: true, cargando: true, datos: null }
      try { this.cotDetalle.datos = await this.$service.get(`cotizaciones/${id}`) }
      catch (e) { this.cotDetalle.abierto = false }
      finally { this.cotDetalle.cargando = false }
    },
    // Abre el POS con la cotización cargada; la venta queda vinculada y la cotización conserva su detalle
    convertirCotizacion(c) {
      const avisoVencida = c.estadoCotizacion === 'VENCIDA' ? ' Está vencida: revisa los precios antes de cobrar.' : ''
      this.$confirm(`¿Convertir la cotización ${c.nroCotizacion} en venta? Se abrirá el punto de venta con sus productos y precios.${avisoVencida}`, () => {
        this.$router.push({ name: 'punto-venta', query: { cotizacion: c.id } })
      })
    },
    anularCotizacion(c) {
      this.$confirm(`¿Anular la cotización ${c.nroCotizacion}? Ya no se podrá convertir en venta.`, async () => {
        try {
          await this.$service.put(`cotizaciones/${c.id}/anular`, { motivo: '' })
          this.$message.success('Cotización anulada')
          if (this.cotDetalle.abierto) await this.abrirCotizacion(c.id)
          if (this.vista === 'COTIZACIONES') await this.cargarCotizaciones()
        } catch (e) { /* mensaje mostrado por el interceptor */ }
      })
    },
    async imprimirCotizacion(c) {
      const w = abrirVentanaPendiente()
      if (!w) return this.$message.error('Permite las ventanas emergentes para imprimir')
      try {
        const d = await this.$service.get(`cotizaciones/${c.id}/impresion`)
        if (d) escribirDocumento(w, htmlCotizacion(d))
        else w.close()
      } catch (e) { w.close() }
    },

    // ── Comisiones ──────────────────────────────────────────────────────────
    async cargarComisiones() {
      const venta = this.detalle?.venta
      if (!venta) return
      this.loadingComisiones = true
      try { this.comisiones = await this.$service.get(`ventas/${venta.id}/comisiones`) || [] }
      catch (e) { this.comisiones = [] }
      finally { this.loadingComisiones = false }
    },
    async cargarContactos() {
      if (this.contactos.length) return
      try { this.contactos = await this.$service.list('contactos-clientes') || [] } catch (e) { this.contactos = [] }
    },
    async cargarRepresentantes(contactoId) {
      this.representantes = []
      this.comisionForm.representanteId = ''
      if (!contactoId) return
      try {
        const reps = await this.$service.get(`contactos-clientes/${contactoId}/representantes`) || []
        this.representantes = reps
        const activo = reps.find(r => r.activo)
        if (activo) this.comisionForm.representanteId = activo.id
      } catch (e) { this.representantes = [] }
    },
    async cargarFuentes() {
      if (this.fuentes.length) return
      try { this.fuentes = (await this.$service.list('fuentes') || []).filter(f => f.activo !== false) } catch (e) { this.fuentes = [] }
    },
    async abrirFormComision() {
      const contactoId = this.detalle.venta.contactoClienteId || ''
      this.comisionForm = {
        abierto: true, contactoId, representanteId: '', monto: null, fuenteId: '',
        fecha: new Date().toISOString().split('T')[0], observaciones: '',
      }
      await Promise.all([this.cargarFuentes(), contactoId ? null : this.cargarContactos()])
      await this.cargarRepresentantes(contactoId)
    },
    async registrarComision() {
      const f = this.comisionForm
      if (!f.representanteId) return this.$message.error('Selecciona al personal del cliente')
      if (!(Number(f.monto) > 0)) return this.$message.error('Ingresa un monto mayor a 0')
      if (!f.fuenteId) return this.$message.error('Selecciona la fuente de fondos')
      this.guardandoComision = true
      try {
        await this.$http.post(`${this.$baseServer}ventas/${this.detalle.venta.id}/comisiones`, {
          representanteId: f.representanteId, monto: Number(f.monto), fuenteId: f.fuenteId,
          fecha: f.fecha, observaciones: f.observaciones || undefined,
        })
        this.$message.success('Comisión registrada en la fuente de fondos')
        this.comisionForm.abierto = false
        this.fuentes = []
        await this.cargarComisiones()
        this.sincronizarComisionesFila()
      } catch (e) { /* mensaje mostrado por el interceptor */ }
      finally { this.guardandoComision = false }
    },
    eliminarComision(c) {
      this.$confirm(`¿Eliminar la comisión de ${c.beneficiarioNombre} (Bs. ${this.formatNum(c.monto)})? Se anulará el egreso en la fuente de fondos.`, async () => {
        try {
          await this.$http.delete(`${this.$baseServer}ventas/${this.detalle.venta.id}/comisiones/${c.id}`)
          this.$message.success('Comisión eliminada')
          this.fuentes = []
          await this.cargarComisiones()
          this.sincronizarComisionesFila()
        } catch (e) { /* mensaje mostrado por el interceptor */ }
      })
    },
    sincronizarComisionesFila() {
      const fila = this.ventas.find(v => v.id === this.detalle?.venta?.id)
      if (fila) this.$set(fila, 'totalComisiones', this.totalComisiones)
    },

    // ── Datos de la nota ────────────────────────────────────────────────────
    async abrirDatosNota() {
      const v = this.detalle.venta
      this.datosNota = {
        abierto: true, guardando: false,
        form: {
          contactoClienteId: v.contactoClienteId || '', nombreCliente: v.nombreCliente || '',
          nitCi: v.nitCi || '', telefonoCliente: v.telefonoCliente || '', direccionCliente: v.direccionCliente || '',
          nroPesaje: v.nroPesaje || '', nroFactura: v.nroFactura || '', observaciones: v.observaciones || '',
        },
      }
      await this.cargarContactos()
    },
    onContactoNotaChange() {
      const c = this.contactos.find(x => x.id === this.datosNota.form.contactoClienteId)
      if (!c) return
      if (!this.datosNota.form.nombreCliente) this.datosNota.form.nombreCliente = c.nombre
      if (!this.datosNota.form.direccionCliente && c.direccion) this.datosNota.form.direccionCliente = c.direccion
    },
    async guardarDatosNota() {
      this.datosNota.guardando = true
      try {
        const res = await this.$http.put(`${this.$baseServer}ventas/${this.detalle.venta.id}/datos-nota`, this.datosNota.form)
        const venta = res.data?.datos
        if (venta) {
          this.detalle.venta = { ...this.detalle.venta, ...venta }
          const fila = this.ventas.find(x => x.id === venta.id)
          if (fila) Object.assign(fila, { nombreCliente: venta.nombreCliente, contactoClienteId: venta.contactoClienteId })
        }
        this.datosNota.abierto = false
        this.$message.success('Datos de la nota guardados')
      } catch (e) { /* mensaje mostrado por el interceptor */ }
      finally { this.datosNota.guardando = false }
    },

    // ── Hoja de ruta ────────────────────────────────────────────────────────
    async abrirHojaRuta() {
      const v = this.detalle.venta
      this.hojaRuta = { abierto: true, cargando: true, guardando: false, nro: null, form: {} }
      try {
        const h = await this.$service.get(`ventas/${v.id}/hoja-ruta`)
        const campos = ['empresaTransporte', 'conductor', 'conductorCi', 'conductorCelular', 'placa', 'vehiculo', 'origen', 'destino', 'fechaSalida', 'observaciones']
        const form = {}
        campos.forEach(k => { form[k] = (h && h[k]) || '' })
        if (!h) {
          form.fechaSalida = new Date().toISOString().split('T')[0]
          form.destino = v.direccionCliente || ''
        }
        this.hojaRuta.nro = h ? h.nroHojaRuta : null
        this.hojaRuta.form = form
      } catch (e) {
        this.hojaRuta.abierto = false
      } finally { this.hojaRuta.cargando = false }
    },
    async guardarHojaRuta() {
      this.hojaRuta.guardando = true
      // Se abre en el mismo clic: tras esperar al servidor el navegador bloquearía la ventana
      const w = abrirVentanaPendiente()
      try {
        await this.$http.put(`${this.$baseServer}ventas/${this.detalle.venta.id}/hoja-ruta`, this.hojaRuta.form)
        this.hojaRuta.abierto = false
        if (w) await this.imprimirDocumento(this.detalle.venta, htmlHojaRuta, w)
        else this.$message.error('Permite las ventanas emergentes para imprimir')
      } catch (e) {
        if (w) w.close()
      } finally { this.hojaRuta.guardando = false }
    },

    // ── Impresión (plantillas en common/impresion-venta.js) ──────────────────
    async imprimirDocumento(venta, generar, ventana = null) {
      const w = ventana || abrirVentanaPendiente()
      if (!w) return this.$message.error('Permite las ventanas emergentes para imprimir')
      this.imprimiendo = true
      try {
        const d = await this.$service.get(`ventas/${venta.id}/impresion`)
        if (!d) { w.close(); return }
        escribirDocumento(w, generar(d))
      } catch (e) {
        w.close()
      } finally { this.imprimiendo = false }
    },
    imprimirNotaVenta(venta) { return this.imprimirDocumento(venta, htmlNotaVenta) },
    imprimirHojaRuta(venta) { return this.imprimirDocumento(venta, htmlHojaRuta) },
    imprimirTicket(venta) {
      const w = window.open('', '_blank')
      const detalles = this.detalle?.detalles || []
      let html = `
        <html>
          <head>
            <title>Ticket ${venta.nroVenta}</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 0; padding: 10px; }
              .ticket { width: 280px; margin: 0 auto; font-size: 11px; }
              h1 { text-align: center; margin: 5px 0; font-size: 14px; }
              .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
              .line { text-align: center; font-size: 10px; }
              table { width: 100%; margin: 5px 0; border-collapse: collapse; }
              td { padding: 2px 0; }
              .item { text-align: left; font-size: 10px; }
              .price { text-align: right; font-size: 10px; }
              .sep { border-top: 1px dashed #000; margin: 5px 0; }
              .total { text-align: right; font-weight: bold; font-size: 12px; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>TICKET DE CAJA</h1>
                <div class="line">Nro: ${venta.nroVenta}</div>
                <div class="line">${this.formatFecha(venta.fecha)}</div>
              </div>
              <div style="margin: 5px 0;">
                ${detalles.map(d => `
                  <div class="sep" style="border: none; margin: 3px 0;"></div>
                  <div class="item">${d.nombreProducto}</div>
                  <table>
                    <tr>
                      <td class="item">${this.formatCant(d.cantidad)} x Bs. ${this.formatNum(d.precioUnitario)}</td>
                      <td class="price">Bs. ${this.formatNum(d.subtotal)}</td>
                    </tr>
                  </table>
                `).join('')}
              </div>
              <div class="sep"></div>
              <table>
                <tr>
                  <td>TOTAL:</td>
                  <td class="total">Bs. ${this.formatNum(venta.total)}</td>
                </tr>
              </table>
              <div style="text-align: center; font-size: 9px; margin-top: 10px;">
                Gracias por su compra
              </div>
            </div>
            <button onclick="window.print()" style="margin-top: 10px;">Imprimir</button>
          </body>
        </html>
      `
      w.document.write(html)
      w.document.close()
    },
    // ── Documentos ──────────────────────────────────────────────────────────
    contarDocs(v, tipo) { return (v.documentos || []).filter(x => x === tipo).length },
    tieneDoc(v, tipo) { return this.contarDocs(v, tipo) > 0 },
    docsDe(tipo) { return (this.detalle?.documentos || []).filter(d => d.tipo === tipo) },
    esMultiple(tipo) { return !!(TIPOS_DOC.find(t => t.codigo === tipo) || {}).multiple },
    elegirArchivo(tipo) {
      this.tipoDocPendiente = tipo
      this.$refs.docInput.value = ''
      this.$refs.docInput.multiple = this.esMultiple(tipo)
      this.$refs.docInput.click()
    },
    validarArchivo(file) {
      if (!MIME_DOC.includes(file.type)) { this.$message.error(`"${file.name}": formato no permitido. Solo PDF, JPG, PNG o WEBP`); return false }
      if (file.size > MAX_TAMANO_DOC) { this.$message.error(`"${file.name}" supera el tamaño máximo de 5 MB`); return false }
      return true
    },
    async onDocSeleccionado(e) {
      const tipo = this.tipoDocPendiente
      const archivos = Array.from(e.target.files || []).filter(f => this.validarArchivo(f))
      if (!archivos.length || !tipo || !this.detalle?.venta) { e.target.value = ''; return }
      const venta = this.detalle.venta
      const multiple = this.esMultiple(tipo)
      this.subiendoTipo = tipo
      let subidos = 0
      try {
        for (const file of multiple ? archivos : archivos.slice(0, 1)) {
          const formData = new FormData(); formData.append('file', file)
          const res = await this.$http.post(`${this.$baseServer}ventas/${venta.id}/documentos/${tipo}`, formData)
          const doc = res.data?.datos
          const otros = (this.detalle.documentos || []).filter(d => multiple || d.tipo !== tipo)
          this.detalle.documentos = [...otros, doc]
          subidos++
        }
      } catch (err) {
        // El interceptor de $http ya muestra el mensaje de error
      } finally {
        if (subidos) {
          this.sincronizarFila(venta.id)
          this.$message.success(subidos > 1 ? `${subidos} archivos subidos` : 'Documento subido')
        }
        this.subiendoTipo = null
        this.tipoDocPendiente = null
        e.target.value = ''
      }
    },
    eliminarDocumento(doc, t) {
      const venta = this.detalle.venta
      this.$confirm(`¿Eliminar "${doc.nombreOriginal}" (${t.etiqueta}) de la venta ${venta.nroVenta}?`, async () => {
        try {
          await this.$http.delete(`${this.$baseServer}ventas/${venta.id}/documentos/${doc.id}`)
          this.detalle.documentos = (this.detalle.documentos || []).filter(d => d.id !== doc.id)
          this.sincronizarFila(venta.id)
          this.$message.success('Documento eliminado')
        } catch (err) { /* mensaje mostrado por el interceptor */ }
      })
    },
    sincronizarFila(ventaId) {
      const fila = this.ventas.find(v => v.id === ventaId)
      if (fila) this.$set(fila, 'documentos', (this.detalle.documentos || []).map(d => d.tipo))
    },
    // Abre la vista previa de un documento; con varios del mismo tipo permite navegar entre ellos
    async verDocumento(venta, t, doc = null) {
      let docs = this.detalle?.venta?.id === venta.id ? this.docsDe(t.codigo) : []
      if (!docs.length && this.contarDocs(venta, t.codigo) > 1) {
        try { docs = ((await this.$service.get(`ventas/${venta.id}/documentos`)) || []).filter(d => d.tipo === t.codigo) } catch (e) { docs = [] }
      }
      const items = docs.length
        ? docs.map((d, i) => ({ url: `ventas/${venta.id}/documentos/${d.id}/archivo`, titulo: `${t.etiqueta}${docs.length > 1 ? ` ${i + 1}` : ''} · ${venta.nroVenta}`, nombre: d.nombreOriginal }))
        : [{ url: `ventas/${venta.id}/documentos/${t.codigo}/archivo`, titulo: `${t.etiqueta} · ${venta.nroVenta}`, nombre: `${t.codigo.toLowerCase()}-${venta.nroVenta}` }]
      const idx = doc ? Math.max(0, docs.findIndex(d => d.id === doc.id)) : 0
      this.abrirPreview(items, idx)
    },
    abrirPreview(items, idx = 0) {
      this.cerrarPreview()
      this.preview = { abierto: true, cargando: true, url: null, esImagen: false, titulo: '', nombre: '', items, idx }
      this.cargarPreview()
    },
    moverPreview(delta) {
      const idx = this.preview.idx + delta
      if (idx < 0 || idx >= this.preview.items.length) return
      if (this.preview.url) URL.revokeObjectURL(this.preview.url)
      Object.assign(this.preview, { idx, url: null, cargando: true })
      this.cargarPreview()
    },
    async cargarPreview() {
      const item = this.preview.items[this.preview.idx]
      this.preview.titulo = item.titulo
      this.preview.nombre = item.nombre
      try {
        const res = await this.$http.get(`${this.$baseServer}${item.url}`, { responseType: 'blob' })
        const tipo = res.headers['content-type'] || res.data.type
        const disp = res.headers['content-disposition'] || ''
        const m = disp.match(/filename\*=UTF-8''([^;]+)/)
        if (m) this.preview.nombre = decodeURIComponent(m[1])
        this.preview.esImagen = tipo.startsWith('image/')
        this.preview.url = URL.createObjectURL(new Blob([res.data], { type: tipo }))
      } catch (err) {
        this.preview.url = null
      } finally { this.preview.cargando = false }
    },
    cerrarPreview() {
      if (this.preview.url) URL.revokeObjectURL(this.preview.url)
      this.preview = { abierto: false, cargando: false, url: null, esImagen: false, titulo: '', nombre: '', items: [], idx: 0 }
    },

    // ── Pagos ───────────────────────────────────────────────────────────────
    etiquetaMetodo(m) { return ({ EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', QR: 'QR', CHEQUE: 'Cheque', TARJETA: 'Tarjeta', ADELANTO: 'Adelanto', MIXTO: 'Mixto', CREDITO: 'Crédito' })[m] || m },
    async cargarPagos() {
      const venta = this.detalle?.venta
      if (!venta) return
      this.loadingPagos = true
      try { this.pagosInfo = await this.$service.get(`ventas/${venta.id}/pagos`) }
      catch (e) { this.pagosInfo = null }
      finally { this.loadingPagos = false }
    },
    // Tras un cambio de pagos se refrescan saldo y estado de la venta (detalle y fila del listado)
    async refrescarVenta() {
      const id = this.detalle?.venta?.id
      if (!id) return
      await this.cargarPagos()
      try {
        const d = await this.$service.get(`ventas/${id}`)
        if (d?.venta) {
          this.detalle.venta = { ...this.detalle.venta, ...d.venta }
          const fila = this.ventas.find(v => v.id === id)
          if (fila) Object.assign(fila, { estadoVenta: d.venta.estadoVenta, montoPagado: d.venta.montoPagado })
        }
      } catch (e) { /* sin cambios visibles */ }
    },
    async abrirFormPago() {
      this.pagoForm = {
        abierto: true, monto: this.pagosInfo ? this.pagosInfo.saldo : null,
        fecha: new Date().toISOString().split('T')[0], metodoPago: 'EFECTIVO', fuenteId: '', referencia: '', observaciones: '',
      }
      await this.cargarFuentes()
      if (this.fuentes.length === 1) this.pagoForm.fuenteId = this.fuentes[0].id
    },
    async registrarPago() {
      const f = this.pagoForm
      if (!(Number(f.monto) > 0)) return this.$message.error('Ingresa un monto mayor a 0')
      if (this.pagosInfo && Number(f.monto) > this.pagosInfo.saldo + 0.009) return this.$message.error(`El pago supera el saldo pendiente (Bs. ${this.formatNum(this.pagosInfo.saldo)})`)
      if (!f.fuenteId) return this.$message.error('Selecciona la fuente de fondos')
      const archivo = this.$refs.pagoComprobanteNuevo?.files?.[0]
      if (archivo && !this.validarArchivo(archivo)) return
      this.guardandoPago = true
      try {
        const res = await this.$http.post(`${this.$baseServer}ventas/${this.detalle.venta.id}/pagos`, {
          fecha: f.fecha, monto: Number(f.monto), metodoPago: f.metodoPago, fuenteId: f.fuenteId,
          referencia: f.referencia || undefined, observaciones: f.observaciones || undefined,
        })
        const pago = res.data?.datos
        if (archivo && pago) {
          try {
            const formData = new FormData(); formData.append('file', archivo)
            await this.$http.post(`${this.$baseServer}ventas/${this.detalle.venta.id}/pagos/${pago.id}/comprobante`, formData)
          } catch (e) { this.$message.error('El pago se registró, pero no se pudo subir el comprobante') }
        }
        this.$message.success('Pago registrado en la fuente de fondos')
        this.pagoForm.abierto = false
        await this.refrescarVenta()
      } catch (e) { /* mensaje mostrado por el interceptor */ }
      finally { this.guardandoPago = false }
    },
    eliminarPago(pg) {
      this.$confirm(`¿Eliminar el pago de Bs. ${this.formatNum(pg.monto)} del ${this.formatFecha(pg.fecha)}? Se anulará el ingreso en la fuente de fondos y el saldo volverá a quedar pendiente.`, async () => {
        try {
          await this.$http.delete(`${this.$baseServer}ventas/${this.detalle.venta.id}/pagos/${pg.id}`)
          this.$message.success('Pago eliminado')
          await this.refrescarVenta()
        } catch (e) { /* mensaje mostrado por el interceptor */ }
      })
    },
    elegirComprobante(pg) {
      this.pagoComprobantePendiente = pg
      this.$refs.comprobanteInput.value = ''
      this.$refs.comprobanteInput.click()
    },
    async onComprobanteSeleccionado(e) {
      const file = e.target.files[0]
      const pg = this.pagoComprobantePendiente
      if (!file || !pg || !this.validarArchivo(file)) { e.target.value = ''; return }
      this.subiendoComprobante = pg.inicial ? 'inicial' : pg.id
      try {
        const formData = new FormData(); formData.append('file', file)
        if (pg.inicial) {
          // Venta anterior al registro de pagos: el backend crea ese pago con el comprobante adjunto
          await this.$http.post(`${this.$baseServer}ventas/${this.detalle.venta.id}/pagos/inicial/comprobante`, formData)
          await this.cargarPagos()
        } else {
          const res = await this.$http.post(`${this.$baseServer}ventas/${this.detalle.venta.id}/pagos/${pg.id}/comprobante`, formData)
          Object.assign(pg, res.data?.datos || {})
        }
        this.$message.success('Comprobante subido')
      } catch (err) { /* mensaje mostrado por el interceptor */ }
      finally {
        this.subiendoComprobante = null
        this.pagoComprobantePendiente = null
        e.target.value = ''
      }
    },
    verComprobante(pg) {
      const venta = this.detalle.venta
      this.abrirPreview([{ url: `ventas/${venta.id}/pagos/${pg.id}/comprobante`, titulo: `Comprobante · ${this.etiquetaMetodo(pg.metodoPago)} Bs. ${this.formatNum(pg.monto)} · ${venta.nroVenta}`, nombre: pg.comprobanteNombre }])
    },
    eliminarComprobante(pg) {
      this.$confirm(`¿Quitar el comprobante "${pg.comprobanteNombre}"?`, async () => {
        try {
          await this.$http.delete(`${this.$baseServer}ventas/${this.detalle.venta.id}/pagos/${pg.id}/comprobante`)
          Object.assign(pg, { comprobanteNombre: null, comprobanteMime: null, comprobanteTamano: null })
          this.$message.success('Comprobante eliminado')
        } catch (err) { /* mensaje mostrado por el interceptor */ }
      })
    },
    abrirPreviewPestana() { window.open(this.preview.url, '_blank') },
    descargarPreview() {
      const a = document.createElement('a')
      a.href = this.preview.url; a.download = this.preview.nombre
      a.click()
    },
    formatTamano(b) { const n = Number(b || 0); return n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB` },
    formatNum(v) { return Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    formatCant(v) { const n = Number(v || 0); return n % 1 === 0 ? n.toString() : n.toFixed(3) },
    formatFecha(d) { if (!d) return ''; return new Date(d + 'T00:00:00').toLocaleDateString('es-BO', { day:'2-digit', month:'short', year:'numeric' }) },
  },
  beforeDestroy() { this.cerrarPreview() },
}
</script>

<style scoped>
.vh-root { display:flex; flex-direction:column; height:100%; gap:10px; }
.vh-filters-container { background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; padding:12px 14px; }
.vh-filters-row { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px; align-items:flex-end; }
.vh-filter-group { display:flex; flex-direction:column; gap:4px; }
.vh-filter-group label { font-size:10px; font-weight:600; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.vh-filter-group input, .vh-filter-group select { width:140px; }
.vh-summary { display:flex; gap:16px; padding-top:8px; border-top:1px solid var(--b1); font-size:12px; }
.cp-cancel-btn { font-size:11px; font-weight:600; padding:5px 12px; border-radius:8px; background:var(--b1); color:var(--t4); border:1px solid var(--b0); cursor:pointer; }
.cp-cancel-btn:hover { background:var(--b2); }
.vh-table-wrap { flex:1; background:var(--bg-s); border:1px solid var(--b1); border-radius:12px; overflow:auto; }
.vh-table { width:100%; border-collapse:collapse; font-size:12px; }
.vh-table thead { background:var(--bg-n); position:sticky; top:0; }
.vh-table th { padding:10px 12px; text-align:left; font-size:10px; color:var(--t5); font-weight:600; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid var(--b1); }
.vh-row { cursor:pointer; border-bottom:1px solid #0d1a2d; transition:background .12s; }
.vh-row:hover { background:var(--bg-n); }
.vh-row td { padding:10px 12px; }
.vh-estado { font-size:9px; font-weight:700; padding:2px 6px; border-radius:4px; }
.vh-estado--pagada { background:#22c55e22; color:#4ade80; border:1px solid #22c55e44; }
.vh-estado--pendiente { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b44; }
.vh-estado--anulada { background:#ef444422; color:#f87171; border:1px solid #ef444444; }
.vh-badge { font-size:9px; font-weight:600; padding:2px 6px; border-radius:4px; background:var(--b1); color:var(--t4); }
.vh-badge--efectivo { background:#22c55e11; color:#4ade80; }
.vh-badge--tarjeta { background:#6366f111; color:#818cf8; }
.vh-badge--qr { background:#f59e0b11; color:#fbbf24; }
.vh-badge--transferencia { background:#3b82f611; color:#60a5fa; }

/* reuse */
.ide-input { padding:7px 10px; border-radius:8px; border:1px solid var(--b0); background:var(--bg); color:var(--t2); font-size:12px; outline:none; }
.ide-input:focus { border-color:#6366f1; }
.ide-select { padding:7px 10px; border-radius:8px; border:1px solid var(--b0); background:var(--bg); color:var(--t2); font-size:12px; outline:none; }
.cp-add-btn { font-size:11px; font-weight:600; padding:5px 12px; border-radius:8px; background:#6366f1; color:#fff; border:none; cursor:pointer; }
.cp-add-btn:hover { background:#4f46e5; }
.cp-icon-btn { padding:5px; border-radius:6px; background:var(--b1); border:1px solid var(--b0); color:var(--t4); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
.cp-icon-btn--danger:hover { background:#ef444422; color:#f87171; border-color:#ef444444; }
.cp-loading { display:flex; align-items:center; justify-content:center; }
.cp-empty { display:flex; align-items:center; justify-content:center; color:var(--b3); font-size:12px; }
.ct-spinner { width:22px; height:22px; border-radius:50%; border:2px solid var(--b0); border-top-color:#6366f1; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.ct-modal-backdrop { position:fixed; inset:0; background:#00000099; display:flex; align-items:center; justify-content:center; z-index:200; }
.ct-modal { background:var(--bg-s); border:1px solid var(--b4); border-radius:16px; width:90%; max-height:88vh; display:flex; flex-direction:column; box-shadow:0 20px 60px #00000088; }
.ct-modal-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--b1); font-size:14px; font-weight:700; color:var(--t2); }
.ct-modal-close { background:none; border:none; color:var(--t5); cursor:pointer; font-size:14px; }
.ct-modal-close:hover { color:var(--t2); }
.ct-modal-body { flex:1; overflow-y:auto; }
.ct-modal-footer { display:flex; gap:8px; justify-content:flex-end; padding:12px 16px; border-top:1px solid var(--b1); }
.ct-btn-cancel { padding:8px 16px; border-radius:8px; background:var(--b1); color:var(--t4); border:1px solid var(--b0); cursor:pointer; font-size:12px; }
.ct-btn-ok { padding:8px 18px; border-radius:8px; background:#6366f1; color:#fff; border:none; cursor:pointer; font-size:12px; font-weight:600; }
.ct-btn-ok:hover { background:#4f46e5; }
.ct-btn-print { padding:8px 12px; border-radius:8px; background:#3b82f6; color:#fff; border:none; cursor:pointer; font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; }
.ct-btn-print:hover { background:#2563eb; }
.vh-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 12px; padding:14px 16px; }
.vh-com-form { display:grid; grid-template-columns:1fr 1fr; gap:8px 10px; margin-top:8px; padding:10px; border:1px solid var(--b1); border-radius:8px; background:var(--bg-n); }
.vh-field { display:flex; flex-direction:column; gap:4px; min-width:0; }
.vh-field label { font-size:10px; font-weight:600; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.vh-field .ide-input, .vh-field .ide-select { width:100%; }
.ct-btn-print:disabled { opacity:.5; cursor:not-allowed; }
.vh-docs { display:flex; gap:4px; }
.vh-tabs { display:flex; gap:4px; background:var(--bg-s); border:1px solid var(--b1); border-radius:10px; padding:4px; width:max-content; max-width:100%; }
.vh-tab { padding:6px 16px; border-radius:7px; border:none; background:transparent; color:var(--t4); font-size:12px; font-weight:700; cursor:pointer; }
.vh-tab:hover { color:var(--t2); }
.vh-tab--on { background:#6366f1; color:#fff; }
.vh-tab--on:hover { color:#fff; }
.vh-link { color:#818cf8; font-weight:700; cursor:pointer; text-decoration:underline; font-size:12px; }
.vh-lbl { font-size:9px; color:var(--t4); }
.vh-val { font-size:12px; color:var(--t2); }
.vh-estado--vigente { background:#6366f122; color:#818cf8; border:1px solid #6366f144; }
.vh-estado--vencida { background:#f59e0b22; color:#fbbf24; border:1px solid #f59e0b44; }
.vh-estado--convertida { background:#22c55e22; color:#4ade80; border:1px solid #22c55e44; }
.vh-doc-count { font-size:8px; margin-left:1px; }
.vh-doc-row--sub { padding:4px 0 4px 30px; border-top:none; }
.vh-pagos-resumen { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:6px; padding:8px 10px; background:var(--bg-n); border:1px solid var(--b1); border-radius:8px; }
.vh-pagos-resumen div { display:flex; flex-direction:column; gap:2px; font-size:12px; }
.vh-pagos-resumen span { font-size:9px; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; }
.vh-pago-monto { font-weight:700; font-size:12px; color:#4ade80; white-space:nowrap; }
.vh-pago-origen { font-size:9px; font-weight:600; padding:1px 5px; border-radius:4px; margin-left:4px; }
.vh-pago-origen--pos { background:#6366f122; color:#818cf8; }
.vh-pago-origen--abono { background:#22c55e22; color:#4ade80; }
.vh-doc-chip { width:20px; height:20px; border-radius:5px; font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; background:transparent; border:1px dashed var(--b0); color:var(--b3); cursor:default; padding:0; flex-shrink:0; }
.vh-doc-chip--on { border-style:solid; cursor:pointer; }
button.vh-doc-chip--on:hover { filter:brightness(1.25); }
.vh-docs-section { padding:10px 16px 14px; border-top:1px solid var(--b1); }
.vh-docs-title { font-size:10px; font-weight:700; color:var(--t4); text-transform:uppercase; letter-spacing:.4px; margin-bottom:8px; }
.vh-docs-title span { font-weight:400; text-transform:none; letter-spacing:0; color:var(--t5); margin-left:6px; }
.vh-doc-row { display:flex; align-items:center; gap:10px; padding:7px 0; border-top:1px solid #0d1a2d; }
.vh-doc-row:first-of-type { border-top:none; }
.vh-doc-info { flex:1; min-width:0; }
.vh-doc-name { font-size:12px; color:var(--t2); font-weight:600; }
.vh-doc-file { font-size:10px; color:var(--t4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.vh-doc-file--empty { color:var(--b3); font-style:italic; }
.vh-doc-actions { display:flex; gap:6px; align-items:center; }
.vh-doc-btn { font-size:11px; font-weight:600; padding:4px 10px; border-radius:6px; background:var(--b1); color:var(--t3); border:1px solid var(--b0); cursor:pointer; }
.vh-doc-btn:hover { background:var(--b2); }
.vh-doc-btn:disabled { opacity:.5; cursor:not-allowed; }
.vh-doc-btn--primary { background:#6366f1; color:#fff; border-color:#6366f1; }
.vh-doc-btn--primary:hover { background:#4f46e5; }
.vh-doc-btn--danger:hover { background:#ef444422; color:#f87171; border-color:#ef444444; }
.vh-preview-body { display:flex; align-items:center; justify-content:center; background:var(--bg); padding:8px; }
.vh-preview-img { max-width:100%; max-height:100%; object-fit:contain; }
.vh-preview-frame { width:100%; height:100%; border:none; background:#fff; }
.modal-fade-enter-active, .modal-fade-leave-active { transition:opacity .2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity:0; }

/* ── Móvil ─────────────────────────────────────────────────────────────────
   Tablas → tarjetas (cada celda muestra su etiqueta), filtros apilados,
   modales a pantalla completa y botones con tamaño cómodo para el dedo. */
@media (max-width: 768px) {
  .vh-root { gap:8px; height:auto; }
  .vh-tabs { width:100%; }
  .vh-tab { flex:1; padding:9px 10px; font-size:13px; }

  .vh-filters-container { padding:10px; }
  .vh-filters-row { gap:8px; }
  .vh-filter-group { flex:1 1 calc(50% - 8px); min-width:0; }
  .vh-filter-group input, .vh-filter-group select { width:100%; min-height:38px; font-size:14px; }
  .vh-filters-row > div:last-child:not(.vh-filter-group) { flex:1 1 100%; }
  .vh-filters-row > div:last-child:not(.vh-filter-group) button { flex:1; min-height:38px; font-size:13px; }
  .vh-summary { flex-wrap:wrap; gap:6px 14px; }

  .vh-table-wrap { overflow:visible; background:transparent; border:none; }
  .vh-table, .vh-table tbody { display:block; }
  .vh-table thead { display:none; }
  .vh-table .vh-row {
    display:grid; grid-template-columns:1fr 1fr; gap:6px 12px;
    background:var(--bg-s); border:1px solid var(--b1); border-radius:12px;
    padding:12px; margin-bottom:8px;
  }
  .vh-table .vh-row:hover { background:var(--bg-s); }
  .vh-table .vh-row td { display:flex; flex-direction:column; gap:2px; padding:0; text-align:left !important; min-width:0; }
  .vh-table .vh-row td::before { content:attr(data-label); font-size:9px; font-weight:700; color:var(--t5); text-transform:uppercase; letter-spacing:.4px; }
  .vh-table .vh-row td.vh-td-titulo { grid-column:1 / 2; font-size:14px; }
  .vh-table .vh-row td.vh-td-titulo::before, .vh-table .vh-row td.vh-td-acciones::before { content:none; }
  .vh-table .vh-row td.vh-td-acciones { grid-column:2 / 3; grid-row:1; flex-direction:row; justify-content:flex-end; gap:6px; }
  .vh-table .vh-row td { align-items:flex-start; }
  .vh-table .vh-row td[data-label="Cliente"] { grid-column:1 / -1; color:var(--t2) !important; font-weight:600; }
  .vh-td-acciones .cp-icon-btn { padding:8px 10px; }
  .vh-doc-chip { width:28px; height:28px; font-size:12px; }

  .ct-modal-backdrop { align-items:stretch; }
  .ct-modal { width:100% !important; max-width:none !important; height:100% !important; max-height:none !important; border-radius:0 !important; border:none !important; }
  .ct-modal-header { padding:12px 14px; position:sticky; top:0; }
  .ct-modal-footer { flex-wrap:wrap; padding:10px 12px; padding-bottom:calc(10px + env(safe-area-inset-bottom)); }
  .ct-modal-footer > div { flex-wrap:wrap; }
  .ct-modal-footer button { min-height:40px; }
  .ct-modal-close { font-size:18px; padding:4px 8px; }

  .vh-docs-section { padding:10px 12px 14px; }
  .vh-doc-row { flex-wrap:wrap; gap:6px 10px; }
  .vh-doc-info { flex:1 1 60%; }
  .vh-doc-actions { flex:1 1 100%; justify-content:flex-end; flex-wrap:wrap; }
  .vh-doc-btn { min-height:36px; padding:6px 12px; font-size:12px; }
  .vh-doc-row--sub { padding-left:12px; }
  .vh-pagos-resumen { gap:6px; padding:8px; }
  .vh-com-form, .vh-form-grid { grid-template-columns:1fr; }
  .vh-com-form .ide-input, .vh-com-form .ide-select, .vh-form-grid .ide-input, .vh-form-grid .ide-select { min-height:40px; font-size:14px; }
  .vh-preview-body { padding:4px; }
}
</style>
