export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  peerjs: {
    host: 'localhost',
    path: '/peer',
    port: 9000,
  },
})
