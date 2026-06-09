import Vue from 'vue';
import AppProgress from './AppProgress.vue';

const ProgressConstructor = Vue.extend(AppProgress);
let instance;

const Progress = {
  install(V) {
    instance = new ProgressConstructor();
    instance.$mount(document.createElement('div'));
    document.body.appendChild(instance.$el);

    V.prototype.$progress = {
      start() { instance.start(); },
      close() { instance.close(); },
    };
  },
};

export default Progress;
