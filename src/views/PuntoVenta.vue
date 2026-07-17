<template>
  <div class="pos-root">

    <!-- ── Alerta caja no abierta ─────────────────────────────────────── -->
    <transition name="alert-slide">
      <div v-if="!cajaAbierta && !alertDismissed" class="pos-alert">
        <div class="pos-alert-body">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span><strong>Caja no abierta.</strong> No hay apertura de caja activa para esta sucursal. Para realizar ventas debe abrir la caja primero desde el módulo <strong>Arqueo de Caja</strong>.</span>
        </div>
        <button class="pos-alert-close" @click="alertDismissed = true">✕</button>
      </div>
    </transition>

    <!-- ── Cabecera ───────────────────────────────────────────────────── -->
    <div class="pos-header">
      <div>
        <div class="pos-title">Ventas y facturación</div>
        <div class="pos-subtitle">T1 - POS</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="pos-btn-secondary" @click="abrirBuscarCliente">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Buscar cliente
        </button>
        <button class="pos-btn-primary" @click="nuevaVenta">+ ADICIONAR</button>
      </div>
    </div>

    <!-- ── Formulario cabecera ────────────────────────────────────────── -->
    <div class="pos-form-section">
      <div class="pos-form-grid">

        <!-- Fila 1 -->
        <div class="pos-field">
          <label>Código cliente</label>
          <input v-model="form.codigoCliente" class="pos-input" placeholder="Buscar por código..." @keyup.enter="buscarPorCodigo" />
        </div>
        <div class="pos-field">
          <label>Sucursal</label>
          <select v-model="form.sucursalId" class="pos-select">
            <option value="">Seleccionar...</option>
            <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </div>
        <div class="pos-field">
          <label>Fecha</label>
          <input v-model="form.fecha" class="pos-input" type="date" />
        </div>
        <div class="pos-field">
          <label>Opciones</label>
          <div class="pos-radio-group">
            <label class="pos-radio"><input type="radio" v-model="form.tipoOperacion" value="VENTA" /> VENTA</label>
            <label class="pos-radio"><input type="radio" v-model="form.tipoOperacion" value="COTIZACION" /> COTIZACIÓN</label>
          </div>
        </div>

        <!-- Fila 2 -->
        <div class="pos-field">
          <label>Nit / CI Factura</label>
          <input v-model="form.nitCi" class="pos-input" placeholder="NIT o CI" />
        </div>
        <div class="pos-field">
          <label>Complemento</label>
          <input v-model="form.complemento" class="pos-input" placeholder="Complemento" />
        </div>
        <div class="pos-field">
          <label>Tipo de comprobante</label>
          <select v-model="form.tipoComprobante" class="pos-select">
            <option value="FACTURA">Factura</option>
            <option value="RECIBO">Recibo</option>
            <option value="PROFORMA">Proforma</option>
          </select>
        </div>
        <div class="pos-field">
          <label>Tipo de Precio</label>
          <div class="pos-radio-group">
            <label class="pos-radio"><input type="radio" v-model="form.tipoPrecio" value="SF" /> SF (Sin Factura)</label>
            <label class="pos-radio"><input type="radio" v-model="form.tipoPrecio" value="CF" /> CF (Con Factura)</label>
            <label class="pos-radio pos-radio--oferta"><input type="radio" v-model="form.tipoPrecio" value="OFERTA" /> OFERTA</label>
          </div>
        </div>

        <!-- Fila 3 -->
        <div class="pos-field pos-field--span2">
          <label>Nombre para la factura</label>
          <input v-model="form.nombreFactura" class="pos-input" placeholder="Nombre completo o razón social" />
        </div>
        <div class="pos-field">
          <label>Tipo de venta</label>
          <select v-model="form.tipoVenta" class="pos-select" @change="onTipoVentaChange">
            <option value="NORMAL">Normal</option>
            <option value="CREDITO">Crédito</option>
            <option value="CONSIGNACION">Consignación</option>
          </select>
        </div>
        <div class="pos-field">
          <label>Fecha limite de pago</label>
          <input v-model="form.fechaLimitePago" class="pos-input" type="date" :disabled="form.tipoVenta !== 'CREDITO'" :style="form.tipoVenta !== 'CREDITO' ? 'opacity:.4' : ''" />
        </div>

        <!-- Fila 4 -->
        <div class="pos-field">
          <label>Nombre del cliente</label>
          <input v-model="form.nombreCliente" class="pos-input" placeholder="Nombre del cliente" />
        </div>
        <div class="pos-field">
          <label>Celular</label>
          <input v-model="form.celular" class="pos-input" placeholder="Celular" />
        </div>
        <div class="pos-field">
          <label>Correo electrónico</label>
          <input v-model="form.correo" class="pos-input" type="email" placeholder="correo@ejemplo.com" />
        </div>
        <div class="pos-field">
          <label>Glosa</label>
          <input v-model="form.glosa" class="pos-input" placeholder="Glosa" />
        </div>
      </div>
    </div>

    <!-- ── Búsqueda de productos ─────────────────────────────────────── -->
    <div class="pos-search-section">
      <div class="pos-search-modes">
        <label class="pos-chk"><input type="checkbox" v-model="searchModes" value="descripcion" /> Descripción</label>
        <label class="pos-chk"><input type="checkbox" v-model="searchModes" value="cod_tienda" /> Cod. Tienda</label>
        <label class="pos-chk"><input type="checkbox" v-model="searchModes" value="cod_proveedor" /> Cod. Proveedor</label>
        <label class="pos-chk"><input type="checkbox" v-model="searchModes" value="cod_barras" /> Cod. Barras</label>
      </div>
      <div class="pos-search-wrap" style="position:relative;">
        <input
          ref="searchInput"
          v-model="searchQuery"
          class="pos-input pos-search-input"
          placeholder="Búsqueda"
          autocomplete="off"
          @input="onSearchInput"
          @keydown.enter.prevent="onSearchKeyEnter"
          @keydown.arrow-down.prevent="onSearchKeyDown"
          @keydown.arrow-up.prevent="onSearchKeyUp"
          @keydown.esc="onSearchKeyEscape"
          @focus="searchDropdownOpen = searchQuery.length > 0"
        />
        <transition name="dropdown-fade">
          <div v-if="searchDropdownOpen && searchResultados.length" class="pos-search-dropdown">
            <div
              v-for="(p, idx) in searchResultados"
              :key="p.id"
              :class="['pos-search-item', { 'pos-search-item--active': idx === searchHighlightIndex }]"
              @mousedown.prevent="agregarProducto(p)"
              @mouseenter="searchHighlightIndex = idx"
            >
              <span class="pos-si-code">{{ p.codigoTienda || p.codigoBarras || '—' }}</span>
              <span class="pos-si-main">
                <span class="pos-si-path">{{ [p.nombreCategoria, p.nombreSubcategoria, p.nombre].filter(Boolean).join(' > ') }}</span>
              </span>
              <span class="pos-si-price">
                <span v-if="p.precio != null">Bs {{ formatNum(p.precio) }}</span>
                <span v-if="p.porcentajeFactura > 0" class="pos-si-price-iva">(+ IVA: Bs {{ formatNum(p.precio * (1 + p.porcentajeFactura / 100)) }})</span>
                <span v-if="p.precio == null">S/P</span>
              </span>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- ── Tabla de productos ─────────────────────────────────────────── -->
    <div class="pos-table-section">
      <div class="pos-table-wrap">
        <table class="pos-table">
          <thead>
            <tr>
              <th class="pos-th" style="width:44px;">Nro</th>
              <th class="pos-th" style="width:110px;">Codigo</th>
              <th class="pos-th">Descripcion</th>
              <th class="pos-th" style="width:140px;">Lotes</th>
              <th class="pos-th" style="width:170px;">Precios</th>
              <th class="pos-th" style="width:90px;">Cantidad</th>
              <th class="pos-th" style="width:110px;">Precio (Bs)</th>
              <th class="pos-th" style="width:110px;">P/ Total</th>
              <th class="pos-th" style="width:36px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!detalle.length">
              <td colspan="9" class="pos-td-empty">No hay productos agregados. Use el buscador para agregar productos.</td>
            </tr>
            <tr v-for="(item, idx) in detalle" :key="item._key" class="pos-tr">
              <!-- Nro -->
              <td class="pos-td pos-td--center pos-td--nro">{{ idx + 1 }}</td>

              <!-- Código -->
              <td class="pos-td pos-td--code">{{ item.codigoTienda || '—' }}</td>

              <!-- Descripción: categoría subcategoría nombre -->
              <td class="pos-td">
                <span class="pos-desc-full">
                  {{ [item.nombreCategoria, item.nombreSubcategoria, item.nombre].filter(Boolean).join(' ') }}
                </span>
              </td>

              <!-- Lotes disponibles -->
              <td class="pos-td">
                <div class="pos-lotes-cell">
                  <select v-model="item.loteSeleccionado" class="pos-select pos-select--lote" @change="onLoteChange(item)">
                    <option value="">Sin lote</option>
                    <option v-for="lote in item.lotes" :key="lote.id" :value="lote.id">
                      {{ lote.nroLote }} ({{ formatNum(lote.stock) }})
                    </option>
                  </select>
                  <div v-if="item.loteSeleccionado" class="pos-lote-info">
                    <span class="pos-lote-label">{{ getLoteLabel(item) }}</span>
                  </div>
                </div>
              </td>

              <!-- Precios: tiers según SF/CF activo -->
              <td class="pos-td">
                <div class="pos-precios-list">
                  <label
                    v-for="(tier, tidx) in tiersActivos(item)"
                    :key="tidx"
                    class="pos-precio-radio"
                    :class="{ 'pos-precio-radio--active': item.tierIdx === tidx }"
                  >
                    <input
                      type="radio"
                      :name="'tier-' + item._key"
                      :value="tidx"
                      :checked="item.tierIdx === tidx"
                      @change="onTierChange(item, tidx)"
                    />
                    <span class="pos-precio-lbl">{{ etiquetaTier(tier, item.porcentajeFactura) }}</span>
                  </label>
                  <span v-if="tiersActivos(item).length > 1" class="pos-precio-auto">
                    ⚡ Precio automático según cantidad
                  </span>
                  <span v-if="!tiersActivos(item).length" class="pos-precio-sinprecio">Sin precio</span>
                </div>
              </td>

              <!-- Cantidad -->
              <td class="pos-td">
                <input
                  v-model.number="item.cantidad"
                  class="pos-input pos-input--qty"
                  type="number" min="0.001" step="1"
                  @input="recalcularLinea(item)"
                />
              </td>

              <!-- Precio unitario -->
              <td class="pos-td">
                <input
                  v-model.number="item.precioUnitario"
                  class="pos-input pos-input--num"
                  type="number" min="0" step="0.01"
                  @input="recalcularLinea(item)"
                />
              </td>

              <!-- Total -->
              <td class="pos-td pos-td--total">Bs {{ formatNum(item.total) }}</td>

              <!-- Eliminar -->
              <td class="pos-td pos-td--center">
                <button class="pos-del-btn" title="Eliminar" @click="quitarLinea(idx)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pos-total-bar">
        <span class="pos-total-label">Total:</span>
        <span class="pos-total-value">{{ totalFormateado }}</span>
      </div>
    </div>

    <!-- ── Pie: Métodos de pago + Acciones ────────────────────────────── -->
    <div class="pos-footer">
      <div class="pos-footer-right">
        <!-- Ícono PDF -->
        <button class="pos-btn-pdf" title="Generar PDF" @click="generarPDF">
          <svg width="22" height="28" viewBox="0 0 22 28" fill="none">
            <rect x="1" y="1" width="20" height="26" rx="3" fill="#ef444422" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M5 9h12M5 13h8M5 17h6" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            <text x="11" y="23" font-size="5" fill="#ef4444" text-anchor="middle" font-weight="700">PDF</text>
          </svg>
        </button>

        <div class="pos-footer-summary" v-if="detalle.length">
          <div class="pos-summary-row">
            <span>Subtotal</span>
            <span>Bs {{ formatNum(subtotal) }}</span>
          </div>
          <div class="pos-summary-row pos-summary-total">
            <span>TOTAL</span>
            <span>Bs {{ formatNum(subtotal) }}</span>
          </div>
        </div>

        <button
          class="pos-btn-guardar"
          :disabled="saving || !detalle.length"
          @click="guardarVenta"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          {{ saving ? 'Guardando...' : 'GUARDAR' }}
        </button>

        <button
          class="pos-btn-cobrar"
          :disabled="cobrando || !detalle.length"
          @click="cobrarVenta"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          {{ cobrando ? 'Procesando...' : 'COBRAR' }}
        </button>
      </div>
    </div>

    <!-- ══ MODAL: Buscar cliente ══ -->
    <transition name="modal-fade">
      <div v-if="clienteModal" class="pos-modal-backdrop">
        <div class="pos-modal">
          <div class="pos-modal-header">
            <span>Buscar Cliente</span>
            <button class="pos-modal-close" @click="clienteModal = false">✕</button>
          </div>
          <div class="pos-modal-body">
            <input v-model="clienteBusqueda" class="pos-input" placeholder="Nombre, NIT o CI..." @input="buscarClientes" />
            <div class="pos-cliente-list">
              <div v-if="loadingClientes" style="text-align:center;padding:20px;color:var(--t5);font-size:12px;">Buscando...</div>
              <div v-else-if="!clientesResultados.length && clienteBusqueda" style="text-align:center;padding:20px;color:var(--t5);font-size:12px;font-style:italic;">Sin resultados</div>
              <div
                v-for="c in clientesResultados" :key="c.id"
                class="pos-cliente-item"
                @click="seleccionarCliente(c)"
              >
                <div style="font-size:13px;font-weight:600;color:var(--t2);">{{ c.nombre }}</div>
                <div style="font-size:11px;color:var(--t5);margin-top:2px;">NIT: {{ c.nit || '—' }} · {{ c.celular || '' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL: Cobro ══ -->
    <transition name="modal-fade">
      <div v-if="cobrarModal" class="pos-modal-backdrop">
        <div class="pos-modal pco-modal">
          <div class="pos-modal-header">
            <span>Cobro de Venta</span>
            <button class="pos-modal-close" @click="cobrarModal = false">✕</button>
          </div>
          <div class="pos-modal-body">

            <!-- Total -->
            <div class="pco-total-card">
              <div class="pco-total-label">Total a cobrar</div>
              <div class="pco-total-amount">Bs {{ formatNum(subtotal) }}</div>
            </div>

            <!-- Métodos de pago -->
            <div class="pco-section-title">Métodos de pago</div>
            <div class="pco-metodos">
              <div
                v-for="m in metodosPago" :key="m.value"
                class="pco-metodo-row"
                :class="{ 'pco-metodo-row--active': m.activo }"
              >
                <label class="pco-toggle">
                  <input type="checkbox" v-model="m.activo" @change="onTogglePago(m)" />
                  <span class="pco-toggle-label">{{ m.label }}</span>
                </label>
                <div v-if="m.activo" class="pco-metodo-inputs">
                  <div class="pco-amount-wrap">
                    <span class="pco-currency">Bs</span>
                    <input
                      v-model.number="m.monto"
                      class="pos-input pco-amount-input"
                      type="number" min="0" step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <input
                    v-if="m.value === 'TRANSFERENCIA' || m.value === 'CHEQUE'"
                    v-model="m.referencia"
                    class="pos-input pco-ref-input"
                    :placeholder="m.value === 'CHEQUE' ? 'Nro. cheque' : 'Referencia'"
                  />
                  <!-- Adelanto: selector -->
                  <div v-if="m.value === 'ADELANTO'" style="flex:1;">
                    <div v-if="cargandoAdelantos" style="font-size:11px;color:var(--t5);">Cargando...</div>
                    <select v-else v-model="m.adelantoId" class="pos-select" style="width:100%;font-size:11px;" @change="onAdelantoSelected(m)">
                      <option :value="null">Seleccionar adelanto...</option>
                      <option v-for="a in adelantosDisponibles" :key="a.id" :value="a.id">
                        {{ a.descripcion || a.id }} — Bs {{ formatNum(a.montoDisponible) }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumen de pagos -->
            <div class="pco-resumen">
              <div class="pco-res-row">
                <span>Total pagado</span>
                <span class="pco-res-paid">Bs {{ formatNum(totalPagos) }}</span>
              </div>
              <div class="pco-res-row">
                <span>{{ saldoPendiente > 0.01 ? 'Saldo pendiente' : 'Saldo' }}</span>
                <span :class="saldoPendiente > 0.01 ? 'pco-res-debt' : 'pco-res-ok'">Bs {{ formatNum(saldoPendiente) }}</span>
              </div>
              <div v-if="totalPagos > subtotal + 0.01" class="pco-res-row">
                <span>Cambio a devolver</span>
                <span class="pco-res-change">Bs {{ formatNum(totalPagos - subtotal) }}</span>
              </div>
            </div>

            <!-- Registrar como deuda -->
            <div v-if="saldoPendiente > 0.01" class="pco-deuda-toggle">
              <label class="pos-chk">
                <input type="checkbox" v-model="registrarDeuda" />
                <span>Registrar Bs {{ formatNum(saldoPendiente) }} como deuda del cliente</span>
              </label>
            </div>

          </div>
          <div class="pos-modal-footer">
            <button class="pos-btn-secondary" @click="cobrarModal = false">Cancelar</button>
            <button
              class="pos-btn-cobrar"
              style="padding:10px 24px;"
              :disabled="cobrando || (!registrarDeuda && saldoPendiente > 0.01)"
              @click="confirmarCobro"
            >
              {{ cobrando ? 'Procesando...' : (registrarDeuda && saldoPendiente > 0.01 ? 'Cobrar + Registrar Deuda' : 'Confirmar Cobro') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL: Ticket ══ -->
    <transition name="modal-fade">
      <div v-if="ticketModal" class="pos-modal-backdrop">
        <div class="pos-modal" style="max-width:340px;text-align:center;">
          <div class="pos-modal-header" style="justify-content:center;border:none;">
            <span>Venta Registrada</span>
          </div>
          <div class="pos-modal-body" style="padding:24px;">
            <div style="font-size:48px;color:#22c55e;margin-bottom:8px;">✓</div>
            <div style="font-size:16px;font-weight:700;color:#4ade80;">¡Venta exitosa!</div>
            <div v-if="ultimaVenta" style="margin-top:12px;">
              <div style="font-size:22px;font-weight:800;color:#818cf8;">{{ ultimaVenta.numeroComprobante || ultimaVenta.id }}</div>
              <div style="font-size:13px;color:var(--t4);margin-top:6px;">Total: <strong style="color:var(--t2);">Bs {{ formatNum(ultimaVenta.total) }}</strong></div>
            </div>
          </div>
          <div class="pos-modal-footer" style="justify-content:center;">
            <button class="pos-btn-primary" style="min-width:160px;" @click="nuevaVenta">Nueva Venta</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
let searchTimeout = null

const emptyForm = () => ({
  codigoCliente: '',
  sucursalId: '',
  fecha: new Date().toISOString().split('T')[0],
  tipoOperacion: 'VENTA',
  nitCi: '',
  complemento: '',
  tipoComprobante: 'FACTURA',
  tipoPrecio: 'SF',
  nombreFactura: '',
  tipoVenta: 'NORMAL',
  fechaLimitePago: '',
  nombreCliente: '',
  celular: '',
  correo: '',
  glosa: '',
})

let _keyCounter = 0

export default {
  name: 'PuntoVenta',
  data: () => ({
    // Caja
    cajaAbierta: false,
    alertDismissed: false,

    // Formulario cabecera
    form: emptyForm(),
    sucursales: [],

    // Búsqueda de productos
    searchModes: ['descripcion'],
    searchQuery: '',
    searchResultados: [],
    searchDropdownOpen: false,
    searchHighlightIndex: -1,
    loadingSearch: false,
    productos: [],

    // Detalle de venta
    detalle: [],

    // Métodos de pago
    metodosPago: [
      { value: 'EFECTIVO',      label: 'Efectivo',      activo: false, monto: '', referencia: '' },
      { value: 'TRANSFERENCIA', label: 'Transferencia', activo: false, monto: '', referencia: '' },
      { value: 'CHEQUE',        label: 'Cheque',        activo: false, monto: '', referencia: '' },
      { value: 'QR',            label: 'QR',            activo: false, monto: '', referencia: '' },
      { value: 'ADELANTO',      label: 'Adelanto',      activo: false, monto: '', referencia: '', adelantoId: null },
    ],

    // Adelantos disponibles para el cliente seleccionado
    adelantosDisponibles: [],
    cargandoAdelantos: false,

    // Modales
    clienteModal: false,
    clienteBusqueda: '',
    clientesResultados: [],
    loadingClientes: false,
    cobrarModal: false,
    ticketModal: false,
    ultimaVenta: null,

    saving: false,
    cobrando: false,
    registrarDeuda: false,
  }),

  watch: {
    'form.tipoPrecio'(nuevoTipo) {
      for (const item of this.detalle) {
        item.tipoPrecio = nuevoTipo === 'CF' ? 'CF' : 'SF'
        // Usar CF si existe, sino caer en SF
        const tiers = (nuevoTipo === 'CF' && item.tiersCF && item.tiersCF.length)
          ? item.tiersCF
          : (item.tiersSF || [])
        const tier = tiers[item.tierIdx] || tiers[0]
        if (tier) {
          item.precioUnitario = tier.precio
          item.total = Number(item.cantidad || 0) * tier.precio
        }
      }
    },
  },

  computed: {
    subtotal() {
      return this.detalle.reduce((s, i) => s + (i.total || 0), 0)
    },
    totalFormateado() {
      return this.formatNum(this.subtotal)
    },
    pagoActivos() {
      return this.metodosPago.filter(m => m.activo)
    },
    totalPagos() {
      return this.pagoActivos.reduce((s, m) => s + (Number(m.monto) || 0), 0)
    },
    saldoPendiente() {
      return Math.max(0, this.subtotal - this.totalPagos)
    },
  },

  created() {
    this.cargarSucursales()
    this.cargarProductos()
    this.verificarCaja()
  },

  mounted() {
    this.$nextTick(() => this.$refs.searchInput?.focus())
  },

  methods: {

    // ── Inicialización ───────────────────────────────────────────────────

    async cargarSucursales() {
      try {
        this.sucursales = await this.$service.list('sucursales') || []
        if (this.sucursales.length === 1) this.form.sucursalId = this.sucursales[0].id
      } catch { this.sucursales = [] }
    },

    async cargarProductos() {
      try { this.productos = await this.$service.list('productos/pos') || [] }
      catch { this.productos = [] }
    },

    async verificarCaja() {
      try {
        const res = await this.$service.get('caja/sesion/activa')
        this.cajaAbierta = !!res
      } catch { this.cajaAbierta = false }
    },

    // ── Búsqueda de productos ────────────────────────────────────────────

    onSearchInput() {
      clearTimeout(searchTimeout)
      if (!this.searchQuery.trim()) {
        this.searchResultados = []
        this.searchDropdownOpen = false
        return
      }
      searchTimeout = setTimeout(() => this.buscarProductos(), 200)
    },

    buscarProductos() {
      const q = this.searchQuery.toLowerCase().trim()
      if (!q) { this.searchResultados = []; this.searchDropdownOpen = false; return }

      this.searchResultados = this.productos.filter(p => {
        if (this.searchModes.includes('descripcion')) {
          const nombreCompleto = [p.nombreCategoria, p.nombreSubcategoria, p.nombre]
            .filter(Boolean).join(' ').toLowerCase()
          if (nombreCompleto.includes(q)) return true
        }
        if (this.searchModes.includes('cod_tienda') && p.codigoTienda?.toLowerCase().includes(q)) return true
        if (this.searchModes.includes('cod_proveedor') && p.codigoProveedor?.toLowerCase().includes(q)) return true
        if (this.searchModes.includes('cod_barras') && p.codigoBarras?.toLowerCase().includes(q)) return true
        return false
      }).slice(0, 12)

      this.searchDropdownOpen = this.searchResultados.length > 0
      this.searchHighlightIndex = -1
    },

    onSearchKeyDown() {
      if (!this.searchDropdownOpen || this.searchResultados.length === 0) return
      this.searchHighlightIndex = Math.min(this.searchHighlightIndex + 1, this.searchResultados.length - 1)
    },

    onSearchKeyUp() {
      if (!this.searchDropdownOpen || this.searchResultados.length === 0) return
      this.searchHighlightIndex = Math.max(this.searchHighlightIndex - 1, -1)
    },

    onSearchKeyEnter() {
      if (this.searchHighlightIndex >= 0 && this.searchHighlightIndex < this.searchResultados.length) {
        this.agregarProducto(this.searchResultados[this.searchHighlightIndex])
      } else if (this.searchResultados.length) {
        this.agregarProducto(this.searchResultados[0])
      }
    },

    onSearchKeyEscape() {
      this.searchDropdownOpen = false
      this.searchHighlightIndex = -1
    },

    agregarProducto(prod) {
      this.searchQuery = ''
      this.searchResultados = []

      const tipoPrecioActual = this.form.tipoPrecio === 'CF' ? 'CF' : 'SF'
      const tiersSF = prod.tiersSF || (prod.precio != null ? [{ cantidadMin: 1, cantidadMax: null, precio: prod.precio }] : [])
      const tiersCF = prod.tiersCF || []

      // Buscar si ya está en el detalle → incrementar cantidad
      const existente = this.detalle.find(i => i.productoId === prod.id)
      if (existente) {
        existente.cantidad += 1
        this.recalcularLinea(existente)
        this.$nextTick(() => this.$refs.searchInput?.focus())
        return
      }

      const tiersActivos = tipoPrecioActual === 'CF' && tiersCF.length ? tiersCF : tiersSF
      const tierIdx = 0
      const precioBase = tiersActivos[0]?.precio ?? 0

      const nuevoItem = {
        _key: ++_keyCounter,
        productoId: prod.id,
        codigoTienda: prod.codigoTienda || prod.codigoBarras || '',
        nombre: prod.nombre,
        nombreCategoria: prod.nombreCategoria || null,
        nombreSubcategoria: prod.nombreSubcategoria || null,
        porcentajeFactura: prod.porcentajeFactura || 0,
        tiersSF,
        tiersCF,
        tipoPrecio: tipoPrecioActual,
        tierIdx,
        cantidad: 1,
        precioUnitario: precioBase,
        descuentoPct: 0,
        total: precioBase,
        lotes: [],
        loteSeleccionado: '',
      }

      this.detalle.push(nuevoItem)

      // Cargar lotes disponibles
      this.cargarLotes(nuevoItem)

      this.$nextTick(() => this.$refs.searchInput?.focus())
    },

    // Devuelve los tiers activos según el tipo global SF/CF del formulario
    tiersActivos(item) {
      return this.form.tipoPrecio === 'CF' && item.tiersCF && item.tiersCF.length
        ? item.tiersCF
        : (item.tiersSF || [])
    },

    // Etiqueta del tier: "Cant. 1-100: Bs 8,00 (+ IVA: Bs 8,96)" o "Cant. 101+: Bs 7,50"
    etiquetaTier(tier, porcentajeFactura = 0) {
      const rango = tier.cantidadMax != null
        ? `Cant. ${tier.cantidadMin}-${tier.cantidadMax}`
        : `Cant. ${tier.cantidadMin}+`
      const precioSinIva = this.formatNum(tier.precio)
      if (porcentajeFactura > 0) {
        const precioConIva = tier.precio * (1 + porcentajeFactura / 100)
        const precioConIvaFormato = this.formatNum(precioConIva)
        return `${rango}: Bs ${precioSinIva} (+ IVA: Bs ${precioConIvaFormato})`
      }
      return `${rango}: Bs ${precioSinIva}`
    },

    // Al hacer click en un tier radio
    onTierChange(item, tierIdx) {
      item.tierIdx = tierIdx
      const tiers = this.tiersActivos(item)
      const tier = tiers[tierIdx]
      if (tier) { item.precioUnitario = tier.precio; this.recalcularLinea(item) }
    },

    recalcularLinea(item) {
      const tiers = this.tiersActivos(item)
      if (tiers.length > 1) {
        const qty = Number(item.cantidad || 1)
        const idx = tiers.findIndex(t =>
          qty >= t.cantidadMin && (t.cantidadMax == null || qty <= t.cantidadMax),
        )
        const matchIdx = idx >= 0 ? idx : tiers.length - 1
        if (matchIdx !== item.tierIdx) {
          item.tierIdx = matchIdx
          item.precioUnitario = tiers[matchIdx].precio
        }
      }
      item.total = Number(item.cantidad || 0) * Number(item.precioUnitario || 0)
      // Forzar reactividad en Vue 2
      this.$set(item, 'total', item.total)
    },

    quitarLinea(idx) {
      this.detalle.splice(idx, 1)
    },

    async cargarLotes(item) {
      try {
        const sucursalId = this.form.sucursalId || (this.$store.getters.sucursalActualId || '')
        const lotes = await this.$service.list(`lotes/producto/${item.productoId}?sucursalId=${sucursalId}`) || []
        // Agregar información de stock y precios del lote
        const lotesConDetalles = await Promise.all(lotes.map(async lote => {
          try {
            const detalles = await this.$service.get(`lotes/${lote.id}/stock`)
            return {
              ...lote,
              stock: detalles?.datos?.stock || 0,
              precioVentaSF: detalles?.datos?.precioVentaSF || null,
              precioVentaCF: detalles?.datos?.precioVentaCF || null,
            }
          } catch (e) {
            return { ...lote, stock: 0, precioVentaSF: null, precioVentaCF: null }
          }
        }))
        this.$set(item, 'lotes', lotesConDetalles.filter(l => Number(l.stock) > 0))
      } catch (e) {
        console.error('Error cargando lotes:', e)
      }
    },

    async onLoteChange(item) {
      if (item.loteSeleccionado) {
        const lote = item.lotes.find(l => l.id === item.loteSeleccionado)
        if (lote) {
          this.$set(item, 'loteSeleccionado', lote.id)

          // Si el lote tiene precio específico configurado, usarlo
          const tipoPrecio = this.form.tipoPrecio === 'CF' ? 'CF' : 'SF'
          const precioLote = tipoPrecio === 'CF' ? lote.precioVentaCF : lote.precioVentaSF

          if (precioLote && Number(precioLote) > 0) {
            item.precioUnitario = Number(precioLote)
            this.recalcularLinea(item)
          }
        }
      } else {
        // Si deselecciona lote, volver al precio del tier actual
        const tiers = this.tiersActivos(item)
        if (tiers.length > 0) {
          const tierIdx = item.tierIdx >= 0 ? item.tierIdx : 0
          item.precioUnitario = tiers[tierIdx].precio
          this.recalcularLinea(item)
        }
      }
    },

    getLoteLabel(item) {
      if (!item.loteSeleccionado) return ''
      const lote = item.lotes.find(l => l.id === item.loteSeleccionado)
      if (!lote) return ''
      return `${lote.nroLote} - Stock: ${this.formatNum(lote.stock)}`
    },

    // ── Pagos ────────────────────────────────────────────────────────────

    onTogglePago(metodo) {
      if (!metodo.activo) {
        metodo.monto = ''
        metodo.referencia = ''
        if (metodo.value === 'ADELANTO') metodo.adelantoId = null
      } else {
        // Auto-rellenar con el saldo restante aún no asignado
        const yaAsignado = this.metodosPago
          .filter(m => m.activo && m.value !== metodo.value)
          .reduce((s, m) => s + (Number(m.monto) || 0), 0)
        const restante = Math.max(0, this.subtotal - yaAsignado)
        metodo.monto = restante > 0 ? restante : ''
        if (metodo.value === 'ADELANTO') this.cargarAdelantos()
      }
    },

    async cargarAdelantos() {
      this.cargandoAdelantos = true
      try {
        const params = {}
        if (this.form.codigoCliente) {
          // Si se seleccionó un cliente, filtrar por él
        }
        this.adelantosDisponibles = (await this.$service.list('ingresos/adelantos', params)) || []
      } catch {
        this.adelantosDisponibles = []
      } finally {
        this.cargandoAdelantos = false
      }
    },

    onAdelantoSelected(metodo) {
      const adelanto = this.adelantosDisponibles.find(a => a.id === metodo.adelantoId)
      if (adelanto) {
        metodo.monto = Math.min(Number(adelanto.montoDisponible), this.subtotal)
      }
    },

    onTipoVentaChange() {
      if (this.form.tipoVenta !== 'CREDITO') this.form.fechaLimitePago = ''
    },

    // ── Buscar cliente ───────────────────────────────────────────────────

    abrirBuscarCliente() {
      this.clienteBusqueda = ''
      this.clientesResultados = []
      this.clienteModal = true
    },

    async buscarClientes() {
      if (!this.clienteBusqueda.trim()) { this.clientesResultados = []; return }
      this.loadingClientes = true
      try {
        this.clientesResultados = await this.$service.list(`contactos-clientes?q=${encodeURIComponent(this.clienteBusqueda)}`) || []
      } catch { this.clientesResultados = [] }
      finally { this.loadingClientes = false }
    },

    seleccionarCliente(c) {
      this.form.nombreCliente = c.nombre || ''
      this.form.nombreFactura = c.razonSocial || c.nombre || ''
      this.form.nitCi = c.nit || c.ci || ''
      this.form.celular = c.celular || ''
      this.form.correo = c.correo || c.email || ''
      this.form.codigoCliente = c.codigo || String(c.id)
      this.clienteModal = false
    },

    buscarPorCodigo() {
      const prod = this.productos.find(p =>
        p.codigoTienda === this.form.codigoCliente ||
        p.codigoBarras === this.form.codigoCliente
      )
      if (prod) this.agregarProducto(prod)
    },

    // ── Guardar / Cobrar ─────────────────────────────────────────────────

    async guardarVenta() {
      if (!this.detalle.length) return
      if (!this.form.sucursalId) return this.$message.error('Selecciona una sucursal')
      this.saving = true
      try {
        const payload = this.buildPayload('PENDIENTE')
        await this.$service.post('ventas/borrador', payload)
        this.$message.success('Venta guardada como pendiente')
        this.nuevaVenta()
      } catch (e) {
        this.$message.error(e?.message || 'Error al guardar la venta')
      } finally { this.saving = false }
    },

    cobrarVenta() {
      if (!this.detalle.length) return
      if (!this.form.sucursalId) return this.$message.error('Selecciona una sucursal')
      if (!this.cajaAbierta) return this.$message.error('Caja no abierta. Debe abrir la caja primero.')
      this.registrarDeuda = false
      // Auto-seleccionar Efectivo con el total si no hay ningún método activo
      if (!this.pagoActivos.length) {
        const efectivo = this.metodosPago.find(m => m.value === 'EFECTIVO')
        if (efectivo) { efectivo.activo = true; efectivo.monto = this.subtotal }
      }
      this.cobrarModal = true
    },

    async confirmarCobro() {
      this.cobrando = true
      try {
        const pagos = this.pagoActivos.map(m => ({
          metodoPago: m.value,
          monto: Number(m.monto) || 0,
          referencia: m.referencia || undefined,
          adelantoId: m.value === 'ADELANTO' ? m.adelantoId : undefined,
        }))
        const estado = (this.registrarDeuda && this.saldoPendiente > 0.01) ? 'PENDIENTE' : 'COMPLETADA'
        const payload = { ...this.buildPayload(estado), pagos }
        if (estado === 'PENDIENTE' && this.saldoPendiente > 0.01) {
          payload.tipoVenta = payload.tipoVenta || 'CREDITO'
        }
        const result = await this.$service.post('ventas/cobrar', payload)
        this.ultimaVenta = result
        this.cobrarModal = false
        this.ticketModal = true
      } catch (e) {
        this.$message.error(e?.message || 'Error al procesar el cobro')
      } finally { this.cobrando = false }
    },

    buildPayload(estado) {
      const adelantoMetodo = this.metodosPago.find(m => m.value === 'ADELANTO' && m.activo)
      return {
        sucursalId: this.form.sucursalId,
        estado,
        tipoOperacion: this.form.tipoOperacion,
        tipoComprobante: this.form.tipoComprobante,
        tipoPrecio: this.form.tipoPrecio,
        tipoVenta: this.form.tipoVenta,
        fechaVenta: this.form.fecha,
        fechaLimitePago: this.form.fechaLimitePago || undefined,
        compradorNitCi: this.form.nitCi || undefined,
        compradorComplemento: this.form.complemento || undefined,
        compradorNombre: this.form.nombreFactura || this.form.nombreCliente || undefined,
        nombreCliente: this.form.nombreCliente || undefined,
        celular: this.form.celular || undefined,
        correo: this.form.correo || undefined,
        glosa: this.form.glosa || undefined,
        total: this.subtotal,
        adelantoId: adelantoMetodo?.adelantoId || undefined,
        montoAdelanto: adelantoMetodo ? Number(adelantoMetodo.monto) || undefined : undefined,
        detalle: this.detalle.map(i => ({
          productoId: i.productoId,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          tipoPrecio: i.tipoPrecio,
          subtotal: i.total,
        })),
      }
    },

    nuevaVenta() {
      this.ticketModal = false
      this.registrarDeuda = false
      this.form = emptyForm()
      this.detalle = []
      this.metodosPago.forEach(m => {
        m.activo = false
        m.monto = ''
        m.referencia = ''
        if (m.value === 'ADELANTO') m.adelantoId = null
      })
      this.adelantosDisponibles = []
      this.searchQuery = ''
      this.ultimaVenta = null
      if (this.sucursales.length === 1) this.form.sucursalId = this.sucursales[0].id
      this.$nextTick(() => this.$refs.searchInput?.focus())
    },

    generarPDF() {
      this.$message.error('PDF disponible solo en ventas completadas')
    },

    formatNum(v) {
      return Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
  },
}
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────────── */
.pos-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: var(--bg);
  padding: 0 0 16px;
  gap: 0;
}

/* ── Alerta ──────────────────────────────────────────────────────────── */
.pos-alert {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 10px 20px;
  background: #92400e22; border-bottom: 2px solid #f59e0b;
  flex-shrink: 0;
}
.pos-alert-body {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; color: #fbbf24; line-height: 1.5;
}
.pos-alert-body strong { color: #f59e0b; }
.pos-alert-close {
  background: none; border: none; color: #f59e0b; font-size: 14px;
  cursor: pointer; padding: 2px 6px; border-radius: 4px; flex-shrink: 0;
}
.pos-alert-close:hover { background: #f59e0b22; }
.alert-slide-enter-active, .alert-slide-leave-active { transition: all .3s; }
.alert-slide-enter, .alert-slide-leave-to { opacity: 0; max-height: 0; padding: 0 20px; }

/* ── Cabecera ────────────────────────────────────────────────────────── */
.pos-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 16px 20px 8px;
  flex-shrink: 0;
}
.pos-title { font-size: 18px; font-weight: 800; color: var(--t1); }
.pos-subtitle { font-size: 12px; color: var(--t5); margin-top: 2px; }

/* ── Botones header ──────────────────────────────────────────────────── */
.pos-btn-primary {
  padding: 7px 16px; border-radius: 8px; background: #22c55e; border: none;
  color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
  transition: background .15s;
}
.pos-btn-primary:hover { background: #16a34a; }
.pos-btn-secondary {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px;
  background: var(--b2); border: 1px solid var(--b0); color: var(--t3);
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s;
}
.pos-btn-secondary:hover { border-color: #6366f155; color: #818cf8; }

/* ── Sección formulario ──────────────────────────────────────────────── */
.pos-form-section {
  margin: 0 16px 8px;
  background: var(--bg-s);
  border: 1px solid var(--b1);
  border-radius: 10px;
  padding: 14px 16px;
  flex-shrink: 0;
}
.pos-form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px 12px;
}

/* ── Campos del formulario ───────────────────────────────────────────── */
.pos-field {
  display: flex; flex-direction: column; gap: 3px;
}
.pos-field--span2 { grid-column: span 2; }
.pos-field label {
  font-size: 10px; font-weight: 700; color: var(--t4);
  text-transform: uppercase; letter-spacing: .4px;
}
.pos-input {
  padding: 6px 10px; border-radius: 7px;
  border: 1px solid var(--b1); background: var(--bg-e);
  color: var(--t2); font-size: 12px; outline: none;
  transition: border-color .15s;
}
.pos-input::placeholder { color: var(--ph, var(--t5)); }
.pos-input:focus { border-color: #6366f1; }
.pos-input:disabled { opacity: .4; cursor: not-allowed; }
.pos-select {
  padding: 6px 10px; border-radius: 7px;
  border: 1px solid var(--b1); background: var(--bg-e);
  color: var(--t2); font-size: 12px; outline: none;
  transition: border-color .15s;
}
.pos-select:focus { border-color: #6366f1; }
.pos-select--sm { padding: 4px 6px; font-size: 11px; width: 100%; }
.pos-lotes-cell { display: flex; flex-direction: column; gap: 4px; }
.pos-select--lote { width: 120px; padding: 5px 6px; font-size: 11px; }
.pos-lote-info { font-size: 10px; color: var(--t4); padding: 0 6px; }
.pos-lote-label { font-weight: 600; color: #6366f1; }

/* ── Radio buttons ───────────────────────────────────────────────────── */
.pos-radio-group {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 6px 0; height: 32px;
}
.pos-radio {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: var(--t3); cursor: pointer;
  white-space: nowrap;
}
.pos-radio input { accent-color: #6366f1; cursor: pointer; }
.pos-radio--oferta { color: #f59e0b; }
.pos-radio--oferta input { accent-color: #f59e0b; }

/* ── Sección búsqueda de productos ──────────────────────────────────── */
.pos-search-section {
  display: flex; flex-direction: column; gap: 6px;
  margin: 0 16px 6px;
  flex-shrink: 0;
}
.pos-search-modes {
  display: flex; gap: 18px; align-items: center;
}
.pos-chk {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: var(--t3); cursor: pointer;
}
.pos-chk input { accent-color: #6366f1; cursor: pointer; }
.pos-search-input {
  width: 100%; font-size: 13px; padding: 8px 12px;
}
.pos-search-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
  background: var(--bg-n); border: 1px solid var(--b4); border-radius: 8px;
  box-shadow: 0 8px 24px #00000088; overflow: hidden; max-height: 260px; overflow-y: auto;
}
.pos-search-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px;
  cursor: pointer; transition: background .1s; border-bottom: 1px solid var(--b2);
}
.pos-search-item:last-child { border-bottom: none; }
.pos-search-item:hover, .pos-search-item--active { background: var(--bg-c); }
.pos-si-code { font-size: 10px; color: var(--t5); font-family: monospace; width: 80px; flex-shrink: 0; }
.pos-si-main { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.pos-si-path { font-size: 11px; color: var(--t2); word-break: break-word; }
.pos-si-price { font-size: 12px; font-weight: 700; color: #6366f1; flex-shrink: 0; }
.dropdown-fade-enter-active, .dropdown-fade-leave-active { transition: opacity .15s; }
.dropdown-fade-enter, .dropdown-fade-leave-to { opacity: 0; }

/* ── Sección tabla ───────────────────────────────────────────────────── */
.pos-table-section {
  margin: 0 16px 0;
  display: flex; flex-direction: column;
  background: var(--bg-s); border: 1px solid var(--b1); border-radius: 10px;
  overflow: hidden; flex-shrink: 0; min-height: 180px;
}
.pos-table-wrap { overflow-x: auto; }
.pos-table {
  width: 100%; border-collapse: collapse; min-width: 700px;
}
.pos-th {
  padding: 8px 10px; font-size: 10px; font-weight: 700; color: var(--t5);
  text-transform: uppercase; letter-spacing: .5px; text-align: left;
  background: var(--bg-n); border-bottom: 1px solid var(--b1); white-space: nowrap;
}
.pos-td {
  padding: 10px 10px; font-size: 12px; color: var(--scroll);
  border-bottom: 1px solid var(--b2); vertical-align: middle;
}
.pos-td--center { text-align: center; }
.pos-td--nro { font-size: 11px; color: var(--t5); width: 36px; }
.pos-td--code { font-family: monospace; font-size: 11px; color: var(--t5); }
.pos-td--total { font-weight: 700; color: #6366f1; text-align: right; padding-right: 12px; font-size: 13px; }
.pos-td-empty {
  text-align: center; padding: 32px 20px;
  font-size: 12px; color: var(--b3); font-style: italic;
}
.pos-tr:hover .pos-td { background: var(--b2); }

/* Descripción completa en una sola línea */
.pos-desc-full { font-size: 12px; font-weight: 600; color: var(--t2); }

/* Radio precios */
.pos-precios-list { display: flex; flex-direction: column; gap: 4px; }
.pos-precio-radio { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.pos-precio-radio input[type="radio"] { accent-color: #6366f1; cursor: pointer; width: 13px; height: 13px; flex-shrink: 0; }
.pos-precio-lbl { font-size: 11px; color: var(--t4); font-weight: 500; }
.pos-precio-radio--active .pos-precio-lbl { color: #6366f1; font-weight: 700; }
.pos-precio-auto { font-size: 10px; color: #eab308; font-style: italic; margin-top: 2px; }
.pos-precio-sinprecio { font-size: 10px; color: #f87171; font-style: italic; }

/* Inputs tabla */
.pos-input--qty { width: 68px; text-align: center; padding: 5px 6px; font-size: 12px; font-weight: 600; }
.pos-input--num { width: 80px; text-align: right; padding: 5px 6px; font-size: 12px; }

/* Botón eliminar */
.pos-del-btn {
  background: #ef4444; border: none; color: #fff;
  cursor: pointer; font-size: 11px; font-weight: 700;
  padding: 4px 7px; border-radius: 5px;
  transition: background .15s; line-height: 1;
}
.pos-del-btn:hover { background: #dc2626; }

/* Barra total */
.pos-total-bar {
  display: flex; align-items: center; justify-content: flex-end; gap: 16px;
  padding: 8px 16px; background: var(--bg-n); border-top: 1px solid var(--b1);
  flex-shrink: 0;
}
.pos-total-label { font-size: 12px; font-weight: 700; color: var(--t4); }
.pos-total-value { font-size: 16px; font-weight: 800; color: var(--t2); }

/* ── Footer ──────────────────────────────────────────────────────────── */
.pos-footer {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
  margin: 8px 16px 0;
  flex-shrink: 0;
}


/* Botones footer derecho */
.pos-footer-right {
  display: flex; align-items: center; gap: 10px; flex-shrink: 0;
}
.pos-footer-summary {
  display: flex; flex-direction: column; gap: 4px;
  padding: 8px 12px; background: var(--bg-n); border: 1px solid var(--b1);
  border-radius: 8px; min-width: 140px;
}
.pos-summary-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--t5); gap: 20px; }
.pos-summary-total { font-size: 13px; font-weight: 800; color: var(--t2); padding-top: 4px; border-top: 1px solid var(--b1); margin-top: 2px; }

.pos-btn-pdf {
  background: none; border: none; cursor: pointer; padding: 4px;
  transition: opacity .15s;
}
.pos-btn-pdf:hover { opacity: .8; }

.pos-btn-guardar {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 20px; border-radius: 8px;
  background: #f59e0b; border: none; color: #1a0a00;
  font-size: 13px; font-weight: 800; cursor: pointer; transition: background .15s;
}
.pos-btn-guardar:hover:not(:disabled) { background: #d97706; }
.pos-btn-guardar:disabled { opacity: .4; cursor: not-allowed; }

.pos-btn-cobrar {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 22px; border-radius: 8px;
  background: #22c55e; border: none; color: #fff;
  font-size: 13px; font-weight: 800; cursor: pointer; transition: background .15s;
}
.pos-btn-cobrar:hover:not(:disabled) { background: #16a34a; }
.pos-btn-cobrar:disabled { opacity: .4; cursor: not-allowed; }

/* ── Modales ─────────────────────────────────────────────────────────── */
.pos-modal-backdrop {
  position: fixed; inset: 0; background: #00000099;
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.pos-modal {
  background: var(--bg-s); border: 1px solid var(--b4); border-radius: 14px;
  width: 90%; max-width: 520px; max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px #00000088;
}
.pos-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--b1);
  font-size: 14px; font-weight: 700; color: var(--t2); flex-shrink: 0;
}
.pos-modal-close { background: none; border: none; color: var(--t5); cursor: pointer; font-size: 14px; }
.pos-modal-close:hover { color: var(--t2); }
.pos-modal-body { flex: 1; overflow-y: auto; padding: 14px 18px; }
.pos-modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 12px 18px; border-top: 1px solid var(--b1); flex-shrink: 0;
}

/* Lista clientes */
.pos-cliente-list { margin-top: 10px; max-height: 300px; overflow-y: auto; }
.pos-cliente-item {
  padding: 10px 12px; border-bottom: 1px solid var(--b2);
  cursor: pointer; border-radius: 6px; transition: background .12s;
}
.pos-cliente-item:hover { background: var(--bg-c); }

/* ── Modal de cobro ──────────────────────────────────────────────────── */
.pco-modal { max-width: 460px; }
.pco-total-card {
  text-align: center; padding: 14px 16px;
  background: var(--bg-n); border-radius: 10px; margin-bottom: 14px;
}
.pco-total-label { font-size: 10px; font-weight: 700; color: var(--t5); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
.pco-total-amount { font-size: 30px; font-weight: 800; color: #22c55e; }
.pco-section-title { font-size: 10px; font-weight: 700; color: var(--t4); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
.pco-metodos { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.pco-metodo-row {
  border: 1px solid var(--b1); border-radius: 8px; padding: 10px 12px;
  background: var(--bg-e); transition: border-color .15s, background .15s;
}
.pco-metodo-row--active { border-color: #6366f155; background: #6366f108; }
.pco-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.pco-toggle input[type="checkbox"] { accent-color: #6366f1; width: 14px; height: 14px; cursor: pointer; flex-shrink: 0; }
.pco-toggle-label { font-size: 12px; font-weight: 700; color: var(--t2); }
.pco-metodo-inputs { display: flex; gap: 8px; margin-top: 8px; align-items: center; }
.pco-amount-wrap { display: flex; align-items: stretch; border: 1px solid var(--b1); border-radius: 7px; background: var(--bg); overflow: hidden; flex: 1; min-width: 0; }
.pco-currency { padding: 0 8px; font-size: 11px; font-weight: 700; color: var(--t4); border-right: 1px solid var(--b1); display: flex; align-items: center; flex-shrink: 0; }
.pco-amount-input { border: none !important; border-radius: 0 !important; background: transparent !important; flex: 1; text-align: right; font-size: 13px; font-weight: 700; min-width: 0; padding: 6px 8px; outline: none; color: var(--t2); }
.pco-ref-input { flex: 1; font-size: 11px; min-width: 0; }
.pco-resumen { background: var(--bg-n); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
.pco-res-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 12px; color: var(--t4); }
.pco-res-row + .pco-res-row { border-top: 1px solid var(--b2); }
.pco-res-paid { font-weight: 700; color: #6366f1; }
.pco-res-ok { font-weight: 700; color: #22c55e; }
.pco-res-debt { font-weight: 700; color: #f87171; }
.pco-res-change { font-weight: 700; color: #f59e0b; }
.pco-deuda-toggle { background: #f5940018; border: 1px solid #f59e0b44; border-radius: 8px; padding: 10px 12px; }
.pco-deuda-toggle .pos-chk { font-size: 12px; color: #f59e0b; font-weight: 600; gap: 8px; }
.pco-deuda-toggle .pos-chk input { accent-color: #f59e0b; }

/* ── Animaciones ─────────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
.expand-enter-active, .expand-leave-active { transition: all .2s; }
.expand-enter, .expand-leave-to { opacity: 0; width: 0; overflow: hidden; }

/* ── Spinner ─────────────────────────────────────────────────────────── */
.ct-spinner { width:22px; height:22px; border-radius:50%; border:2px solid var(--b0); border-top-color:#6366f1; animation:spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
