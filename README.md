## Description
 A production-ready RESTful Node.js (NestJS + TypeScript) API inside the `/backend` directory. The architecture must include PostgreSQL, Prisma, Zod for validation, standard response models, soft delete integrity, non-blocking event mechanisms

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

# Prisma Configuration

This project utilizes Prisma 7+, which supports a dedicated configuration file `prisma.config.ts`. This file centralizes configuration for both the Prisma CLI (migrations) and the runtime client (database connection).

## `prisma.config.ts`

The `prisma.config.ts` file is used to:
- Configure the datasource URL and schema path for Prisma Migrate.
- Export a `PrismaPg` adapter for the Prisma Client to use `pg` driver features.


### Usage

- **Migrations**: The Prisma CLI automatically detects this configuration file.
- **Client**: The `adapter` export is used when instantiating `PrismaClient` in the application code.


### Prisma Commands
- To create a new migration: `npx prisma migrate dev --name <name_of_migration>`
- To run seed files: `npx prisma db seed`
- To Wipe the database: This drops and recrates the database, and reapplies all migrations. WARNING: use only in non-production env't. 
`npx prisma migrate reset`
- To push or deploy Changes to the database: `npx prisma db push`
- To Validate prisma configs and schema: `npx prisma validate`


## Stay in touch

- Author - [Melake Wubshet](https://www.linkedin.com/in/melake-wub/)


