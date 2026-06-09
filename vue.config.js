module.exports = {
  transpileDependencies: ['vuetify'],
  devServer: {
    port: 8083,
    proxy: {
      '/api': {
        target: process.env.VUE_APP_BASE_SERVER || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
};
