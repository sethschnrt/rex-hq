import { defineConfig } from 'vite';

export default defineConfig({
  base: '/rex-hq/',
  server: {
    host: true,
    port: 5175,
  },
  build: {
    target: 'esnext',
  },
});
