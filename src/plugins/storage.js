const APP_KEY = 'ide_ia';

const Storage = {
  install(Vue) {
    const storage = {
      set(key, value) {
        localStorage.setItem(`${APP_KEY}_${key}`, JSON.stringify(value));
      },
      get(key) {
        try {
          return JSON.parse(localStorage.getItem(`${APP_KEY}_${key}`));
        } catch {
          return null;
        }
      },
      exist(key) {
        return localStorage.getItem(`${APP_KEY}_${key}`) !== null;
      },
      remove(key) {
        localStorage.removeItem(`${APP_KEY}_${key}`);
      },
      removeAll() {
        Object.keys(localStorage)
          .filter(k => k.startsWith(`${APP_KEY}_`))
          .forEach(k => localStorage.removeItem(k));
      },
    };
    Vue.prototype.$storage = storage;
  },
};

export default Storage;
