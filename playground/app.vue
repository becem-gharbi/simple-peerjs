<template>
  <div>
    <h4>Local Peer ID: {{ $peerjs.lcPeerId }}</h4>
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
    <button @click="$peerjs.removePeerData(rmPeerId)">
      End
    </button>
    <h4>Data received: {{ reception }}</h4>
    <hr>

    <h4>Status: {{ status }}</h4>
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
    <h4>Remote</h4>
    <video
      id="peerjs-rm-video"
      autoplay
    />
    <h4>Local</h4>
    <video
      id="peerjs-lc-video"
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
const status = ref('offline')

let nPeer: SimplePeerData | null = null

$peerjs.hooks.hook('data:received', (id, data) => {
  reception.value = data
})

$peerjs.hooks.hook('media:status', (s) => {
  status.value = s
})

function add(id: string) {
  nPeer = $peerjs.addPeerData(id, { metadata: { from: id } })

  setInterval(() => rmPeerConnected.value = nPeer!.connected, 1000)
}
</script>
