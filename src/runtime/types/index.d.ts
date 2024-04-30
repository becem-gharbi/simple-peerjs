import type { Peer } from 'peerjs'

declare module '#app' {
  interface NuxtApp {
    $peerjs: {
      init: (uid: string) => void
      end: () => void
      connected: Ref<boolean>
      readonly peer: Peer | null
    }
  }
}

export interface PublicConfig {
  host: string
  path: string
  port: number
}
