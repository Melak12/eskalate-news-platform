import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { BaseResponse } from '@common/interfaces/response.interface';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

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

  async findMyArticles(userId: string): Promise<BaseResponse<any>> {
    const articles = await this.prisma.article.findMany({
      where: {
        authorId: userId,
        deletedAt: null, // Ensure we only get non-deleted articles
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      Success: true,
      Message: 'Articles retrieved successfully',
      Object: articles,
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
}
