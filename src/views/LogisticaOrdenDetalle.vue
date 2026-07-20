<template>
  <div class="ide-view">

    <!-- Header -->
    <div class="det-header">
      <button class="ide-btn" @click="$router.push({ name: 'logistica' })">← Volver</button>
      <div class="det-header__info" v-if="orden">
        <h2>{{ orden.numero }}</h2>
        <span class="ide-chip" :class="chipEstado(orden.estadoOrden)">{{ orden.estadoOrden }}</span>
        <span class="det-meta">{{ orden.paisOrigen }}</span>
        <span class="det-meta">{{ orden.fechaOrden }}</span>
        <span class="det-meta">Distribución: {{ orden.metodoDistribucion === 'POR_VALOR' ? 'Por Valor' : 'Por Cantidad' }}</span>
      </div>
      <div class="det-header__actions" v-if="orden">
        <button class="ide-btn ide-btn--outline" :disabled="orden.estadoOrden === 'CERRADO' || calculando" @click="calcularCostos">
          {{ calculando ? 'Calculando...' : '⚙ Calcular Costos' }}
        </button>
        <button class="ide-btn ide-btn--primary" :disabled="orden.estadoOrden === 'CERRADO' || cerrando" @click="abrirCierreDialog">
          {{ cerrando ? 'Cerrando...' : '✓ Cerrar Orden' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="ide-loading">Cargando orden...</div>
    <div v-else-if="!orden" class="ide-empty">No se encontró la orden.</div>
    <div v-else class="det-body">

      <!-- Sub-tabs -->
      <div class="ide-view__tabs" style="padding: 0 24px; border-bottom: 1px solid var(--t1); margin-bottom: 0;">
        <button v-for="tab in subTabs" :key="tab.id" class="ide-tab" :class="{ 'ide-tab--active': subTab === tab.id }" @click="subTab = tab.id">
          {{ tab.label }}
          <span v-if="tab.count != null" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- ── SUB-TAB PRODUCTOS ─────────────────────────────── -->
      <div v-show="subTab === 'items'" class="det-panel">
        <div class="det-panel__toolbar">
          <div class="det-summary" v-if="orden">
            <span>Total compra: <strong>{{ fmtNum(orden.totalProductosMonedaCompra) }}</strong></span>
            <span>Total base: <strong>{{ fmtNum(orden.totalProductosMonedaBase) }}</strong></span>
            <span>Unidades: <strong>{{ orden.unidadesTotales }}</strong></span>
          </div>
          <button class="ide-btn ide-btn--primary ide-btn--sm" :disabled="orden.estadoOrden === 'CERRADO'" @click="abrirItemDialog()">+ Agregar Producto</button>
        </div>
        <div v-if="!items.length" class="ide-empty">No hay productos en esta orden.</div>
        <table v-else class="ide-table">
          <thead>
            <tr>
              <th>Producto / Descripción</th>
              <th>Cantidad</th>
              <th>Precio Unit. Compra</th>
              <th>Subtotal Compra</th>
              <th>T.C.</th>
              <th>Precio Unit. Base</th>
              <th>Subtotal Base</th>
              <th>Costo/kg</th>
              <th>P.U. VENTA</th>
              <th v-if="orden.estadoOrden === 'CERRADO' && items.some(i => i.precioVentaConIva)">P.U.+IVA</th>
              <th v-if="orden.estadoOrden === 'CERRADO' && items.some(i => i.utilidadTonelada != null)">Util./TON</th>
              <th v-if="orden.estadoOrden === 'CERRADO' && items.some(i => i.utilidadToneladaConIva != null)">Util./TON+IVA</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <div>{{ item.descripcionProducto }}</div>
                <div v-if="item.productoId" style="font-size:11px;color:var(--t4);">{{ categoriasDeProducto(item.productoId) }}</div>
              </td>
              <td>{{ item.cantidadUnidades }}</td>
              <td>{{ fmtNum(item.precioUnitarioMonedaCompra) }}</td>
              <td><strong>{{ fmtNum(item.precioUnitarioMonedaCompra * item.cantidadUnidades) }}</strong></td>
              <td>{{ fmtNum6(item.tipoCambio) }}</td>
              <td>{{ fmtNum(item.precioUnitarioMonedaBase) }}</td>
              <td><strong>{{ fmtNum(item.subtotalMonedaBase) }}</strong></td>
              <td>{{ item.costoTotalUnitario ? fmtNum(item.costoTotalUnitario) : '—' }}</td>
              <td>
                <span v-if="item.precioVentaManual" class="precio-sugerido" style="background:#6366f122;color:#818cf8;border-color:#6366f144;">{{ fmtNum(item.precioVentaManual) }}</span>
                <span v-else-if="item.precioVentaSugerido" class="precio-sugerido">{{ fmtNum(item.precioVentaSugerido) }}</span>
                <span v-else>—</span>
              </td>
              <td v-if="orden.estadoOrden === 'CERRADO' && items.some(i => i.precioVentaConIva)">
                <span v-if="item.precioVentaConIva" style="font-size:12px;font-weight:600;color:#22c55e;">{{ fmtNum(item.precioVentaConIva) }}</span>
                <span v-else>—</span>
              </td>
              <td v-if="orden.estadoOrden === 'CERRADO' && items.some(i => i.utilidadTonelada != null)">
                <span v-if="item.utilidadTonelada != null" style="font-size:12px;font-weight:600;" :style="{ color: item.utilidadTonelada >= 0 ? '#60a5fa' : '#ef4444' }">{{ fmtNum(item.utilidadTonelada) }}</span>
                <span v-else>—</span>
              </td>
              <td v-if="orden.estadoOrden === 'CERRADO' && items.some(i => i.utilidadToneladaConIva != null)">
                <span v-if="item.utilidadToneladaConIva != null" style="font-size:12px;font-weight:600;" :style="{ color: item.utilidadToneladaConIva >= 0 ? '#a78bfa' : '#ef4444' }">{{ fmtNum(item.utilidadToneladaConIva) }}</span>
                <span v-else>—</span>
              </td>
              <td class="ide-actions">
                <button class="ide-btn ide-btn--sm" :disabled="orden.estadoOrden === 'CERRADO'" @click="abrirItemDialog(item)">Editar</button>
                <button class="ide-btn ide-btn--sm ide-btn--danger" :disabled="orden.estadoOrden === 'CERRADO'" @click="eliminarItem(item)">✕</button>
              </td>
            </tr>
            <!-- Fila de totales -->
            <tr style="background:var(--bg-n);border-top:2px solid var(--b1);font-weight:700;">
              <td colspan="3" style="text-align:right;padding-right:12px;">TOTAL COMPRA</td>
              <td style="text-align:right;color:#f97316;font-size:13px;">{{ fmtNum(totalProductosCompra) }}</td>
              <td colspan="2"></td>
              <td style="text-align:right;color:#6366f1;font-size:13px;">{{ fmtNum(totalProductosCalculado) }}</td>
              <td colspan="5"></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── SUB-TAB PAGOS ─────────────────────────────────── -->
      <div v-show="subTab === 'pagos'" class="det-panel">
        <div class="det-panel__toolbar">
          <div class="pago-estado" v-if="orden">
            <div class="pago-estado__item">
              <span class="pago-estado__label">Deuda Inicial</span>
              <span class="pago-estado__val" style="color:#ef4444;">{{ fmtNum(totalOrdenCompra) }}</span>
              <span class="pago-estado__moneda">{{ monedaNombre(monedaCompraId) }}</span>
            </div>
            <div class="pago-estado__sep">→</div>
            <div class="pago-estado__item">
              <span class="pago-estado__label">Pagado</span>
              <span class="pago-estado__val pago-estado__val--pagado">{{ fmtNum(totalPagosCompra) }}</span>
              <span class="pago-estado__moneda">{{ monedaNombre(monedaCompraId) }}</span>
            </div>
            <div class="pago-estado__sep">→</div>
            <div class="pago-estado__item">
              <span class="pago-estado__label">Saldo Pendiente</span>
              <span class="pago-estado__val" :class="totalPendientePagosCompra > 0 ? 'pago-estado__val--pendiente' : 'pago-estado__val--saldado'">
                {{ totalPendientePagosCompra > 0 ? fmtNum(totalPendientePagosCompra) : '✓ Saldado' }}
              </span>
              <span class="pago-estado__moneda">{{ monedaNombre(monedaCompraId) }}</span>
            </div>
            <div class="pago-barra" :title="`${porcentajePagadoCompra.toFixed(1)}% pagado`">
              <div class="pago-barra__fill" :style="{ width: porcentajePagadoCompra + '%' }"></div>
            </div>
            <div v-if="Object.keys(totalPagosPorMoneda).length" class="monedas-breakdown">
              <span class="monedas-breakdown__label">Por moneda origen:</span>
              <span v-for="(tot, cod) in totalPagosPorMoneda" :key="cod" class="moneda-breakdown-chip">{{ cod }} {{ fmtNum(tot) }}</span>
            </div>
          </div>
          <button class="ide-btn ide-btn--primary ide-btn--sm" :disabled="orden.estadoOrden === 'CERRADO'" @click="abrirPagoDialog()">+ Registrar Pago</button>
        </div>

        <!-- Historial detallado de deuda -->
        <div v-if="pagos.length" style="margin-top:20px;">
          <h4 style="padding:0 24px;margin:0 0 12px 0;font-size:13px;font-weight:700;color:var(--t2);">Historial de Deuda del Proveedor</h4>
          <table class="ide-table" style="margin:0 24px;">
            <thead>
              <tr>
                <th>Paso</th>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Monto Pagado</th>
                <th>Saldo Anterior</th>
                <th>Saldo Posterior</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background:var(--bg-n);font-weight:600;">
                <td style="text-align:center;">0</td>
                <td>—</td>
                <td style="color:#ef4444;">Deuda Inicial</td>
                <td>—</td>
                <td style="text-align:right;">—</td>
                <td style="text-align:right;color:#ef4444;">{{ fmtNum(totalOrdenBase) }}</td>
              </tr>
              <tr v-for="(p, idx) in pagos" :key="p.id" style="background:idx % 2 === 0 ? 'transparent' : 'var(--bg-n)';">
                <td style="text-align:center;font-weight:600;">{{ idx + 1 }}</td>
                <td>{{ p.fechaPago }}</td>
                <td>
                  <span style="font-weight:600;">Pago</span>
                  <span style="font-size:11px;color:var(--t4);">{{ monedaNombre(p.monedaId) }} {{ fmtNum(p.monto) }} @ {{ fmtNum6(p.tipoCambio) }}</span>
                </td>
                <td style="text-align:right;font-weight:600;color:#22c55e;">{{ fmtNum(Number(p.monto) * Number(p.tipoCambio)) }}</td>
                <td style="text-align:right;color:#ef4444;font-weight:600;">{{ fmtNum(saldoAnteriorPago(idx)) }}</td>
                <td style="text-align:right;font-weight:600;" :class="saldoPosteriorPago(idx) > 0 ? 'pago-estado__val--pendiente' : 'pago-estado__val--saldado'">
                  {{ saldoPosteriorPago(idx) > 0 ? fmtNum(saldoPosteriorPago(idx)) : '✓ Saldado' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabla de pagos registrados -->
        <div style="margin-top:20px;">
          <h4 style="padding:0 24px;margin:0 0 12px 0;font-size:13px;font-weight:700;color:var(--t2);">Pagos Registrados</h4>
          <div v-if="!pagos.length" class="ide-empty">No hay pagos registrados.</div>
          <table v-else class="ide-table" style="margin:0 24px;">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Moneda Origen</th>
                <th>Monto Origen</th>
                <th>T.C.</th>
                <th>Monto Base</th>
                <th>Método</th>
                <th>Referencia</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in pagos" :key="p.id">
                <td>{{ p.fechaPago }}</td>
                <td><span class="moneda-chip">{{ monedaNombre(p.monedaId) }}</span></td>
                <td style="text-align:right;"><strong>{{ fmtNum(p.monto) }}</strong></td>
                <td style="color:var(--t4);text-align:center;">{{ fmtNum6(p.tipoCambio) }}</td>
                <td style="text-align:right;"><strong style="color:#6366f1;">{{ fmtNum(Number(p.monto) * Number(p.tipoCambio)) }}</strong></td>
                <td>{{ p.metodoPago }}</td>
                <td>{{ p.referencia || '—' }}</td>
                <td class="ide-actions">
                  <button class="ide-btn ide-btn--sm" :disabled="orden.estadoOrden === 'CERRADO'" @click="abrirPagoDialog(p)">Editar</button>
                  <button class="ide-btn ide-btn--sm ide-btn--danger" :disabled="orden.estadoOrden === 'CERRADO'" @click="eliminarPago(p)">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── SUB-TAB GASTOS ────────────────────────────────── -->
      <div v-show="subTab === 'gastos'" class="det-panel">
        <div class="det-panel__toolbar">
          <div class="det-summary det-summary--col" v-if="gastos.length">
            <span>Total gastos (base): <strong>{{ fmtNum(totalGastosBase) }}</strong></span>
            <div v-if="Object.keys(totalGastosPorMoneda).length" class="monedas-breakdown">
              <span class="monedas-breakdown__label">Por moneda:</span>
              <span v-for="(tot, cod) in totalGastosPorMoneda" :key="cod" class="moneda-breakdown-chip">{{ cod }} {{ fmtNum(tot) }}</span>
            </div>
          </div>
          <button class="ide-btn ide-btn--primary ide-btn--sm" :disabled="orden.estadoOrden === 'CERRADO'" @click="abrirGastoDialog()">+ Registrar Gasto</button>
        </div>
        <div v-if="!gastos.length" class="ide-empty">No hay gastos de logística registrados.</div>
        <table v-else class="ide-table">
          <thead>
            <tr>
              <th>Tipo / Descripción</th>
              <th>País</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>T.C.</th>
              <th>Equivalente Base</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in gastos" :key="g.id">
              <td>
                <div>{{ g.descripcion }}</div>
                <div style="font-size:11px;color:var(--t4);">{{ tipoGastoNombre(g.tipoGastoId) }}</div>
              </td>
              <td><span v-if="g.pais" class="ide-chip ide-chip--blue" style="font-size:10px;">{{ g.pais }}</span><span v-else style="color:var(--b3);">—</span></td>
              <td>{{ g.fechaGasto }}</td>
              <td>
                <span class="monto-con-moneda">{{ fmtNum(g.monto) }}</span>
                <span class="moneda-chip">{{ monedaNombre(g.monedaId) }}</span>
              </td>
              <td style="color:var(--t4);">{{ fmtNum6(g.tipoCambio) }}</td>
              <td><strong>{{ fmtNum(Number(g.monto) * Number(g.tipoCambio)) }}</strong></td>
              <td class="ide-actions">
                <button class="ide-btn ide-btn--sm" :disabled="orden.estadoOrden === 'CERRADO'" @click="abrirGastoDialog(g)">Editar</button>
                <button class="ide-btn ide-btn--sm ide-btn--danger" :disabled="orden.estadoOrden === 'CERRADO'" @click="eliminarGasto(g)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── SUB-TAB PRECIO LOGÍSTICA ──────────────────────── -->

      <!-- ── SUB-TAB TRAZABILIDAD ──────────────────────────── -->
      <div v-show="subTab === 'trazabilidad'" class="det-panel">
        <div v-if="!trazabilidad" class="ide-empty">
          Calcula los costos primero para ver la trazabilidad completa.
        </div>
        <div v-else class="traz-body">
          <!-- Resumen general -->
          <div class="traz-card">
            <h4>Resumen General</h4>
            <div class="traz-grid">
              <div class="traz-kpi">
                <div class="traz-kpi__label">Total Productos (Base)</div>
                <div class="traz-kpi__val">{{ fmtNum(trazabilidad.resumen.totalProductosMonedaBase) }}</div>
              </div>
              <div class="traz-kpi">
                <div class="traz-kpi__label">Total Gastos Logísticos (Base)</div>
                <div class="traz-kpi__val">{{ fmtNum(trazabilidad.resumen.totalGastosMonedaBase) }}</div>
              </div>
              <div class="traz-kpi">
                <div class="traz-kpi__label">Total Pagado al Proveedor (Base)</div>
                <div class="traz-kpi__val">{{ fmtNum(trazabilidad.resumen.totalPagosMonedaBase) }}</div>
              </div>
              <div class="traz-kpi traz-kpi--highlight">
                <div class="traz-kpi__label">Costo Total de Importación (Base)</div>
                <div class="traz-kpi__val">{{ fmtNum(trazabilidad.resumen.costoTotalMonedaBase) }}</div>
              </div>
              <div class="traz-kpi">
                <div class="traz-kpi__label">Unidades Totales</div>
                <div class="traz-kpi__val">{{ trazabilidad.resumen.unidadesTotales }}</div>
              </div>
            </div>
          </div>

          <!-- Desglose pagos -->
          <div class="traz-card" v-if="trazabilidad.pagos.length">
            <h4>Pagos al Proveedor</h4>
            <table class="ide-table">
              <thead><tr><th>Fecha</th><th>Monto</th><th>Moneda</th><th>T.C.</th><th>Monto Base</th><th>Método</th></tr></thead>
              <tbody>
                <tr v-for="p in trazabilidad.pagos" :key="p.id">
                  <td>{{ p.fechaPago }}</td>
                  <td>{{ fmtNum(p.monto) }}</td>
                  <td>{{ monedaNombre(p.monedaId) }}</td>
                  <td>{{ fmtNum6(p.tipoCambio) }}</td>
                  <td><strong>{{ fmtNum(p.montoMonedaBase) }}</strong></td>
                  <td>{{ p.metodoPago }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Desglose gastos -->
          <div class="traz-card" v-if="trazabilidad.gastos.length">
            <h4>Gastos de Logística</h4>
            <table class="ide-table">
              <thead><tr><th>Tipo</th><th>Descripción</th><th>Monto</th><th>Moneda</th><th>T.C.</th><th>Monto Base</th></tr></thead>
              <tbody>
                <tr v-for="g in trazabilidad.gastos" :key="g.id">
                  <td>{{ tipoGastoNombre(g.tipoGastoId) }}</td>
                  <td>{{ g.descripcion }}</td>
                  <td>{{ fmtNum(g.monto) }}</td>
                  <td>{{ monedaNombre(g.monedaId) }}</td>
                  <td>{{ fmtNum6(g.tipoCambio) }}</td>
                  <td><strong>{{ fmtNum(g.montoMonedaBase) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Distribución de costos por ítem -->
          <div class="traz-card">
            <h4>Distribución de Costos por Producto</h4>
            <table class="ide-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Subtotal Base</th>
                  <th>Gasto Log. Asignado</th>
                  <th>Costo Total Unitario</th>
                  <th>Margen Aplicado</th>
                  <th>Precio Sugerido</th>
                  <th>Precio + IVA</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in trazabilidad.items" :key="item.id">
                  <td>{{ item.descripcionProducto }}</td>
                  <td>{{ item.cantidadUnidades }}</td>
                  <td>{{ fmtNum(item.subtotalMonedaBase) }}</td>
                  <td>{{ item.costoLogisticaAsignado != null ? fmtNum(item.costoLogisticaAsignado) : '—' }}</td>
                  <td><strong>{{ item.costoTotalUnitario != null ? fmtNum(item.costoTotalUnitario) : '—' }}</strong></td>
                  <td>{{ item.margenAplicado != null ? item.margenAplicado + '%' : '—' }}</td>
                  <td>
                    <span v-if="item.precioVentaSugerido" class="precio-sugerido">{{ fmtNum(item.precioVentaSugerido) }}</span>
                    <span v-else>—</span>
                  </td>
                  <td>
                    <span v-if="item.precioVentaConIva" class="precio-iva" style="color:#22c55e;font-weight:600;">{{ fmtNum(item.precioVentaConIva) }}</span>
                    <span v-else>—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ── DIALOG ÍTEM ──────────────────────────────────────── -->
    <div v-if="itemDialog" class="ide-modal-overlay">
      <div class="ide-modal">
        <div class="ide-modal__header">
          <h3>{{ editandoItem ? 'Editar Producto' : 'Agregar Producto' }}</h3>
          <button class="ide-modal__close" @click="itemDialog = false">✕</button>
        </div>
        <div class="ide-modal__body ide-form-grid">
          <div class="ide-field ide-field--full" style="position:relative;">
            <label>Producto del Catálogo (opcional)</label>
            <input
              v-model="productoSearchText"
              class="ide-input"
              placeholder="Buscar: categoría > subcategoría > producto"
              @input="productoSearchText = $event.target.value; productoHighlightIndex = -1"
              @focus="productoDropdownOpen = true"
              @blur="setTimeout(() => productoDropdownOpen = false, 200)"
              @keydown="onProductoKeydown"
            />
            <div
              v-if="productoDropdownOpen && productoSearchText"
              class="autocomplete-dropdown"
              style="position:absolute;top:100%;left:0;right:0;z-index:10;background:var(--bg-s);border:1px solid var(--b1);border-radius:6px;max-height:200px;overflow-y:auto;margin-top:4px;"
            >
              <div
                v-for="(p, idx) in productosFiltrados"
                :key="p.id"
                class="autocomplete-item"
                :class="{ 'autocomplete-item--disabled': productosIdsEnOrden.has(p.id), 'autocomplete-item--highlighted': idx === productoHighlightIndex }"
                style="padding:8px 12px;border-bottom:1px solid var(--b2);cursor:pointer;font-size:12px;transition:background 0.1s;"
                :style="{
                  color: productosIdsEnOrden.has(p.id) ? 'var(--b3)' : 'var(--t2)',
                  background: idx === productoHighlightIndex ? '#6366f122' : 'transparent'
                }"
                @click="!productosIdsEnOrden.has(p.id) && selectProducto(p)"
                @mouseenter="productoHighlightIndex = idx"
              >
                {{ p.label }}{{ productosIdsEnOrden.has(p.id) ? ' (ya agregado)' : '' }}
              </div>
              <div v-if="productosFiltrados.length === 0" style="padding:8px 12px;color:var(--b3);font-size:11px;">
                No hay productos que coincidan
              </div>
            </div>
            <div v-if="itemForm.productoId && !productoSearchText" style="font-size:10px;color:var(--t5);margin-top:4px;">
              ✓ Producto vinculado: {{ productoSeleccionado?.label }}
            </div>
          </div>
          <div class="ide-field ide-field--full">
            <label>Descripción *</label>
            <input v-model="itemForm.descripcionProducto" class="ide-input" placeholder="Nombre o descripción del producto" />
          </div>
          <div class="ide-field">
            <label>Cantidad de Unidades *</label>
            <input v-model.number="itemForm.cantidadUnidades" class="ide-input" type="number" min="1" @input="calcularPrecioUnitario" />
          </div>
          <div class="ide-field">
            <label>Total de Compra (Moneda de Compra) *</label>
            <input v-model.number="itemForm.totalDeCompra" class="ide-input" type="number" min="0" step="0.0001" @input="calcularPrecioUnitario" />
          </div>
          <div class="ide-field" v-if="itemForm.precioUnitarioMonedaCompra">
            <label style="font-size:10px;color:var(--t5);">Precio Unit. Calculado</label>
            <div style="font-size:13px;font-weight:700;color:#818cf8;padding:8px 12px;background:var(--bg-n);border:1px solid var(--b1);border-radius:6px;">
              {{ fmtNum(itemForm.precioUnitarioMonedaCompra) }}
            </div>
          </div>
          <div class="ide-field">
            <label>Tipo de Cambio (1 moneda compra = ? base) *</label>
            <input v-model.number="itemForm.tipoCambio" class="ide-input" type="number" min="0" step="0.000001" />
          </div>
          <div class="ide-field">
            <label>Moneda de Compra</label>
            <select v-model="itemForm.monedaCompraId" class="ide-input">
              <option value="">— Sin especificar —</option>
              <option v-for="m in monedas" :key="m.id" :value="m.id">{{ m.codigo }} — {{ m.nombre }}</option>
            </select>
          </div>
          <div class="ide-field ide-field--full" v-if="itemForm.totalDeCompra && itemForm.tipoCambio">
            <div class="ide-preview-calc">
              <div>Precio unitario base: <strong>{{ fmtNum(itemForm.precioUnitarioMonedaCompra * itemForm.tipoCambio) }}</strong></div>
              <div>Subtotal base (total compra × TC): <strong>{{ fmtNum(itemForm.totalDeCompra * itemForm.tipoCambio) }}</strong></div>
            </div>
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="itemDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarItem">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── DIALOG PAGO ──────────────────────────────────────── -->
    <div v-if="pagoDialog" class="ide-modal-overlay">
      <div class="ide-modal ide-modal--sm">
        <div class="ide-modal__header">
          <h3>{{ editandoPago ? 'Editar Pago' : 'Registrar Pago al Proveedor' }}</h3>
          <button class="ide-modal__close" @click="pagoDialog = false">✕</button>
        </div>
        <!-- Resumen estado de cuenta -->
        <div v-if="orden" class="pago-dialog-resumen">
          <div class="pago-dialog-resumen__row">
            <div class="pago-dialog-resumen__item">
              <div class="pago-dialog-resumen__label">Total orden</div>
              <div class="pago-dialog-resumen__val">{{ fmtNum(totalOrdenBase) }}</div>
            </div>
            <div class="pago-dialog-resumen__item">
              <div class="pago-dialog-resumen__label">Ya pagado</div>
              <div class="pago-dialog-resumen__val pago-dialog-resumen__val--ok">{{ fmtNum(totalPagosBase) }}</div>
            </div>
            <div class="pago-dialog-resumen__item">
              <div class="pago-dialog-resumen__label">Pendiente</div>
              <div class="pago-dialog-resumen__val" :class="totalPendientePagos > 0 ? 'pago-dialog-resumen__val--warn' : 'pago-dialog-resumen__val--ok'">
                {{ totalPendientePagos > 0 ? fmtNum(totalPendientePagos) : '✓ Saldado' }}
              </div>
            </div>
            <div v-if="pagoActualBase && !editandoPago" class="pago-dialog-resumen__item">
              <div class="pago-dialog-resumen__label">Tras este pago</div>
              <div class="pago-dialog-resumen__val" :class="(totalPendientePagos - pagoActualBase) > 0.01 ? 'pago-dialog-resumen__val--warn' : 'pago-dialog-resumen__val--ok'">
                {{ (totalPendientePagos - pagoActualBase) > 0.01 ? fmtNum(Math.max(0, totalPendientePagos - pagoActualBase)) : '✓ Saldado' }}
              </div>
            </div>
          </div>
          <div class="pago-barra pago-barra--dialog">
            <div class="pago-barra__fill" :style="{ width: porcentajePagado + '%' }"></div>
            <div v-if="pagoActualBase && !editandoPago" class="pago-barra__fill pago-barra__fill--preview" :style="{ width: Math.min(100 - porcentajePagado, (pagoActualBase / totalOrdenBase) * 100) + '%' }"></div>
          </div>
        </div>
        <div class="ide-modal__body ide-form-grid">
          <div class="ide-field">
            <label>Moneda *</label>
            <select v-model="pagoForm.monedaId" class="ide-input">
              <option value="">— Seleccionar —</option>
              <option v-for="m in monedas" :key="m.id" :value="m.id">{{ m.codigo }} — {{ m.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Monto *</label>
            <input v-model.number="pagoForm.monto" class="ide-input" type="number" min="0" step="0.01" />
          </div>
          <div class="ide-field">
            <label>{{ pagoForm.monedaId ? `T.C.: 1 ${monedaNombre(pagoForm.monedaId)} = ? base` : 'Tipo de Cambio *' }}</label>
            <input v-model.number="pagoForm.tipoCambio" class="ide-input" type="number" min="0" step="0.000001"
              :readonly="pagoTcCadena" :class="{ 'ide-input--readonly': pagoTcCadena }" />
            <div class="tc-doble-trigger" :class="{ 'tc-doble-trigger--on': pagoTcCadena }" @click="pagoTcCadena = !pagoTcCadena">
              <span>⇄</span> {{ pagoTcCadena ? 'Ocultar conversión en dos pasos' : 'Pago con conversión en dos pasos' }}
            </div>
            <div v-if="pagoTcCadena" class="tc-doble-inline">
              <div class="tc-doble-campo">
                <span class="tc-doble-hint">{{ monedaNombre(pagoForm.monedaId) || 'moneda' }} → inter.</span>
                <input v-model.number="pagoTc1" class="ide-input tc-doble-input" type="number" min="0" step="0.000001" placeholder="0.001050" @input="recalcTcPago" />
              </div>
              <span class="tc-doble-op">×</span>
              <div class="tc-doble-campo">
                <span class="tc-doble-hint">inter. → base</span>
                <input v-model.number="pagoTc2" class="ide-input tc-doble-input" type="number" min="0" step="0.000001" placeholder="10.13" @input="recalcTcPago" />
              </div>
              <div v-if="pagoTc1 && pagoTc2" class="tc-doble-result">
                <span class="tc-doble-hint">TC efectivo</span>
                <strong>{{ fmtNum6(pagoTc1 * pagoTc2) }}</strong>
              </div>
            </div>
          </div>
          <div class="ide-field">
            <label>Fecha de Pago *</label>
            <input v-model="pagoForm.fechaPago" class="ide-input" type="date" />
          </div>
          <div class="ide-field">
            <label>Método de Pago</label>
            <select v-model="pagoForm.metodoPago" class="ide-input">
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CARTA_CREDITO">Carta de Crédito</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Referencia / N° Operación</label>
            <input v-model="pagoForm.referencia" class="ide-input" />
          </div>
          <div class="ide-field ide-field--full" v-if="pagoForm.monto && pagoForm.tipoCambio">
            <div class="ide-preview-calc ide-preview-calc--conversion">
              <span class="preview-moneda">{{ fmtNum(pagoForm.monto) }} <span class="preview-cod">{{ monedaNombre(pagoForm.monedaId) }}</span></span>
              <span class="preview-op">×</span>
              <span>{{ fmtNum6(pagoForm.tipoCambio) }}</span>
              <span class="preview-op">=</span>
              <strong>{{ fmtNum(pagoForm.monto * pagoForm.tipoCambio) }}</strong>
              <span class="preview-base-label">[base]</span>
            </div>
          </div>
          <div class="ide-field ide-field--full">
            <label>{{ editandoPago ? 'Fuente de fondos' : 'Registrar egreso en fuente (opcional)' }}</label>
            <select v-model="pagoForm.fuenteId" class="ide-input">
              <option value="">— No registrar en ninguna fuente —</option>
              <option v-for="f in fuentes" :key="f.id" :value="f.id">{{ f.nombre }}{{ f.banco ? ' — ' + f.banco : '' }}</option>
            </select>
            <div v-if="editandoPago && pagoForm.fuenteId" class="ide-field-hint">
              Al guardar se registrará un nuevo egreso en la fuente seleccionada.
            </div>
          </div>
          <div class="ide-field ide-field--full">
            <label>Observaciones</label>
            <textarea v-model="pagoForm.observaciones" class="ide-input" rows="2" />
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="pagoDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarPago">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── DIALOG GASTO ─────────────────────────────────────── -->
    <div v-if="gastoDialog" class="ide-modal-overlay">
      <div class="ide-modal ide-modal--sm">
        <div class="ide-modal__header">
          <h3>{{ editandoGasto ? 'Editar Gasto' : 'Registrar Gasto de Logística' }}</h3>
          <button class="ide-modal__close" @click="gastoDialog = false">✕</button>
        </div>
        <div class="ide-modal__body ide-form-grid">
          <div class="ide-field ide-field--full">
            <label>Tipo de Gasto</label>
            <select v-model="gastoForm.tipoGastoId" class="ide-input">
              <option value="">— Sin categoría —</option>
              <option v-for="t in tiposGasto" :key="t.id" :value="t.id">{{ t.nombre }}</option>
            </select>
          </div>
          <div class="ide-field ide-field--full">
            <label>Descripción *</label>
            <input v-model="gastoForm.descripcion" class="ide-input" placeholder="Descripción del gasto" />
          </div>
          <div class="ide-field">
            <label>Moneda *</label>
            <select v-model="gastoForm.monedaId" class="ide-input">
              <option value="">— Seleccionar —</option>
              <option v-for="m in monedas" :key="m.id" :value="m.id">{{ m.codigo }} — {{ m.nombre }}</option>
            </select>
          </div>
          <div class="ide-field">
            <label>Monto *</label>
            <input v-model.number="gastoForm.monto" class="ide-input" type="number" min="0" step="0.01" />
          </div>
          <div class="ide-field">
            <label>Cantidad</label>
            <input v-model.number="gastoForm.cantidad" class="ide-input" type="number" min="1" step="1" placeholder="1" />
            <div v-if="gastoForm.cantidad > 1" style="font-size:11px;color:var(--t4);margin-top:4px;">
              Total: {{ fmtNum(gastoForm.monto * (gastoForm.cantidad || 1)) }}
            </div>
          </div>
          <div class="ide-field">
            <label>{{ gastoForm.monedaId ? `T.C.: 1 ${monedaNombre(gastoForm.monedaId)} = ? base` : 'Tipo de Cambio *' }}</label>
            <input v-model.number="gastoForm.tipoCambio" class="ide-input" type="number" min="0" step="0.000001"
              :readonly="gastoTcCadena" :class="{ 'ide-input--readonly': gastoTcCadena }" />
            <div class="tc-doble-trigger" :class="{ 'tc-doble-trigger--on': gastoTcCadena }" @click="gastoTcCadena = !gastoTcCadena">
              <span>⇄</span> {{ gastoTcCadena ? 'Ocultar conversión en dos pasos' : 'Gasto con conversión en dos pasos' }}
            </div>
            <div v-if="gastoTcCadena" class="tc-doble-inline">
              <div class="tc-doble-campo">
                <span class="tc-doble-hint">{{ monedaNombre(gastoForm.monedaId) || 'moneda' }} = ? inter. (ej. 920 CLP = 1 USD)</span>
                <input v-model.number="gastoTc1" class="ide-input tc-doble-input" type="number" min="0" step="0.01" placeholder="920" @input="recalcTcGasto" />
              </div>
              <span class="tc-doble-op">÷</span>
              <div class="tc-doble-campo">
                <span class="tc-doble-hint">1 inter. = ? base (ej. 1 USD = 10.57 BOB)</span>
                <input v-model.number="gastoTc2" class="ide-input tc-doble-input" type="number" min="0" step="0.000001" placeholder="10.57" @input="recalcTcGasto" />
              </div>
              <div v-if="gastoTc1 && gastoTc2" class="tc-doble-result">
                <span class="tc-doble-hint">TC efectivo</span>
                <strong>{{ fmtNum6(gastoTc2 / gastoTc1) }}</strong>
              </div>
            </div>
          </div>
          <div class="ide-field">
            <label>Fecha del Gasto *</label>
            <input v-model="gastoForm.fechaGasto" class="ide-input" type="date" />
          </div>
          <div class="ide-field">
            <label>País donde se origina</label>
            <select v-model="gastoForm.pais" class="ide-input">
              <option value="">— Sin especificar —</option>
              <option v-for="p in paisesConfig" :key="p.id" :value="p.nombre">{{ p.nombre }}</option>
            </select>
          </div>
          <div v-if="gastoTcCadena && gastoTc1 && gastoTc2" class="ide-field ide-field--full">
            <div class="ide-preview-calc ide-preview-calc--conversion" style="flex-direction:column;align-items:flex-start;gap:10px;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span class="preview-moneda">{{ fmtNum(gastoForm.monto * (gastoForm.cantidad || 1)) }} <span class="preview-cod">{{ monedaNombre(gastoForm.monedaId) }}</span></span>
                <span class="preview-op">÷</span>
                <span>{{ fmtNum6(gastoTc1) }}</span>
                <span class="preview-op">=</span>
                <strong style="color:#f97316;">{{ fmtNum6((gastoForm.monto * (gastoForm.cantidad || 1)) / gastoTc1) }} inter.</strong>
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <strong style="color:#f97316;">{{ fmtNum6((gastoForm.monto * (gastoForm.cantidad || 1)) / gastoTc1) }} inter.</strong>
                <span class="preview-op">×</span>
                <span>{{ fmtNum6(gastoTc2) }}</span>
                <span class="preview-op">=</span>
                <strong style="color:#6366f1;">{{ fmtNum((gastoForm.monto * (gastoForm.cantidad || 1) / gastoTc1) * gastoTc2) }}</strong>
                <span class="preview-base-label">[base]</span>
              </div>
            </div>
          </div>
          <div v-else-if="gastoForm.monto && gastoForm.tipoCambio && !gastoTcCadena" class="ide-field ide-field--full">
            <div class="ide-preview-calc ide-preview-calc--conversion">
              <span class="preview-moneda">{{ fmtNum(gastoForm.monto * (gastoForm.cantidad || 1)) }} <span class="preview-cod">{{ monedaNombre(gastoForm.monedaId) }}</span></span>
              <span class="preview-op">×</span>
              <span>{{ fmtNum6(gastoForm.tipoCambio) }}</span>
              <span class="preview-op">=</span>
              <strong>{{ fmtNum(gastoForm.monto * gastoForm.tipoCambio * (gastoForm.cantidad || 1)) }}</strong>
              <span class="preview-base-label">[base]</span>
            </div>
          </div>
          <div class="ide-field ide-field--full">
            <label>{{ editandoGasto ? 'Fuente de fondos' : 'Registrar egreso en fuente (opcional)' }}</label>
            <select v-model="gastoForm.fuenteId" class="ide-input">
              <option value="">— No registrar en ninguna fuente —</option>
              <option v-for="f in fuentes" :key="f.id" :value="f.id">{{ f.nombre }}{{ f.banco ? ' — ' + f.banco : '' }}</option>
            </select>
            <div v-if="editandoGasto && gastoForm.fuenteId" class="ide-field-hint">
              Al guardar se registrará un nuevo egreso en la fuente seleccionada.
            </div>
          </div>
          <div class="ide-field">
            <label>N° Comprobante / Factura</label>
            <input v-model="gastoForm.comprobante" class="ide-input" />
          </div>
          <div class="ide-field ide-field--full">
            <label>Observaciones</label>
            <textarea v-model="gastoForm.observaciones" class="ide-input" rows="2" />
          </div>
        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="gastoDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="saving" @click="guardarGasto">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── DIALOG CIERRE ────────────────────────────────────── -->
    <div v-if="cierreDialog" class="ide-modal-overlay">
      <div class="ide-modal ide-modal--lg">
        <div class="ide-modal__header">
          <h3>Cerrar Orden — Configurar Precio Propuesto</h3>
          <button class="ide-modal__close" @click="cierreDialog = false">✕</button>
        </div>
        <div class="ide-modal__body">

          <!-- Toggle modo -->
          <div class="cierre-modo-toggle">
            <button class="cierre-modo-btn" :class="{ 'cierre-modo-btn--active': cierreModo === 1 }" @click="cierreModo = 1">
              Precio Directo / Kilo
            </button>
            <button class="cierre-modo-btn" :class="{ 'cierre-modo-btn--active': cierreModo === 2 }" @click="cierreModo = 2">
              Fórmula Avanzada
            </button>
            <button class="cierre-modo-btn" :class="{ 'cierre-modo-btn--active': cierreModo === 3 }" @click="cierreModo = 3">
              Fórmula LOGÍSTICA
            </button>
          </div>

          <!-- ══ MODO PRECIO DIRECTO ════════════════════════════════════ -->
          <template v-if="cierreModo === 1">

            <!-- Controles globales -->
            <div class="fb-section">
              <div style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap;">
                <div class="ide-field" style="min-width:140px;">
                  <label>IVA / Imp. adicional %</label>
                  <input v-model.number="tasaIvaOrden" class="ide-input" type="number" min="0" step="0.01" placeholder="ej. 9" />
                </div>
                <div class="ide-field" style="min-width:140px;">
                  <label>Margen sugerido %</label>
                  <input v-model.number="margenSugerido" class="ide-input" type="number" min="0" step="0.1" placeholder="ej. 30" />
                </div>
                <button class="ide-btn ide-btn--outline ide-btn--sm" style="margin-bottom:1px;" @click="aplicarMargenATodos">
                  Aplicar a todos
                </button>
              </div>
            </div>

            <!-- Tabla precio directo por producto -->
            <div class="fb-section">
              <div class="fb-section__title">
                Determinación de costo y precio de venta por unidad/kg
                <span style="font-size:10px;font-weight:400;color:var(--t5);"> — se actualiza en tiempo real</span>
              </div>
              <div v-if="!items.length" style="font-size:12px;color:var(--t4);padding:8px 0;">
                No hay productos en la orden.
              </div>
              <div v-else-if="!items.some(i => i.costoTotalUnitario)" style="font-size:12px;color:#f59e0b;padding:8px 0;">
                ⚠ Ejecuta "Calcular Costos" antes de cerrar para obtener el P.U. POR KILO.
              </div>
              <div v-else style="overflow-x:auto;">
                <table class="ide-table cierre-precio-table" style="margin-top:4px;min-width:700px;">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style="text-align:right;">P.U. POR KILO</th>
                      <th style="text-align:right;color:#6366f1;">P.U. VENTA</th>
                      <th style="text-align:right;color:#22c55e;">P.U. VENTA + IVA</th>
                      <th style="text-align:right;color:#60a5fa;">UTILIDAD / TON</th>
                      <th style="text-align:right;color:#a78bfa;">UTILIDAD / TON + IVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in previewItemsDirecto" :key="row.id">
                      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        {{ row.descripcionProducto }}
                      </td>
                      <td style="text-align:right;color:var(--t4);">
                        {{ row.precioPorKilo ? fmtNum(row.precioPorKilo) : '—' }}
                      </td>
                      <td style="text-align:right;padding:4px 8px;">
                        <input
                          :value="preciosVentaManualMap[row.id] !== undefined && preciosVentaManualMap[row.id] !== '' ? preciosVentaManualMap[row.id] : (row.precioVenta > 0 ? row.precioVenta.toFixed(4) : '')"
                          @input="$set(preciosVentaManualMap, row.id, $event.target.value)"
                          class="ide-input cierre-precio-input"
                          type="number" min="0" step="0.01"
                          :placeholder="row.precioVenta > 0 ? row.precioVenta.toFixed(4) : '0.00'"
                        />
                      </td>
                      <td style="text-align:right;font-weight:600;color:#22c55e;">
                        {{ row.precioVenta > 0 ? fmtNum(row.precioVentaIva) : '—' }}
                      </td>
                      <td style="text-align:right;" :style="{ color: row.utilidadTon >= 0 ? '#60a5fa' : '#ef4444' }">
                        {{ row.precioVenta > 0 ? fmtNum(row.utilidadTon) : '—' }}
                      </td>
                      <td style="text-align:right;" :style="{ color: row.utilidadTonIva >= 0 ? '#a78bfa' : '#ef4444' }">
                        {{ row.precioVenta > 0 ? fmtNum(row.utilidadTonIva) : '—' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </template>

          <!-- ══ MODO FÓRMULA AVANZADA ══════════════════════════════════ -->
          <template v-else-if="cierreModo === 2">

            <!-- Gastos para el precio -->
            <div class="fb-section">
              <div class="fb-section__title">
                Gastos logísticos incluidos en el precio
                <span style="font-size:10px;font-weight:400;color:var(--t5);"> — selecciona cuáles afectan el precio propuesto</span>
              </div>
              <div v-if="!gastos.length" style="font-size:12px;color:var(--t4);">Sin gastos registrados.</div>
              <table v-else class="ide-table fb-gastos-table">
                <thead>
                  <tr>
                    <th style="width:32px;"></th>
                    <th>Gasto</th>
                    <th style="text-align:right;">Monto</th>
                    <th style="text-align:right;">TC original</th>
                    <th style="text-align:right;">TC para precio</th>
                    <th style="text-align:right;">Monto base efectivo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in gastos" :key="g.id" :class="{ 'fb-gasto-off': gastosParaPrecioMap[g.id] === false }">
                    <td>
                      <div class="cierre-toggle-check" :class="{ 'cierre-toggle-check--on': gastosParaPrecioMap[g.id] !== false }"
                        style="margin:0 auto;cursor:pointer;"
                        @click="toggleGastoPrecio(g.id)">
                        <span v-if="gastosParaPrecioMap[g.id] !== false">✓</span>
                      </div>
                    </td>
                    <td>
                      <div style="font-size:13px;color:var(--t2);">{{ g.descripcion }}</div>
                      <div style="font-size:11px;color:var(--t5);">{{ tipoGastoNombre(g.tipoGastoId) }}</div>
                    </td>
                    <td style="text-align:right;">{{ fmtNum(g.monto) }} <span style="font-size:10px;color:var(--t5);">{{ monedaNombre(g.monedaId) }}</span></td>
                    <td style="text-align:right;color:var(--t4);">{{ fmtNum6(g.tipoCambio) }}</td>
                    <td style="text-align:right;">
                      <input
                        v-model="tcOverridesMap[g.id]"
                        class="ide-input fb-tc-input"
                        type="number" min="0" step="0.0001"
                        :placeholder="fmtNum6(g.tipoCambio)"
                        :disabled="gastosParaPrecioMap[g.id] === false"
                      />
                    </td>
                    <td style="text-align:right;font-weight:600;" :style="{ color: gastosParaPrecioMap[g.id] === false ? 'var(--b3)' : 'var(--t3)' }">
                      {{ fmtNum(Number(g.monto) * tcEfectivo(g)) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="5" style="text-align:right;font-size:11px;color:var(--t4);padding:8px 12px;">Total gastos para precio (base):</td>
                    <td style="text-align:right;font-weight:700;color:#60a5fa;padding:8px 12px;">{{ fmtNum(totalGastosParaPrecio) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Base de cálculo -->
            <div class="fb-section">
              <div class="fb-section__title">Base de cálculo por unidad</div>
              <div class="fb-base-opts">
                <div class="fb-base-opt" :class="{ 'fb-base-opt--active': formulaBase === 'costoTotal' }" @click="formulaBase = 'costoTotal'">
                  <div class="fb-base-opt__name">Costo Total para Precio</div>
                  <div class="fb-base-opt__desc">Precio producto + gastos seleccionados con TC para precio</div>
                </div>
                <div class="fb-base-opt" :class="{ 'fb-base-opt--active': formulaBase === 'costoProducto' }" @click="formulaBase = 'costoProducto'">
                  <div class="fb-base-opt__name">Solo Costo del Producto</div>
                  <div class="fb-base-opt__desc">Precio unitario en moneda base, sin incluir logística</div>
                </div>
              </div>
            </div>

            <!-- Pasos de la fórmula -->
            <div class="fb-section">
              <div class="fb-section__title">Pasos de la fórmula</div>
              <div v-if="!formulaPasos.length" style="font-size:12px;color:var(--t4);padding:8px 0;">
                Sin pasos — el precio propuesto será igual a la base seleccionada.
              </div>
              <div v-for="(paso, idx) in formulaPasos" :key="idx" class="fb-paso">
                <span class="fb-paso__num">{{ idx + 1 }}</span>
                <select v-model="paso.operacion" class="ide-input fb-paso__op">
                  <option value="multiplicar">× Multiplicar</option>
                  <option value="dividir">÷ Dividir</option>
                  <option value="sumar">+ Sumar</option>
                  <option value="restar">− Restar</option>
                </select>
                <input v-model.number="paso.valor" class="ide-input fb-paso__val" type="number" min="0" step="0.01" placeholder="Valor" />
                <div class="fb-paso__preview" v-if="previewBase !== null">
                  = {{ fmtNum(evaluarPasoHasta(idx)) }}
                </div>
                <button class="ide-btn ide-btn--sm ide-btn--danger" style="flex-shrink:0;" @click="formulaPasos.splice(idx, 1)">✕</button>
              </div>
              <button class="ide-btn ide-btn--sm ide-btn--outline" style="margin-top:8px;" @click="formulaPasos.push({ operacion: 'multiplicar', valor: 1 })">
                + Agregar paso
              </button>
            </div>

            <!-- Redondeo -->
            <div class="fb-section">
              <div class="fb-section__title">Redondeo</div>
              <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                <select v-model="formulaRedondeo.tipo" class="ide-input" style="width:210px;">
                  <option value="ninguno">Sin redondeo</option>
                  <option value="entero">Al entero superior (ceil)</option>
                  <option value="multiplo">Al múltiplo más cercano</option>
                </select>
                <div v-if="formulaRedondeo.tipo === 'multiplo'" style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:12px;color:var(--t4);">Múltiplo:</span>
                  <select v-model.number="formulaRedondeo.multiplo" class="ide-input" style="width:90px;">
                    <option :value="0.5">0.50</option>
                    <option :value="1">1.00</option>
                    <option :value="5">5.00</option>
                    <option :value="10">10.00</option>
                    <option :value="50">50.00</option>
                    <option :value="100">100.00</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Vista previa por producto -->
            <div class="fb-section">
              <div class="fb-section__title">
                Vista previa por producto
                <span style="font-size:10px;font-weight:400;color:var(--t5);"> — actualiza en tiempo real</span>
              </div>
              <div v-if="!itemsConCosto.length" style="font-size:12px;color:var(--t4);padding:8px 0;">
                No hay ítems con costo calculado. Ejecuta "Calcular Costos" antes de cerrar.
              </div>
              <table v-else class="ide-table" style="margin-top:4px;">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align:right;">Costo Contable</th>
                    <th style="text-align:right;">Log. asignada</th>
                    <th style="text-align:right;">Costo p/Precio</th>
                    <th style="text-align:right;color:#f59e0b;">Precio Propuesto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in previewItemsConPrecio" :key="row.id">
                    <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ row.descripcionProducto }}</td>
                    <td style="text-align:right;color:var(--t4);">{{ fmtNum(row.costoTotalUnitario) }}</td>
                    <td style="text-align:right;color:#60a5fa;">{{ fmtNum(row.gastoAsignadoPrecio / Number(row.cantidadUnidades)) }}</td>
                    <td style="text-align:right;">{{ fmtNum(row.costoUnitParaPrecio) }}</td>
                    <td style="text-align:right;font-weight:700;color:#fbbf24;">{{ fmtNum(row.precioPropuesto) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </template>

          <!-- ══ MODO FÓRMULA LOGÍSTICA SIMPLIFICADA ═════════════════════ -->
          <template v-else-if="cierreModo === 3">

            <!-- Gastos para precio -->
            <div class="fb-section">
              <div class="fb-section__title">
                Gastos logísticos incluidos en el precio
                <span style="font-size:10px;font-weight:400;color:var(--t5);"> — selecciona cuáles afectan el precio</span>
              </div>
              <div v-if="!gastos.length" style="font-size:12px;color:var(--t4);">Sin gastos registrados.</div>
              <table v-else class="ide-table fb-gastos-table">
                <thead>
                  <tr>
                    <th style="width:32px;"></th>
                    <th>Gasto</th>
                    <th style="text-align:right;">Monto</th>
                    <th style="text-align:right;">TC original</th>
                    <th style="text-align:right;">TC para precio</th>
                    <th style="text-align:right;">Monto base efectivo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in gastos" :key="g.id" :class="{ 'fb-gasto-off': logGastosMap[g.id] === false }">
                    <td>
                      <div class="cierre-toggle-check" :class="{ 'cierre-toggle-check--on': logGastosMap[g.id] !== false }"
                        style="margin:0 auto;cursor:pointer;"
                        @click="logGastosMap[g.id] = logGastosMap[g.id] === false ? undefined : false">
                        <span v-if="logGastosMap[g.id] !== false">✓</span>
                      </div>
                    </td>
                    <td>
                      <div style="font-size:13px;color:var(--t2);">{{ g.descripcion }}</div>
                      <div style="font-size:11px;color:var(--t5);">{{ tipoGastoNombre(g.tipoGastoId) }}</div>
                    </td>
                    <td style="text-align:right;">{{ fmtNum(g.monto) }} <span style="font-size:10px;color:var(--t5);">{{ monedaNombre(g.monedaId) }}</span></td>
                    <td style="text-align:right;color:var(--t4);">{{ fmtNum6(g.tipoCambio) }}</td>
                    <td style="text-align:right;">
                      <input
                        v-model="logTcMap[g.id]"
                        class="ide-input fb-tc-input"
                        type="number" min="0" step="0.0001"
                        :placeholder="fmtNum6(g.tipoCambio)"
                        :disabled="logGastosMap[g.id] === false"
                      />
                    </td>
                    <td style="text-align:right;font-weight:600;" :style="{ color: logGastosMap[g.id] === false ? 'var(--b3)' : 'var(--t3)' }">
                      {{ fmtNum(Number(g.monto) * (logTcMap[g.id] ? Number(logTcMap[g.id]) : Number(g.tipoCambio))) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Constructor de precio -->
            <div class="fb-section" style="margin-top:16px;">
              <div class="fb-section__title">Constructor de precio por unidad</div>
              <div style="font-size:12px;color:var(--t5);margin-bottom:14px;">
                PRECIO = (Costo Compra × A + B) + (Costo Logística × C + D) + Ajuste Fijo × (1 + Ajuste%)
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
                <!-- Componente Compra -->
                <div style="border:1px solid var(--b2);border-radius:6px;padding:12px;background:var(--b1);">
                  <div style="font-size:12px;font-weight:600;color:#a78bfa;margin-bottom:8px;">Componente: COMPRA</div>
                  <div class="ide-field" style="margin-bottom:8px;">
                    <label style="font-size:11px;">Multiplicador (A)</label>
                    <input v-model.number="logCompraMulti" class="ide-input" type="number" min="0" step="0.01" />
                  </div>
                  <div class="ide-field">
                    <label style="font-size:11px;">Sumar fijo (B)</label>
                    <input v-model.number="logCompraSumar" class="ide-input" type="number" step="0.01" />
                  </div>
                </div>

                <!-- Componente Logística -->
                <div style="border:1px solid var(--b2);border-radius:6px;padding:12px;background:var(--b1);">
                  <div style="font-size:12px;font-weight:600;color:#60a5fa;margin-bottom:8px;">Componente: LOGÍSTICA</div>
                  <div class="ide-field" style="margin-bottom:8px;">
                    <label style="font-size:11px;">Multiplicador (C)</label>
                    <input v-model.number="logLogMulti" class="ide-input" type="number" min="0" step="0.01" />
                  </div>
                  <div class="ide-field">
                    <label style="font-size:11px;">Sumar fijo (D)</label>
                    <input v-model.number="logLogSumar" class="ide-input" type="number" step="0.01" />
                  </div>
                </div>
              </div>

              <!-- Ajuste final -->
              <div style="border:1px solid var(--b2);border-radius:6px;padding:12px;background:var(--b1);">
                <div style="font-size:12px;font-weight:600;color:#fbbf24;margin-bottom:8px;">Ajuste final y Redondeo</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                  <div class="ide-field">
                    <label style="font-size:11px;">Ajuste fijo global</label>
                    <input v-model.number="logAjusteFijo" class="ide-input" type="number" step="0.01" />
                  </div>
                  <div class="ide-field">
                    <label style="font-size:11px;">Ajuste porcentaje (%)</label>
                    <input v-model.number="logAjustePorcentaje" class="ide-input" type="number" min="0" max="100" step="0.01" placeholder="0" />
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div class="ide-field">
                    <label style="font-size:11px;">Redondeo</label>
                    <select v-model="logRedondeoTipo" class="ide-input">
                      <option value="ninguno">Sin redondeo</option>
                      <option value="entero">Al entero superior</option>
                      <option value="multiplo">Al múltiplo</option>
                    </select>
                  </div>
                  <div v-if="logRedondeoTipo === 'multiplo'" class="ide-field">
                    <label style="font-size:11px;">Múltiplo</label>
                    <select v-model.number="logRedondeoMultiplo" class="ide-input">
                      <option :value="0.5">0.50</option><option :value="1">1.00</option>
                      <option :value="5">5.00</option><option :value="10">10.00</option>
                      <option :value="50">50.00</option><option :value="100">100.00</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Vista previa -->
            <div class="fb-section" style="margin-top:16px;">
              <div class="fb-section__title">Vista previa por producto</div>
              <div v-if="!itemsConCosto.length" style="font-size:12px;color:var(--t4);padding:8px 0;">
                No hay ítems con costo calculado. Ejecuta "Calcular Costos" antes de cerrar.
              </div>
              <table v-else class="ide-table" style="margin-top:4px;">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align:right;">Cant.</th>
                    <th style="text-align:right;">Compra Unit.</th>
                    <th style="text-align:right;">Log. Unit.</th>
                    <th style="text-align:right;color:#f59e0b;">Precio Final</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in logPreviewItems" :key="row.id">
                    <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ row.descripcionProducto }}</td>
                    <td style="text-align:right;">{{ row.cantidadUnidades }}</td>
                    <td style="text-align:right;color:#a78bfa;">{{ fmtNum(row.compraUnit) }}</td>
                    <td style="text-align:right;color:#60a5fa;">{{ fmtNum(row.logUnit) }}</td>
                    <td style="text-align:right;font-weight:700;color:#fbbf24;">{{ fmtNum(row.precio) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </template>

          <!-- Inventario (común a todos los modos) -->
          <div class="cierre-inventario-toggle" @click="ingresarInventario = !ingresarInventario">
            <div class="cierre-toggle-check" :class="{ 'cierre-toggle-check--on': ingresarInventario }">
              <span v-if="ingresarInventario">✓</span>
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--t2);">Ingresar al inventario automáticamente</div>
              <div style="font-size:11px;color:var(--t4);margin-top:2px;">Crea un lote por cada producto vinculado al catálogo</div>
            </div>
          </div>
          <div v-if="ingresarInventario" class="ide-field" style="margin-top:12px;">
            <label>Sucursal destino *</label>
            <select v-model="sucursalCierreId" class="ide-input">
              <option value="">— Seleccionar sucursal —</option>
              <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>

        </div>
        <div class="ide-modal__footer">
          <button class="ide-btn" @click="cierreDialog = false">Cancelar</button>
          <button class="ide-btn ide-btn--primary" :disabled="cerrando" @click="cerrarOrden">
            {{ cerrando ? 'Cerrando...' : 'Cerrar Orden' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'LogisticaOrdenDetalle',
  data: () => ({
    loading: false,
    orden: null,
    items: [], pagos: [], gastos: [],
    monedas: [], tiposGasto: [], productos: [], categorias: [], subcategorias: [], paisesConfig: [], fuentes: [],
    trazabilidad: null,
    subTab: 'items',
    // Flags
    calculando: false, cerrando: false, saving: false,
    // Dialogs
    itemDialog: false, editandoItem: null, itemForm: {}, productoSearchText: '', productoDropdownOpen: false, productoHighlightIndex: -1,
    pagoDialog: false, editandoPago: null, pagoForm: {},
    gastoDialog: false, editandoGasto: null, gastoForm: {},
    pagoTcCadena: false, pagoTc1: '', pagoTc2: '',
    gastoTcCadena: false, gastoTc1: '', gastoTc2: '',
    cierreDialog: false, ingresarInventario: false, sucursalCierreId: '', sucursales: [],
    // Modo de cierre (1: directo, 2: fórmula avanzada, 3: logística simplificada)
    cierreModo: 1,
    // Modo precio directo
    tasaIvaOrden: 9,
    margenSugerido: 0,
    preciosVentaManualMap: {},
    // Modo fórmula avanzada
    formulaBase: 'costoTotal',
    formulaPasos: [{ operacion: 'multiplicar', valor: 1.30 }],
    formulaRedondeo: { tipo: 'ninguno', multiplo: 0.5 },
    gastosParaPrecioMap: {},
    tcOverridesMap: {},
    // Modo fórmula LOGÍSTICA simplificada
    logCompraMulti: 1,
    logCompraSumar: 0,
    logLogMulti: 1,
    logLogSumar: 0,
    logAjusteFijo: 0,
    logAjustePorcentaje: 0,
    logRedondeoTipo: 'ninguno',
    logRedondeoMultiplo: 0.5,
    logGastosMap: {},
    logTcMap: {},
  }),
  computed: {
    subTabs() {
      return [
        { id: 'items', label: 'Productos', count: this.items.length },
        { id: 'pagos', label: 'Pagos al Proveedor', count: this.pagos.length },
        { id: 'gastos', label: 'Gastos Logísticos', count: this.gastos.length },
        { id: 'trazabilidad', label: 'Trazabilidad / Resumen', count: null },
      ]
    },
    itemsConCosto() {
      return this.items.filter(i => i.productoId && i.costoTotalUnitario)
    },
    totalGastosParaPrecio() {
      return this.gastos
        .filter(g => this.gastosParaPrecioMap[g.id] !== false)
        .reduce((s, g) => s + Number(g.monto) * this.tcEfectivo(g), 0)
    },
    previewItemsConPrecio() {
      if (!this.itemsConCosto.length) return []
      const totalProdBase = this.itemsConCosto.reduce((s, i) => s + Number(i.subtotalMonedaBase ?? 0), 0)
      const unidadesTot = this.itemsConCosto.reduce((s, i) => s + Number(i.cantidadUnidades), 0)
      return this.itemsConCosto.map(item => {
        let factor = 0
        if (this.orden && this.orden.metodoDistribucion === 'POR_CANTIDAD') {
          factor = unidadesTot > 0 ? Number(item.cantidadUnidades) / unidadesTot : 0
        } else {
          factor = totalProdBase > 0 ? Number(item.subtotalMonedaBase) / totalProdBase : 0
        }
        const gastoAsignadoPrecio = this.totalGastosParaPrecio * factor
        const costoItemPrecio = Number(item.subtotalMonedaBase ?? 0) + gastoAsignadoPrecio
        const costoUnitParaPrecio = Number(item.cantidadUnidades) > 0
          ? costoItemPrecio / Number(item.cantidadUnidades)
          : Number(item.costoTotalUnitario)
        const baseVal = this.formulaBase === 'costoProducto'
          ? Number(item.precioUnitarioMonedaBase)
          : costoUnitParaPrecio
        return { ...item, gastoAsignadoPrecio, costoUnitParaPrecio, precioPropuesto: this.calcularPrecioFormula(baseVal) }
      })
    },
    previewBase() {
      if (!this.previewItemsConPrecio.length) return null
      const first = this.previewItemsConPrecio[0]
      return this.formulaBase === 'costoProducto'
        ? Number(first.precioUnitarioMonedaBase)
        : first.costoUnitParaPrecio
    },
    totalProductosCalculado() {
      return this.items.reduce((sum, item) => sum + Number(item.subtotalMonedaBase ?? 0), 0)
    },
    totalProductosCompra() {
      return this.items.reduce((sum, item) => sum + Number(item.precioUnitarioMonedaCompra ?? 0) * Number(item.cantidadUnidades ?? 0), 0)
    },
    previewItemsDirecto() {
      const iva = Number(this.tasaIvaOrden || 0) / 100
      const margen = Number(this.margenSugerido || 0) / 100
      return this.items.map(item => {
        const precioPorKilo = Number(item.costoTotalUnitario) || 0
        // Si hay un precio ingresado manualmente, usarlo; si no, sugerir basado en margen
        let precioVenta = Number(this.preciosVentaManualMap[item.id])
        if (!precioVenta || precioVenta === 0) {
          precioVenta = precioPorKilo > 0 ? precioPorKilo * (1 + margen) : 0
        }
        const precioVentaIva = precioVenta * (1 + iva)
        return {
          ...item,
          precioPorKilo,
          precioVenta,
          precioVentaIva,
          utilidadTon:    (precioVenta - precioPorKilo) * 1000,
          utilidadTonIva: (precioVentaIva - precioPorKilo) * 1000,
        }
      })
    },
    paisesGastoExistentes() {
      return [...new Set(this.gastos.map(g => g.pais).filter(Boolean))]
    },
    // ── Módulo Precio LOGÍSTICA ──────────────────────────────
    logPreviewItems() {
      if (!this.itemsConCosto.length) return []
      const totalProdBase = this.itemsConCosto.reduce((s, i) => s + Number(i.subtotalMonedaBase ?? 0), 0)
      const unidadesTot = this.itemsConCosto.reduce((s, i) => s + Number(i.cantidadUnidades), 0)
      const totalLogBase = this.gastos
        .filter(g => this.logGastosMap[g.id] !== false)
        .reduce((s, g) => s + Number(g.monto) * (this.logTcMap[g.id] ? Number(this.logTcMap[g.id]) : Number(g.tipoCambio)), 0)

      return this.itemsConCosto.map(item => {
        const factor = this.orden.metodoDistribucion === 'POR_CANTIDAD'
          ? (unidadesTot > 0 ? Number(item.cantidadUnidades) / unidadesTot : 0)
          : (totalProdBase > 0 ? Number(item.subtotalMonedaBase ?? 0) / totalProdBase : 0)
        const logUnit = Number(item.cantidadUnidades) > 0 ? (totalLogBase * factor) / Number(item.cantidadUnidades) : 0
        const compraUnit = Number(item.precioUnitarioMonedaBase ?? 0)

        const precioCompra = compraUnit * Number(this.logCompraMulti) + Number(this.logCompraSumar)
        const precioLog = logUnit * Number(this.logLogMulti) + Number(this.logLogSumar)
        let precio = (precioCompra + precioLog + Number(this.logAjusteFijo)) * (1 + Number(this.logAjustePorcentaje) / 100)
        if (this.logRedondeoTipo === 'entero') precio = Math.ceil(precio)
        else if (this.logRedondeoTipo === 'multiplo' && this.logRedondeoMultiplo) {
          precio = Math.ceil(precio / this.logRedondeoMultiplo) * this.logRedondeoMultiplo
        }

        return {
          id: item.id,
          descripcionProducto: item.descripcionProducto,
          cantidadUnidades: item.cantidadUnidades,
          compraUnit,
          logUnit,
          precio,
        }
      })
    },
    productosConLabel() {
      return this.productos.map(p => {
        const sub = this.subcategorias.find(s => s.id === p.subcategoriaId)
        const cat = sub ? this.categorias.find(c => c.id === sub.categoriaId) : null
        const prefix = [cat?.nombre, sub?.nombre].filter(Boolean).join(' > ')
        return { ...p, label: prefix ? `${prefix} > ${p.nombre}` : p.nombre }
      })
    },
    productosFiltrados() {
      if (!this.productoSearchText) return this.productosConLabel.slice(0, 10)
      const q = this.productoSearchText.toLowerCase()
      return this.productosConLabel.filter(p => p.label.toLowerCase().includes(q)).slice(0, 15)
    },
    productoSeleccionado() {
      if (!this.itemForm.productoId) return null
      return this.productosConLabel.find(p => p.id === this.itemForm.productoId)
    },
    productosIdsEnOrden() {
      const editId = this.editandoItem?.productoId
      return new Set(
        this.items
          .map(i => i.productoId)
          .filter(id => id && id !== editId)
      )
    },
    totalPagosBase() {
      return this.pagos.reduce((s, p) => s + Number(p.monto) * Number(p.tipoCambio), 0)
    },
    totalGastosBase() {
      return this.gastos.reduce((s, g) => s + Number(g.monto) * (Number(g.cantidad) || 1) * Number(g.tipoCambio), 0)
    },
    totalPagosPorMoneda() {
      const m = {}
      for (const p of this.pagos) {
        const cod = this.monedaNombre(p.monedaId)
        m[cod] = (m[cod] || 0) + Number(p.monto)
      }
      return m
    },
    totalGastosPorMoneda() {
      const m = {}
      for (const g of this.gastos) {
        const cod = this.monedaNombre(g.monedaId)
        m[cod] = (m[cod] || 0) + Number(g.monto) * (Number(g.cantidad) || 1)
      }
      return m
    },
    totalOrdenBase() {
      return this.totalProductosCalculado || Number(this.orden?.totalProductosMonedaBase ?? 0)
    },
    totalPendientePagos() {
      return Math.max(0, this.totalOrdenBase - this.totalPagosBase)
    },
    porcentajePagado() {
      if (!this.totalOrdenBase) return 0
      return Math.min(100, (this.totalPagosBase / this.totalOrdenBase) * 100)
    },
    pagoActualBase() {
      const m = Number(this.pagoForm.monto) || 0
      const tc = Number(this.pagoForm.tipoCambio) || 0
      return m * tc
    },
    tipoCambioCompra() {
      if (!this.items.length) return 1
      const firstItem = this.items[0]
      return Number(firstItem.tipoCambio) || 1
    },
    monedaCompraId() {
      if (!this.items.length) return null
      return this.items[0].monedaCompraId || null
    },
    totalPagosCompra() {
      if (!this.pagos.length) return 0
      return this.pagos.reduce((sum, p) => {
        const monto = Number(p.monto) || 0
        // Si el pago está en la misma moneda de compra, sumar directamente
        if (p.monedaId === this.monedaCompraId) {
          return sum + monto
        }
        // Si está en otra moneda, convertir a base y luego a compra
        const tipoCambioPago = Number(p.tipoCambio) || 1
        const montoBase = monto * tipoCambioPago
        const montoCompra = montoBase / this.tipoCambioCompra
        return sum + montoCompra
      }, 0)
    },
    totalOrdenCompra() {
      return Number(this.orden?.totalProductosMonedaCompra) || this.totalProductosCompra
    },
    totalPendientePagosCompra() {
      return Math.max(0, this.totalOrdenCompra - this.totalPagosCompra)
    },
    porcentajePagadoCompra() {
      if (!this.totalOrdenCompra) return 0
      return Math.min(100, (this.totalPagosCompra / this.totalOrdenCompra) * 100)
    },
  },
  watch: {
    'gastoForm.tipoGastoId'(nuevoTipoId) {
      if (nuevoTipoId && !this.editandoGasto) {
        const tipoGasto = this.tiposGasto.find(t => t.id === nuevoTipoId)
        if (tipoGasto) {
          this.gastoForm.descripcion = tipoGasto.nombre
        }
      }
    },
  },
  created() {
    this.cargarTodo()
  },
  methods: {
    fmtNum(v) {
      if (v == null) return '—'
      return Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    fmtNum6(v) {
      if (v == null) return '—'
      return Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
    },
    chipEstado(e) {
      const map = { BORRADOR: 'ide-chip--grey', EN_TRANSITO: 'ide-chip--blue', EN_ADUANA: 'ide-chip--orange', RECIBIDO: 'ide-chip--purple', CERRADO: 'ide-chip--success' }
      return map[e] || 'ide-chip--grey'
    },
    monedaNombre(id) {
      const m = this.monedas.find(x => x.id === id)
      return m ? m.codigo : id || '—'
    },
    tipoGastoNombre(id) {
      if (!id) return '—'
      const t = this.tiposGasto.find(x => x.id === id)
      return t ? t.nombre : '—'
    },
    categoriasDeProducto(productoId) {
      const prod = this.productos.find(p => p.id === productoId)
      if (!prod) return 'vinculado al catálogo'
      const sub = this.subcategorias.find(s => s.id === prod.subcategoriaId)
      const cat = sub ? this.categorias.find(c => c.id === sub.categoriaId) : null
      return [cat?.nombre, sub?.nombre].filter(Boolean).join(' > ') || 'vinculado al catálogo'
    },
    async cargarTodo() {
      this.loading = true
      try {
        const [detalle, monedasData, tiposData, productosData, categoriasData, subcategoriasData, paisesData, fuentesData] = await Promise.all([
          this.$service.get(`logistica-ordenes/${this.$route.params.id}`),
          this.$service.list('logistica-monedas'),
          this.$service.list('logistica-tipos-gasto'),
          this.$service.list('productos?soloActivos=true'),
          this.$service.list('categorias-producto?soloActivos=true'),
          this.$service.list('subcategorias-producto?soloActivos=true'),
          this.$service.list('logistica-paises'),
          this.$service.list('fuentes'),
        ])
        this.monedas = monedasData || []
        this.tiposGasto = tiposData || []
        this.productos = productosData || []
        this.categorias = categoriasData || []
        this.subcategorias = subcategoriasData || []
        this.paisesConfig = (paisesData || []).filter(p => p.activo)
        this.fuentes = fuentesData || []
        if (detalle) {
          this.orden = { ...detalle, items: undefined, pagos: undefined, gastos: undefined }
          this.items = detalle.items || []
          this.pagos = detalle.pagos || []
          this.gastos = detalle.gastos || []
        }
        await this.cargarTrazabilidad()
      } finally { this.loading = false }
    },
    async cargarTrazabilidad() {
      try {
        const datos = await this.$service.get(`logistica-ordenes/${this.$route.params.id}/trazabilidad`)
        if (datos && datos.items && datos.items.some(i => i.costoTotalUnitario != null)) {
          this.trazabilidad = datos
        } else {
          this.trazabilidad = datos
        }
      // eslint-disable-next-line no-empty
      } catch (_) { /* trazabilidad no disponible aún */ }
    },
    async calcularCostos() {
      this.calculando = true
      try {
        await this.$service.post(`logistica-ordenes/${this.$route.params.id}/calcular`, {})
        this.$message.success('Costos calculados correctamente.')
        await this.cargarTodo()
        this.subTab = 'trazabilidad'
      } finally { this.calculando = false }
    },
    tcEfectivo(g) {
      const v = this.tcOverridesMap[g.id]
      return (v !== '' && v != null && !isNaN(Number(v))) ? Number(v) : Number(g.tipoCambio)
    },
    toggleGastoPrecio(id) {
      this.$set(this.gastosParaPrecioMap, id, this.gastosParaPrecioMap[id] === false ? true : false)
    },
    calcularPrecioFormula(base) {
      let precio = Number(base) || 0
      for (const paso of this.formulaPasos) {
        const v = Number(paso.valor) || 0
        if (paso.operacion === 'multiplicar') precio = precio * v
        else if (paso.operacion === 'dividir') precio = v !== 0 ? precio / v : precio
        else if (paso.operacion === 'sumar') precio = precio + v
        else if (paso.operacion === 'restar') precio = precio - v
      }
      if (this.formulaRedondeo.tipo === 'entero') precio = Math.ceil(precio)
      else if (this.formulaRedondeo.tipo === 'multiplo' && this.formulaRedondeo.multiplo) {
        precio = Math.ceil(precio / this.formulaRedondeo.multiplo) * this.formulaRedondeo.multiplo
      }
      return Math.max(0, precio)
    },
    evaluarPasoHasta(idx) {
      if (this.previewBase === null) return 0
      let precio = this.previewBase
      for (let i = 0; i <= idx; i++) {
        const paso = this.formulaPasos[i]
        const v = Number(paso.valor) || 0
        if (paso.operacion === 'multiplicar') precio = precio * v
        else if (paso.operacion === 'dividir') precio = v !== 0 ? precio / v : precio
        else if (paso.operacion === 'sumar') precio = precio + v
        else if (paso.operacion === 'restar') precio = precio - v
      }
      return Math.max(0, precio)
    },
    aplicarMargenATodos() {
      const m = Number(this.margenSugerido) / 100
      for (const item of this.items) {
        const costo = Number(item.costoTotalUnitario) || 0
        this.$set(this.preciosVentaManualMap, item.id, +(costo * (1 + m)).toFixed(4))
      }
    },
    async abrirCierreDialog() {
      this.ingresarInventario = false
      this.sucursalCierreId = ''
      this.cierreModo = 1
      this.margenSugerido = 0
      // Inicializar precios directos con valores ya guardados (si existen)
      const mapaPrecio = {}
      for (const item of this.items) {
        if (item.precioVentaManual) this.$set(mapaPrecio, item.id, item.precioVentaManual)
      }
      this.preciosVentaManualMap = mapaPrecio
      // Modo fórmula avanzada
      this.formulaBase = 'costoTotal'
      this.formulaPasos = [{ operacion: 'multiplicar', valor: 1.30 }]
      this.formulaRedondeo = { tipo: 'ninguno', multiplo: 0.5 }
      const mapaGastos = {}
      const mapaTC = {}
      for (const g of this.gastos) {
        mapaGastos[g.id] = true
        mapaTC[g.id] = ''
      }
      this.gastosParaPrecioMap = mapaGastos
      this.tcOverridesMap = mapaTC
      // Modo fórmula LOGÍSTICA simplificada
      this.logCompraMulti = 1
      this.logCompraSumar = 0
      this.logLogMulti = 1
      this.logLogSumar = 0
      this.logAjusteFijo = 0
      this.logAjustePorcentaje = 0
      this.logRedondeoTipo = 'ninguno'
      this.logRedondeoMultiplo = 0.5
      this.logGastosMap = mapaGastos
      this.logTcMap = mapaTC
      if (!this.sucursales.length) {
        const data = await this.$service.list('sucursales')
        this.sucursales = data || []
      }
      this.cierreDialog = true
    },
    async cerrarOrden() {
      if (this.ingresarInventario && !this.sucursalCierreId) return this.$message.error('Selecciona la sucursal destino del inventario.')
      if (this.cierreModo === 1) {
        // Validar que haya al menos un precio (manual o sugerido)
        const margen = Number(this.margenSugerido || 0) / 100
        const hayPreciosOSugerencias = this.items.some(item => {
          const precioManual = Number(this.preciosVentaManualMap[item.id]) || 0
          if (precioManual > 0) return true
          const costo = Number(item.costoTotalUnitario) || 0
          const precioSugerido = costo > 0 ? costo * (1 + margen) : 0
          return precioSugerido > 0
        })
        if (!hayPreciosOSugerencias) return this.$message.error('Ingresa al menos un P.U. VENTA o Margen sugerido antes de cerrar.')
      }
      this.cerrando = true
      try {
        const basePayload = {
          ingresarInventario: this.ingresarInventario || undefined,
          sucursalId: this.ingresarInventario ? this.sucursalCierreId : undefined,
        }
        let payload
        if (this.cierreModo === 1) {
          // ── MODO PRECIO DIRECTO ──────────────────────────────────────────
          const margen = Number(this.margenSugerido || 0) / 100
          const preciosVentaConSugerencias = this.items
            .map(item => {
              const precioManual = Number(this.preciosVentaManualMap[item.id]) || 0
              let precioVenta = precioManual
              if (!precioVenta || precioVenta === 0) {
                const costo = Number(item.costoTotalUnitario) || 0
                precioVenta = costo > 0 ? costo * (1 + margen) : 0
              }
              return precioVenta > 0 ? { itemId: item.id, precioVenta } : null
            })
            .filter(p => p !== null)
          payload = Object.assign({}, basePayload, {
            tasaIva: Number(this.tasaIvaOrden || 0) / 100,
            preciosVentaManual: preciosVentaConSugerencias,
          })
        } else if (this.cierreModo === 2) {
          // ── MODO FÓRMULA AVANZADA ────────────────────────────────────────
          const gastosSeleccionados = this.gastos
            .filter(g => this.gastosParaPrecioMap[g.id] !== false)
            .map(g => g.id)
          const gastosExcluidos = this.gastos.length !== gastosSeleccionados.length
          const tcOverrides = this.gastos
            .filter(g => {
              const v = this.tcOverridesMap[g.id]
              return v !== '' && v != null && !isNaN(Number(v)) && Number(v) !== Number(g.tipoCambio)
            })
            .map(g => ({ gastoId: g.id, tipoCambio: Number(this.tcOverridesMap[g.id]) }))
          payload = Object.assign({}, basePayload, {
            formula: {
              base: this.formulaBase,
              pasos: this.formulaPasos.map(p => ({ operacion: p.operacion, valor: Number(p.valor) })),
              redondeo: this.formulaRedondeo,
            },
            gastosParaPrecio: gastosExcluidos ? gastosSeleccionados : undefined,
            tiposCambioOverride: tcOverrides.length ? tcOverrides : undefined,
          })
        } else {
          // ── MODO FÓRMULA LOGÍSTICA SIMPLIFICADA ──────────────────────────
          const gastosSeleccionados = this.gastos
            .filter(g => this.logGastosMap[g.id] !== false)
            .map(g => g.id)
          const tcOverrides = this.gastos
            .filter(g => {
              const v = this.logTcMap[g.id]
              return v !== '' && v != null && !isNaN(Number(v)) && Number(v) !== Number(g.tipoCambio)
            })
            .map(g => ({ gastoId: g.id, tipoCambio: Number(this.logTcMap[g.id]) }))
          payload = Object.assign({}, basePayload, {
            componenteCompra: {
              multiplicador: Number(this.logCompraMulti),
              sumarFijo: Number(this.logCompraSumar) || undefined,
            },
            componenteLogistica: {
              multiplicador: Number(this.logLogMulti),
              sumarFijo: Number(this.logLogSumar) || undefined,
            },
            ajusteFijo: Number(this.logAjusteFijo) || undefined,
            ajustePorcentaje: Number(this.logAjustePorcentaje) || undefined,
            redondeo: {
              tipo: this.logRedondeoTipo,
              multiplo: this.logRedondeoTipo === 'multiplo' ? Number(this.logRedondeoMultiplo) : undefined,
            },
            gastosParaPrecio: gastosSeleccionados.length < this.gastos.length ? gastosSeleccionados : undefined,
            tiposCambioOverride: tcOverrides.length ? tcOverrides : undefined,
          })
        }

        const res = await this.$service.post(`logistica-ordenes/${this.$route.params.id}/cerrar`, payload)
        const lotesMsg = res?.datos?.lotesCreados?.length
          ? ` Se crearon ${res.datos.lotesCreados.length} lote(s) en inventario.`
          : ''
        this.$message.success(`Orden cerrada. Precios propuestos en el catálogo.${lotesMsg}`)
        this.cierreDialog = false
        await this.cargarTodo()
        this.subTab = 'trazabilidad'
      } finally { this.cerrando = false }
    },

    // ── Ítems ────────────────────────────────────────────────
    selectProducto(p) {
      this.itemForm.productoId = p.id
      this.itemForm.descripcionProducto = p.label
      this.productoSearchText = ''
      this.productoDropdownOpen = false
      this.productoHighlightIndex = -1
    },
    onProductoKeydown(e) {
      if (!this.productoDropdownOpen && this.productosFiltrados.length === 0) return

      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (!this.productoDropdownOpen) this.productoDropdownOpen = true
          this.productoHighlightIndex = Math.min(this.productoHighlightIndex + 1, this.productosFiltrados.length - 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          this.productoHighlightIndex = Math.max(this.productoHighlightIndex - 1, -1)
          break
        case 'Enter':
          e.preventDefault()
          if (this.productoHighlightIndex >= 0 && this.productoHighlightIndex < this.productosFiltrados.length) {
            const p = this.productosFiltrados[this.productoHighlightIndex]
            if (!this.productosIdsEnOrden.has(p.id)) {
              this.selectProducto(p)
            }
          }
          break
        case 'Escape':
          e.preventDefault()
          this.productoDropdownOpen = false
          this.productoHighlightIndex = -1
          break
      }
    },
    calcularPrecioUnitario() {
      if (this.itemForm.totalDeCompra && this.itemForm.cantidadUnidades) {
        this.itemForm.precioUnitarioMonedaCompra = this.itemForm.totalDeCompra / this.itemForm.cantidadUnidades
      } else {
        this.itemForm.precioUnitarioMonedaCompra = 0
      }
    },
    abrirItemDialog(item = null) {
      this.editandoItem = item
      this.productoSearchText = ''
      this.productoDropdownOpen = false
      this.productoHighlightIndex = -1
      this.itemForm = item
        ? { productoId: item.productoId || '', descripcionProducto: item.descripcionProducto, cantidadUnidades: Number(item.cantidadUnidades), totalDeCompra: Number(item.precioUnitarioMonedaCompra) * Number(item.cantidadUnidades), precioUnitarioMonedaCompra: Number(item.precioUnitarioMonedaCompra), tipoCambio: Number(item.tipoCambio), monedaCompraId: item.monedaCompraId || '' }
        : { productoId: '', descripcionProducto: '', cantidadUnidades: 1, totalDeCompra: 0, precioUnitarioMonedaCompra: 0, tipoCambio: 1, monedaCompraId: '' }
      this.itemDialog = true
    },
    async guardarItem() {
      if (!this.itemForm.descripcionProducto.trim()) return this.$message.error('La descripción es obligatoria.')
      if (!this.itemForm.cantidadUnidades || this.itemForm.cantidadUnidades < 1) return this.$message.error('La cantidad debe ser mayor a 0.')
      if (!this.itemForm.totalDeCompra || this.itemForm.totalDeCompra < 0) return this.$message.error('El total de compra debe ser mayor o igual a 0.')
      if (!this.itemForm.tipoCambio || this.itemForm.tipoCambio <= 0) return this.$message.error('El tipo de cambio debe ser mayor a 0.')
      if (this.itemForm.productoId && this.productosIdsEnOrden.has(this.itemForm.productoId)) {
        return this.$message.error('Este producto ya está en la orden. Edita el ítem existente.')
      }
      this.saving = true
      const payload = { ...this.itemForm, precioUnitarioMonedaCompra: this.itemForm.precioUnitarioMonedaCompra }
      if (!payload.productoId) delete payload.productoId
      if (!payload.monedaCompraId) delete payload.monedaCompraId
      try {
        if (this.editandoItem) {
          await this.$service.put(`logistica-ordenes/${this.$route.params.id}/items/${this.editandoItem.id}`, payload)
          this.$message.success('Producto actualizado.')
        } else {
          await this.$service.post(`logistica-ordenes/${this.$route.params.id}/items`, payload)
          this.$message.success('Producto agregado.')
        }
        this.itemDialog = false
        await this.cargarTodo()
      } finally { this.saving = false }
    },
    async eliminarItem(item) {
      this.$confirm(`¿Eliminar el producto "${item.descripcionProducto}"?`, async () => {
        await this.$service.delete(`logistica-ordenes/${this.$route.params.id}/items/${item.id}`)
        this.$message.success('Producto eliminado.')
        await this.cargarTodo()
      })
    },

    // ── Pagos ────────────────────────────────────────────────
    abrirPagoDialog(p = null) {
      this.editandoPago = p
      this.pagoTcCadena = false; this.pagoTc1 = ''; this.pagoTc2 = ''
      this.pagoForm = p
        ? { monedaId: p.monedaId, monto: Number(p.monto), tipoCambio: Number(p.tipoCambio), fechaPago: p.fechaPago, metodoPago: p.metodoPago, referencia: p.referencia || '', observaciones: p.observaciones || '', fuenteId: p.fuenteId || '' }
        : { monedaId: '', monto: 0, tipoCambio: 1, fechaPago: '', metodoPago: 'TRANSFERENCIA', referencia: '', observaciones: '', fuenteId: '' }
      this.pagoDialog = true
    },
    recalcTcPago() {
      if (this.pagoTc1 && this.pagoTc2) {
        this.pagoForm.tipoCambio = Number(this.pagoTc1) * Number(this.pagoTc2)
      }
    },
    async guardarPago() {
      if (!this.pagoForm.monedaId) return this.$message.error('Selecciona la moneda.')
      if (!this.pagoForm.monto || this.pagoForm.monto <= 0) return this.$message.error('El monto debe ser mayor a 0.')
      if (!this.pagoForm.tipoCambio || this.pagoForm.tipoCambio <= 0) return this.$message.error('El tipo de cambio debe ser mayor a 0.')
      if (!this.pagoForm.fechaPago) return this.$message.error('La fecha de pago es obligatoria.')
      if (this.totalOrdenBase > 0) {
        const pagoAnteriorBase = this.editandoPago
          ? Number(this.editandoPago.monto) * Number(this.editandoPago.tipoCambio)
          : 0
        const disponible = this.totalPendientePagos + pagoAnteriorBase
        if (this.pagoActualBase > disponible + 0.01) {
          return this.$message.error(
            `El pago excede el monto pendiente. Disponible: ${this.fmtNum(disponible)} — Este pago: ${this.fmtNum(this.pagoActualBase)}`
          )
        }
      }
      if (this.pagoForm.fuenteId) {
        const fuente = this.fuentes.find(f => f.id === this.pagoForm.fuenteId)
        if (fuente && fuente.saldoActual != null) {
          const montoNativo = Number(this.pagoForm.monto) * Number(this.pagoForm.tipoCambio)
          if (montoNativo > fuente.saldoActual + 0.001) {
            return this.$message.error(
              `Saldo insuficiente en "${fuente.nombre}". Disponible: ${this.fmtNum(fuente.saldoActual)} — Requerido: ${this.fmtNum(montoNativo)}`
            )
          }
        }
      }
      this.saving = true
      try {
        const payload = { ...this.pagoForm }
        if (!payload.fuenteId) delete payload.fuenteId
        if (this.editandoPago) {
          await this.$service.put(`logistica-ordenes/${this.$route.params.id}/pagos/${this.editandoPago.id}`, payload)
          this.$message.success('Pago actualizado.')
        } else {
          await this.$service.post(`logistica-ordenes/${this.$route.params.id}/pagos`, payload)
          const fMsg = payload.fuenteId ? ' Egreso registrado en la fuente.' : ''
          this.$message.success(`Pago registrado.${fMsg}`)
        }
        this.pagoDialog = false
        await this.cargarTodo()
      } finally { this.saving = false }
    },
    async eliminarPago(p) {
      this.$confirm('¿Eliminar este pago?', async () => {
        await this.$service.delete(`logistica-ordenes/${this.$route.params.id}/pagos/${p.id}`)
        this.$message.success('Pago eliminado.')
        await this.cargarTodo()
      })
    },

    // ── Gastos ───────────────────────────────────────────────
    abrirGastoDialog(g = null) {
      this.editandoGasto = g
      this.gastoTcCadena = false; this.gastoTc1 = ''; this.gastoTc2 = ''
      this.gastoForm = g
        ? { tipoGastoId: g.tipoGastoId || '', descripcion: g.descripcion, monedaId: g.monedaId, monto: Number(g.monto), cantidad: g.cantidad || 1, tipoCambio: Number(g.tipoCambio), fechaGasto: g.fechaGasto, pais: g.pais || '', comprobante: g.comprobante || '', observaciones: g.observaciones || '', fuenteId: g.fuenteId || '' }
        : { tipoGastoId: '', descripcion: '', monedaId: '', monto: 0, cantidad: 1, tipoCambio: 1, fechaGasto: '', pais: this.orden?.paisOrigen || '', comprobante: '', observaciones: '', fuenteId: '' }
      this.gastoDialog = true
    },
    recalcTcGasto() {
      if (this.gastoTc1 && this.gastoTc2) {
        this.gastoForm.tipoCambio = Number(this.gastoTc2) / Number(this.gastoTc1)
      }
    },
    async guardarGasto() {
      if (!this.gastoForm.descripcion.trim()) return this.$message.error('La descripción es obligatoria.')
      if (!this.gastoForm.monedaId) return this.$message.error('Selecciona la moneda.')
      if (!this.gastoForm.monto || this.gastoForm.monto <= 0) return this.$message.error('El monto debe ser mayor a 0.')
      if (!this.gastoForm.tipoCambio || this.gastoForm.tipoCambio <= 0) return this.$message.error('El tipo de cambio debe ser mayor a 0.')
      if (!this.gastoForm.fechaGasto) return this.$message.error('La fecha del gasto es obligatoria.')
      if (this.gastoForm.fuenteId) {
        const fuente = this.fuentes.find(f => f.id === this.gastoForm.fuenteId)
        if (fuente && fuente.saldoActual != null) {
          const montoNativo = Number(this.gastoForm.monto) * (Number(this.gastoForm.cantidad) || 1) * Number(this.gastoForm.tipoCambio)
          if (montoNativo > fuente.saldoActual + 0.001) {
            return this.$message.error(
              `Saldo insuficiente en "${fuente.nombre}". Disponible: ${this.fmtNum(fuente.saldoActual)} — Requerido: ${this.fmtNum(montoNativo)}`
            )
          }
        }
      }
      this.saving = true
      const payload = { ...this.gastoForm }
      if (!payload.tipoGastoId) delete payload.tipoGastoId
      if (!payload.fuenteId) delete payload.fuenteId
      try {
        if (this.editandoGasto) {
          await this.$service.put(`logistica-ordenes/${this.$route.params.id}/gastos/${this.editandoGasto.id}`, payload)
          this.$message.success('Gasto actualizado.')
        } else {
          const fMsg = payload.fuenteId ? ' Egreso registrado en la fuente.' : ''
          await this.$service.post(`logistica-ordenes/${this.$route.params.id}/gastos`, payload)
          this.$message.success(`Gasto registrado.${fMsg}`)
        }
        this.gastoDialog = false
        await this.cargarTodo()
      } finally { this.saving = false }
    },
    async eliminarGasto(g) {
      this.$confirm('¿Eliminar este gasto?', async () => {
        await this.$service.delete(`logistica-ordenes/${this.$route.params.id}/gastos/${g.id}`)
        this.$message.success('Gasto eliminado.')
        await this.cargarTodo()
      })
    },

    // ── Saldo Proveedor ──────────────────────────────────
    saldoAnteriorPago(pagoIdx) {
      if (pagoIdx === 0) {
        return this.totalOrdenBase
      }
      // Suma de pagos anteriores + este pago
      let pagosAnteriores = 0
      for (let i = 0; i < pagoIdx; i++) {
        pagosAnteriores += Number(this.pagos[i].monto) * Number(this.pagos[i].tipoCambio)
      }
      return this.totalOrdenBase - pagosAnteriores
    },
    saldoPosteriorPago(pagoIdx) {
      let pagosAcumulados = 0
      for (let i = 0; i <= pagoIdx; i++) {
        pagosAcumulados += Number(this.pagos[i].monto) * Number(this.pagos[i].tipoCambio)
      }
      return Math.max(0, this.totalOrdenBase - pagosAcumulados)
    },
  },
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────── */
.ide-view { display: flex; flex-direction: column; height: 100%; }
.det-header { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid var(--b1); flex-wrap: wrap; }
.det-header__info { display: flex; align-items: center; gap: 10px; flex: 1; flex-wrap: wrap; }
.det-header__info h2 { font-size: 16px; font-weight: 700; margin: 0; color: var(--t1); }
.det-meta { font-size: 12px; color: var(--t5); }
.det-header__actions { display: flex; gap: 8px; }
.det-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.det-panel { flex: 1; overflow: auto; padding: 16px 24px 24px; }
.det-panel__toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.det-summary { display: flex; gap: 8px; font-size: 13px; color: var(--t5); align-items: center; flex-wrap: wrap; }
.det-summary--col { flex-direction: column; align-items: flex-start; gap: 4px; }

/* ── Estados ─────────────────────────────────────────────────────────── */
.ide-loading { color: var(--t5); font-size: 13px; padding: 48px 0; text-align: center; }
.ide-empty   { color: var(--b3); font-size: 13px; padding: 48px 0; text-align: center; font-style: italic; }

/* ── Tabs ────────────────────────────────────────────────────────────── */
.ide-view__tabs { display: flex; gap: 4px; }
.ide-tab { background: none; border: none; padding: 10px 16px; border-radius: 0; cursor: pointer; font-size: 13px; color: var(--t4); border-bottom: 2px solid transparent; transition: all .15s; display: flex; align-items: center; gap: 6px; }
.ide-tab--active { color: #818cf8; border-bottom-color: #6366f1; font-weight: 600; }
.tab-count { background: var(--b1); color: var(--t4); padding: 1px 6px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.ide-tab--active .tab-count { background: #6366f133; color: #818cf8; }

/* ── Tabla ───────────────────────────────────────────────────────────── */
.ide-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ide-table th { text-align: left; padding: 8px 12px; background: var(--bg-n); color: var(--t4); font-weight: 700; border-bottom: 1px solid var(--b1); white-space: nowrap; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
.ide-table td { padding: 10px 12px; border-bottom: 1px solid var(--b2); vertical-align: middle; color: var(--scroll); }
.ide-table tr:hover td { background: var(--b1); }
.ide-actions { display: flex; gap: 6px; white-space: nowrap; }
.precio-sugerido { background: #22c55e22; color: #4ade80; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 13px; border: 1px solid #22c55e33; }

/* ── Chips ───────────────────────────────────────────────────────────── */
.ide-chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid; }
.ide-chip--grey   { background: var(--b2); color: var(--t3);  border-color: var(--b1); }
.ide-chip--blue   { background: #3b82f622; color: #60a5fa;  border-color: #3b82f644; }
.ide-chip--orange { background: #f9731622; color: #fb923c;  border-color: #f9731644; }
.ide-chip--purple { background: #a855f722; color: #c084fc;  border-color: #a855f744; }
.ide-chip--success{ background: #22c55e22; color: #4ade80;  border-color: #22c55e44; }

/* ── Cards de trazabilidad ───────────────────────────────────────────── */
.traz-body { display: flex; flex-direction: column; gap: 20px; }
.traz-card { background: var(--bg-s); border: 1px solid var(--b1); border-radius: 10px; padding: 20px; }
.traz-card h4 { font-size: 11px; font-weight: 700; color: var(--t5); margin: 0 0 16px; text-transform: uppercase; letter-spacing: .5px; }
.traz-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.traz-kpi { background: var(--bg-n); border: 1px solid var(--b1); border-radius: 8px; padding: 12px 16px; }
.traz-kpi--highlight { background: #6366f111; border-color: #6366f133; }
.traz-kpi__label { font-size: 11px; color: var(--t5); margin-bottom: 4px; }
.traz-kpi__val { font-size: 18px; font-weight: 700; color: var(--t2); }
.traz-kpi--highlight .traz-kpi__val { color: #818cf8; }

/* ── Botones ─────────────────────────────────────────────────────────── */
.ide-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--b0); background: var(--b2); color: var(--t3); cursor: pointer; font-size: 12px; font-weight: 600; transition: all .15s; }
.ide-btn:disabled { opacity: .4; cursor: not-allowed; }
.ide-btn:hover:not(:disabled) { border-color: #6366f155; color: var(--scroll); }
.ide-btn--primary { background: #6366f1; color: #fff; border-color: #6366f1; }
.ide-btn--primary:hover:not(:disabled) { background: #4f46e5; border-color: #4f46e5; }
.ide-btn--danger { color: #f87171; border-color: #ef444444; background: #ef444411; }
.ide-btn--danger:hover:not(:disabled) { background: #ef444422; }
.ide-btn--outline { background: transparent; color: #818cf8; border-color: #6366f155; }
.ide-btn--outline:hover { background: #6366f110; }
.ide-btn--sm { padding: 4px 10px; font-size: 11px; }

/* ── Inputs / Selects / Textareas ────────────────────────────────────── */
.ide-input {
  width: 100%; padding: 8px 12px;
  border: 1px solid var(--b1); border-radius: 8px;
  background: var(--bg); color: var(--t2);
  font-size: 13px; outline: none; box-sizing: border-box;
  transition: border-color .15s;
}
.ide-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px #6366f120; }
.ide-input::placeholder { color: var(--b3); }

/* ── Modal ───────────────────────────────────────────────────────────── */
.ide-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.ide-modal { background: var(--bg-s); border: 1px solid var(--b4); border-radius: 14px; width: 600px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
.ide-modal--sm { width: 460px; }
.ide-modal__header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--b1); }
.ide-modal__header h3 { font-size: 15px; font-weight: 700; margin: 0; color: var(--t1); }
.ide-modal__close { background: none; border: none; font-size: 16px; cursor: pointer; color: var(--t5); padding: 4px; transition: color .15s; }
.ide-modal__close:hover { color: var(--t2); }
.ide-modal__body { padding: 20px 24px; }
.ide-modal__footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 20px; border-top: 1px solid var(--b1); }

/* ── Formulario ──────────────────────────────────────────────────────── */
.ide-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ide-field { display: flex; flex-direction: column; gap: 4px; }
.ide-field--full { grid-column: 1 / -1; }
.ide-field label { font-size: 11px; font-weight: 700; color: var(--t4); text-transform: uppercase; letter-spacing: .4px; }
.ide-preview-calc { background: var(--bg-n); border: 1px solid var(--b1); border-radius: 6px; padding: 8px 12px; font-size: 12px; color: var(--t4); }

/* ── Modal grande ────────────────────────────────────────────────────── */
.ide-modal--lg { width: 760px; }

/* ── Formula Builder ─────────────────────────────────────────────────── */
.fb-section { margin-bottom: 20px; }
.fb-section__title { font-size: 11px; font-weight: 700; color: var(--t4); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; }
.fb-base-opts { display: flex; gap: 10px; }
.fb-base-opt {
  flex: 1; padding: 10px 14px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--b1); background: var(--bg); transition: all .15s;
}
.fb-base-opt:hover { border-color: #6366f155; }
.fb-base-opt--active { border-color: #6366f1; background: #6366f111; }
.fb-base-opt__name { font-size: 13px; font-weight: 600; color: var(--t2); margin-bottom: 2px; }
.fb-base-opt--active .fb-base-opt__name { color: #818cf8; }
.fb-base-opt__desc { font-size: 11px; color: var(--t5); }
.fb-paso {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.fb-paso__num { font-size: 11px; font-weight: 700; color: var(--t5); min-width: 18px; text-align: center; }
.fb-paso__op { width: 170px; flex-shrink: 0; }
.fb-paso__val { width: 110px; flex-shrink: 0; }
.fb-paso__preview {
  flex: 1; font-size: 12px; color: #fbbf24; font-weight: 600;
  padding: 8px 10px; background: #f59e0b11; border: 1px solid #f59e0b22;
  border-radius: 8px; text-align: right; min-width: 80px;
}

/* ── Tabla de gastos para precio ─────────────────────────────────────── */
.fb-gastos-table { margin-bottom: 0; }
.fb-gastos-table tfoot td { background: var(--bg-n); font-size: 12px; }
.fb-gasto-off td { opacity: .4; }
.fb-tc-input { width: 100px; padding: 5px 8px; font-size: 12px; }
.fb-tc-input:disabled { opacity: .35; cursor: not-allowed; }

/* ── Módulo Precio LOGÍSTICA (sub-tab) ───────────────────────────────── */
.pl-grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
@media (max-width: 900px) { .pl-grid-2 { grid-template-columns: 1fr; } }

.pl-card {
  background: var(--bg-s); border: 1px solid var(--b1); border-radius: 10px; padding: 18px 20px;
}
.pl-card__title {
  font-size: 11px; font-weight: 700; color: var(--t4);
  text-transform: uppercase; letter-spacing: .5px; margin-bottom: 12px;
}

.pl-totales { margin-top: 14px; border-top: 1px solid var(--b1); padding-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.pl-total-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--t4); padding: 2px 0; }
.pl-total-row strong { font-size: 14px; }
.pl-total-row--grand { border-top: 1px solid var(--b1); margin-top: 4px; padding-top: 8px; color: var(--t3); font-weight: 600; }
.pl-total-row--grand strong { font-size: 16px; }

.pl-formula-grid {
  display: grid; grid-template-columns: 1fr auto 1fr auto; gap: 12px; align-items: start;
  background: var(--bg-n); border: 1px solid var(--b1); border-radius: 10px; padding: 16px; margin-bottom: 14px;
}
@media (max-width: 1000px) { .pl-formula-grid { grid-template-columns: 1fr; } }

.pl-formula-bloque {
  background: var(--bg); border: 1px solid var(--b1); border-radius: 8px; padding: 14px;
}
.pl-formula-bloque__title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 2px; }
.pl-formula-bloque__desc { font-size: 11px; color: var(--t5); margin-bottom: 12px; }
.pl-formula-bloque--final { background: #f59e0b08; border-color: #f59e0b22; }

.pl-formula-sep {
  font-size: 22px; font-weight: 700; color: var(--t5);
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px; align-self: center;
}

.pl-formula-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.pl-formula-label { font-size: 11px; color: var(--t4); min-width: 120px; flex-shrink: 0; }
.pl-formula-input { width: 110px !important; flex-shrink: 0; }
.pl-formula-hint { font-size: 11px; color: var(--b3); white-space: nowrap; }

.pl-formula-resumen {
  background: #f59e0b0d; border: 1px solid #f59e0b22; border-radius: 8px;
  padding: 10px 14px; font-size: 13px; color: #fbbf24; font-weight: 600;
  font-family: monospace; letter-spacing: .2px;
}

/* ── Toggle inventario (diálogo cierre) ──────────────────────────────── */
.cierre-inventario-toggle {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; margin-top: 16px;
  background: var(--bg-n); border: 1px solid var(--b1); border-radius: 10px;
  cursor: pointer; transition: border-color .15s;
}
.cierre-inventario-toggle:hover { border-color: #22c55e55; }
.cierre-toggle-check {
  width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
  border: 2px solid var(--b3); background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #fff; transition: all .15s;
}
.cierre-toggle-check--on { background: #22c55e; border-color: #22c55e; }

/* ── Toggle modo cierre ───────────────────────────────────────────────── */
.cierre-modo-toggle {
  display: flex; gap: 0; margin-bottom: 20px;
  border: 1px solid var(--b3); border-radius: 8px; overflow: hidden;
}
.cierre-modo-btn {
  flex: 1; padding: 9px 16px; background: var(--bg-e); border: none; cursor: pointer;
  font-size: 12px; font-weight: 600; color: var(--t4); font-family: inherit;
  transition: background .15s, color .15s;
}
.cierre-modo-btn + .cierre-modo-btn { border-left: 1px solid var(--b3); }
.cierre-modo-btn--active { background: #6366f1; color: #fff; }

/* ── Tabla precio directo ─────────────────────────────────────────────── */
.cierre-precio-table th { font-size: 10px; }
.cierre-precio-input {
  width: 90px; padding: 5px 8px; font-size: 12px;
  border-radius: 6px; text-align: right;
}

/* ── TC en dos pasos — nuevo diseño compacto ─────────────────────────── */
.tc-doble-trigger {
  margin-top: 6px; font-size: 11px; color: var(--b3); cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px;
  transition: color .15s; user-select: none;
}
.tc-doble-trigger:hover { color: #818cf8; }
.tc-doble-trigger--on { color: #818cf8; }

.tc-doble-inline {
  display: flex; align-items: flex-end; gap: 8px;
  margin-top: 10px; padding: 10px 12px;
  background: #6366f108; border: 1px solid #6366f122; border-radius: 8px;
  flex-wrap: wrap;
}
.tc-doble-campo { display: flex; flex-direction: column; gap: 3px; }
.tc-doble-hint { font-size: 10px; color: var(--t5); font-weight: 700; text-transform: uppercase; letter-spacing: .3px; }
.tc-doble-input { width: 118px !important; padding: 6px 8px !important; font-size: 12px !important; }
.tc-doble-op { font-size: 16px; color: var(--b3); padding-bottom: 2px; flex-shrink: 0; }
.tc-doble-result {
  display: flex; flex-direction: column; gap: 3px;
  background: #6366f122; border: 1px solid #6366f133;
  padding: 5px 12px; border-radius: 7px; flex-shrink: 0;
}
.tc-doble-result strong { font-size: 13px; color: #818cf8; font-weight: 700; }

.ide-input--readonly { opacity: .7; cursor: default; border-style: dashed; }
.ide-field-hint { font-size: 11px; color: #f59e0b; margin-top: 4px; }

/* ── Pago estado de cuenta (toolbar) ────────────────────────────────── */
.pago-estado {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex: 1;
}
.pago-estado__item { display: flex; flex-direction: column; gap: 1px; }
.pago-estado__label { font-size: 10px; color: var(--t5); text-transform: uppercase; letter-spacing: .4px; font-weight: 700; }
.pago-estado__val { font-size: 14px; font-weight: 700; color: var(--t3); }
.pago-estado__val--pagado { color: #4ade80; }
.pago-estado__val--pendiente { color: #fb923c; }
.pago-estado__val--saldado { color: #4ade80; }
.pago-estado__moneda { font-size: 9px; color: var(--t4); text-transform: uppercase; letter-spacing: .3px; font-weight: 600; }
.pago-estado__sep { color: var(--b0); font-size: 18px; align-self: center; }

/* ── Barra de progreso de pago ───────────────────────────────────────── */
.pago-barra {
  width: 140px; height: 6px; border-radius: 999px;
  background: var(--b1); overflow: hidden; align-self: center; flex-shrink: 0;
  display: flex;
}
.pago-barra--dialog { width: 100%; height: 8px; border-radius: 999px; margin-top: 10px; }
.pago-barra__fill { height: 100%; background: #4ade80; border-radius: 999px; transition: width .3s; flex-shrink: 0; }
.pago-barra__fill--preview { background: #fbbf2488; }

/* ── Resumen en el dialog de pago ────────────────────────────────────── */
.pago-dialog-resumen {
  margin: 0 24px 0;
  padding: 14px 16px;
  background: var(--bg-n);
  border: 1px solid var(--b1);
  border-radius: 10px;
  border-bottom: none;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.pago-dialog-resumen__row {
  display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-end;
}
.pago-dialog-resumen__item { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 80px; }
.pago-dialog-resumen__label { font-size: 10px; color: var(--t5); text-transform: uppercase; letter-spacing: .4px; font-weight: 700; }
.pago-dialog-resumen__val { font-size: 15px; font-weight: 800; color: var(--t3); }
.pago-dialog-resumen__val--ok { color: #4ade80; }
.pago-dialog-resumen__val--warn { color: #fb923c; }

/* ── Moneda inline chip en tabla ─────────────────────────────────────── */
.monto-con-moneda { font-weight: 600; color: var(--t2); }
.moneda-chip {
  display: inline-block; margin-left: 5px;
  padding: 1px 6px; border-radius: 5px; font-size: 10px; font-weight: 700;
  background: var(--b1); color: #60a5fa; border: 1px solid #3b82f633;
  vertical-align: middle; letter-spacing: .3px;
}

/* ── Desglose por moneda en toolbar ──────────────────────────────────── */
.monedas-breakdown { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex-basis: 100%; }
.monedas-breakdown__label { font-size: 10px; color: var(--b3); text-transform: uppercase; letter-spacing: .3px; }
.moneda-breakdown-chip {
  padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
  background: var(--b1); color: var(--t3); border: 1px solid var(--b4);
}

/* ── Preview de conversión en diálogos ───────────────────────────────── */
.ide-preview-calc--conversion {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.preview-moneda { font-size: 13px; color: var(--t2); font-weight: 600; }
.preview-cod {
  display: inline-block; padding: 1px 5px; border-radius: 4px; font-size: 10px;
  background: var(--b1); color: #60a5fa; border: 1px solid #3b82f633;
  margin-left: 2px; vertical-align: middle; font-weight: 700;
}
.preview-op { color: var(--t5); font-size: 12px; }
.preview-base-label { font-size: 10px; color: var(--b3); }
</style>
