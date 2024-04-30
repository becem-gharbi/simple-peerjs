import { useNuxtApp, ref, onUnmounted } from '#imports'

/**
 * Send and receive data with WebRTC
 * @param label unique key by which you want to identify this data connection.
 */
export function usePeerjsData(label: string) {
  const connectIntervalMs = 5000

  const { $peerjs } = useNuxtApp()

  let lcDataConnection = $peerjs.connections.find(conn => conn.label === label)
  let connectInterval: NodeJS.Timeout | null = null

  const rmPeerConnected = ref(false)
  const dataReceived = ref()

  $peerjs.peer?.on('connection', (conn) => {
    if (conn.label === label) {
      lcDataConnection = conn
    }
  })

  function connect(rmPeerId: string) {
    if (import.meta.server) {
      return
    }

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
      const idx = $peerjs.connections.findIndex(conn => conn.label === label)
      if (idx >= 0) {
        $peerjs.connections.splice(idx, 1)
      }
    })

    connectInterval = setInterval(() => {
      if ($peerjs.connected.value && !rmPeerConnected.value) {
        connect(rmPeerId)
      }
    }, connectIntervalMs)
  }

  onUnmounted(() => {
    if (connectInterval) {
      clearInterval(connectInterval)
    }
    lcDataConnection?.close()
  })

  async function send(data: unknown) {
    await lcDataConnection?.send(data)
  }

  return { send, connect, dataReceived, rmPeerConnected }
}
