<template>
  <div>
    <client-only>
      <h3> Connected to server: {{ $peerjs.connected }}</h3>
      <hr>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { useNuxtApp } from '#imports'

const { $peerjs } = useNuxtApp()
</script>
