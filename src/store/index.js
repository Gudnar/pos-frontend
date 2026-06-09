import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    auth: false,
    user: null,
    clienteId: null,
    clienteInfo: null,
    sidenav: true,
    snackbar: { show: false, message: '', color: 'success' },
    waiting: { show: false, message: '' },
    sucursales: [],
    sucursalActual: null,
  },
  mutations: {
    setAuth(state, value) { state.auth = value; },
    setUser(state, value) { state.user = value; },
    setClienteId(state, value) { state.clienteId = value; },
    setClienteInfo(state, value) { state.clienteInfo = value; },
    setEmpresaActual(state, empresa) {
      state.clienteId = empresa ? empresa.id : null;
      state.clienteInfo = empresa || null;
    },
    setSidenav(state, value) { state.sidenav = value; },
    setSnackbar(state, value) { state.snackbar = { ...state.snackbar, ...value }; },
    setWaiting(state, value) { state.waiting = { ...state.waiting, ...value }; },
    setSucursales(state, value) { state.sucursales = value || []; },
    setSucursalActual(state, value) { state.sucursalActual = value; },
    logout(state) {
      state.auth = false;
      state.user = null;
      state.clienteId = null;
      state.clienteInfo = null;
      state.sucursales = [];
      state.sucursalActual = null;
    },
  },
  getters: {
    isAuth: (s) => s.auth,
    currentUser: (s) => s.user,
    clienteId: (s) => s.clienteId,
    clienteInfo: (s) => s.clienteInfo,
    isSidenavOpen: (s) => s.sidenav,
    currentRol: (s) => s.user?.rol || null,
    isSuperAdmin: (s) => s.user?.rol === 'SUPER_ADMIN',
    isAdminCliente: (s) => s.user?.rol === 'ADMIN_CLIENTE',
    isColaborador: (s) => s.user?.rol === 'COLABORADOR',
    sucursales: (s) => s.sucursales,
    sucursalActual: (s) => s.sucursalActual,
    sucursalActualId: (s) => s.sucursalActual?.id || null,
    isRolRestringido: (s) => ['ENCARGADO', 'CAJERO', 'VENDEDOR'].includes(s.user?.rol),
  },
});
