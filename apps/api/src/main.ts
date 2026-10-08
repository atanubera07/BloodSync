import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readConfig } from './config';
import helmet from 'helmet';
import { ApiLogger } from './logger';
import { isAllowedMutation } from './security';
import cookieParser from 'cookie-parser';
import { BadRequestException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
async function bootstrap() {
  const config = readConfig();
  const app = await NestFactory.create(AppModule, { bodyParser: true, logger: new ApiLogger() });
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: config.WEB_ORIGIN, credentials: true });
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (!isAllowedMutation(req, config.WEB_ORIGIN))
      return next(new BadRequestException('Invalid request origin'));
    next();
  });
  const attempts = new Map<string, { count: number; reset: number }>();
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method !== 'POST' ||
      !/^\/auth\/(register|login|refresh|verify-email|password)/.test(req.path)
    )
      return next();
    if (attempts.size > 10_000) {
      const now = Date.now();
      for (const [key, value] of attempts) if (value.reset < now) attempts.delete(key);
      if (attempts.size > 10_000)
        return res.status(503).json({ message: 'Service temporarily busy' });
    }
    const key = `${req.socket.remoteAddress}:${req.path}`;
    const now = Date.now();
    const state = attempts.get(key);
    if (!state || state.reset < now) attempts.set(key, { count: 1, reset: now + 15 * 60_000 });
    else if (++state.count > 10)
      return res.status(429).json({ message: 'Too many attempts. Try again later.' });
    next();
  });
  await app.listen(config.API_PORT, '0.0.0.0');
}
bootstrap();
