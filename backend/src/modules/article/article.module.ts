import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { AuthModule } from '../auth/auth.module';
import { ArticleEventListener } from './article.listener';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleEventListener],
})
export class ArticleModule {}
