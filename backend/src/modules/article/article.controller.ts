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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../prisma/generated/client';
import { BaseResponse } from '../../common/interfaces/response.interface';

@ApiTags('Articles')
@Controller('articles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @Roles(Role.AUTHOR)
  @ApiOperation({ summary: 'Create a new article (Author only)' })
  @ApiResponse({ status: 201, description: 'Article created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Request() req, @Body() createArticleDto: CreateArticleDto): Promise<BaseResponse<any>> {
    return this.articleService.create(req.user.sub, createArticleDto);
  }

  @Get('me')
  @Roles(Role.AUTHOR)
  @ApiOperation({ summary: 'Get all articles by current author (Author only)' })
  @ApiResponse({ status: 200, description: 'Return all articles.' })
  findMyArticles(@Request() req): Promise<BaseResponse<any>> {
    return this.articleService.findMyArticles(req.user.sub);
  }

  @Put(':id')
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
  @Roles(Role.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted article (Author only)' })
  @ApiResponse({ status: 200, description: 'Article restored successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Not the author.' })
  @ApiResponse({ status: 404, description: 'Article not found.' })
  restore(@Request() req, @Param('id') id: string): Promise<BaseResponse<any>> {
    return this.articleService.restore(req.user.sub, id);
  }
}
