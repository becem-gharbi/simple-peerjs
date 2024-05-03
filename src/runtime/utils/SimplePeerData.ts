import type { PeerConnectOption, DataConnection, Peer } from 'peerjs'

export class SimplePeerData {
  rmPeerId: Peer['id']
  #peer: Peer

  rmDataConnection: DataConnection | null
  lcDataConnection: DataConnection | null
  #connected: boolean
  #connectInterval: NodeJS.Timeout | null
  #connectIntervalMs: number
  onConnectionChange: (cb: (connected: boolean) => void) => void
  onDataReceived: (cb: (data: unknown) => void) => void

  constructor(peer: Peer, rmPeerId: Peer['id']) {
    this.rmPeerId = rmPeerId
    this.#peer = peer

    this.#connected = false
    this.rmDataConnection = null
    this.lcDataConnection = null
    this.#connectInterval = null
    this.onConnectionChange = () => {}
    this.onDataReceived = () => {}
    this.#connectIntervalMs = 5000
  }

  connect(opts?: PeerConnectOption) {
    const _connect = () => {
      this.rmDataConnection = this.#peer.connect(this.rmPeerId, opts)

      this.onConnectionChange = (cb) => {
        this.rmDataConnection?.on('open', () => {
          this.#connected = true
          cb(true)
        })
        this.rmDataConnection?.on('close', () => {
          this.#connected = false
          cb(false)
          if (this.#connectInterval) {
            clearInterval(this.#connectInterval)
          }
        })
      }

      this.onDataReceived = (cb) => {
        this.rmDataConnection?.on('data', cb)
      }
    }

    _connect()

    this.#connectInterval = setInterval(() => {
      if (!this.#peer.disconnected && this.#connected === false) {
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
