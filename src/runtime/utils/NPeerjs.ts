import type { PeerConnectOption, CallOption, DataConnection, MediaConnection, Peer } from 'peerjs'
import { useState } from '#imports'
import type { Ref } from '#imports'

type Connection = 'online' | 'offline'
type Media = 'active' | 'inactive' | 'calling' | 'waiting'
type Data = object | string

export class NPeer {
  id: string
  static peer: Peer

  connection: Ref<Connection>
  #rmDataConnection: DataConnection | null
  #lcDataConnection: DataConnection | null

  static media: Ref<Media>
  static #rmMediaConnection: MediaConnection | null
  static #lcMediaConnection: MediaConnection | null
  static #lcMediaStream: MediaStream | null

  constructor(peer: Peer, id: string) {
    this.id = id
    NPeer.peer = peer

    this.connection = useState<Connection>(`peer:${id}:connection`, () => 'offline')
    this.#rmDataConnection = null
    this.#lcDataConnection = null

    NPeer.media = useState<Media>(`peer:media`, () => 'inactive')
    NPeer.#rmMediaConnection = null
    NPeer.#lcMediaConnection = null
    NPeer.#lcMediaStream = null
  }

  connect(opts?: PeerConnectOption) { }
  disconnect() { }
  sendData(data: Data) { }
  onData(cb: (data: Data) => void) {}

  startCall(rmVideoEl: HTMLVideoElement, opts?: CallOption) { }
  static onCall(rmVideoEl: HTMLVideoElement, cb: () => void) {}
  static endCall() { }
  static acceptCall() { }
  static declineCall() { }
}
