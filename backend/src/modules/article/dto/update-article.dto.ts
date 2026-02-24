import { createZodDto } from 'nestjs-zod';
import { CreateArticleSchema } from './create-article.dto';

export const UpdateArticleSchema = CreateArticleSchema.partial();

export class UpdateArticleDto extends createZodDto(UpdateArticleSchema) {}
