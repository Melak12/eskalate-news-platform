import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesFilterDto } from './dto/get-articles-filter.dto';
import { GetMyArticlesFilterDto } from './dto/get-my-articles-filter.dto';
import { BaseResponse, PaginatedResponse } from '../../common/interfaces/response.interface';
import { Prisma } from '../../../prisma/generated/client';
import { ArticleReadEvent } from './events/article-read.event';

@Injectable()
export class ArticleService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateArticleDto): Promise<BaseResponse<any>> {
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category,
        authorId: userId,
        status: 'DRAFT', // Default status
      },
    });

    return {
      Success: true,
      Message: 'Article created successfully',
      Object: article,
      Errors: null,
    };
  }

  async findMyArticles(userId: string, filter?: GetMyArticlesFilterDto): Promise<PaginatedResponse<any>> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const includeDeleted = filter?.includeDeleted || false;
    const skip = (page - 1) * limit;

    const where: any = {
      authorId: userId,
    };

    if (includeDeleted) {
      // Pass deletedAt: undefined explicitly.
      // The 'in' operator in our PrismaService extension will see the key exists, so it won't inject 'deletedAt: null'.
      // Prisma itself treats an undefined filter value as "no filter", fetching all records.
      where.deletedAt = undefined; 
    } else {
      // Default behavior (handled by extension or explicit null)
      where.deletedAt = null;
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      Success: true,
      Message: 'Articles retrieved successfully',
      Object: articles,
      PageNumber: page,
      PageSize: limit,
      TotalSize: total,
      Errors: null,
    };
  }

  async update(userId: string, articleId: string, dto: UpdateArticleDto): Promise<BaseResponse<any>> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to edit this article');
    }

    const updatedArticle = await this.prisma.article.update({
      where: { id: articleId },
      data: dto,
    });

    return {
      Success: true,
      Message: 'Article updated successfully',
      Object: updatedArticle,
      Errors: null,
    };
  }

  async remove(userId: string, articleId: string): Promise<BaseResponse<any>> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this article');
    }

    // Soft delete
    await this.prisma.article.update({
      where: { id: articleId },
      data: { deletedAt: new Date() },
    });

    return {
      Success: true,
      Message: 'Article deleted successfully',
      Object: null,
      Errors: null,
    };
  }

  async restore(userId: string, articleId: string): Promise<BaseResponse<any>> {
    // We must check if the article exists even if it is deleted.
    // By default, our Prisma global extension filters out deleted items.
    // We need to bypass that filter here.
    // We can do this by using a raw query or by adjusting the query
    // to act as if we are looking for deleted items, similar to findMyArticles logic.
    // Or we can use findFirst with explicit deletedAt check that involves "not null" or "undefined bypass".
    
    // However, findUnique relies on the extension too.
    // Let's us findFirst and signal we want deleted items too.
    
    // Actually, based on our Prisma extension logic:
    // If we pass `deletedAt` in where clause, we can control it.
    // To find a specific ID regardless of deleted status:
    const article = await this.prisma.article.findFirst({
        where: { 
            id: articleId,
            // Pass empty filter to bypass default null injection validation
            deletedAt: {} 
        }
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to restore this article');
    }

    // We must ensure that the update operation also hits the deleted record.
    // Standard update might filter by deletedAt=null again due to global extension.
    // However, delete/update/updateMany in our extension explicitly set deletedAt.
    // For standard update, we need to verify if the where clause is intercepted.
    
    // wait, our global extension for 'query' intercepts 'findFirst', 'findMany', 'findUnique'.
    // It DOES NOT intercept 'update' for READ filtering, but might if 'update' uses 'where'.
    
    // Actually, Prisma extensions usually apply to top-level methods.
    // If we use `prisma.article.update`, standard client behavior applies unless we extended it.
    // Let's check prisma.service.ts again.
    
    // To be safe, let's explicitly include deletedAt in the where clause of the update too 
    // to match the specific record if needed, OR just rely on ID if update isn't filtered.
    
    // UPDATE: The error was in finding it FIRST.
    // Once found (above), we can restore it.
    
    const restoredArticle = await this.prisma.article.update({
      where: { 
        id: articleId,
        // Match regardless of current state to ensure update finds it
        deletedAt: {} 
      },
      data: { deletedAt: null },
    });

    return {
      Success: true,
      Message: 'Article restored successfully',
      Object: restoredArticle,
      Errors: null,
    };
  }

  async findAll(filter: GetArticlesFilterDto): Promise<PaginatedResponse<any>> {
    const { page, limit, category, author, q } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ArticleWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
    };

    if (category) {
      where.category = category;
    }

    if (author) {
      where.author = {
        name: {
          contains: author,
          mode: 'insensitive',
        },
      };
    }

    if (q) {
      where.title = {
        contains: q,
        mode: 'insensitive',
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      Success: true,
      Message: 'Articles retrieved successfully',
      Object: articles,
      PageNumber: page,
      PageSize: limit,
      TotalSize: total,
      Errors: null,
    };
  }

  async findOne(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<BaseResponse<any>> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!article || article.deletedAt) {
      return {
        Success: false,
        Message: 'News article no longer available',
        Object: null,
        Errors: ['Article not found or deleted'],
      };
    }

    // Trigger read event (fire and forget)
    this.eventEmitter.emit(
      'article.read',
      new ArticleReadEvent(id, userId, ipAddress, userAgent)
    );

    return {
      Success: true,
      Message: 'Article retrieved successfully',
      Object: article,
      Errors: null,
    };
  }
}
