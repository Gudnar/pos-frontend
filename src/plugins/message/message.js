import Vue from 'vue';
import AppMessages from './AppMessages.vue';

const MessageConstructor = Vue.extend(AppMessages);
let instance;

const Message = {
  install(V) {
    instance = new MessageConstructor();
    instance.$mount(document.createElement('div'));
    document.body.appendChild(instance.$el);

    V.prototype.$message = {
      success(text) { instance.show('success', text); },
      error(text) { instance.show('error', text); },
      info(text) { instance.show('info', text); },
      warning(text) { instance.show('warning', text); },
    };
  },
};

export default Message;
