import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  // Setup logger
  const logger = new Logger('Bootstrap');

  // Initialize NestJs Application
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1'); 

  const config = new DocumentBuilder()
    .setTitle('Eskalate News Platform API')
    .setDescription('The Eskalate News Platform API description')
    .setVersion('1.0')
    .addTag('news')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger UI is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
