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
        `Received read event for article ${event.articleId} by user ${event.userId || 'Guest'} (IP: ${event.ipAddress})`,
      );

      // Debounce logic: Prevent duplicate logs within 10 seconds
      const DEBOUNCE_MS = 10000;
      const threshold = new Date(Date.now() - DEBOUNCE_MS);

      // Build validation query. Prefer ReaderID, fallback to IP.
      // Or check BOTH? If same IP reads again, even diligently logged in/out?
      // "Prevent the same user from refreshing". If I refresh, my IP is same.
      // So filtering by IP is stronger for "refresh spam".
      
      const whereClause: any = {
        articleId: event.articleId,
        readAt: {
          gt: threshold,
        },
      };

      // If we have an IP, use it as primary spam filter (catches both auth & guest loops)
      if (event.ipAddress) {
         whereClause.ipAddress = event.ipAddress;
      } else if (event.userId) {
         // Fallback to userId if IP is missing for some reason
         whereClause.readerId = event.userId;
      }

      // Only perform check if we have identity
      if (whereClause.ipAddress || whereClause.readerId) {
        const existingLog = await this.prisma.readLog.findFirst({
          where: whereClause,
        });

        if (existingLog) {
          this.logger.debug(`Debouncing read event for article ${event.articleId} (Already read in last 10s)`);
          return;
        }
      }

      // 1. Create ReadLog immediately for audit trail
      // Analytics aggregation is now handled by a nightly cron job.
      await this.prisma.readLog.create({
        data: {
          articleId: event.articleId,
          readerId: event.userId || null,
          ipAddress: event.ipAddress || null,
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
