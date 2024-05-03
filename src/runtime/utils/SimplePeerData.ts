import type { PeerConnectOption, DataConnection, Peer } from 'peerjs'
import { defu } from 'defu'

export interface Options extends PeerConnectOption {
  connectIntervalMs?: number
}

export class SimplePeerData {
  rmPeerId: Peer['id']
  connected: boolean
  rmDataConnection: DataConnection | null
  lcDataConnection: DataConnection | null
  #peer: Peer
  #connectInterval: NodeJS.Timeout | null
  #options: Options

  constructor(peer: Peer, rmPeerId: Peer['id'], opts?: Options) {
    this.rmPeerId = rmPeerId
    this.connected = false
    this.rmDataConnection = null
    this.lcDataConnection = null
    this.#peer = peer
    this.#connectInterval = null

    this.#options = defu(opts, {
      connectIntervalMs: 5000,
    })

    this.#connect()
    this.#setConnectInterval()
  }

  #connect() {
    this.rmDataConnection = this.#peer.connect(this.rmPeerId, this.#options)

    this.rmDataConnection?.on('open', () => {
      this.connected = true
    })

    this.rmDataConnection?.on('close', () => {
      this.connected = false
      this.#clearConnectInterval()
    })
  }

  end() {
    this.#clearConnectInterval()
    this.rmDataConnection?.close()
    this.lcDataConnection?.close()
  }

  async sendData(data: unknown, chunked?: boolean) {
    return this.lcDataConnection?.send(data, chunked)
  }

  #setConnectInterval() {
    this.#connectInterval = setInterval(() => {
      if (!this.#peer.disconnected && this.connected === false) {
        this.#connect()
      }
    }, this.#options.connectIntervalMs)
  }

  #clearConnectInterval() {
    if (this.#connectInterval) {
      clearInterval(this.#connectInterval)
      this.#connectInterval = null
    }
  }
}
