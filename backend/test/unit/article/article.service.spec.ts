import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from '../../../src/modules/article/article.service';
import { PrismaService } from '../../../src/core/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateArticleDto } from '../../../src/modules/article/dto/create-article.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockPrismaService = {
  article: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const mockEventEmitter = {
  emit: jest.fn(),
};

describe('ArticleService', () => {
  let service: ArticleService;
  let prisma: typeof mockPrismaService;
  let eventEmitter: typeof mockEventEmitter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    prisma = module.get(PrismaService);
    eventEmitter = module.get(EventEmitter2);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an article', async () => {
      const dto: CreateArticleDto = {
        title: 'Test Title',
        content: 'Content',
        category: 'Tech',
      };
      const userId = 'user-1';
      
      const createdArticle = { id: '1', ...dto, authorId: userId, status: 'DRAFT' };
      prisma.article.create.mockResolvedValue(createdArticle);

      const result = await service.create(userId, dto);

      expect(prisma.article.create).toHaveBeenCalledWith({
        data: { ...dto, authorId: userId, status: 'DRAFT' },
      });
      expect(result.Success).toBe(true);
      expect(result.Object).toEqual(createdArticle);
    });
  });

  describe('findMyArticles', () => {
    it('should return paginated articles', async () => {
      const userId = 'user-1';
      const articles = [{ id: '1', title: 'Test' }];
      prisma.article.findMany.mockResolvedValue(articles);
      prisma.article.count.mockResolvedValue(1);

      const result = await service.findMyArticles(userId, { page: 1, limit: 10, includeDeleted: false });

      expect(prisma.article.findMany).toHaveBeenCalled();
      expect(result.Object).toEqual(articles);
      expect(result.TotalSize).toBe(1);
    });

    it('should handle includeDeleted flag', async () => {
      const userId = 'user-1';
      prisma.article.findMany.mockResolvedValue([]);
      prisma.article.count.mockResolvedValue(0);

      await service.findMyArticles(userId, { includeDeleted: true, page: 1, limit: 10 });

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: undefined }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return an article and emit event', async () => {
      const article = { id: '1', title: 'Test', deletedAt: null };
      prisma.article.findUnique.mockResolvedValue(article);

      const result = await service.findOne('1', 'user-1', '127.0.0.1');

      expect(result.Success).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'article.read',
        expect.objectContaining({ articleId: '1', userId: 'user-1', ipAddress: '127.0.0.1' })
      );
    });

    it('should return error if article not found', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      const result = await service.findOne('1', 'user-1');

      expect(result.Success).toBe(false);
      expect(result.Errors).toContain('Article not found or deleted');
    });

    it('should return error if article is deleted', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: '1', deletedAt: new Date() });
  
        const result = await service.findOne('1', 'user-1');
  
        expect(result.Success).toBe(false);
        expect(result.Errors).toContain('Article not found or deleted');
      });
  });

  describe('restore', () => {
    it('should restore a deleted article', async () => {
        const userId = 'user-1';
        const articleId = 'article-1';
        const article = { id: articleId, authorId: userId, deletedAt: new Date() }; // Deleted state

        // findFirst logic in service uses deletedAt: {} to bypass filter
        prisma.article.findFirst.mockResolvedValue(article);
        
        // update returns the restored article
        const restoredArticle = { ...article, deletedAt: null };
        prisma.article.update.mockResolvedValue(restoredArticle);

        const result = await service.restore(userId, articleId);

        expect(prisma.article.findFirst).toHaveBeenCalledWith({
            where: { id: articleId, deletedAt: {} }
        });
        expect(prisma.article.update).toHaveBeenCalledWith({
            where: { id: articleId, deletedAt: {} },
            data: { deletedAt: null }
        });
        expect(result.Success).toBe(true);
        expect(result?.Object?.deletedAt).toBeNull();
    });

    it('should throw NotFoundException if article doesn\'t exist', async () => {
        prisma.article.findFirst.mockResolvedValue(null);

        await expect(service.restore('user-1', '999')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author', async () => {
        const article = { id: '1', authorId: 'other-user', deletedAt: new Date() };
        prisma.article.findFirst.mockResolvedValue(article);

        await expect(service.restore('user-1', '1')).rejects.toThrow(ForbiddenException);
    });
  });
});
