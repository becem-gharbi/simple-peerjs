import type { MediaConnection } from 'peerjs'
import { onMounted, ref, useNuxtApp, onUnmounted } from '#imports'

export function usePeerjsMedia(videoId: string) {
  let rmMediaConnection: MediaConnection | null = null
  let lcMediaConnection: MediaConnection | null = null
  let lcMediaStream: MediaStream | null = null
  let rmVideo: HTMLVideoElement | null = null

  const calling = ref(false)
  const streaming = ref(false)

  const { $peerjs } = useNuxtApp()

  onMounted(() => {
    rmVideo = document.getElementById(videoId) as HTMLVideoElement
  })

  async function call(rmPeerId: string) {
    lcMediaStream = await getUserMedia()

    lcMediaConnection = $peerjs.peer?.call(rmPeerId, lcMediaStream) ?? null

    calling.value = true

    lcMediaConnection?.on('stream', (stream) => {
      calling.value = false
      streaming.value = true
      if (rmVideo) {
        rmVideo.srcObject = stream
      }
    })

    lcMediaConnection?.on('close', () => {
      stopUserMedia()
      streaming.value = false
      if (rmVideo) {
        rmVideo.srcObject = null
      }
    })
  }

  async function answer() {
    calling.value = false
    lcMediaStream = await getUserMedia()
    rmMediaConnection?.answer(lcMediaStream)
  }

  $peerjs.peer?.on('call', function (call) {
    rmMediaConnection = call

    calling.value = true

    rmMediaConnection.on('stream', (stream) => {
      streaming.value = true
      if (rmVideo) {
        rmVideo.srcObject = stream
      }
    })
    rmMediaConnection.on('close', () => {
      stopUserMedia()
      streaming.value = false
      if (rmVideo) {
        rmVideo.srcObject = null
      }
    })
  })

  function end() {
    calling.value = false
    lcMediaConnection?.close()
    rmMediaConnection?.close()
    stopUserMedia()
  }

  async function getUserMedia() {
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

  function stopUserMedia() {
    lcMediaStream?.getTracks().forEach((track) => {
      if (track.readyState === 'live') {
        track.stop()
      }
    })
  }

  onUnmounted(() => end())

  return { call, answer, end, streaming, calling }
}
