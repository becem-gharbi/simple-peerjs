import type { PeerConnectOption, CallOption, DataConnection, MediaConnection, Peer } from 'peerjs'
import { useState } from '#imports'
import type { Ref } from '#imports'

type Connection = 'online' | 'offline'
type Media = 'active' | 'inactive' | 'calling' | 'waiting'

export class NPeer {
  id: string
  static peer: Peer

  connection: Ref<Connection>
  rmDataConnection: DataConnection | null
  #lcDataConnection: DataConnection | null
  #connectInterval: NodeJS.Timeout | null
  #connectIntervalMs: number

  static media: Ref<Media>
  static #rmMediaConnection: MediaConnection | null
  static #lcMediaConnection: MediaConnection | null
  static #lcMediaStream: MediaStream | null

  constructor(peer: Peer, id: string) {
    this.id = id
    NPeer.peer = peer

    this.connection = useState<Connection>(`peer:${id}:connection`, () => 'offline')
    this.rmDataConnection = null
    this.#lcDataConnection = null
    this.#connectInterval = null
    this.#connectIntervalMs = 5000

    NPeer.peer.on('connection', (connection) => {
      if (connection.label === this.id) {
        this.#lcDataConnection = connection
      }
    })

    NPeer.media = useState<Media>(`peer:media`, () => 'inactive')
    NPeer.#rmMediaConnection = null
    NPeer.#lcMediaConnection = null
    NPeer.#lcMediaStream = null
  }

  connect(opts?: PeerConnectOption) {
    this.#connectInterval = setInterval(() => {
      if (!NPeer.peer.disconnected && !this.connection.value) {
        this.rmDataConnection = NPeer.peer.connect(this.id, {
          ...opts,
          label: this.id,
        })

        this.rmDataConnection.on('open', () => {
          this.connection.value = 'online'
        })
        this.rmDataConnection.on('close', () => {
          this.connection.value = 'offline'
        })
      }
    }, this.#connectIntervalMs)
  }

  disconnect() {
    if (this.#connectInterval) {
      clearInterval(this.#connectInterval)
      this.#connectInterval = null
    }
    this.rmDataConnection?.close()
    this.#lcDataConnection?.close()
  }

  async sendData(data: unknown, chunked?: boolean) {
    await this.#lcDataConnection?.send(data, chunked)
  }

  startCall(rmVideoEl: HTMLVideoElement, opts?: CallOption) { }
  static onCall(rmVideoEl: HTMLVideoElement, cb: () => void) {}
  static endCall() { }
  static acceptCall() { }
  static declineCall() { }
}
