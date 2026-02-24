import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import * as argon2 from 'argon2';
import { BaseResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
}
