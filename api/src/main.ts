import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService)

  // allows svelte to call client-side
  app.enableCors({
    origin: configService.getOrThrow<string>('CORS_ORIGIN'),
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

  await app.listen(process.env.PORT ?? 4000)
}
bootstrap()
