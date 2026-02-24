import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateArticleSchema = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters long' })
    .max(150, { message: 'Title must not exceed 150 characters' }),
  content: z
    .string()
    .min(20, { message: 'Content must be at least 20 characters long' }),
  category: z.string().min(1, { message: 'Category is required' }),
});

export class CreateArticleDto extends createZodDto(CreateArticleSchema) {}
