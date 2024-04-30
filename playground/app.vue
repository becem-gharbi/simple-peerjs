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
    <hr>

    <h4>Streaming: {{ streaming }}</h4>
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
    />
  </div>
</template>

<script setup lang="ts">
import { useNuxtApp, ref, usePeerjsData, usePeerjsMedia } from '#imports'

const { $peerjs } = useNuxtApp()
const rmPeerId = ref()
const { connect, rmPeerConnected, dataReceived, send } = usePeerjsData('connection 1')
const message = ref()
const { call, answer, end, streaming, calling } = usePeerjsMedia('stream')
</script>
