import type { DataConnection } from 'peerjs'
import { useNuxtApp, ref, onUnmounted } from '#imports'
/**
 * Send and receive data with WebRTC
 * @param label unique key by which you want to identify this data connection.
 */
export function usePeerjsData(label: string) {
  const connectIntervalMs = 5000

  let rmDataConnection: DataConnection | null | undefined = null
  let connectInterval: NodeJS.Timeout | null = null

  const rmPeerConnected = ref(false)
  const dataReceived = ref()
  const { $peerjs } = useNuxtApp()

  function connect(rmPeerId: string) {
    if (import.meta.server) {
      return
    }
    rmDataConnection = $peerjs.peer?.connect(rmPeerId, {
      label,
    })
    rmDataConnection?.on('open', () => {
      rmPeerConnected.value = true
      rmDataConnection?.on('data', (data) => {
        dataReceived.value = data
      })
    })
    rmDataConnection?.on('close', () => {
      rmPeerConnected.value = false
    })

    connectInterval = setInterval(() => {
      if ($peerjs.connected.value && !rmPeerConnected.value) {
        connect(rmPeerId)
      }
    }, connectIntervalMs)
  }

  function end() {
    if (connectInterval) {
      clearInterval(connectInterval)
      connectInterval = null
    }
    $peerjs.connections.get(label)?.close()
    $peerjs.connections.delete(label)
    rmDataConnection?.close()
  }

  async function send(data: unknown) {
    await $peerjs.connections.get(label)?.send(data)
  }

  onUnmounted(() => end())

  return { send, connect, end, dataReceived, rmPeerConnected }
}
