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
        `Processing read for article ${event.articleId} by user ${event.userId || 'Guest'}`,
      );

      // Create ReadLog
      await this.prisma.readLog.create({
        data: {
          articleId: event.articleId,
          readerId: event.userId || null,
        },
      });

      // Update Daily Analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.prisma.dailyAnalytics.upsert({
        where: {
          articleId_date: {
            articleId: event.articleId,
            date: today,
          },
        },
        update: {
          viewCount: {
            increment: 1,
          },
        },
        create: {
          articleId: event.articleId,
          date: today,
          viewCount: 1,
        },
      });
    } catch (error:any) {
      this.logger.error(
        `Failed to process read event for article ${event.articleId}`,
        error.stack,
      );
    }
  }
}
