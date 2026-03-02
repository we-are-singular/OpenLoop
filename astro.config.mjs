// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough'
  }),
  integrations: [react()],
  devToolbar: {
    enabled: false
  },
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'react-dom-edge-build-only',
        config(_, { command }) {
          if (command === 'build') {
            return {
              resolve: {
                alias: { 'react-dom/server': 'react-dom/server.edge' }
              }
            };
          }
        }
      }
    ]
  }
});
