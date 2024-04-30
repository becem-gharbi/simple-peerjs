import { Peer } from 'peerjs'
import type { PublicConfig } from '../types'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'peer:init',

  setup(nuxtApp) {
    const config = nuxtApp.$config.public.peerjs as PublicConfig

    let peer: null | Peer = null

    function init(uid: string) {
      peer = new Peer(uid, {
        host: config.host,
        port: config.port,
        path: config.path,
      })
    }

    return {
      provide: {
        peerjs: {
          init,
          get peer() { return peer },
        },
      },
    }
  },
})
