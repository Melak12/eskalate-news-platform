import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Run daily at midnight GMT
  async handleDailySummaries() {
    this.logger.debug('Running daily analytics aggregation...');

    try {
      const now = new Date();
      // Calculate "Yesterday" in UTC.
      // We explicitly subtract 24 hours from the current UTC time.
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const year = yesterday.getUTCFullYear();
      const month = yesterday.getUTCMonth();
      const day = yesterday.getUTCDate();

      // Range: Yesterday 00:00:00 to 23:59:59.999 UTC
      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      
      // Target Date for DailyAnalytics (Just the date part, time 00:00:00 UTC)
      const analyticsDate = new Date(Date.UTC(year, month, day));

      this.logger.debug(`Aggregating reads for ${analyticsDate.toISOString().split('T')[0]}`);

      // 1. Group ReadLogs by ArticleId for Yesterday
      // We also group by date(readAt) effectively by filtering within the range
      const aggregatedReads = await this.prisma.readLog.groupBy({
        by: ['articleId'],
        where: {
          readAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _count: {
          articleId: true,
        },
      });

      this.logger.debug(`Found ${aggregatedReads.length} articles with reads yesterday.`);

      // 2. Batch Update/Upsert DailyAnalytics
      for (const record of aggregatedReads) {
        const count = record._count.articleId;
        
        // Use upsert to be idempotent. If job runs twice, it just resets to correct count.
        await this.prisma.dailyAnalytics.upsert({
          where: {
            articleId_date: {
              articleId: record.articleId,
              date: analyticsDate,
            },
          },
          update: {
            viewCount: count,
          },
          create: {
            articleId: record.articleId,
            date: analyticsDate,
            viewCount: count,
          },
        });
      }

      this.logger.debug('Daily analytics aggregation complete.');
    } catch (error) {
      this.logger.error('Failed to run daily analytics aggregation', error);
    }
  }
}
