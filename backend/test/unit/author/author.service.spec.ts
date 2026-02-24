import { Test, TestingModule } from '@nestjs/testing';
import { AuthorService } from '../../../src/modules/author/author.service';
import { PrismaService } from '../../../src/core/prisma/prisma.service';
import { AuthorDashboardQueryDto } from '../../../src/modules/author/dto/author-dashboard-query.dto';

const mockPrismaService = {
  article: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('AuthorService', () => {
  let service: AuthorService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthorService>(AuthorService);
    prisma = module.get(PrismaService);
    prisma.article.findMany.mockClear();
    prisma.article.count.mockClear();
  });

  it('should return author dashboard with total views', async () => {
    const userId = 'user-1';
    const query: AuthorDashboardQueryDto = { page: 1, limit: 10 };

    const articles = [
      {
        id: '1',
        title: 'Article 1',
        createdAt: new Date(),
        status: 'PUBLISHED',
        dailyAnalytics: [
          { viewCount: 10 },
          { viewCount: 5 },
        ],
      },
      {
        id: '2',
        title: 'Article 2',
        createdAt: new Date(),
        status: 'DRAFT',
        dailyAnalytics: [],
      },
    ];

    prisma.article.findMany.mockResolvedValue(articles);
    prisma.article.count.mockResolvedValue(2);

    const result = await service.getDashboard(userId, query);

    expect(prisma.article.findMany).toHaveBeenCalledWith({
      where: { authorId: userId, deletedAt: null },
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: expect.anything(),
    });

    expect(result.Object).toHaveLength(2);
    expect(result.Object![0].totalViews).toBe(15);
    expect(result.Object![1].totalViews).toBe(0);
    expect(result.Object![0]).not.toHaveProperty('dailyAnalytics');
  });
});
