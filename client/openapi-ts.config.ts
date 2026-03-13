import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  // NestJS must be running when you generate
  input: 'http://localhost:3000/api/swagger-json',
  output: {
    path: 'src/lib/api/generated',
    postProcess: ['prettier'],
  },
  // fetch is default
  // plugins: ['@hey-api/client-fetch'],
})
