import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readConfig } from './config';
import helmet from 'helmet';
import { ApiLogger } from './logger';
import { isAllowedMutation } from './security';
import cookieParser from 'cookie-parser';
import express from 'express';
import { BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';
import { rateLimit } from './rate-limit';
import type { Request, Response, NextFunction } from 'express';
async function bootstrap() {
  const config = readConfig();
  const app = await NestFactory.create(AppModule, { bodyParser: true, logger: new ApiLogger() });
  if (config.TRUST_PROXY_HOPS)
    app.getHttpAdapter().getInstance().set('trust proxy', config.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json({ limit: '64kb' }));
  app.enableCors({ origin: config.WEB_ORIGIN, credentials: true });
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (!isAllowedMutation(req, config.WEB_ORIGIN))
      return next(new BadRequestException('Invalid request origin'));
    next();
  });
  const redis = new Redis(config.REDIS_URL, { maxRetriesPerRequest: 1 });
  app.use(rateLimit(redis));
  await app.listen(config.API_PORT, '0.0.0.0');
}
bootstrap();
