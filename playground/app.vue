<template>
  <div>
    <h3> Connected to server: {{ $peerjs.connected }}</h3>
    <h4>Local Peer ID: {{ $peerjs.peer?.id }}</h4>
    <button @click="$peerjs.end()">
      End
    </button>
    <hr>

    <input v-model="rmPeerId">
    <button @click="add(rmPeerId)">
      Connect
    </button>
    <h4>Connected to remote Peer: {{ connection }} </h4>
    <input v-model="message">
    <button @click="nPeer?.sendData(message)">
      Send
    </button>
    <button @click="nPeer?.disconnect()">
      End
    </button>
    <h4>Data received: {{ reception }}</h4>
    <hr>

    <!-- <h4>Streaming: {{ streaming }}</h4>
    <h4>Calling: {{ calling }}</h4>
    <input v-model="rmPeerId">
    <button @click="call(rmPeerId)">
      Call
    </button>
    <button @click="answer()">
      Answer
    </button>
    <button @click="end()">
      Hang
    </button>
    <br>
    <video
      id="stream"
      autoplay
    /> -->
  </div>
</template>

<script setup lang="ts">
import type { NPeer } from '../src/runtime/utils/NPeerjs'
import { useNuxtApp, ref } from '#imports'

const { $peerjs } = useNuxtApp()
const rmPeerId = ref()
const message = ref()
const reception = ref()
const connection = ref('offline')

let nPeer: NPeer | null = null

function add(id: string) {
  nPeer = $peerjs.addNPeer(id)
  nPeer.connect()
  nPeer.onDataReceived((data) => {
    reception.value = data
  })
  nPeer.onConnectionChange((conn) => {
    connection.value = conn
  })
}
</script>
