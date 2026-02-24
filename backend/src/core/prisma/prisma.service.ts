import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

import { adapter } from '../../../prisma.config';
import { PrismaClient } from '../../../prisma/generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['info', 'warn', 'error'],
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
    
    // Capture 'this' to use inside extensions
    const prisma = this as any;

    Object.assign(
      this,
      this.$extends({
        query: {
          article: {
            async findFirst({ args, query }) {
              if (args.where && 'deletedAt' in args.where) {
                // If filtering by deletedAt is explicitly present:
                // If it is 'undefined' (e.g., from service passing manual bypass), remove it so query runs without filter (fetching all).
                // If it is an empty object (e.g., deletedAt: {}), also treat as bypass/all.
                // However, Prisma runtime validation might reject {} for DateTime field.
                // Safest bypass for "ALL" is usually to remove the key entirely after verifying intent.
                if (
                  args.where.deletedAt === undefined ||
                  (args.where.deletedAt !== null &&
                    typeof args.where.deletedAt === 'object' &&
                    !(args.where.deletedAt instanceof Date) &&
                    Object.keys(args.where.deletedAt).length === 0)
                ) {
                  delete args.where.deletedAt;
                }
              } else {
                args.where = { ...args.where, deletedAt: null };
              }
              return query(args);
            },
            async findMany({ args, query }) {
              if (args.where) {
                // Determine if we should enforce soft delete check.
                // If deletedAt is explicitly provided in the query (even as undefined/null), we respect it?
                // No, standard usage is to omit it for active items.
                // We introduce a special symbol or property to bypass?
                // Or simply: If 'deletedAt' key exists in where object (even if value is strange), we skip injection.
                // Service layer passes `deletedAt: { not: null }` for recycle bin, or something compatible.
                // BUT for "ALL", we need to pass something that acts as identity.
                
                // Let's rely on 'deletedAt' property presence.
                if (!('deletedAt' in args.where)) {
                  args.where.deletedAt = null;
                }
              } else {
                args.where = { deletedAt: null };
              }
              return query(args);
            },
            async findUnique({ args, query }) {
              // Convert to findFirst to allow filtering by deletedAt
              // We use the captured 'prisma' instance to avoid context issues
              return prisma.article.findFirst({
                where: { ...args.where, deletedAt: null }
              });
            },
            async delete({ model, args }) {
              return prisma.article.update({
                ...args,
                data: { deletedAt: new Date() },
              });
            },
            async deleteMany({ model, args }) {
              return prisma.article.updateMany({
                ...args,
                data: { deletedAt: new Date() },
              });
            },
          },
        },
      }),
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}



