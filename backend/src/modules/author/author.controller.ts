import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthorService } from './author.service';
import { AuthorDashboardQueryDto } from './dto/author-dashboard-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BaseResponse } from '../../common/interfaces/response.interface';
import { Role } from '../../../prisma/generated/client';

@ApiTags('Author')
@Controller('author')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Roles(Role.AUTHOR)
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get author dashboard metrics (Author only)' })
  @ApiResponse({ status: 200, description: 'Return paginated list of articles with total views.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not an author.' })
  getDashboard(
    @Request() req,
    @Query() query: AuthorDashboardQueryDto,
  ): Promise<BaseResponse<any>> {
    return this.authorService.getDashboard(req.user.sub, query);
  }
}
