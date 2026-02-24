# Core Module

The **Core Module** contains the essential infrastructure and foundational services that power the entire application. It encapsulates high-level capabilities, database connectivity, and scheduled tasks.

## 1. Prisma Service (`src/core/prisma/prisma.service.ts`)
The `PrismaService` extends the standard `PrismaClient` and is responsible for managing the database connection lifecycle within the NestJS application context.

### Features
- **Lifecycle Management**: Automatically connects on module init and disconnects on module destruction.
- **Global Query Extensions (Soft Delete)**: 
  - Implements a global query extension middleware to handle "Soft Deletes" for the `Article` model.
  - **`delete` / `deleteMany`**: Intercepted to perform `update` with `deletedAt: new Date()` instead of physically removing rows.
  - **`findMany` / `findFirst`**: Automatically injects `deletedAt: null` into queries to hide deleted items.
  - **Bypassing Soft Delete**: Services can bypass the filter by explicitly passing `deletedAt: undefined` or `deletedAt: {}` in the `where` clause (used for restoring articles).


## 2. Analytics Service (`src/core/analytics/analytics.service.ts`)
The `AnalyticsService` handles the aggregation of article view data.

### Architecture
- **Scheduled Task**: Uses `@nestjs/schedule` to run a strict Cron job.
- **Schedule**: `0 0 * * *` (Every Day at Midnight).
- **Logic**:
  1. Wakes up at 00:00 UTC.
  2. Identifies the "Yesterday" date range (00:00:00 - 23:59:59).
  3. Groups `ReadLog` entries by `articleId`.
  4. Upserts the count into the `DailyAnalytics` table.

### Why Cron vs Real-Time?
- **Performance**: Real-time counters on high-traffic articles cause database write contention (row locking).
- **Scalability**: Updating a separate analytics table once per day offloads `WRITE` operations from the critical reading path. (ReadLogs are `INSERT`-only, which is fast).

## Setup & Dependencies
These services are provided globally via the `AppModule` or their respective Core sub-modules.

- **PrismaModule**: Exports `PrismaService`.
- **AnalyticsModule**: Registers the `ScheduleModule`.
