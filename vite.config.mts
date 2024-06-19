import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      exclude: [
        '**/docs/**',
        '**/src/mocks/**',
      ],
      reporter: ['text', 'json', 'html', 'cobertura'],
    },
    environment: 'jsdom',
    exclude: [
      ...configDefaults.exclude,
      '**/docs/**',
      '**/src/mocks/**',
    ]
  },
})
