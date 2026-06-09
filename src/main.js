import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import 'vuetify/dist/vuetify.min.css';

import Message from '@/plugins/message/message';
import Storage from '@/plugins/storage';
import Progress from '@/plugins/progress-bar/progress';
import Loading from '@/plugins/loading/loading';
import Modal from '@/plugins/modal/modal';
import Bus from '@/plugins/bus';
import Datetime from '@/plugins/datetime';
import Directives from '@/directives';
import Util from '@/plugins/util';
import Components from '@/plugins/component';
import Service from '@/plugins/service';

Vue.use(Message);
Vue.use(Storage);
Vue.use(Progress);
Vue.use(Loading);
Vue.use(Modal);
Vue.use(Bus);
Vue.use(Datetime);
Vue.use(Directives);
Vue.use(Util);
Vue.use(Components);

Vue.use(Service, {
  baseServer: process.env.VUE_APP_BASE_SERVER || 'http://localhost:3001/api/',
  authToken: process.env.VUE_APP_AUTH_TOKEN || 'Bearer',
});

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App),
}).$mount('#app');
