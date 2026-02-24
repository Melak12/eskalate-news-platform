import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuthorDashboardQueryDto } from './dto/author-dashboard-query.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class AuthorService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(
    userId: string,
    query: AuthorDashboardQueryDto,
  ): Promise<PaginatedResponse<any>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      authorId: userId,
      deletedAt: null,
    };

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          status: true,
          dailyAnalytics: {
            select: {
              viewCount: true,
            },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    const items = articles.map((article) => {
      const totalViews = article.dailyAnalytics.reduce(
        (sum, analytics) => sum + analytics.viewCount,
        0,
      );

      // Remove dailyAnalytics from final object to keep response clean
      const { dailyAnalytics, ...rest } = article;
      
      return {
        ...rest,
        totalViews,
      };
    });

    return {
      Success: true,
      Message: 'Author dashboard retrieved successfully',
      Object: items,
      PageNumber: page,
      PageSize: limit,
      TotalSize: total,
      Errors: null,
    };
  }
}
