import { Test, TestingModule } from '@nestjs/testing';
import { ArticleController } from '../../../src/modules/article/article.controller';
import { ArticleService } from '../../../src/modules/article/article.service';
import { CreateArticleDto } from '../../../src/modules/article/dto/create-article.dto';
import { BaseResponse } from '../../../src/common/interfaces/response.interface';

const mockArticleService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findMyArticles: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  restore: jest.fn(),
};

describe('ArticleController', () => {
  let controller: ArticleController;
  let service: typeof mockArticleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: mockArticleService,
        },
      ],
    }).compile();

    controller = module.get<ArticleController>(ArticleController);
    service = module.get(ArticleService);
  });

  describe('create', () => {
    it('should create an article', async () => {
      const dto: CreateArticleDto = { title: 'T', content: 'C', category: 'Cat' };
      const req = { user: { sub: 'user-1' } };
      const response: BaseResponse<any> = { Success: true, Message: 'Created', Object: { id: '1' }, Errors: null };
      
      service.create.mockResolvedValue(response);

      expect(await controller.create(req, dto)).toBe(response);
      expect(service.create).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('restore', () => {
    it('should restore an article', async () => {
      const id = '1';
      const req = { user: { sub: 'user-1' } };
      const response: BaseResponse<any> = { Success: true, Message: 'Restored', Object: { id: '1' }, Errors: null };

      service.restore.mockResolvedValue(response);

      expect(await controller.restore(req, id)).toBe(response);
      expect(service.restore).toHaveBeenCalledWith('user-1', id);
    });
  });

  describe('findOne', () => {
    it('should find an article with IP and UserAgent', async () => {
      const id = '1';
      const req = { 
          user: { sub: 'user-1' }, 
          ip: '127.0.0.1', 
          headers: { 'user-agent': 'Mozilla' } 
      };
      
      const response: BaseResponse<any> = { Success: true, Message: 'Found', Object: { id: '1' }, Errors: null };

      service.findOne.mockResolvedValue(response);

      expect(await controller.findOne(req, id)).toBe(response);
      expect(service.findOne).toHaveBeenCalledWith('1', 'user-1', '127.0.0.1', 'Mozilla');
    });
  });
});
