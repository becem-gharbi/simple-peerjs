import type { CallOption, MediaConnection, Peer } from 'peerjs'
import { defu } from 'defu'

type MediaStatus = 'active' | 'inactive' | 'calling' | 'waiting'

interface Options {
  rmVideoElId: string
  callingTimeoutMs?: number
}

export class SimplePeerMedia {
  status: MediaStatus
  #peer: Peer
  #rmMediaConnection: MediaConnection | null
  #lcMediaConnection: MediaConnection | null
  #lcMediaStream: MediaStream | null
  #callingTimeout: NodeJS.Timeout | null
  #options: Options

  constructor(peer: Peer, opts?: Options) {
    this.status = 'inactive'
    this.#peer = peer
    this.#rmMediaConnection = null
    this.#lcMediaConnection = null
    this.#lcMediaStream = null
    this.#callingTimeout = null

    this.#options = defu(opts, {
      rmVideoElId: 'peerjs-rm-video',
      callingTimeoutMs: 10000,
    })
  }

  async startCall(rmPeerId: Peer['id'], opts?: CallOption) {
    this.#lcMediaStream = await this.#getUserMedia()

    this.#lcMediaConnection = this.#peer.call(rmPeerId, this.#lcMediaStream, opts)

    this.status = 'waiting'

    this.#clearCallingTimeout()
    this.#setCallingTimeout()

    this.#lcMediaConnection.on('stream', (stream) => {
      this.status = 'active'
      this.#clearCallingTimeout()
      this.#renderVideo(this.#options.rmVideoElId, stream)
    })

    this.#lcMediaConnection.on('close', () => {
      this.status = 'inactive'
      this.#clearCallingTimeout()
      this.#clearUserMedia()
      this.#renderVideo(this.#options.rmVideoElId, null)
    })
  }

  onCall(mediaConnection: MediaConnection) {
    this.#rmMediaConnection = mediaConnection

    this.status = 'calling'

    this.#clearCallingTimeout()
    this.#setCallingTimeout()

    this.#rmMediaConnection.on('stream', (stream) => {
      this.status = 'active'
      this.#clearCallingTimeout()
      this.#renderVideo(this.#options.rmVideoElId, stream)
    })

    this.#rmMediaConnection.on('close', () => {
      this.status = 'inactive'
      this.#clearCallingTimeout()
      this.#clearUserMedia()
      this.#renderVideo(this.#options.rmVideoElId, null)
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

  #setCallingTimeout() {
    this.#callingTimeout = setTimeout(() => {
      this.status = 'inactive'
      this.#clearUserMedia()
    }, this.#options.callingTimeoutMs)
  }

  #clearCallingTimeout() {
    if (this.#callingTimeout) {
      clearTimeout(this.#callingTimeout)
      this.#callingTimeout = null
    }
  }
}
