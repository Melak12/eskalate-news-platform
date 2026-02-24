# Eskalate News Platform API

> A production-ready RESTful Node.js (NestJS + TypeScript) API designed for high scalability and maintainability.

## 🚀 Technologies Used
- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL 16+
- **ORM**: [Prisma](https://www.prisma.io/) (v7+)
- **Validation**: [Zod](https://zod.dev/) (via `nestjs-zod`)
- **Authentication**: JWT & Argon2
- **Documentation**: Swagger (OpenAPI 3.0)
- **Scheduling**: `@nestjs/schedule` (Cron Jobs)
- **Testing**: Jest (Unit & E2E)

---

## 📂 Project Structure
The backend is organized into a modular monolith structure:

```
backend/
├── prisma/
│   ├── migrations/       # Database migration history
│   └── schema.prisma     # Prisma data model definition
├── src/
│   ├── common/           # Shared utilities
│   │   ├── decorators/   # Custom decorators (e.g., @Roles)
│   │   ├── filters/      # Global exception handling
│   │   ├── guards/       # Auth and Role guards
│   │   ├── interceptors/ # Response formatting
│   │   └── interfaces/   # Shared types (BaseResponse)
│   ├── core/             # Core infrastructure
│   │   ├── analytics/    # Periodic tasks (Cron jobs)
│   │   └── prisma/       # Database connection & extensions
│   ├── modules/          # Feature modules
│   │   ├── article/      # News management & tracking
│   │   ├── auth/         # Authentication (Signup/Login)
│   │   └── author/       # Author dashboard & metrics
│   ├── app.module.ts     # Root module orchestration
│   └── main.ts           # Entry point (Bootstrap)
├── test/                 # Testing directory
│   ├── unit/             # Unit tests for services/controllers
│   ├── jest-e2e.json     # E2E test config
│   └── jest-unit.json    # Unit test config
├── .env                  # Environment variables
├── nest-cli.json         # NestJS CLI configuration
├── package.json          # Dependencies and scripts
├── prisma.config.ts      # Prisma custom config
└── tsconfig.json         # TypeScript configuration
```

### Key Modules
- **[Auth Module](backend/src/modules/auth/README.md)**: Handles secure user registration and login using JWT strategies.
- **[Article Module](backend/src/modules/article/README.md)**: Manages news content, including soft deletes and restoration. Features an event-driven system to track reads while preventing spam via debounce logic.
- **[Author Module](backend/src/modules/author/README.md)**: Provides a dashboard for content creators to view aggregated performance metrics (Total Views).
- **[Core Module](backend/src/core/README.md)**: Contains the **Analytics Engine** (a nightly Cron job that aggregates daily views) and the **Prisma Service** (configured with global soft-delete middleware).

---

## 🛠️ Getting Started
Follow these steps to set up and run the project locally.

### Prerequisites
- Node.js (v18 or later)
- pnpm (`npm install -g pnpm`)
- PostgreSQL Database running locally or via Docker

### 1. Installation
```bash
# Clone the repository
git clone <repository-url>
cd eskalate-news-platform/backend

# Install dependencies
pnpm install
```

### 2. Environment Configuration
Create a `.env` file in the `backend` root directory:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/eskalate_news?schema=public"

# JWT Secret
JWT_SECRET="your_super_secret_key_change_this"
```

### 3. Database Setup
Initialize the database schema using Prisma:

```bash
# Generate Prisma Client
npx prisma generate

# Run Migrations
npx prisma migrate dev --name init
```

### 4. Running the Application
```bash
# Development Mode (Watch Mode)
pnpm run start:dev

# Production Build
pnpm run build
pnpm run start:prod
```

Once running, access the **Swagger Documentation** at:
👉 [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## 🧪 Testing

### Unit Tests
Run isolated unit tests for Controllers and Services:
```bash
npx jest --config test/jest-unit.json
```

### E2E Tests
Run integration tests:
```bash
pnpm run test:e2e
```

---

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


