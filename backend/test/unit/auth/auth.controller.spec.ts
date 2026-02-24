import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { SignupDto } from '../../../src/modules/auth/dto/signup.dto';
import { LoginDto } from '../../../src/modules/auth/dto/login.dto';
import { BaseResponse } from '../../../src/common/interfaces/response.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            login: jest.fn(),
            getMe: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const signupDto: SignupDto = {
        name: 'Test',
        email: 'test@example.com',
        password: 'password',
        role: 'AUTHOR',
      };
      
      const result: BaseResponse<any> = {
        Success: true,
        Message: 'User created successfully',
        Object: { id: '1', ...signupDto },
        Errors: null,
      };

      jest.spyOn(service, 'signup').mockResolvedValue(result);

      expect(await controller.signup(signupDto)).toBe(result);
    });
  });

  describe('login', () => {
    it('should return a token', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      
      const result: BaseResponse<any> = {
        Success: true,
        Message: 'Login successful',
        Object: { user: {}, token: 'jwt-token' },
        Errors: null,
      };

      jest.spyOn(service, 'login').mockResolvedValue(result);

      expect(await controller.login(loginDto)).toBe(result);
    });
  });

  describe('getMe', () => {
    it('should return user details', async () => {
      const req = { user: { sub: 'user-id' } };
      const result: BaseResponse<any> = {
        Success: true,
        Message: 'User retrieved successfully',
        Object: { id: 'user-id', name: 'Test' },
        Errors: null,
      };

      jest.spyOn(service, 'getMe').mockResolvedValue(result);

      expect(await controller.getMe(req)).toBe(result);
    });
  });
});
