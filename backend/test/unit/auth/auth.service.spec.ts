import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { PrismaService } from '../../../src/core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrismaService;
  let jwt: typeof mockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'AUTHOR' as const,
    };

    it('should create a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      jest.spyOn(argon2, 'hash').mockResolvedValue('hashedPassword');
      prisma.user.create.mockResolvedValue({
        id: 'user-id',
        ...signupDto,
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signup(signupDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: signupDto.email } });
      expect(argon2.hash).toHaveBeenCalledWith(signupDto.password);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.Success).toBe(true);
      expect(result.Object).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      role: 'AUTHOR',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return token on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login(loginDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginDto.email } });
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.password, loginDto.password);
      expect(jwt.signAsync).toHaveBeenCalled();
      expect(result.Success).toBe(true);
      expect(result.Object).toHaveProperty('token', 'jwt-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    const userId = 'user-id';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      role: 'AUTHOR',
    };

    it('should return user details', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result.Success).toBe(true);
      expect(result.Object).toEqual(expect.objectContaining({ email: mockUser.email }));
      expect(result.Object).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe(userId)).rejects.toThrow(UnauthorizedException);
    });
  });
});
