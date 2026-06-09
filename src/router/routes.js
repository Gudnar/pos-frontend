import Login from '@/components/auth/Login.vue';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/admin',
    component: () => import('@/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@/layout/AppHome.vue'),
      },
      {
        path: 'empresas',
        name: 'empresas',
        component: () => import('@/views/Empresas.vue'),
        meta: { roles: ['SUPER_ADMIN'] },
      },
      {
        path: 'clientes',
        redirect: { name: 'empresas' },
      },
      {
        path: 'agentes',
        name: 'agentes',
        component: () => import('@/views/Agentes.vue'),
      },
      {
        path: 'agentes/:id',
        name: 'agente-detalle',
        component: () => import('@/views/AgenteDetalle.vue'),
      },
      {
        path: 'herramientas',
        name: 'herramientas',
        component: () => import('@/views/Herramientas.vue'),
      },
      {
        path: 'conversaciones',
        name: 'conversaciones',
        component: () => import('@/views/Conversaciones.vue'),
      },
      {
        path: 'calificacion',
        name: 'calificacion',
        component: () => import('@/views/Calificacion.vue'),
      },
      {
        path: 'configuracion',
        name: 'configuracion',
        component: () => import('@/views/Configuracion.vue'),
        meta: { roles: ['SUPER_ADMIN', 'ADMIN_CLIENTE'] },
      },
      {
        path: 'reportes',
        name: 'reportes',
        component: () => import('@/views/Reportes.vue'),
      },
      {
        path: 'mi-cuenta',
        name: 'mi-cuenta',
        component: () => import('@/views/MiCuenta.vue'),
        meta: { roles: ['ADMIN_CLIENTE'] },
      },
      {
        path: 'campanas',
        name: 'campanas',
        component: () => import('@/views/Campanas.vue'),
        meta: { roles: ['ADMIN_CLIENTE'] },
      },
      {
        path: 'especialistas',
        name: 'especialistas',
        component: () => import('@/views/Especialistas.vue'),
        meta: { roles: ['ADMIN_CLIENTE'] },
      },
      {
        path: 'citas-medicas',
        name: 'citas-medicas',
        component: () => import('@/views/CitasMedicas.vue'),
        meta: { roles: ['ADMIN_CLIENTE'] },
      },
      {
        path: 'pacientes',
        name: 'pacientes',
        component: () => import('@/views/Pacientes.vue'),
        meta: { roles: ['ADMIN_CLIENTE'] },
      },
      {
        path: 'configuracion/catalogo',
        name: 'catalogo-productos',
        component: () => import('@/views/CatalogoProductos.vue'),
        meta: { roles: ['ADMIN_CLIENTE'] },
      },
      {
        path: 'configuracion/sucursales',
        name: 'sucursales',
        component: () => import('@/views/Sucursales.vue'),
        meta: { roles: ['ADMIN_CLIENTE', 'SUPER_ADMIN'] },
      },
      {
        path: 'configuracion/usuarios',
        name: 'usuarios-sistema',
        component: () => import('@/views/UsuariosSistema.vue'),
        meta: { roles: ['ADMIN_CLIENTE', 'SUPER_ADMIN'] },
      },
      {
        path: 'inventario',
        name: 'inventario',
        component: () => import('@/views/Inventario.vue'),
      },
      { path: 'inventario/stock',           name: 'inventario-stock',           component: () => import('@/views/InventarioStock.vue') },
      { path: 'inventario/kardex',          name: 'inventario-kardex',          component: () => import('@/views/InventarioKardex.vue') },
      { path: 'inventario/lotes',           name: 'inventario-lotes',           component: () => import('@/views/InventarioLotes.vue') },
      { path: 'inventario/ajustes',         name: 'inventario-ajustes',         component: () => import('@/views/InventarioAjustes.vue') },
      { path: 'inventario/bajas',           name: 'inventario-bajas',           component: () => import('@/views/InventarioBajas.vue') },
      { path: 'inventario/transferencias',  name: 'inventario-transferencias',  component: () => import('@/views/InventarioTransferencias.vue') },
      { path: 'inventario/devoluciones',    name: 'inventario-devoluciones',    component: () => import('@/views/InventarioDevoluciones.vue') },
      { path: 'inventario/toma',            name: 'inventario-toma',            component: () => import('@/views/InventarioToma.vue') },
      { path: 'inventario/alertas',         name: 'inventario-alertas',         component: () => import('@/views/InventarioAlertas.vue') },
      { path: 'inventario/reporte-general', name: 'inventario-reporte-general', component: () => import('@/views/InventarioReporteGeneral.vue') },
      { path: 'inventario/rotacion',        name: 'inventario-rotacion',        component: () => import('@/views/InventarioRotacion.vue') },
      { path: 'inventario/precios',         name: 'inventario-precios',         component: () => import('@/views/InventarioPrecios.vue') },
      {
        path: 'ventas/pos',
        name: 'punto-venta',
        component: () => import('@/views/PuntoVenta.vue'),
      },
      {
        path: 'ventas/historial',
        name: 'ventas-historial',
        component: () => import('@/views/VentasHistorial.vue'),
      },
      {
        path: 'ventas/caja',
        name: 'caja',
        component: () => import('@/views/Caja.vue'),
      },
      {
        path: 'contactos/proveedores',
        name: 'proveedores',
        component: () => import('@/views/Proveedores.vue'),
      },
      {
        path: 'contactos/clientes',
        name: 'contactos-clientes',
        component: () => import('@/views/ContactosClientes.vue'),
      },
      {
        path: 'compras/ingreso',
        name: 'compras-ingreso',
        component: () => import('@/views/ComprasIngreso.vue'),
      },
      {
        path: 'compras/orden',
        name: 'compras-orden',
        component: () => import('@/views/ComprasOrden.vue'),
      },
      {
        path: 'compras/historial',
        name: 'compras-historial',
        component: () => import('@/views/ComprasHistorial.vue'),
      },
      {
        path: 'compras/pagos',
        name: 'compras-pagos',
        component: () => import('@/views/ComprasPagos.vue'),
      },
      {
        path: 'compras/pagos-historial',
        name: 'compras-pagos-historial',
        component: () => import('@/views/ComprasPagosHistorial.vue'),
      },
      {
        path: 'logistica',
        name: 'logistica',
        component: () => import('@/views/Logistica.vue'),
        meta: { roles: ['ADMIN_CLIENTE'] },
      },
      {
        path: 'logistica/ordenes/:id',
        name: 'logistica-orden-detalle',
        component: () => import('@/views/LogisticaOrdenDetalle.vue'),
        meta: { roles: ['ADMIN_CLIENTE'] },
      },
      {
        path: 'fuentes',
        name: 'fuentes',
        component: () => import('@/views/Fuentes.vue'),
        meta: { roles: ['ADMIN_CLIENTE'] },
      },
      {
        path: 'finanzas/ingresos',
        name: 'ingresos',
        component: () => import('@/views/Ingresos.vue'),
        meta: { roles: ['ADMIN_CLIENTE', 'ENCARGADO', 'CAJERO', 'VENDEDOR'] },
      },
      {
        path: 'finanzas/gastos',
        name: 'gastos',
        component: () => import('@/views/Gastos.vue'),
        meta: { roles: ['ADMIN_CLIENTE', 'ENCARGADO', 'CAJERO', 'VENDEDOR'] },
      },
    ],
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('@/layout/AppNotFound.vue'),
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/layout/AppForbidden.vue'),
  },
  {
    path: '*',
    redirect: '/404',
  },
];

export default routes;
