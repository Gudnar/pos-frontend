import Vue from 'vue';
import AppLoading from './AppLoading.vue';

const LoadingConstructor = Vue.extend(AppLoading);
let instance;

const Loading = {
  install(V) {
    instance = new LoadingConstructor();
    instance.$mount(document.createElement('div'));
    document.body.appendChild(instance.$el);

    V.prototype.$loading = {
      show(msg = 'Cargando...') { instance.show(msg); },
      hide() { instance.hide(); },
    };

    V.prototype.$waiting = (show, message = 'Procesando...') => {
      if (show) instance.show(message);
      else instance.hide();
    };
  },
};

export default Loading;
