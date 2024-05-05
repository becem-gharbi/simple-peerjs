import { Peer } from 'peerjs'
import { createHooks } from 'hookable'
import type { DataConnection, PeerOptions } from 'peerjs'
import type { Hookable } from 'hookable'
import { SimplePeerMedia } from './SimplePeerMedia.js'
import { SimplePeerData } from './SimplePeerData.js'
import type { SimplePeerDataOptions } from './SimplePeerData.js'

export interface SimplePeerOptions extends Partial<PeerOptions> {
  rmVideoElId: string
  callingTimeoutMs?: number
  connectIntervalMs?: number
  lcVideoElId?: string
}

interface Hooks {
  'media:call': (rmPeerId: Peer['id'], metadata?: unknown) => Promise<void> | void
  'media:status': (status: SimplePeerMedia['status']) => Promise<void> | void
  'data:connection': (rmPeerId: Peer['id'], metadata?: unknown) => Promise<void> | void
  'data:received': (rmPeerId: Peer['id'], data: unknown) => Promise<void> | void
}

const CONNECT_INTERVAL_MS = 5000
const CALLING_TIMEOUT_MS = 15000

export class SimplePeer {
  lcPeerId: Peer['id'] | null
  connected: boolean
  peerMedia: SimplePeerMedia | null
  hooks: Hookable<Hooks>
  #peerDataMap: Map<Peer['id'], SimplePeerData>
  #peer: Peer | null
  #lcDataConnectionMap: Map<Peer['id'], DataConnection>
  #options: SimplePeerOptions

  constructor(opts: SimplePeerOptions) {
    this.lcPeerId = null
    this.connected = false
    this.peerMedia = null
    this.hooks = createHooks()
    this.#peerDataMap = new Map()
    this.#peer = null
    this.#lcDataConnectionMap = new Map()
    this.#options = opts
  }

  init(lcPeerId: Peer['id']) {
    this.#peer = new Peer(lcPeerId, this.#options)
    this.lcPeerId = lcPeerId

    this.peerMedia = new SimplePeerMedia(this.#peer, {
      callingTimeoutMs: this.#options.callingTimeoutMs ?? CALLING_TIMEOUT_MS,
      rmVideoElId: this.#options.rmVideoElId,
      lcVideoElId: this.#options.lcVideoElId,
      onStatusChange: status => this.hooks.callHook('media:status', status),
    })

    window.addEventListener('unload', () => this.end())

    this.#peer.on('call', (mediaConnection) => {
      const rmPeerId = mediaConnection.peer
      this.hooks.callHook('media:call', rmPeerId, mediaConnection.metadata)
        .then(() => {
          this.peerMedia?._onCall(mediaConnection)
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
          const peerData = this.#peerDataMap.get(rmPeerId)
          if (peerData) {
            peerData._lcDataConnection = lcDataConnection
            peerData._lcDataConnection.on('close', () => {
              peerData._rmDataConnection?.emit('close')
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
      this.#peerDataMap.forEach(peerData => peerData._end())
      this.#peerDataMap.clear()
      this.#lcDataConnectionMap.clear()
    }
  }

  addPeerData(rmPeerId: Peer['id'], opts?: Partial<SimplePeerDataOptions>) {
    if (!this.#peer) {
      throw new Error('Please make sure to initialize local Peer')
    }

    if (!this.#peerDataMap.has(rmPeerId)) {
      const peerData = new SimplePeerData(this.#peer, rmPeerId, {
        ...opts,
        connectIntervalMs: this.#options.connectIntervalMs ?? CONNECT_INTERVAL_MS,
      })

      peerData._connect((rmDataConnection) => {
        rmDataConnection?.on('data', (data) => {
          this.hooks.callHook('data:received', rmPeerId, data)
        })
      })

      peerData._lcDataConnection = this.#lcDataConnectionMap.get(rmPeerId) ?? null

      peerData._lcDataConnection?.on('close', () => {
        peerData._rmDataConnection?.emit('close')
      })

      this.#peerDataMap.set(rmPeerId, peerData)
    }

    return this.#peerDataMap.get(rmPeerId)
  }

  removePeerData(rmPeerId: Peer['id']) {
    this.#peerDataMap.get(rmPeerId)?._end()
    this.#peerDataMap.delete(rmPeerId)
    this.#lcDataConnectionMap.delete(rmPeerId)
  }

  getPeerData(rmPeerId: Peer['id']) {
    return this.#peerDataMap.get(rmPeerId)
  }
}
