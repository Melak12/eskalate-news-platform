import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Setup logger
  const logger = new Logger('Bootstrap');

  // Initialize NestJs Application
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1')

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
