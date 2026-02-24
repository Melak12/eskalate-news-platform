import { Test, TestingModule } from '@nestjs/testing';
import { AuthorController } from '../../../src/modules/author/author.controller';
import { AuthorService } from '../../../src/modules/author/author.service';
import { AuthorDashboardQueryDto } from '../../../src/modules/author/dto/author-dashboard-query.dto';
import { PaginatedResponse } from '../../../src/common/interfaces/response.interface';

const mockAuthorService = {
  getDashboard: jest.fn(),
};

describe('AuthorController', () => {
  let controller: AuthorController;
  let service: typeof mockAuthorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorController],
      providers: [
        {
          provide: AuthorService,
          useValue: mockAuthorService,
        },
      ],
    }).compile();

    controller = module.get<AuthorController>(AuthorController);
    service = module.get(AuthorService);
    service.getDashboard.mockClear();
  });

  describe('getDashboard', () => {
    it('should return paginated author dashboard data', async () => {
      const query: AuthorDashboardQueryDto = { page: 1, limit: 10 };
      const req = { user: { sub: 'user-1' } };

      const response: PaginatedResponse<any> = {
        Success: true,
        Message: 'Dashboard',
        Object: [],
        PageNumber: 1,
        PageSize: 10,
        TotalSize: 0,
        Errors: null,
      };

      service.getDashboard.mockResolvedValue(response);

      const result = await controller.getDashboard(req, query);

      expect(result).toBe(response);
      expect(service.getDashboard).toHaveBeenCalledWith('user-1', query);
    });
  });
});
