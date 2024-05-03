import type { PeerConnectOption, DataConnection, Peer } from 'peerjs'
import { defu } from 'defu'

interface Options extends PeerConnectOption {
  connectIntervalMs?: number
}

export class SimplePeerData {
  rmPeerId: Peer['id']
  #peer: Peer
  connected: boolean
  rmDataConnection: DataConnection | null
  lcDataConnection: DataConnection | null
  #connectInterval: NodeJS.Timeout | null
  options: Options

  constructor(peer: Peer, rmPeerId: Peer['id'], opts?: Options) {
    this.rmPeerId = rmPeerId
    this.#peer = peer
    this.connected = false
    this.rmDataConnection = null
    this.lcDataConnection = null
    this.#connectInterval = null

    this.options = defu(opts, {
      connectIntervalMs: 5000,
    })

    this.#init()
  }

  #init() {
    const connect = () => {
      this.rmDataConnection = this.#peer.connect(this.rmPeerId, this.options)

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

    connect()

    this.#connectInterval = setInterval(() => {
      if (!this.#peer.disconnected && this.connected === false) {
        connect()
      }
    }
    , this.options.connectIntervalMs)
  }

  end() {
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
