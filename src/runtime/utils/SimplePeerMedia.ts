import type { CallOption, MediaConnection, Peer } from 'peerjs'

type MediaStatus = 'active' | 'inactive' | 'calling' | 'waiting'

export class SimplePeerMedia {
  #peer: Peer

  status: MediaStatus
  #rmMediaConnection: MediaConnection | null
  #lcMediaConnection: MediaConnection | null
  #lcMediaStream: MediaStream | null
  #callingTimeout: NodeJS.Timeout | null
  #callingTimeoutMs: number

  constructor(peer: Peer) {
    this.#peer = peer

    this.status = 'inactive'
    this.#rmMediaConnection = null
    this.#lcMediaConnection = null
    this.#lcMediaStream = null
    this.#callingTimeout = null
    this.#callingTimeoutMs = 10000
  }

  async startCall(rmPeerId: Peer['id'], rmVideoEl: HTMLVideoElement, opts?: CallOption) {
    this.#lcMediaStream = await this.#getUserMedia()

    this.#lcMediaConnection = this.#peer.call(rmPeerId, this.#lcMediaStream, opts)

    this.status = 'waiting'

    if (this.#callingTimeout) {
      clearTimeout(this.#callingTimeout)
      this.#callingTimeout = null
    }
    this.#callingTimeout = setTimeout(() => {
      this.status = 'inactive'
      this.#clearUserMedia()
    }, this.#callingTimeoutMs)

    this.#lcMediaConnection.on('stream', (stream) => {
      this.status = 'active'
      rmVideoEl.srcObject = stream
    })

    this.#lcMediaConnection.on('close', () => {
      this.#clearUserMedia()
      this.status = 'inactive'
      rmVideoEl.srcObject = null
    })
  }

  onCall(rmVideoEl: HTMLVideoElement) {
    this.#peer.on('call', (call) => {
      this.#rmMediaConnection = call

      this.status = 'calling'

      if (this.#callingTimeout) {
        clearTimeout(this.#callingTimeout)
        this.#callingTimeout = null
      }
      this.#callingTimeout = setTimeout(() => {
        this.status = 'inactive'
        this.#clearUserMedia()
      }, this.#callingTimeoutMs)

      this.#rmMediaConnection.on('stream', (stream) => {
        this.status = 'active'
        rmVideoEl.srcObject = stream
      })

      this.#rmMediaConnection.on('close', () => {
        this.#clearUserMedia()
        this.status = 'inactive'
        rmVideoEl.srcObject = null
      })
    })
  }

  endCall() {
    this.#lcMediaConnection?.close()
    this.#rmMediaConnection?.close()
    this.#clearUserMedia()
    //* Maybe set media to inactive
  }

  async acceptCall() {
    this.#lcMediaStream = await this.#getUserMedia()
    this.#rmMediaConnection?.answer(this.#lcMediaStream)
    //* Maybe set media to active
  }

  declineCall() {
    this.#lcMediaConnection?.close()
    this.#rmMediaConnection?.close()
    this.status = 'inactive'
  }

  #getUserMedia() {
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

  #clearUserMedia() {
    this.#lcMediaStream?.getTracks().forEach((track) => {
      if (track.readyState === 'live') {
        track.stop()
      }
    })
  }
}
