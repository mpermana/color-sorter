import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    target: 'es2020'
  },
  server: {
    allowedHosts: ['ryzen.tenk.co', 'color-sorter'],
    port: 5174,
    open: true
  }
})
