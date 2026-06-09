import Vue from 'vue';
import AppAlert from './AppAlert.vue';

const AlertConstructor = Vue.extend(AppAlert);
let instance;

const Modal = {
  install(V) {
    instance = new AlertConstructor();
    instance.$mount(document.createElement('div'));
    document.body.appendChild(instance.$el);

    V.prototype.$confirm = (text, callbackOk, callbackCancel) => {
      instance.showConfirm(text, callbackOk, callbackCancel);
    };
    V.prototype.$alert = (title, text) => {
      instance.showAlert(title, text);
    };
  },
};

export default Modal;
