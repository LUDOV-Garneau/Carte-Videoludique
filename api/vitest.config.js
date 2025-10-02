// api/vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // ⬇️ Très important: inline le module que tu veux mocker
    deps: {
      inline: ['jsonwebtoken'], // ajoute-en d’autres si besoin
    },
  },
})