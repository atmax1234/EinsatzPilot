import 'reflect-metadata';
import 'dotenv/config';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request, Response, NextFunction } from 'express';

import { AuthContextService } from './auth/auth-context.service';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  const authContextService = app.get(AuthContextService);

  app.use(async (request: Request, _response: Response, next: NextFunction) => {
    try {
      request.authContext = await authContextService.buildAuthContext(request);
      next();
    } catch (error) {
      next(error);
    }
  });

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  Logger.log(`API listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap().catch((error) => {
  Logger.error(error, 'Bootstrap');
  process.exit(1);
});
