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
  static #callingTimeout: NodeJS.Timeout | null
  static #callingTimeoutMs: number

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
    NPeer.#callingTimeout = null
    NPeer.#callingTimeoutMs = 10000
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

  async startCall(rmVideoEl: HTMLVideoElement, opts?: CallOption) {
    NPeer.#lcMediaStream = await NPeer.#getUserMedia()

    NPeer.#lcMediaConnection = NPeer.peer.call(this.id, NPeer.#lcMediaStream, opts)

    NPeer.media.value = 'waiting'

    if (NPeer.#callingTimeout) {
      clearTimeout(NPeer.#callingTimeout)
      NPeer.#callingTimeout = null
    }
    NPeer.#callingTimeout = setTimeout(() => {
      NPeer.media.value = 'inactive'
      NPeer.#clearUserMedia()
    }, NPeer.#callingTimeoutMs)

    NPeer.#lcMediaConnection.on('stream', (stream) => {
      NPeer.media.value = 'active'
      rmVideoEl.srcObject = stream
    })

    NPeer.#lcMediaConnection.on('close', () => {
      NPeer.#clearUserMedia()
      NPeer.media.value = 'inactive'
      rmVideoEl.srcObject = null
    })
  }

  static onCall(rmVideoEl: HTMLVideoElement) {
    NPeer.peer.on('call', (call) => {
      NPeer.#rmMediaConnection = call

      NPeer.media.value = 'calling'

      if (NPeer.#callingTimeout) {
        clearTimeout(NPeer.#callingTimeout)
        NPeer.#callingTimeout = null
      }
      NPeer.#callingTimeout = setTimeout(() => {
        NPeer.media.value = 'inactive'
        NPeer.#clearUserMedia()
      }, NPeer.#callingTimeoutMs)

      NPeer.#rmMediaConnection.on('stream', (stream) => {
        NPeer.media.value = 'active'
        rmVideoEl.srcObject = stream
      })

      NPeer.#rmMediaConnection.on('close', () => {
        NPeer.#clearUserMedia()
        NPeer.media.value = 'inactive'
        rmVideoEl.srcObject = null
      })
    })
  }

  static endCall() {
    NPeer.#lcMediaConnection?.close()
    NPeer.#rmMediaConnection?.close()
    NPeer.#clearUserMedia()
    //* Maybe set media to inactive
  }

  static async acceptCall() {
    NPeer.#lcMediaStream = await NPeer.#getUserMedia()
    NPeer.#rmMediaConnection?.answer(NPeer.#lcMediaStream)
    //* Maybe set media to active
  }

  static declineCall() {
    NPeer.#lcMediaConnection?.close()
    NPeer.#rmMediaConnection?.close()
    NPeer.media.value = 'inactive'
  }

  static #getUserMedia() {
    return navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: {
          ideal: window.innerWidth,
        },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
  }

  static #clearUserMedia() {
    this.#lcMediaStream?.getTracks().forEach((track) => {
      if (track.readyState === 'live') {
        track.stop()
      }
    })
  }
}
