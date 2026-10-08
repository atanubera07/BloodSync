import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config';
import helmet from 'helmet';
import { ApiLogger } from './logger';
import { isAllowedMutation } from './security';
import cookieParser from 'cookie-parser';
import express from 'express';
import { BadRequestException, RequestMethod } from '@nestjs/common';
import { rateLimit } from './rate-limit';
import { RateLimitRedis } from './rate-limit-redis';
import { installOpenApi } from './openapi';
import type { Request, Response, NextFunction } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true, logger: new ApiLogger() });
  const config = app.get(ConfigService).values;
  app.setGlobalPrefix(config.VERCEL ? 'api/v1' : 'v1', {
    exclude: ['health', 'health/live', 'health/ready']
      .map((path) => ({
        path,
        method: RequestMethod.GET,
      }))
      .concat([{ path: 'internal/account-email', method: RequestMethod.POST }]),
  });
  installOpenApi(app);
  app.enableShutdownHooks();
  if (config.NODE_ENV === 'production' && config.TRUST_PROXY_HOPS === 0)
    new ApiLogger().warn('TRUST_PROXY_HOPS is 0 in production; verify the hosting proxy topology');
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
  app.use(rateLimit(app.get(RateLimitRedis).client));
  await app.listen(process.env.PORT ? Number(process.env.PORT) : config.API_PORT, '0.0.0.0');
}
bootstrap().catch((error) => {
  new ApiLogger().error(error);
  process.exit(1);
});
