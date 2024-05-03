import type { PublicConfig } from '../types'
import { SimplePeer } from '../utils'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'peerjs',

  setup(nuxtApp) {
    const config = nuxtApp.$config.public.peerjs as PublicConfig

    const peerjs = new SimplePeer(config)

    return {
      provide: {
        peerjs,
      },
    }
  },
})
