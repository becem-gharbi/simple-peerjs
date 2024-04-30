import { Peer } from 'peerjs'
import type { DataConnection } from 'peerjs'
import type { PublicConfig } from '../types'
import { defineNuxtPlugin } from '#app'
import { useState } from '#imports'

export default defineNuxtPlugin({
  name: 'peerjs:init',

  setup(nuxtApp) {
    const config = nuxtApp.$config.public.peerjs as PublicConfig

    /**
     * Connected to Peer server
     */
    const connected = useState('peerjs-connected', () => false)

    /**
     * Local Peer instance
     */
    let peer: null | Peer = null
    const connections: DataConnection[] = []

    /**
     * Initiate the connection to the server.
     * @param uid local Peer ID that others can connect to.
     */
    function init(uid: string) {
      peer = new Peer(uid, {
        host: config.host,
        port: config.port,
        path: config.path,
      })

      peer.on('open', () => {
        connected.value = true
      })
      peer.on('disconnected', () => {
        connected.value = false
      })
      peer.on('connection', (conn) => {
        connections.push(conn)
      })
    }

    /**
     * Close the connection to the server and terminate all existing connections.
     */
    function end() {
      if (peer?.destroyed === false) {
        peer.removeAllListeners()
        peer.destroy()
      }
    }

    return {
      provide: {
        peerjs: {
          init,
          end,
          connected,
          connections,
          get peer() { return peer },
        },
      },
    }
  },
})
