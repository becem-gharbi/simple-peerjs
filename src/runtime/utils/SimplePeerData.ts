import type { PeerConnectOption, DataConnection, Peer } from 'peerjs'

export interface SimplePeerDataOptions extends Partial<PeerConnectOption> {
  connectIntervalMs: number
}

export class SimplePeerData {
  rmPeerId: Peer['id']
  connected: boolean
  rmDataConnection: DataConnection | null
  lcDataConnection: DataConnection | null
  #peer: Peer
  #connectInterval: NodeJS.Timeout | null
  #options: SimplePeerDataOptions

  constructor(peer: Peer, rmPeerId: Peer['id'], opts: SimplePeerDataOptions) {
    this.rmPeerId = rmPeerId
    this.connected = false
    this.rmDataConnection = null
    this.lcDataConnection = null
    this.#peer = peer
    this.#connectInterval = null
    this.#options = opts
  }

  connect(cb: (rmDataConnection: DataConnection) => void) {
    this.rmDataConnection = this.#peer.connect(this.rmPeerId, this.#options)

    cb(this.rmDataConnection)

    this.rmDataConnection?.on('open', () => {
      this.connected = true
    })

    this.rmDataConnection?.on('close', () => {
      this.connected = false
    })

    this.#clearConnectInterval()

    this.#connectInterval = setInterval(() => {
      if (!this.#peer.disconnected && this.connected === false) {
        this.connect(cb)
      }
    }, this.#options.connectIntervalMs)
  }

  end() {
    this.#clearConnectInterval()
    this.rmDataConnection?.close()
    this.lcDataConnection?.close()
  }

  async sendData(data: unknown, chunked?: boolean) {
    if (this.connected) {
      return this.lcDataConnection?.send(data, chunked)
    }
  }

  #clearConnectInterval() {
    if (this.#connectInterval) {
      clearInterval(this.#connectInterval)
      this.#connectInterval = null
    }
  }
}
