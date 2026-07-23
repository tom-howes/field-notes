import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.use(helmet())
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  app.enableCors({
    origin: config.getOrThrow('WEB_APP_URL'),
    credentials: true,
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Field Notes API')
    .setDescription('Music geography guessing game API')
    .setVersion('0.1')
    .addCookieAuth('session', {
      type: 'apiKey',
      in: 'cookie',
      name: 'session',
      description: 'Set by GET /auth/spotify/callback after a successful Spotify OAuth login',
    })
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document)

  // Explicit 0.0.0.0 rather than relying on the default host resolution — inside
  // an Alpine container that default has been observed to bind loopback-only,
  // which Docker's port publishing (arriving via the container's eth0, not
  // loopback) can't reach.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}
bootstrap()
