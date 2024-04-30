import type { DataConnection } from 'peerjs'
import { useNuxtApp, ref, onUnmounted } from '#imports'

/**
 * Send and receive data with WebRTC
 * @param label unique key by which you want to identify this data connection.
 */
export function usePeerjsData(label: string) {
  let lcDataConnection: DataConnection | null = null
  let interval: NodeJS.Timeout | null = null
  const rmPeerConnected = ref(false)
  const dataReceived = ref()

  const { $peerjs } = useNuxtApp()

  $peerjs.peer?.on('connection', (conn) => {
    if (conn.label === label) {
      lcDataConnection = conn
    }
  })

  function connect(rmPeerId: string) {
    const rmDataConnection = $peerjs.peer?.connect(rmPeerId, {
      label,
    })
    rmDataConnection?.on('open', () => {
      rmPeerConnected.value = true
      rmDataConnection.on('data', (data) => {
        dataReceived.value = data
      })
    })
    rmDataConnection?.on('close', () => {
      rmPeerConnected.value = false
    })

    if (import.meta.client) {
      interval = setInterval(() => {
        if ($peerjs.connected.value && !rmPeerConnected.value) {
          connect(rmPeerId)
        }
      }, 1000)
    }
  }

  onUnmounted(() => {
    lcDataConnection?.close()
    if (interval) {
      clearInterval(interval)
    }
  })

  async function send(data: unknown) {
    await lcDataConnection?.send(data)
  }

  return { send, connect, dataReceived, rmPeerConnected }
}
