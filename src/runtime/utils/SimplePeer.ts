import { Peer } from 'peerjs'
import type { DataConnection, PeerOptions } from 'peerjs'
import { SimplePeerMedia } from './SimplePeerMedia'
import { SimplePeerData } from './SimplePeerData'

interface Options {
  peer: PeerOptions
}

export class SimplePeer {
  peer: Peer | null
  peerMedia: SimplePeerMedia | null
  peerDataMap: Map<Peer['id'], SimplePeerData>
  options: Options | undefined
  #lcDataConnectionMap: Map<Peer['id'], DataConnection>

  constructor(opts?: Options) {
    this.peerDataMap = new Map()
    this.#lcDataConnectionMap = new Map()
    this.peer = null
    this.peerMedia = null
    this.options = opts
  }

  init(lcPeerId: Peer['id']) {
    this.peer = new Peer(lcPeerId, this.options?.peer)
    this.peerMedia = new SimplePeerMedia(this.peer)

    this.peer.on('connection', (lcDataConnection) => {
      const rmPeerId = lcDataConnection.peer
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
  }

  end() {
    if (this.peer?.destroyed === false) {
      this.peer.destroy()
      this.peerDataMap.forEach(conn => conn.disconnect())
      this.peerDataMap.clear()
      this.#lcDataConnectionMap.clear()
    }
  }

  addPeerData(rmPeerId: Peer['id']) {
    if (this.peer && !this.peerDataMap.has(rmPeerId)) {
      const peerData = new SimplePeerData(this.peer, rmPeerId)
      peerData.lcDataConnection = this.#lcDataConnectionMap.get(rmPeerId) ?? null
      peerData.lcDataConnection?.on('close', () => {
        peerData.rmDataConnection?.emit('close')
      })
      this.peerDataMap.set(rmPeerId, peerData)
    }

    return this.peerDataMap.get(rmPeerId) as SimplePeerData
  }

  removePeerData(rmPeerId: Peer['id']) {
    this.peerDataMap.get(rmPeerId)?.disconnect()
    this.peerDataMap.delete(rmPeerId)
    this.#lcDataConnectionMap.delete(rmPeerId)
  }
}
