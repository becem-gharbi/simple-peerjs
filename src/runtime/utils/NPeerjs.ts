import type { PeerConnectOption, CallOption, DataConnection, MediaConnection, Peer } from 'peerjs'

type Connection = 'online' | 'offline'
type Media = 'active' | 'inactive' | 'calling' | 'waiting'

export class NPeer {
  id: string
  static #peer: Peer

  #connection: Connection
  rmDataConnection: DataConnection | null
  lcDataConnection: DataConnection | null
  #connectInterval: NodeJS.Timeout | null
  onConnectionChange: (cb: (conn: Connection) => void) => void
  onDataReceived: (cb: (data: unknown) => void) => void
  static #connectIntervalMs: number

  static media: Media
  static #rmMediaConnection: MediaConnection | null
  static #lcMediaConnection: MediaConnection | null
  static #lcMediaStream: MediaStream | null
  static #callingTimeout: NodeJS.Timeout | null
  static #callingTimeoutMs: number

  constructor(peer: Peer, id: string) {
    this.id = id
    NPeer.#peer = peer

    this.#connection = 'offline'
    this.rmDataConnection = null
    this.lcDataConnection = null
    this.#connectInterval = null
    this.onConnectionChange = () => {}
    this.onDataReceived = () => {}
    NPeer.#connectIntervalMs = 5000

    NPeer.media = 'inactive'
    NPeer.#rmMediaConnection = null
    NPeer.#lcMediaConnection = null
    NPeer.#lcMediaStream = null
    NPeer.#callingTimeout = null
    NPeer.#callingTimeoutMs = 10000
  }

  connect(opts?: PeerConnectOption) {
    const _connect = () => {
      this.rmDataConnection = NPeer.#peer.connect(this.id, opts)

      this.onConnectionChange = (cb) => {
        this.rmDataConnection?.on('open', () => {
          this.#connection = 'online'
          cb('online')
        })
        this.rmDataConnection?.on('close', () => {
          this.#connection = 'offline'
          cb('offline')
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
      if (!NPeer.#peer.disconnected && this.#connection === 'offline') {
        _connect()
      }
    }
    , NPeer.#connectIntervalMs)
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

  async startCall(rmVideoEl: HTMLVideoElement, opts?: CallOption) {
    NPeer.#lcMediaStream = await NPeer.#getUserMedia()

    NPeer.#lcMediaConnection = NPeer.#peer.call(this.id, NPeer.#lcMediaStream, opts)

    NPeer.media = 'waiting'

    if (NPeer.#callingTimeout) {
      clearTimeout(NPeer.#callingTimeout)
      NPeer.#callingTimeout = null
    }
    NPeer.#callingTimeout = setTimeout(() => {
      NPeer.media = 'inactive'
      NPeer.#clearUserMedia()
    }, NPeer.#callingTimeoutMs)

    NPeer.#lcMediaConnection.on('stream', (stream) => {
      NPeer.media = 'active'
      rmVideoEl.srcObject = stream
    })

    NPeer.#lcMediaConnection.on('close', () => {
      NPeer.#clearUserMedia()
      NPeer.media = 'inactive'
      rmVideoEl.srcObject = null
    })
  }

  static onCall(rmVideoEl: HTMLVideoElement) {
    NPeer.#peer.on('call', (call) => {
      NPeer.#rmMediaConnection = call

      NPeer.media = 'calling'

      if (NPeer.#callingTimeout) {
        clearTimeout(NPeer.#callingTimeout)
        NPeer.#callingTimeout = null
      }
      NPeer.#callingTimeout = setTimeout(() => {
        NPeer.media = 'inactive'
        NPeer.#clearUserMedia()
      }, NPeer.#callingTimeoutMs)

      NPeer.#rmMediaConnection.on('stream', (stream) => {
        NPeer.media = 'active'
        rmVideoEl.srcObject = stream
      })

      NPeer.#rmMediaConnection.on('close', () => {
        NPeer.#clearUserMedia()
        NPeer.media = 'inactive'
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
    NPeer.media = 'inactive'
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
