import type { PeerConnectOption, DataConnection, Peer } from 'peerjs'

export interface SimplePeerDataOptions extends Partial<PeerConnectOption> {
  connectIntervalMs: number
}

export class SimplePeerData {
  rmPeerId: Peer['id']
  connected: boolean
  _rmDataConnection: DataConnection | null
  _lcDataConnection: DataConnection | null
  #peer: Peer
  #connectInterval: NodeJS.Timeout | null
  #options: SimplePeerDataOptions

  constructor(peer: Peer, rmPeerId: Peer['id'], opts: SimplePeerDataOptions) {
    this.rmPeerId = rmPeerId
    this.connected = false
    this._rmDataConnection = null
    this._lcDataConnection = null
    this.#peer = peer
    this.#connectInterval = null
    this.#options = opts
  }

  _connect(cb: (rmDataConnection: DataConnection) => void) {
    this._rmDataConnection = this.#peer.connect(this.rmPeerId, this.#options)

    cb(this._rmDataConnection)

    this._rmDataConnection?.on('open', () => {
      this.connected = true
    })

    this._rmDataConnection?.on('close', () => {
      this.connected = false
    })

    this.#clearConnectInterval()

    this.#connectInterval = setInterval(() => {
      if (!this.#peer.disconnected && this.connected === false) {
        this._connect(cb)
      }
    }, this.#options.connectIntervalMs)
  }

  _end() {
    this.#clearConnectInterval()
    this._rmDataConnection?.close()
    this._lcDataConnection?.close()
  }

  async sendData(data: unknown, chunked?: boolean) {
    if (this.connected) {
      return this._lcDataConnection?.send(data, chunked)
    }
  }

  #clearConnectInterval() {
    if (this.#connectInterval) {
      clearInterval(this.#connectInterval)
      this.#connectInterval = null
    }
  }
}
