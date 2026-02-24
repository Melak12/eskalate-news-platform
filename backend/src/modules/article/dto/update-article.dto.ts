import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreateArticleSchema } from './create-article.dto';

export const UpdateArticleSchema = CreateArticleSchema.extend({
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
}).partial();

export class UpdateArticleDto extends createZodDto(UpdateArticleSchema) {}
