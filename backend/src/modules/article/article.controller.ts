import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesFilterDto } from './dto/get-articles-filter.dto';
import { GetMyArticlesFilterDto } from './dto/get-my-articles-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../prisma/generated/client';
import { BaseResponse } from '../../common/interfaces/response.interface';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

@ApiTags('Articles')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get published news feed' })
  @ApiResponse({ status: 200, description: 'Return paginated list of published articles.' })
  findAll(@Query() filterDto: GetArticlesFilterDto): Promise<BaseResponse<any>> {
    return this.articleService.findAll(filterDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.AUTHOR)
  @ApiOperation({ summary: 'List my articles (Authors only)' })
  @ApiResponse({ status: 200, description: 'Return paginated list of articles.' })
  findMyArticles(@Request() req, @Query() filter: GetMyArticlesFilterDto): Promise<BaseResponse<any>> {
    return this.articleService.findMyArticles(req.user.sub, filter);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Read an article' })
  @ApiResponse({ status: 200, description: 'Return article details.' })
  @ApiResponse({ status: 404, description: 'Article not found.' })
  async findOne(@Request() req, @Param('id') id: string): Promise<BaseResponse<any>> {
    const user = req.user;
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.articleService.findOne(id, user?.sub, ip, userAgent);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.AUTHOR)
  @ApiOperation({ summary: 'Create a new article (Author only)' })
  @ApiResponse({ status: 201, description: 'Article created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Request() req, @Body() createArticleDto: CreateArticleDto): Promise<BaseResponse<any>> {
    return this.articleService.create(req.user.sub, createArticleDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.AUTHOR)
  @ApiOperation({ summary: 'Update an article (Author only)' })
  @ApiResponse({ status: 200, description: 'Article updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not the author.' })
  @ApiResponse({ status: 404, description: 'Article not found.' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<BaseResponse<any>> {
    return this.articleService.update(req.user.sub, id, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.AUTHOR)
  @ApiOperation({ summary: 'Soft delete an article (Author only)' })
  @ApiResponse({ status: 200, description: 'Article deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not the author.' })
  @ApiResponse({ status: 404, description: 'Article not found.' })
  remove(@Request() req, @Param('id') id: string): Promise<BaseResponse<any>> {
    return this.articleService.remove(req.user.sub, id);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.AUTHOR)
  @ApiOperation({ summary: 'Restore a soft-deleted article (Author only)' })
  @ApiResponse({ status: 200, description: 'Article restored successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not the author.' })
  @ApiResponse({ status: 404, description: 'Article not found.' })
  restore(@Request() req, @Param('id') id: string): Promise<BaseResponse<any>> {
    return this.articleService.restore(req.user.sub, id);
  }
}
