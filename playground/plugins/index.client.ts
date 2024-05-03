import { defineNuxtPlugin, useNuxtApp } from '#imports'

export default defineNuxtPlugin({
  dependsOn: ['peerjs'],

  setup() {
    const nuxtApp = useNuxtApp()

    nuxtApp.$peerjs.init(crypto.randomUUID())
  },
})
