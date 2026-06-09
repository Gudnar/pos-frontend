const Util = {
  install(Vue) {
    Vue.prototype.$util = {
      serialize(obj) {
        return Object.entries(obj)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
      },
    };
  },
};

export default Util;
