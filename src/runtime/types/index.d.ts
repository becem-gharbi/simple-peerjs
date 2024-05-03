import type { SimplePeer, SimplePeerOptions } from '../utils'

declare module '#app' {
  interface NuxtApp {
    $peerjs: SimplePeer
  }
}

export interface PublicConfig extends SimplePeerOptions {}
