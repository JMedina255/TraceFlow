import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { loadConfig } from './config/configuration.js';

async function bootstrap() {
  const logger = new Logger('TraceFlowBootstrap');
  const config = loadConfig();

  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Prefijo unificado para API REST v1
  app.setGlobalPrefix('api/v1');

  // Middleware de Cookies para Sesiones Opacas (ADR-006)
  app.use(cookieParser());

  // CORS con credenciales permitidas
  app.enableCors({
    origin: config.corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-Token'],
  });

  // Validación declarativa global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Filtro global de excepciones sin fugas de secretos ni SQL
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(config.port);
  logger.log(`TraceFlow Backend Monolito Modular activo en puerto: ${config.port}`);
  logger.log(`Entorno: ${config.nodeEnv} | CORS autorizado para: ${config.corsOrigin}`);
}

bootstrap().catch((err) => {
  console.error('Fallo fatal al inicializar TraceFlow Backend:', err);
  process.exit(1);
});
