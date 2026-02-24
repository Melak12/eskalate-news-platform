import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetArticlesFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  category: z.string().optional(),
  author: z.string().optional(),
  q: z.string().optional(),
});

export class GetArticlesFilterDto extends createZodDto(GetArticlesFilterSchema) {}
