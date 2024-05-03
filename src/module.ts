import { defineNuxtModule, addPlugin, createResolver, addImportsDir, extendViteConfig } from '@nuxt/kit'
import { defu } from 'defu'
import type { PublicConfig } from './runtime/types'

export interface ModuleOptions extends PublicConfig {}

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

    addPlugin(resolve('./runtime/plugins/index.client'))
    addImportsDir(resolve('./runtime/utils'))
    addImportsDir(resolve('./runtime/composables'))

    extendViteConfig((config) => {
      config.optimizeDeps ||= {}
      config.optimizeDeps.include ||= []
      config.optimizeDeps.include.push('sdp')
    })
  },
})
