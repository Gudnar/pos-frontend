import Vue from 'vue';

const Directives = {
  install() {
    Vue.directive('focus', {
      inserted(el) {
        const input = el.tagName === 'INPUT' ? el : el.querySelector('input');
        if (input) input.focus();
      },
    });
  },
};

export default Directives;
