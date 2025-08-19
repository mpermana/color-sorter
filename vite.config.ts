import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: ['ryzen.tenk.co'],
    port: 5174,
    open: true
  },
  build: {
    target: 'es2020'
  }
})
