import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ENV } from 'varlock/env'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  console.log('🔒 CORS Origin:', ENV.CORS_ORIGIN)

  // allows svelte to call client-side
  app.enableCors({
    origin: ENV.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // required if you're sending cookies or auth headers
  })

  const config = new DocumentBuilder()
    .setTitle('Albumz')
    .setDescription('The albumz API')
    .setVersion('1.0')
    // .addTag('albumz')
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/swagger', app, documentFactory)

  await app.listen(ENV.PORT ? String(ENV.PORT) : '3000')
}
bootstrap()
