# Application Root Module & Bootstrap

This document manages the core application configuration, including the root logic in `AppModule` and the bootstrapping process in `main.ts`.

## 1. App Module (`src/app.module.ts`)
The `AppModule` is the root module of the NestJS application. It orchestrates the feature modules and sets up global configurations using the Dependency Injection (DI) system.

### Key Responsibilities
- **Imports Feature Modules**: Aggregates `AuthModule`, `ArticleModule`, `AuthorModule`, and `AnalyticsModule`.
- **Global Configuration**:
  - `ConfigModule`: Loads environment variables globally.
  - `EventEmitterModule`: Enables asynchronous event processing (e.g., for non-blocking read logs).
  - `PrismaModule`: Provides database connectivity.
- **Global Providers**:
  - `APP_PIPE`: Registers `ZodValidationPipe` globally to validate all incoming DTOs against Zod schemas.
  - `APP_INTERCEPTOR`: Registers `ZodSerializerInterceptor` to automatically transform responses based on DTOs.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ArticleModule,
    AuthorModule,
    AnalyticsModule,
    EventEmitterModule.forRoot({ global: true }),
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
```

## 2. Application Bootstrap (`src/main.ts`)
The `main.ts` file is the entry point of the application. It creates the NestJS application instance and applies global middleware/settings.

### Bootstrapping Flow
1. **Creation**: Initializes the app using `NestFactory.create(AppModule)`.
2. **Global Prefix**: Sets the API route prefix to `/api/v1` (e.g., `http://localhost:3000/api/v1/articles`).
3. **Response Standardization**: Applies `ResponseInterceptor` to wrap all successful responses in the `{ Success: true, ... }` format.
4. **Exception Handling**: Applies `GlobalExceptionFilter` to catch errors and return standardized `{ Success: false, Errors: [...] }` responses without leaking stack traces.
5. **Swagger Documentation**:
   - Generates API docs at `/api/docs`.
   - Configures JWT Bearer Auth scheme (`access-token`).
   - Uses `cleanupOpenApiDoc` from `nestjs-zod` to ensure Zod schemas are correctly converted to Swagger definitions.

### Swagger Setup
The documentation is automatically generated and served at:
`http://localhost:3000/api/docs`

Ensure the application is running:
```bash
pnpm start:dev
```
