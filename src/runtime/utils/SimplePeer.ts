import { Peer } from 'peerjs'
import type { DataConnection, PeerOptions } from 'peerjs'
import { createHooks } from 'hookable'
import type { Hookable } from 'hookable'
import { SimplePeerMedia } from './SimplePeerMedia'
import { SimplePeerData } from './SimplePeerData'

interface Options {
  peer: PeerOptions
}

interface Hooks {
  'media:call': (metadata: object) => Promise<void> | void
  'data:connection': (metadata: object) => Promise<void> | void
  'data:received': (rmPeerId: Peer['id'], data: unknown) => Promise<void> | void
}

export class SimplePeer {
  peer: Peer | null
  connected: boolean
  peerMedia: SimplePeerMedia | null
  peerDataMap: Map<Peer['id'], SimplePeerData>
  #options: Options | undefined
  #lcDataConnectionMap: Map<Peer['id'], DataConnection>
  hooks: Hookable<Hooks>

  constructor(opts?: Options) {
    this.connected = false
    this.peerDataMap = new Map()
    this.#lcDataConnectionMap = new Map()
    this.peer = null
    this.peerMedia = null
    this.#options = opts
    this.hooks = createHooks()
  }

  init(lcPeerId: Peer['id']) {
    this.peer = new Peer(lcPeerId, this.#options?.peer)
    this.peerMedia = new SimplePeerMedia(this.peer)

    this.peer.on('call', async (call) => {
      await this.hooks.callHook('media:call', call.metadata)
        .then(() => {
          this.peerMedia?.onCall(call)
        })
        .catch(() => {})
    })

    this.peer.on('open', () => {
      this.connected = true
    })
    this.peer.on('disconnected', () => {
      this.connected = false
    })

    this.peer.on('connection', async (lcDataConnection) => {
      const rmPeerId = lcDataConnection.peer
      await this.hooks.callHook('data:connection', lcDataConnection.metadata)
        .then(() => {
          const peerData = this.peerDataMap.get(rmPeerId)
          if (peerData) {
            peerData.lcDataConnection = lcDataConnection
            peerData.lcDataConnection.on('close', () => {
              peerData.rmDataConnection?.emit('close')
            })
          }
          else {
            this.#lcDataConnectionMap.set(rmPeerId, lcDataConnection)
          }
        })
        .catch(() => { })
    })
  }

  end() {
    if (this.peer && this.peer.destroyed === false) {
      this.peer.destroy()
      this.peerDataMap.forEach(conn => conn.end())
      this.peerDataMap.clear()
      this.#lcDataConnectionMap.clear()
    }
  }

  addPeerData(rmPeerId: Peer['id'], opts?: SimplePeerData['options']) {
    if (!this.peer) {
      throw new Error('Please make sure to initialize local Peer')
    }

    if (!this.peerDataMap.has(rmPeerId)) {
      const peerData = new SimplePeerData(this.peer, rmPeerId, opts)

      peerData.rmDataConnection?.on('data', (data) => {
        this.hooks.callHook('data:received', rmPeerId, data)
      })

      peerData.lcDataConnection = this.#lcDataConnectionMap.get(rmPeerId) ?? null

      peerData.lcDataConnection?.on('close', () => {
        peerData.rmDataConnection?.emit('close')
      })
      this.peerDataMap.set(rmPeerId, peerData)
    }

    return this.peerDataMap.get(rmPeerId) as SimplePeerData
  }

  removePeerData(rmPeerId: Peer['id']) {
    this.peerDataMap.get(rmPeerId)?.end()
    this.peerDataMap.delete(rmPeerId)
    this.#lcDataConnectionMap.delete(rmPeerId)
  }
}
