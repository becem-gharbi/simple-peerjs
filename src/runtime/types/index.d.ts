import type { Peer } from 'peerjs'
import type { NPeer } from '../utils/NPeerjs'

declare module '#app' {
  interface NuxtApp {
    $peerjs: {
      peer: Peer | null
      nPeers: Map<string, NPeer>
      connected: Ref<boolean>
      init: (uid: string) => void
      end: () => void
      addNPeer: (id: string) => NPeer | undefined
      removeNPeer: (id: string) => void
    }
  }
}

export interface PublicConfig {
  host: string
  path: string
  port: number
}
