import type { MediaConnection } from 'peerjs'
import { onMounted, ref, useNuxtApp, onUnmounted } from '#imports'

export function usePeerjsMedia(videoId: string) {
  let rmMediaConnection: MediaConnection | null = null
  let lcMediaStream: MediaStream | null = null
  let rmVideo: HTMLVideoElement | null = null
  const calling = ref(false)
  const streaming = ref(false)

  const { $peerjs } = useNuxtApp()

  onMounted(() => {
    rmVideo = document.getElementById(videoId) as HTMLVideoElement
  })

  async function call(rmPeerId: string) {
    lcMediaStream = await navigator.mediaDevices.getUserMedia({
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

    const call = $peerjs.peer?.call(rmPeerId, lcMediaStream)

    call?.on('stream', (stream) => {
      streaming.value = true
      if (rmVideo) {
        rmVideo.srcObject = stream
      }
    })

    call?.on('close', () => {
      streaming.value = false
      if (rmVideo) {
        rmVideo.srcObject = null
      }
    })
  }

  async function answer() {
    calling.value = false
    lcMediaStream = await navigator.mediaDevices.getUserMedia({
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
    rmMediaConnection?.answer(lcMediaStream)
  }

  $peerjs.peer?.on('call', function (call) {
    calling.value = true
    rmMediaConnection = call

    call.on('stream', (stream) => {
      streaming.value = true
      if (rmVideo) {
        rmVideo.srcObject = stream
      }
    })
    call.on('close', () => {
      streaming.value = false
      if (rmVideo) {
        rmVideo.srcObject = null
      }
    })
  })

  function end() {
    rmMediaConnection?.close()
  }

  onUnmounted(() => {
    lcMediaStream?.getTracks().forEach((track) => {
      if (track.readyState === 'live') {
        track.stop()
      }
    })
    rmMediaConnection?.removeAllListeners()
    rmMediaConnection?.close()
  })

  return { call, answer, end, streaming, calling }
}
