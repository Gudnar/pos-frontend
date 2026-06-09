import axios from 'axios';
import router from '@/router';
import Store from '@/store';

axios.defaults.withCredentials = true;

let baseServer;
let authToken;
let Message;
let Storage;
let Progress;
let Waiting;
let sessionExpired = false;

const request = axios.create({ withCredentials: true });

const getUrl = (url) => {
  if (/^https?:\/\//.test(url)) return url;
  return baseServer + url;
};

const filterResponse = (response) => {
  Progress.close();
  if (response && typeof response === 'object') {
    if ('finalizado' in response) {
      if (response.finalizado) return response.datos;
      if (response.mensaje) Message.error(response.mensaje);
      return response.datos;
    }
  }
  return response;
};

const Services = {
  get(url, id) {
    const fullUrl = id ? `${getUrl(url)}/${id}` : getUrl(url);
    Progress.start();
    return request.get(fullUrl)
      .then(r => filterResponse(r.data))
      .finally(() => Progress.close());
  },
  post(url, data) {
    Progress.start();
    return request.post(getUrl(url), data)
      .then(r => filterResponse(r.data))
      .finally(() => Progress.close());
  },
  put(url, data) {
    Progress.start();
    return request.put(getUrl(url), data)
      .then(r => filterResponse(r.data))
      .finally(() => Progress.close());
  },
  patch(url, data) {
    Progress.start();
    return request.patch(getUrl(url), data)
      .then(r => filterResponse(r.data))
      .finally(() => Progress.close());
  },
  delete(url, id) {
    const fullUrl = id ? `${getUrl(url)}/${id}` : getUrl(url);
    Progress.start();
    return request.delete(fullUrl)
      .then(r => filterResponse(r.data))
      .finally(() => Progress.close());
  },
  list(url, query) {
    const qs = query ? '?' + Object.entries(query).filter(([, v]) => v != null).map(([k, v]) => `${k}=${v}`).join('&') : '';
    Progress.start();
    return request.get(getUrl(url) + qs)
      .then(r => filterResponse(r.data))
      .finally(() => Progress.close());
  },
  save(url, data) {
    return data.id ? this.put(`${url}/${data.id}`, data) : this.post(url, data);
  },
};

const responseInterceptor = (error) => {
  Progress.close();
  if (error?.response?.status === 401) {
    if (window.location.pathname !== '/login' && !sessionExpired) {
      sessionExpired = true;
      Message.error('Sesión terminada');
      Storage.removeAll();
      router.push('/login').finally(() => { sessionExpired = false; });
    }
  } else if (error?.response?.status === 403) {
    const msg = error.response.data?.mensaje || 'No tienes permisos para realizar esta acción';
    Message.error(msg);
  } else if (error?.response) {
    const msg = error.response.data?.mensaje || error.message || 'Error del servidor';
    Message.error(msg);
  } else if (error?.message) {
    Message.error(error.message === 'Network Error' ? 'Error de conexión' : error.message);
  }
  return Promise.reject(error);
};

const requestInterceptor = (config) => {
  if (Storage.exist('token')) {
    sessionExpired = false;
    config.headers = config.headers || {};
    config.headers.Authorization = `${authToken} ${Storage.get('token')}`;
    const sucursal = Store.getters.sucursalActual;
    if (sucursal?.id) {
      config.headers['X-Sucursal-Id'] = sucursal.id;
    }
    if (!config.headers['X-Empresa-Id']) {
      const empresaId = Store.getters.clienteId;
      if (empresaId) config.headers['X-Empresa-Id'] = empresaId;
    }
  }
  return config;
};

export default {
  install(Vue, config) {
    baseServer = config?.baseServer || '';
    authToken = config?.authToken || 'Bearer';

    const instance = new Vue();
    Message = instance.$message;
    Storage = instance.$storage;
    Progress = instance.$progress;
    Waiting = instance.$waiting;

    request.interceptors.response.use(r => r, responseInterceptor);
    request.interceptors.request.use(requestInterceptor, e => Promise.reject(e));

    Vue.prototype.$service = Services;
    Vue.prototype.$http = request;
    Vue.prototype.$baseServer = baseServer;
    Vue.prototype.$authToken = authToken;
  },
};
