import { defineNuxtPlugin, useNuxtApp } from '#imports'

export default defineNuxtPlugin({
  dependsOn: ['peerjs'],

  setup() {
    const nuxtApp = useNuxtApp()

    nuxtApp.$peerjs.init(crypto.randomUUID())

    nuxtApp.$peerjs.hooks.hook('data:connection', (metadata) => {
      console.log('data:connection', metadata)
    })

    nuxtApp.$peerjs.hooks.hook('media:call', (metadata) => {
      console.log('media:call', metadata)
      throw new Error('unauthorized')
    })
  },
})
