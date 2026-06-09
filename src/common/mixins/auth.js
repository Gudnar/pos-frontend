import axios from 'axios';

export default {
  methods: {
    async login(usuario, contrasena) {
      const encoded = btoa(contrasena);
      const res = await axios.post(
        `${process.env.VUE_APP_BASE_SERVER}auth/login`,
        { usuario, contrasena: encoded },
        { withCredentials: true }
      );
      return res.data;
    },
    async logout() {
      this.$storage.removeAll();
      this.$store.commit('logout');
      this.$router.push('/login');
    },
  },
};
