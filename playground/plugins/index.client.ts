import { defineNuxtPlugin, useNuxtApp } from '#imports'

export default defineNuxtPlugin({
  dependsOn: ['peerjs:init'],

  setup() {
    const nuxtApp = useNuxtApp()
    nuxtApp.$peerjs.init(crypto.randomUUID())
  },
})
