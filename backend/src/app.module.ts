import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ArticleModule } from './modules/article/article.module';
import { AuthorModule } from './modules/author/author.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { APP_PIPE, APP_INTERCEPTOR  } from '@nestjs/core';
import { AnalyticsModule } from './core/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ArticleModule,
    AuthorModule,
    AnalyticsModule,
    EventEmitterModule.forRoot({ global: true }),
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_PIPE,
    useClass: ZodValidationPipe,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: ZodSerializerInterceptor,
  }],
})
export class AppModule {}

