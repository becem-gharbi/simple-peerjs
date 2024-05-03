import type { CallOption, MediaConnection, Peer } from 'peerjs'
import { defu } from 'defu'

type MediaStatus = 'active' | 'inactive' | 'calling' | 'waiting'

interface Options {
  lcVideoElId?: string
  rmVideoElId: string
}

export class SimplePeerMedia {
  #peer: Peer
  status: MediaStatus
  #rmMediaConnection: MediaConnection | null
  #lcMediaConnection: MediaConnection | null
  #lcMediaStream: MediaStream | null
  #callingTimeout: NodeJS.Timeout | null
  #callingTimeoutMs: number
  #options: Options

  constructor(peer: Peer, opts?: Options) {
    this.#peer = peer
    this.status = 'inactive'
    this.#rmMediaConnection = null
    this.#lcMediaConnection = null
    this.#lcMediaStream = null
    this.#callingTimeout = null
    this.#callingTimeoutMs = 10000

    this.#options = defu(opts, {
      lcVideoElId: 'peerjs-lc-video',
      rmVideoElId: 'peerjs-rm-video',
    })

    this.#listenForCall()
  }

  async startCall(rmPeerId: Peer['id'], opts?: CallOption) {
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
      if (this.#callingTimeout) {
        clearTimeout(this.#callingTimeout)
      }
      this.#renderVideo(this.#options.rmVideoElId, stream)
    })

    this.#lcMediaConnection.on('close', () => {
      this.status = 'inactive'
      if (this.#callingTimeout) {
        clearTimeout(this.#callingTimeout)
      }
      this.#clearUserMedia()
      this.#renderVideo(this.#options.rmVideoElId, null)
    })
  }

  #listenForCall() {
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
        if (this.#callingTimeout) {
          clearTimeout(this.#callingTimeout)
        }
        this.#renderVideo(this.#options.rmVideoElId, stream)
      })

      this.#rmMediaConnection.on('close', () => {
        this.status = 'inactive'
        if (this.#callingTimeout) {
          clearTimeout(this.#callingTimeout)
        }
        this.#clearUserMedia()
        this.#renderVideo(this.#options.rmVideoElId, null)
      })
    })
  }

  endCall() {
    this.#lcMediaConnection?.close()
    this.#rmMediaConnection?.close()
    this.status = 'inactive'
  }

  async acceptCall() {
    this.#lcMediaStream = await this.#getUserMedia()
    this.#rmMediaConnection?.answer(this.#lcMediaStream)
    //* Maybe set media to active
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

  #renderVideo(videoElId: string, stream: MediaStream | null) {
    const videoEl = document.getElementById(videoElId) as HTMLVideoElement
    if (videoEl) {
      videoEl.srcObject = stream
    }
    else {
      throw new Error(`Could not find video element with id ${videoElId}`)
    }
  }
}
