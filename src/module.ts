import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@bg-dev/nuxt-peerjs',
    configKey: 'peerjs',
  },

  defaults: {},

  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)

    addPlugin(resolve('./runtime/plugin'))
  },
})
