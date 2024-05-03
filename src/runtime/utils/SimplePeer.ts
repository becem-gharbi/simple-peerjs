import { Peer } from 'peerjs'
import { createHooks } from 'hookable'
import type { DataConnection, PeerOptions } from 'peerjs'
import type { Hookable } from 'hookable'
import { SimplePeerMedia } from './SimplePeerMedia'
import { SimplePeerData } from './SimplePeerData'
import type { Options as SimplePeerDataOptions } from './SimplePeerData'

interface Options extends PeerOptions {
}

interface Hooks {
  'media:call': (rmPeerId: Peer['id'], metadata?: object) => Promise<void> | void
  'data:connection': (rmPeerId: Peer['id'], metadata?: object) => Promise<void> | void
  'data:received': (rmPeerId: Peer['id'], data: unknown) => Promise<void> | void
}

export class SimplePeer {
  lcPeerId: Peer['id'] | null
  connected: boolean
  peerMedia: SimplePeerMedia | null
  peerDataMap: Map<Peer['id'], SimplePeerData>
  hooks: Hookable<Hooks>
  #peer: Peer | null
  #lcDataConnectionMap: Map<Peer['id'], DataConnection>
  #options: Options | undefined

  constructor(opts?: Options) {
    this.lcPeerId = null
    this.connected = false
    this.peerMedia = null
    this.peerDataMap = new Map()
    this.hooks = createHooks()
    this.#peer = null
    this.#lcDataConnectionMap = new Map()
    this.#options = opts
  }

  init(lcPeerId: Peer['id']) {
    this.#peer = new Peer(lcPeerId, this.#options)
    this.lcPeerId = lcPeerId

    this.peerMedia = new SimplePeerMedia(this.#peer)

    this.#peer.on('call', (mediaConnection) => {
      const rmPeerId = mediaConnection.peer
      this.hooks.callHook('media:call', rmPeerId, mediaConnection.metadata)
        .then(() => {
          this.peerMedia?.onCall(mediaConnection)
        })
        .catch(() => {})
    })

    this.#peer.on('open', () => {
      this.connected = true
    })

    this.#peer.on('disconnected', () => {
      this.connected = false
    })

    this.#peer.on('connection', (lcDataConnection) => {
      const rmPeerId = lcDataConnection.peer

      this.hooks.callHook('data:connection', rmPeerId, lcDataConnection.metadata)
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
        .catch(() => {})
    })
  }

  end() {
    if (this.#peer && this.#peer.destroyed === false) {
      this.#peer.destroy()
      this.peerDataMap.forEach(peerData => peerData.end())
      this.peerDataMap.clear()
      this.#lcDataConnectionMap.clear()
      this.hooks.removeAllHooks()
    }
  }

  addPeerData(rmPeerId: Peer['id'], opts?: SimplePeerDataOptions) {
    if (!this.#peer) {
      throw new Error('Please make sure to initialize local Peer')
    }

    if (!this.peerDataMap.has(rmPeerId)) {
      const peerData = new SimplePeerData(this.#peer, rmPeerId, opts)

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
