import type { CallOption, MediaConnection, Peer } from 'peerjs'

type MediaStatus = 'active' | 'inactive' | 'calling' | 'waiting'

export interface SimplePeerMediaOptions {
  rmVideoElId: string
  lcVideoElId: string
  callingTimeoutMs: number
  onStatusChange: (status: MediaStatus) => Promise<void> | void
}

export class SimplePeerMedia {
  status: MediaStatus
  constraints?: MediaStreamConstraints
  #peer: Peer
  #rmMediaConnection: MediaConnection | null
  #lcMediaConnection: MediaConnection | null
  #lcMediaStream: MediaStream | null
  #callingTimeout: NodeJS.Timeout | null
  #options: SimplePeerMediaOptions

  constructor(peer: Peer, opts: SimplePeerMediaOptions) {
    this.status = 'inactive'
    this.constraints = {
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
    }

    this.#peer = peer
    this.#rmMediaConnection = null
    this.#lcMediaConnection = null
    this.#lcMediaStream = null
    this.#callingTimeout = null
    this.#options = opts
  }

  async startCall(rmPeerId: Peer['id'], opts?: CallOption) {
    this.#lcMediaStream = await this.#getUserMedia()

    this.#lcMediaConnection = this.#peer.call(rmPeerId, this.#lcMediaStream, opts)

    this.#changeStatus('waiting')
    this.#clearCallingTimeout()
    this.#setCallingTimeout()

    this.#lcMediaConnection.on('stream', (stream) => {
      this.#changeStatus('active')
      this.#clearCallingTimeout()
      this.#renderVideo(this.#options.rmVideoElId, stream)
    })

    this.#lcMediaConnection.on('close', () => {
      this.#changeStatus('inactive')
      this.#clearCallingTimeout()
      this.#clearUserMedia()
      this.#renderVideo(this.#options.rmVideoElId, null)
    })
  }

  onCall(mediaConnection: MediaConnection) {
    this.#rmMediaConnection = mediaConnection

    this.#changeStatus('calling')
    this.#clearCallingTimeout()
    this.#setCallingTimeout()

    this.#rmMediaConnection.on('stream', (stream) => {
      this.#changeStatus('active')
      this.#clearCallingTimeout()
      this.#renderVideo(this.#options.rmVideoElId, stream)
    })

    this.#rmMediaConnection.on('close', () => {
      this.#changeStatus('inactive')
      this.#clearCallingTimeout()
      this.#clearUserMedia()
      this.#renderVideo(this.#options.rmVideoElId, null)
    })
  }

  endCall() {
    this.#lcMediaConnection?.close()
    this.#rmMediaConnection?.close()
    this.#changeStatus('inactive')
  }

  async acceptCall() {
    this.#lcMediaStream = await this.#getUserMedia()
    this.#rmMediaConnection?.answer(this.#lcMediaStream)
    //* Maybe set media to active
  }

  #changeStatus(status: MediaStatus) {
    this.status = status
    this.#options.onStatusChange(status)
  }

  async #getUserMedia() {
    const stream = await navigator.mediaDevices.getUserMedia(this.constraints)
    this.#renderVideo(this.#options.lcVideoElId, stream)
    return stream
  }

  #clearUserMedia() {
    this.#renderVideo(this.#options.lcVideoElId, null)
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
      this.#options.onStatusChange('inactive')
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
