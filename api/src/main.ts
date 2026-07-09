// IMPORTANT: Initialize varlock FIRST before any other imports
import { ENV } from './env'

import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './trpc/root'
import { createContext } from './trpc/context'
import { pgPool } from './db/database'

async function main() {
  const server = Fastify({
    logger: true,
    maxParamLength: 5000,
  })

  console.log('🔒 CORS Origin:', ENV.CORS_ORIGIN)

  // Register CORS
  await server.register(cors, {
    origin: ENV.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  // Register JWT
  await server.register(jwt, {
    secret: ENV.JWT_SECRET,
  })

  // Register tRPC
  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  })

  // Health check endpoint
  server.get('/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM']
  signals.forEach((signal) => {
    process.on(signal, () => {
      void (async () => {
        console.log(`Received ${signal}, shutting down gracefully...`)
        await server.close()
        await pgPool.end()
        process.exit(0)
      })()
    })
  })

  // Start server
  const port = ENV.PORT ? Number(ENV.PORT) : 3000
  const host = '0.0.0.0'

  try {
    await server.listen({ port, host })
    console.log(`🚀 Server ready at http://${host}:${port}`)
    console.log(`📡 tRPC endpoint: http://${host}:${port}/trpc`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

void main()
