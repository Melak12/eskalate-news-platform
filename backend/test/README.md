# Testing Documentation

This directory contains the testing infrastructure for the Eskalate News Platform backend. We utilize **Jest** as our primary testing framework, integrated with NestJS testing utilities.

## Testing Strategy
We employ two main types of tests to ensure application reliability:

### 1. Unit Tests (`/test/unit`)
Unit tests focus on isolating individual components (Services, Controllers) and verifying their logic in isolation. Dependencies like Database (Prisma) and Authentication (JwtService) are **mocked** to ensure speed and reliability.

- **Location**: `test/unit/**/*.spec.ts`
- **Configuration**: Uses `test/jest-unit.json`.
- **Key Features**:
  - Isolated testing of business logic.
  - Path mapping support (`@core`, `@modules`).
  - Fast execution (no real database connection).

### 2. End-to-End (E2E) Tests (`/test/*.e2e-spec.ts`)
E2E tests verify the application flow from the HTTP request to the response. These tests start the full NestJS application instance and often interact with a test database.

- **Location**: `test/*.e2e-spec.ts`
- **Configuration**: Uses `test/jest-e2e.json`.
- **Current Coverage**: Basic application health checks.

## How to Run Tests

### Running Unit Tests
To run the suite of unit tests for all modules (Auth, Article, Author):

```bash
# Using npm
npx jest --config test/jest-unit.json

# Using pnpm (Recommended)
pnpm jest --config test/jest-unit.json
```

### Running E2E Tests
To run the end-to-end test suite:

```bash
# Using npm
npm run test:e2e

# Using pnpm
pnpm run test:e2e
```

### Running Specific Tests
You can target specific files by passing the path:

```bash
pnpm jest test/unit/auth/auth.service.spec.ts --config test/jest-unit.json
```

## Test Structure & Constraints

### Mocks & Stubs
- **PrismaService**: Mocked globally in unit tests to prevent database writes.
- **JwtService**: Mocked to simulate token generation without cryptographic overhead.
- **EventEmitter**: Mocked to verify event application logic without triggering side effects.

### Path Mapping
The project uses path aliases (e.g., `@core/prisma/prisma.service`). The unit test configuration (`jest-unit.json`) includes a `moduleNameMapper` section to resolve these paths correctly during test execution:

```json
"moduleNameMapper": {
  "^@common/(.*)$": "<rootDir>/src/common/$1",
  "^@modules/(.*)$": "<rootDir>/src/modules/$1",
  "^@core/(.*)$": "<rootDir>/src/core/$1"
}
```
