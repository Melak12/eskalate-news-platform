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
              args.where = { ...args.where, deletedAt: null };
              return query(args);
            },
            async findMany({ args, query }) {
              if (args.where) {
                if (args.where.deletedAt === undefined) {
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



