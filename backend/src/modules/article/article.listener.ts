import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { ArticleReadEvent } from './events/article-read.event';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class ArticleEventListener {
  private readonly logger = new Logger(ArticleEventListener.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('article.read')
  async handleArticleReadEvent(event: ArticleReadEvent) {
    try {
      this.logger.debug(
        `Received read event for article ${event.articleId} by user ${event.userId || 'Guest'}`,
      );

      // 1. Create ReadLog immediately for audit trail
      // Analytics aggregation is now handled by a nightly cron job.
      await this.prisma.readLog.create({
        data: {
          articleId: event.articleId,
          readerId: event.userId || null,
        },
      });
      
    } catch (error: any) {
      this.logger.error(
        `Failed to process read event for article ${event.articleId}`,
        error.stack,
      );
    }
  }
}
