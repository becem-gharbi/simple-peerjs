import type { SimplePeer } from '../utils'

declare module '#app' {
  interface NuxtApp {
    $peerjs: SimplePeer
  }
}

export interface PublicConfig {
  host: string
  path: string
  port: number
}
