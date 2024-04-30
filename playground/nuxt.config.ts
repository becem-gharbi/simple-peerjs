export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  ssr: false,
  peerjs: {
    host: 'localhost',
    path: '/peer',
    port: 9000,
  },
})
