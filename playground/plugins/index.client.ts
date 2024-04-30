import { defineNuxtPlugin, useNuxtApp } from '#imports'

export default defineNuxtPlugin({
  dependsOn: ['peer:init'],

  setup() {
    const nuxtApp = useNuxtApp()

    nuxtApp.$peerjs.init(crypto.randomUUID())

    console.log(nuxtApp.$peerjs.peer)
  },
})
