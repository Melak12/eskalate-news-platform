import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@core/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import { BaseResponse } from '@common/interfaces/response.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<BaseResponse<any>> {
    // Check for existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await argon2.hash(dto.password);

    // Create user
    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      },
    });

    // Remove password from response
    const { password, ...result } = newUser;

    return {
      Success: true,
      Message: 'User created successfully',
      Object: result,
      Errors: null,
    };
  }

  async login(dto: LoginDto): Promise<BaseResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.password, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;

    return {
      Success: true,
      Message: 'Login successful',
      Object: {
        user: result,
        token,
      },
      Errors: null,
    };
  }
}
