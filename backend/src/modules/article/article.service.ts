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
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to restore this article');
    }

    const restoredArticle = await this.prisma.article.update({
      where: { id: articleId },
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

  async findOne(id: string, userId?: string): Promise<BaseResponse<any>> {
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
      new ArticleReadEvent(id, userId)
    );

    return {
      Success: true,
      Message: 'Article retrieved successfully',
      Object: article,
      Errors: null,
    };
  }
}
