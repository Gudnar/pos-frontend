// Impresiones de venta (nota de venta y hoja de ruta) a partir de GET ventas/:id/impresion.
// Las usan el Historial de ventas y el Punto de venta.
import { resolverLogo } from './logo'

const ESTILOS = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; background: #f3f4f6; }
  /* Hoja carta (8,5 × 11 in) vertical; en pantalla se ve igual que impresa */
  @page { size: letter portrait; margin: 12mm; }
  .hoja { width: 8.5in; min-height: 11in; margin: 12px auto; padding: 12mm; background: #fff; font-size: 11px; }
  .cabecera { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 10px; }
  .logo { height: 70px; width: auto; max-width: 280px; object-fit: contain; }
  .empresa-nombre { font-size: 26px; font-weight: 800; color: #1e3a8a; }
  .empresa-datos { text-align: left; font-size: 10px; line-height: 1.5; }
  h1 { text-align: center; font-size: 15px; margin: 10px 0 12px; }
  table.grid { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  table.grid td, table.grid th { border: 1px solid #000; padding: 6px 7px; vertical-align: top; }
  table.grid th { background: #e5e7eb; font-size: 10px; text-align: left; }
  table.datos td { width: 50%; height: 30px; }
  table.items td { font-size: 10px; }
  table.totales td { font-size: 13px; font-weight: 700; width: 33%; }
  table.firmas th { text-align: center; }
  table.grid tr, .compromiso, .pie { break-inside: avoid; }
  table.firmas { break-inside: avoid; }
  table.firmas td { height: 110px; vertical-align: bottom; font-size: 10px; line-height: 1.6; width: 33%; }
  .c { text-align: center; } .r { text-align: right; }
  .seccion-titulo { background: #e5e7eb; padding: 6px 8px; font-weight: 800; font-size: 12px; margin: 10px 0 6px; }
  .compromiso { font-size: 10px; line-height: 1.5; margin: 0 0 10px; }
  .pie { font-size: 10px; line-height: 1.5; margin-top: 8px; }
  .acciones { text-align: center; margin: 10px; }
  .acciones button { padding: 8px 20px; font-size: 13px; cursor: pointer; }
  @media print {
    body { background: #fff; }
    .hoja { margin: 0; width: auto; min-height: 0; padding: 0; }
    .acciones { display: none; }
  }
`

export const esc = v => String(v == null ? '' : v)
  .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const formatNum = v => Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatCant = v => { const n = Number(v || 0); return n % 1 === 0 ? n.toString() : n.toFixed(3) }
const formatFecha = d => (d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '')
const abrevUdm = u => ({ KILO: 'Kg.', KILOGRAMO: 'Kg.', KG: 'Kg.', UNIDAD: 'Und.', TONELADA: 'Tn.', LITRO: 'Lt.', METRO: 'm' }[String(u).toUpperCase()] || u)
const nombreVendedor = d => { const u = d.vendedor || {}; return [u.nombres, u.apellidos].filter(Boolean).join(' ') }

const encabezadoEmpresa = d => {
  const e = d.empresa || {}
  const meta = e.metadatos || {}
  const direccion = meta.direccion || meta.direccionEmpresa || ''
  const logo = e.logoUrl
    ? `<img src="${esc(resolverLogo(e.logoUrl))}" alt="${esc(e.nombre)}" class="logo">`
    : `<div class="empresa-nombre">${esc(e.nombre || '')}</div>`
  return `<div class="cabecera">
    <div>${logo}</div>
    <div class="empresa-datos">
      ${e.telefono ? `<div>${esc(e.telefono)}</div>` : ''}
      ${e.correo ? `<div>${esc(e.correo)}</div>` : ''}
      ${direccion ? `<div>${esc(direccion)}</div>` : ''}
    </div>
  </div>`
}

/** Cuerpo HTML de la nota de venta (recibo). */
export function htmlNotaVenta (d) {
  const v = d.venta
  const e = d.empresa || {}
  const total = Number(v.total || 0)
  // Si hubo cambio, montoPagado incluye lo entregado de más: a cuenta nunca supera el total
  const aCuenta = Math.min(total, Number(v.montoPagado || 0))
  const saldo = Math.max(0, total - aCuenta)
  const credito = saldo > 0.009 || v.metodoPago === 'CREDITO'
  const rep = d.representante || {}
  const nombreCliente = v.nombreCliente || (d.contacto && d.contacto.nombre) || ''
  const direccion = v.direccionCliente || (d.contacto && d.contacto.direccion) || ''
  const n = x => formatNum(x)
  const filas = d.lineas.map((l, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td class="c">${esc(formatCant(l.cantidad))}${l.unidadMedida ? ` ${esc(abrevUdm(l.unidadMedida))}` : ''}</td>
      <td>${esc([l.categoria, l.descripcion].filter(Boolean).join(' '))}</td>
      <td class="r">${n(l.precioUnitario)}</td>
      <td class="r">${l.porcentajeFactura > 0 ? n(l.precioUnitario * (1 + l.porcentajeFactura / 100)) : ''}</td>
      <td class="r">${n(l.subtotal)}</td>
    </tr>`).join('')
  const linea = '____________'
  const compromiso = !credito ? '' : `
    <div class="seccion-titulo">NOTA DE COMPROMISO</div>
    <p class="compromiso">
      Yo, <i>${esc(rep.nombre || linea)}</i> Mayor de edad con C.I. N° ${linea}, con el cargo de ${esc(rep.cargo || linea)}.
      Que por el presente documento me comprometo a cancelar a favor de ${esc(e.nombre || '')}, en calidad de acreedor la suma
      líquida de Bs./ ${n(saldo)} crédito que cancelaré impostergablemente hasta la fecha ...(...)..., a plazo vencido se tomará
      en cuenta para efectos de ley.
    </p>`
  const cuerpo = `
    ${encabezadoEmpresa(d)}
    <h1>NOTA DE VENTA N° ${esc(v.nroVenta)}</h1>
    <table class="grid datos">
      <tr><td>Fecha: ${esc(formatFecha(v.fecha))}</td><td>NIT/C.I.: ${esc(v.nitCi || '')}</td></tr>
      <tr><td>Cliente: ${esc(nombreCliente)}</td><td>Teléfonos: ${esc(v.telefonoCliente || '')}</td></tr>
      <tr><td>Dirección: ${esc(direccion)}</td><td>Venta: [${credito ? ' ' : 'X'}] Contado [${credito ? 'X' : ' '}] Crédito</td></tr>
      <tr><td>N° de Pesaje/Tablilla: ${esc(v.nroPesaje || linea)}</td><td>N° de Factura: ${esc(v.nroFactura || linea)}</td></tr>
    </table>
    <table class="grid items">
      <thead><tr><th>ITEM</th><th>CANTIDAD</th><th>DESCRIPCIÓN</th><th>Precio Unit.</th><th>Precio U. + IVA</th><th>Sub Total</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <table class="grid">
      <tr><td style="width:65%;">Obs.: ${esc(v.observaciones || '')}</td><td class="r">Total en Bs.: ${n(total)}</td></tr>
    </table>
    <table class="grid totales">
      <tr><td>TOTAL: ${n(total)}</td><td>A CUENTA: ${n(aCuenta)}</td><td>SALDO: ${n(saldo)}</td></tr>
    </table>
    ${compromiso}
    <table class="grid firmas">
      <thead><tr><th>CLIENTE</th><th>ENCARGADO DE RECEPCIÓN</th><th>${esc((e.nombre || '').toUpperCase())}</th></tr></thead>
      <tr>
        <td>Firma:<br>Nombre: ${esc(rep.nombre || linea)}<br>C.I.: ${linea}<br>Celular: ${esc(rep.telefono || linea)}</td>
        <td>Firma:<br>Nombre: ${linea}<br>C.I.: ${linea}<br>Celular: ${linea}</td>
        <td>Firma:<br>Nombre: ${esc(nombreVendedor(d) || linea)}<br>C.I.: ${linea}<br>Celular: ${esc((d.vendedor && d.vendedor.telefono) || e.telefono || linea)}</td>
      </tr>
    </table>
    <p class="pie">Al firmar el comprobante declaro haber recibido conforme el producto.<br>
    <b>IMPORTANTE:</b> En caso de cualquier observación, se presentará este documento, que prueba la entrega del producto.</p>`
  return { titulo: `Nota de venta ${v.nroVenta}`, cuerpo }
}

/** Cuerpo HTML de la hoja de ruta. */
export function htmlHojaRuta (d) {
  const v = d.venta
  const h = d.hojaRuta || {}
  const e = d.empresa || {}
  const linea = '____________'
  const nombreCliente = v.nombreCliente || (d.contacto && d.contacto.nombre) || ''
  const filas = d.lineas.map((l, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td class="c">${esc(formatCant(l.cantidad))}${l.unidadMedida ? ` ${esc(abrevUdm(l.unidadMedida))}` : ''}</td>
      <td>${esc([l.categoria, l.descripcion].filter(Boolean).join(' '))}</td>
    </tr>`).join('')
  const cuerpo = `
    ${encabezadoEmpresa(d)}
    <h1>HOJA DE RUTA N° ${esc(h.nroHojaRuta || '')}</h1>
    <table class="grid datos">
      <tr><td>Fecha de salida: ${esc(h.fechaSalida ? formatFecha(h.fechaSalida) : linea)}</td><td>Nota de venta N°: ${esc(v.nroVenta)}</td></tr>
      <tr><td>Cliente: ${esc(nombreCliente)}</td><td>NIT/C.I.: ${esc(v.nitCi || '')}</td></tr>
      <tr><td>Teléfonos: ${esc(v.telefonoCliente || '')}</td><td>N° de Pesaje/Tablilla: ${esc(v.nroPesaje || linea)}</td></tr>
    </table>
    <div class="seccion-titulo">DATOS DEL TRANSPORTE</div>
    <table class="grid datos">
      <tr><td colspan="2">Empresa de transporte: ${esc(h.empresaTransporte || linea)}</td></tr>
      <tr><td>Conductor: ${esc(h.conductor || linea)}</td><td>C.I.: ${esc(h.conductorCi || linea)}</td></tr>
      <tr><td>Celular: ${esc(h.conductorCelular || linea)}</td><td>Placa: ${esc(h.placa || linea)}</td></tr>
      <tr><td colspan="2">Vehículo: ${esc(h.vehiculo || linea)}</td></tr>
      <tr><td>Origen: ${esc(h.origen || linea)}</td><td>Destino: ${esc(h.destino || linea)}</td></tr>
    </table>
    <table class="grid items">
      <thead><tr><th>ITEM</th><th>CANTIDAD</th><th>DESCRIPCIÓN</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <table class="grid">
      <tr><td>Obs.: ${esc(h.observaciones || '')}</td></tr>
    </table>
    <table class="grid firmas">
      <thead><tr><th>DESPACHADO POR (${esc((e.nombre || '').toUpperCase())})</th><th>TRANSPORTISTA</th><th>RECIBIDO POR (CLIENTE)</th></tr></thead>
      <tr>
        <td>Firma:<br>Nombre: ${esc(nombreVendedor(d) || linea)}<br>C.I.: ${linea}<br>Fecha: ${linea}</td>
        <td>Firma:<br>Nombre: ${esc(h.conductor || linea)}<br>C.I.: ${esc(h.conductorCi || linea)}<br>Placa: ${esc(h.placa || linea)}</td>
        <td>Firma:<br>Nombre: ${linea}<br>C.I.: ${linea}<br>Fecha: ${linea}</td>
      </tr>
    </table>
    <p class="pie">El transportista declara haber recibido la mercadería detallada en buen estado y se compromete a entregarla en el destino indicado.<br>
    <b>IMPORTANTE:</b> El cliente debe verificar la cantidad y el estado del producto al momento de la recepción.</p>`
  return { titulo: `Hoja de ruta ${h.nroHojaRuta || ''} - ${v.nroVenta}`, cuerpo }
}

/** Cuerpo HTML de la cotización (d = respuesta de GET cotizaciones/:id/impresion). */
export function htmlCotizacion (d) {
  const c = d.cotizacion
  const e = d.empresa || {}
  const linea = '____________'
  const nombreCliente = c.nombreCliente || (d.contacto && d.contacto.nombre) || ''
  const direccion = (d.contacto && d.contacto.direccion) || ''
  const n = x => formatNum(x)
  const filas = d.lineas.map((l, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td class="c">${esc(formatCant(l.cantidad))}${l.unidadMedida ? ` ${esc(abrevUdm(l.unidadMedida))}` : ''}</td>
      <td>${esc([l.categoria, l.descripcion].filter(Boolean).join(' '))}</td>
      <td class="r">${n(l.precioUnitario)}</td>
      <td class="r">${l.porcentajeFactura > 0 ? n(l.precioUnitario * (1 + l.porcentajeFactura / 100)) : ''}</td>
      <td class="r">${n(l.subtotal)}</td>
    </tr>`).join('')
  const cuerpo = `
    ${encabezadoEmpresa(d)}
    <h1>COTIZACIÓN N° ${esc(c.nroCotizacion)}</h1>
    <table class="grid datos">
      <tr><td>Fecha: ${esc(formatFecha(c.fecha))}</td><td>Válida hasta: ${esc(c.validoHasta ? formatFecha(c.validoHasta) : linea)}</td></tr>
      <tr><td>Cliente: ${esc(nombreCliente)}</td><td>NIT/C.I.: ${esc(c.nitCi || '')}</td></tr>
      <tr><td>Dirección: ${esc(direccion)}</td><td>Teléfonos: ${esc(c.telefonoCliente || '')}</td></tr>
    </table>
    <table class="grid items">
      <thead><tr><th>ITEM</th><th>CANTIDAD</th><th>DESCRIPCIÓN</th><th>Precio Unit.</th><th>Precio U. + IVA</th><th>Sub Total</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <table class="grid">
      <tr><td style="width:65%;">Obs.: ${esc(c.observaciones || '')}</td><td class="r">Total en Bs.: ${n(c.total)}</td></tr>
    </table>
    <table class="grid totales">
      <tr><td colspan="3">TOTAL COTIZADO: Bs. ${n(c.total)}</td></tr>
    </table>
    <table class="grid firmas" style="width:40%;margin-left:auto;">
      <thead><tr><th>${esc((e.nombre || '').toUpperCase())}</th></tr></thead>
      <tr><td>Firma:<br>Nombre: ${esc(nombreVendedor(d) || linea)}<br>Celular: ${esc((d.vendedor && d.vendedor.telefono) || e.telefono || linea)}</td></tr>
    </table>
    <p class="pie">Precios en bolivianos, sujetos a disponibilidad de stock al momento de la compra.<br>
    <b>IMPORTANTE:</b> Esta cotización no es una factura ni una nota de venta${c.validoHasta ? `; es válida hasta el ${esc(formatFecha(c.validoHasta))}` : ''}.</p>`
  return { titulo: `Cotización ${c.nroCotizacion}`, cuerpo }
}

/**
 * Escribe el documento en una ventana. Se puede pasar una ventana abierta de antemano
 * (en el mismo clic del usuario) para que el navegador no la bloquee tras una espera.
 * Con autoImprimir se abre el diálogo de impresión al cargar.
 */
export function escribirDocumento (w, { titulo, cuerpo }, { autoImprimir = false } = {}) {
  w.document.open()
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>${ESTILOS}</style></head>
    <body${autoImprimir ? ' onload="setTimeout(function(){window.print()},250)"' : ''}><div class="hoja">${cuerpo}</div><div class="acciones"><button onclick="window.print()">Imprimir</button></div></body></html>`)
  w.document.close()
  w.focus()
}

/** Ventana provisional mientras se obtienen los datos. */
export function abrirVentanaPendiente () {
  const w = window.open('', '_blank')
  if (w) w.document.write('<p style="font-family:Arial;padding:24px;color:#555;">Generando documento…</p>')
  return w
}
