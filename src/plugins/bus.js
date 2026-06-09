import Vue from 'vue';

const Bus = {
  install(V) {
    V.prototype.$bus = new Vue();
  },
};

export default Bus;
