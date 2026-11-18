<template>
  <div class="vh-root">

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
          <select v-model="filtros.estadoVenta" class="ide-select" @change="cargar">
            <option value="">Todos</option>
            <option value="PAGADA">Pagada</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>
        <div class="vh-filter-group">
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
      <div class="vh-summary">
        <span style="font-size:11px;color:var(--t5);">{{ ventas.length }} ventas</span>
        <span style="font-size:12px;font-weight:700;color:#6366f1;">Total: Bs. {{ formatNum(totalDia) }}</span>
        <span v-if="totalSaldoPendiente > 0" style="font-size:12px;font-weight:700;color:#f97316;">Saldo pendiente: Bs. {{ formatNum(totalSaldoPendiente) }}</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="vh-table-wrap">
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
            <td style="font-weight:700;color:#818cf8;">{{ v.nroVenta }}</td>
            <td style="color:var(--t3);font-size:11px;">{{ formatFecha(v.fecha) }}</td>
            <td style="color:var(--scroll);">{{ v.nombreCliente || '—' }}</td>
            <td>
              <span v-if="v.metodoPago" :class="['vh-badge', `vh-badge--${(v.metodoPago).toLowerCase()}`]">{{ v.metodoPago }}</span>
              <span v-else style="color:var(--b3);font-size:10px;">—</span>
            </td>
            <td style="text-align:right;font-weight:700;color:#6366f1;">Bs. {{ formatNum(v.total) }}</td>
            <td>
              <span :class="['vh-estado', `vh-estado--${v.estadoVenta.toLowerCase()}`]">{{ v.estadoVenta }}</span>
            </td>
            <td @click.stop>
              <div class="vh-docs">
                <button
                  v-for="t in tiposDoc" :key="t.codigo"
                  :class="['vh-doc-chip', { 'vh-doc-chip--on': tieneDoc(v, t.codigo) }]"
                  :style="tieneDoc(v, t.codigo) ? { color: t.color, borderColor: t.color + '66', background: t.color + '1a' } : null"
                  :title="tieneDoc(v, t.codigo) ? `Ver ${t.etiqueta}` : `${t.etiqueta}: sin cargar`"
                  :disabled="!tieneDoc(v, t.codigo)"
                  @click.stop="verDocumento(v, t)"
                >{{ t.corto }}</button>
              </div>
            </td>
            <td @click.stop>
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
              <!-- Documentos -->
              <div class="vh-docs-section">
                <div class="vh-docs-title">Documentos <span>PDF, JPG, PNG o WEBP · máx. 5 MB</span></div>
                <div v-for="t in tiposDoc" :key="t.codigo" class="vh-doc-row">
                  <span class="vh-doc-chip vh-doc-chip--on" :style="{ color: t.color, borderColor: t.color + '66', background: t.color + '1a' }">{{ t.corto }}</span>
                  <div class="vh-doc-info">
                    <div class="vh-doc-name">{{ t.etiqueta }}</div>
                    <div v-if="docDetalle(t.codigo)" class="vh-doc-file" :title="docDetalle(t.codigo).nombreOriginal">
                      {{ docDetalle(t.codigo).nombreOriginal }} · {{ formatTamano(docDetalle(t.codigo).tamano) }}
                    </div>
                    <div v-else class="vh-doc-file vh-doc-file--empty">Sin cargar</div>
                  </div>
                  <div class="vh-doc-actions">
                    <div v-if="subiendoTipo === t.codigo" class="ct-spinner" style="width:16px;height:16px;"></div>
                    <template v-else>
                      <button v-if="docDetalle(t.codigo)" class="vh-doc-btn" @click="verDocumento(detalle.venta, t)">Ver</button>
                      <button
                        v-if="detalle.venta.estadoVenta !== 'ANULADA'"
                        class="vh-doc-btn vh-doc-btn--primary"
                        :disabled="!!subiendoTipo"
                        @click="elegirArchivo(t.codigo)"
                      >{{ docDetalle(t.codigo) ? 'Reemplazar' : 'Subir' }}</button>
                      <button v-if="docDetalle(t.codigo) && puedeEliminarDoc" class="vh-doc-btn vh-doc-btn--danger" title="Eliminar" @click="eliminarDocumento(t)">✕</button>
                    </template>
                  </div>
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

    <!-- ══ MODAL VISTA PREVIA DOCUMENTO ══ -->
    <transition name="modal-fade">
      <div v-if="preview.abierto" class="ct-modal-backdrop" style="z-index:210;" @click.self="cerrarPreview">
        <div class="ct-modal" style="max-width:900px;height:88vh;">
          <div class="ct-modal-header">
            <span>{{ preview.titulo }}</span>
            <button class="ct-modal-close" @click="cerrarPreview">✕</button>
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
import { htmlNotaVenta, htmlHojaRuta, escribirDocumento, abrirVentanaPendiente } from '@/common/impresion-venta'

const TIPOS_DOC = [
  { codigo: 'TABLILLA_PESAJE', etiqueta: 'Tablilla de pesaje', corto: 'P', color: '#22c55e' },
  { codigo: 'RECIBO', etiqueta: 'Recibo', corto: 'R', color: '#3b82f6' },
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
      nombreCliente: '',
      conSaldo: '',
    },
    detalleModal: false, detalle: null, loadingDetalle: false,
    tiposDoc: TIPOS_DOC,
    tipoDocPendiente: null, subiendoTipo: null,
    preview: { abierto: false, cargando: false, url: null, esImagen: false, titulo: '', nombre: '' },
    imprimiendo: false,
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
    totalDia() { return this.ventas.filter(v => v.estadoVenta !== 'ANULADA').reduce((s, v) => s + Number(v.total), 0) },
    totalSaldoPendiente() { return this.ventas.filter(v => v.estadoVenta !== 'ANULADA').reduce((s, v) => s + Math.max(0, Number(v.total) - Number(v.montoPagado || 0)), 0) },
  },
  mounted() {
    this.cargarSucursales()
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
    async cargar() {
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
      try { this.detalle = await this.$service.get(`ventas/${v.id}`) }
      finally { this.loadingDetalle = false }
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
    tieneDoc(v, tipo) { return (v.documentos || []).includes(tipo) },
    docDetalle(tipo) { return (this.detalle?.documentos || []).find(d => d.tipo === tipo) },
    elegirArchivo(tipo) {
      this.tipoDocPendiente = tipo
      this.$refs.docInput.value = ''
      this.$refs.docInput.click()
    },
    async onDocSeleccionado(e) {
      const file = e.target.files[0]
      const tipo = this.tipoDocPendiente
      if (!file || !tipo || !this.detalle?.venta) return
      if (!MIME_DOC.includes(file.type)) return this.$message.error('Formato no permitido. Solo PDF, JPG, PNG o WEBP')
      if (file.size > MAX_TAMANO_DOC) return this.$message.error('El archivo supera el tamaño máximo de 5 MB')
      const venta = this.detalle.venta
      this.subiendoTipo = tipo
      try {
        const formData = new FormData(); formData.append('file', file)
        const res = await this.$http.post(`${this.$baseServer}ventas/${venta.id}/documentos/${tipo}`, formData)
        const doc = res.data?.datos
        this.detalle.documentos = [...(this.detalle.documentos || []).filter(d => d.tipo !== tipo), doc]
        this.sincronizarFila(venta.id)
        this.$message.success('Documento subido')
      } catch (err) {
        // El interceptor de $http ya muestra el mensaje de error
      } finally {
        this.subiendoTipo = null
        this.tipoDocPendiente = null
        e.target.value = ''
      }
    },
    eliminarDocumento(t) {
      const venta = this.detalle.venta
      this.$confirm(`¿Eliminar el documento "${t.etiqueta}" de la venta ${venta.nroVenta}?`, async () => {
        try {
          await this.$http.delete(`${this.$baseServer}ventas/${venta.id}/documentos/${t.codigo}`)
          this.detalle.documentos = (this.detalle.documentos || []).filter(d => d.tipo !== t.codigo)
          this.sincronizarFila(venta.id)
          this.$message.success('Documento eliminado')
        } catch (err) { /* mensaje mostrado por el interceptor */ }
      })
    },
    sincronizarFila(ventaId) {
      const fila = this.ventas.find(v => v.id === ventaId)
      if (fila) this.$set(fila, 'documentos', (this.detalle.documentos || []).map(d => d.tipo))
    },
    async verDocumento(venta, t) {
      this.cerrarPreview()
      this.preview = { abierto: true, cargando: true, url: null, esImagen: false, titulo: `${t.etiqueta} · ${venta.nroVenta}`, nombre: '' }
      try {
        const res = await this.$http.get(`${this.$baseServer}ventas/${venta.id}/documentos/${t.codigo}/archivo`, { responseType: 'blob' })
        const tipo = res.headers['content-type'] || res.data.type
        const disp = res.headers['content-disposition'] || ''
        const m = disp.match(/filename\*=UTF-8''([^;]+)/)
        this.preview.nombre = m ? decodeURIComponent(m[1]) : `${t.codigo.toLowerCase()}-${venta.nroVenta}`
        this.preview.esImagen = tipo.startsWith('image/')
        this.preview.url = URL.createObjectURL(new Blob([res.data], { type: tipo }))
      } catch (err) {
        this.preview.url = null
      } finally { this.preview.cargando = false }
    },
    cerrarPreview() {
      if (this.preview.url) URL.revokeObjectURL(this.preview.url)
      this.preview = { abierto: false, cargando: false, url: null, esImagen: false, titulo: '', nombre: '' }
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
</style>
