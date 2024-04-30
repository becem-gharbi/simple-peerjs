<template>
  <div>
    <h3> Connected to server: {{ $peerjs.connected }}</h3>
    <h4>Local Peer ID: {{ $peerjs.peer?.id }}</h4>
    <button @click="$peerjs.end()">
      End
    </button>
    <hr>

    <input v-model="rmPeerId">
    <button @click="connect(rmPeerId)">
      Connect
    </button>
    <h4>Connected to remote Peer: {{ rmPeerConnected }} </h4>
    <input v-model="message">
    <button @click="send(message)">
      Send
    </button>
    <h4>Data received: {{ dataReceived }}</h4>
  </div>
</template>

<script setup lang="ts">
import { useNuxtApp, ref, usePeerjsData } from '#imports'

const { $peerjs } = useNuxtApp()
const rmPeerId = ref()
const { connect, rmPeerConnected, dataReceived, send } = usePeerjsData('connection 1')
const message = ref()
</script>
