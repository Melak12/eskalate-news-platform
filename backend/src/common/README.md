# Common Module

The `src/common` directory contains shared utilities, guards, decorators, and interceptors that are used across multiple modules to enforce consistency and security.

## 1. Guards (`/guards`)
Guards are responsible for allowing or denying access to endpoints based on authentication or role requirements.

- **`JwtAuthGuard`**: Extends NestJS `AuthGuard('jwt')`. It validates the Bearer token in the request header. If invalid or missing, it throws an `UnauthorizedException`.
- **`OptionalJwtAuthGuard`**: Similar to `JwtAuthGuard` but does **not** throw an error if the token is missing. It allows the request to proceed as a "Guest" (where `req.user` is undefined). Used for endpoints like `GET /articles/:id` where tracking logic differs for guests vs. users.
- **`RolesGuard`**: Checks if the authenticated user possesses the required role (e.g., `AUTHOR`). It must be used **after** `JwtAuthGuard`.

## 2. Decorators (`/decorators`)
- **`@Roles(...roles: Role[])`**: A custom decorator used to attach metadata to route handlers. It specifies which roles are permitted to access the endpoint.
  ```typescript
  @Roles(Role.AUTHOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create() { ... }
  ```

## 3. Filters (`/filters`)
- **`GlobalExceptionFilter`**: A centralized error handler that catches all exceptions (HTTP, Prisma, Validation) and formats them into a standardized JSON response.
  - **Behavior**: Hides internal stack traces and ensures all errors return `{ Success: false, Errors: [...] }`.
  - **Zod Integration**: Specifically parses `ZodValidationException` to return user-friendly validation error messages.

## 4. Interceptors (`/interceptors`)
- **`ResponseInterceptor`**: Wraps the return value of successful route handlers into the standard response format.
  - **Input**: `return { id: 1, title: '...' }`
  - **Output**: 
    ```json
    {
      "Success": true,
      "Message": "Operation successful",
      "Object": { "id": 1, "title": "..." },
      "Errors": null
    }
    ```
  - **Bypass**: If the controller already returns a `BaseResponse`-shaped object, the interceptor passes it through unchanged.

## 5. Interfaces (`/interfaces`)
Defines the typescript contracts for API responses to ensure type safety.

- **`BaseResponse<T>`**:
  ```typescript
  {
    Success: boolean;
    Message: string;
    Object: T | null;
    Errors: string[] | null;
  }
  ```
- **`PaginatedResponse<T>`**: Extends `BaseResponse` with pagination metadata (`PageNumber`, `PageSize`, `TotalSize`).
