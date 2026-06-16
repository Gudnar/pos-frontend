module.exports = {
  transpileDependencies: ['vuetify'],
  devServer: {
    host: '0.0.0.0',
    port: 8084,
    proxy: {
      '/api': {
        target: process.env.VUE_APP_BASE_SERVER,
        changeOrigin: true,
      },
    },
  },
};
