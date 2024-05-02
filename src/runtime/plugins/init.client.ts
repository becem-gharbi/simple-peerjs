import { Peer } from 'peerjs'
import type { DataConnection } from 'peerjs'
import type { PublicConfig } from '../types'
import { NPeer } from '../utils/NPeerjs'
import { defineNuxtPlugin } from '#app'
import { useState } from '#imports'

export default defineNuxtPlugin({
  name: 'peerjs:init',

  setup(nuxtApp) {
    const config = nuxtApp.$config.public.peerjs as PublicConfig
    let peer: null | Peer = null
    const nPeers = new Map<string, NPeer>()
    const connected = useState('peerjs-server-connected', () => false)
    const lcDataConnections = new Map<string, DataConnection>()

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
      peer.on('connection', (connection) => {
        const nPeer = nPeers.get(connection.peer)
        if (nPeer) {
          nPeer.lcDataConnection = connection
          nPeer.lcDataConnection.on('close', () => {
            nPeer.rmDataConnection?.emit('close')
          })
        }
        else {
          lcDataConnections.set(connection.peer, connection)
        }
      })
    }

    /**
     * Close the connection to the server and terminate all existing connections.
     */
    function end() {
      if (peer?.destroyed === false) {
        peer.destroy()
        nPeers.forEach(nPeer => nPeer.disconnect())
        nPeers.clear()
        lcDataConnections.clear()
      }
    }

    function addNPeer(id: string) {
      if (!peer) {
        throw new Error('make sure to initialize local Peer')
      }

      if (!nPeers.has(id)) {
        const nPeer = new NPeer(peer, id)
        nPeer.lcDataConnection = lcDataConnections.get(id) ?? null
        nPeer.lcDataConnection?.on('close', () => {
          nPeer.rmDataConnection?.emit('close')
        })
        nPeers.set(id, nPeer)
      }

      return nPeers.get(id)
    }

    function removeNPeer(id: string) {
      nPeers.get(id)?.disconnect()
      nPeers.delete(id)
      lcDataConnections.delete(id)
    }

    return {
      provide: {
        peerjs: {
          get peer() { return peer },
          get nPeers() { return nPeers },
          connected,
          init,
          end,
          addNPeer,
          removeNPeer,
        },
      },
    }
  },
})
