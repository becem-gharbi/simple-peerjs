<template>
  <div>
    <h3> Connected to server: {{ !$peerjs.peer?.disconnected }}</h3>
    <h4>Local Peer ID: {{ $peerjs.peer?.id }}</h4>
    <button @click="$peerjs.end()">
      End
    </button>
    <hr>

    <input v-model="rmPeerId">
    <button @click="add(rmPeerId)">
      Connect
    </button>
    <h4>Connected to remote Peer: {{ rmPeerConnected }} </h4>
    <input v-model="message">
    <button @click="nPeer?.sendData(message)">
      Send
    </button>
    <button @click="nPeer?.disconnect()">
      End
    </button>
    <h4>Data received: {{ reception }}</h4>
    <hr>

    <h4>Status: {{ $peerjs.peerMedia?.status }}</h4>
    <input v-model="rmPeerId">
    <button @click="$peerjs.peerMedia?.startCall(rmPeerId, { metadata: { from: rmPeerId } })">
      Call
    </button>
    <button @click="$peerjs.peerMedia?.acceptCall()">
      Answer
    </button>
    <button @click="$peerjs.peerMedia?.endCall()">
      Hang
    </button>
    <br>
    <video
      id="peerjs-rm-video"
      autoplay
    />
  </div>
</template>

<script setup lang="ts">
import type { SimplePeerData } from '../src/runtime/utils'
import { useNuxtApp, ref } from '#imports'

const { $peerjs } = useNuxtApp()
const rmPeerId = ref()
const message = ref()
const reception = ref()
const rmPeerConnected = ref(false)

let nPeer: SimplePeerData | null = null

function add(id: string) {
  nPeer = $peerjs.addPeerData(id)
  nPeer.connect({ metadata: { from: id } })
  nPeer.rmDataConnection?.on('data', (data) => {
    reception.value = data
  })
  nPeer.rmDataConnection?.on('open', () => {
    rmPeerConnected.value = true
  })
  nPeer.rmDataConnection?.on('close', () => {
    rmPeerConnected.value = false
  })
}
</script>
