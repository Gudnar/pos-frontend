import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const Datetime = {
  install(Vue) {
    Vue.prototype.$datetime = {
      format(date, fmt = 'DD/MM/YYYY') {
        return dayjs(date).format(fmt);
      },
      fromNow(date) {
        return dayjs(date).fromNow();
      },
      now() {
        return dayjs().format('DD/MM/YYYY HH:mm');
      },
      relative(date) {
        const d = dayjs(date);
        const now = dayjs();
        if (now.diff(d, 'hour') < 1) return `${now.diff(d, 'minute')}m`;
        if (now.diff(d, 'day') < 1) return d.format('HH:mm');
        if (now.diff(d, 'day') < 2) return 'Ayer';
        return d.format('DD MMM');
      },
    };
  },
};

export default Datetime;
