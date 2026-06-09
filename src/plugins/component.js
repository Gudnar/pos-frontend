import Vue from 'vue';

const Components = {
  install() {
    Vue.component('IdeCard', {
      functional: true,
      render(h, ctx) {
        return h('div', {
          staticClass: 'ide-ia-card',
          ...ctx.data,
        }, ctx.children);
      },
    });
  },
};

export default Components;
