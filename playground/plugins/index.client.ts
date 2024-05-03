import { defineNuxtPlugin, useNuxtApp } from '#imports'

export default defineNuxtPlugin({
  dependsOn: ['peerjs'],

  setup() {
    const nuxtApp = useNuxtApp()

    nuxtApp.$peerjs.init(crypto.randomUUID())

    nuxtApp.$peerjs.hooks.hook('data:connection', (rmPeerId, metadata) => {
      console.log('data:connection', rmPeerId, metadata)
    })

    nuxtApp.$peerjs.hooks.hook('data:received', (data) => {
      console.log('data:received', data)
    })

    nuxtApp.$peerjs.hooks.hook('media:call', (rmPeerId, metadata) => {
      console.log('media:call', rmPeerId, metadata)
    })

    nuxtApp.$peerjs.hooks.hook('media:status', (status) => {
      console.log('media:status', status)
    })
  },
})
