import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'
import { defu } from 'defu'

export interface ModuleOptions {
  host: string
  path: string
  port: number
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@bg-dev/nuxt-peerjs',
    configKey: 'peerjs',
  },

  defaults: {
    host: '0.peerjs.com',
    path: '/',
    port: 443,
  },

  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)

    addPlugin(resolve('./runtime/plugin'))

    _nuxt.options.runtimeConfig = defu(_nuxt.options.runtimeConfig, {
      app: {},
      public: {
        peerjs: {
          host: _options.host,
          path: _options.path,
          port: _options.port,
        },
      },
    })
  },
})
