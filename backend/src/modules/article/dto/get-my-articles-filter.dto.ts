import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetMyArticlesFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  includeDeleted: z.enum(['true', 'false']).transform((val) => val === 'true').default(false),
});

export class GetMyArticlesFilterDto extends createZodDto(GetMyArticlesFilterSchema) {}
