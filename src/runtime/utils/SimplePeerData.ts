import type { PeerConnectOption, DataConnection, Peer } from 'peerjs'

export class SimplePeerData {
  rmPeerId: Peer['id']
  #peer: Peer
  connected: boolean
  rmDataConnection: DataConnection | null
  lcDataConnection: DataConnection | null
  #connectInterval: NodeJS.Timeout | null
  #connectIntervalMs: number

  constructor(peer: Peer, rmPeerId: Peer['id']) {
    this.rmPeerId = rmPeerId
    this.#peer = peer
    this.connected = false
    this.rmDataConnection = null
    this.lcDataConnection = null
    this.#connectInterval = null
    this.#connectIntervalMs = 5000
  }

  connect(opts?: PeerConnectOption) {
    const _connect = () => {
      this.rmDataConnection = this.#peer.connect(this.rmPeerId, opts)

      this.rmDataConnection?.on('open', () => {
        this.connected = true
      })
      this.rmDataConnection?.on('close', () => {
        this.connected = false
        if (this.#connectInterval) {
          clearInterval(this.#connectInterval)
        }
      })
    }

    _connect()

    this.#connectInterval = setInterval(() => {
      if (!this.#peer.disconnected && this.connected === false) {
        _connect()
      }
    }
    , this.#connectIntervalMs)
  }

  disconnect() {
    if (this.#connectInterval) {
      clearInterval(this.#connectInterval)
      this.#connectInterval = null
    }
    this.rmDataConnection?.close()
    this.lcDataConnection?.close()
  }

  async sendData(data: unknown, chunked?: boolean) {
    await this.lcDataConnection?.send(data, chunked)
  }
}
