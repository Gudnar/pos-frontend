import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: localStorage.getItem('ide-theme') !== 'light',
    themes: {
      dark: {
        primary: '#6366f1', secondary: '#8b5cf6', accent: '#c96442',
        error: '#ef4444', warning: '#f59e0b', info: '#3b82f6', success: '#22c55e',
        background: '#0a0f1e', surface: '#1e293b',
      },
      light: {
        primary: '#6366f1', secondary: '#8b5cf6', accent: '#c96442',
        error: '#ef4444', warning: '#f59e0b', info: '#3b82f6', success: '#22c55e',
        background: '#f0f4f8', surface: '#ffffff',
      },
    },
    options: { customProperties: true },
  },
});
