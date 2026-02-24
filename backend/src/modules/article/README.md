# Article Module

The **Article Module** is the core component of the News Platform, responsible for managing news content, view tracking, and author workflows. It implements a robust set of features including role-based access control (RBAC), soft deletions, and an intelligent view tracking system with spam prevention.

## Overview

Key capabilities:
- **CRUD Operations**: Complete management of articles (Create, Read, Update, Delete).
- **Soft Deletion**: Articles are not permanently removed from the database but are flagged with a `deletedAt` timestamp.
- **Restoration**: Capability to restore soft-deleted articles.
- **View Tracking**: Asynchronous event-based system to log article reads.
- **Spam Prevention**: A debounce mechanism to prevent artificial inflation of view counts.

## Key Features

### 1. View Tracking & Analytics
When a user (guest or authenticated) views a single article (`GET /articles/:id`), the system triggers a background process to log the read.

#### Event-Driven Architecture
The module uses `@nestjs/event-emitter` to decouple the HTTP response from the logging logic.
1. **Trigger**: `findOne()` method emits an `article.read` event.
2. **Payload**: The event carries `articleId`, `userId` (optional), `ipAddress`, and `userAgent`.
3. **Listener**: `ArticleEventListener` catches the event and processes it asynchronously.

#### Spam Prevention (Debounce Mechanism)
To prevent users from refreshing the page rapidly to inflate view counts, the system implements a strict **Debounce Mechanism**:

- **Logic**: BEFORE creating a new `ReadLog` entry, the system checks for any existing log for the same Article + Reader identity within the last **10 seconds**.
- **Identity Resolution**:
    1. **Authenticated Users**: Checked by unique `userId`.
    2. **Guests**: Checked by `ipAddress`.
- **Outcome**: If a recent log exists, the new event is ignored (debounced).

**Why?**
- Prevents "refresh spam" (e.g., hitting F5 100 times in 10 seconds).
- Ensures analytics data correlates more closely to actual engagement rather than request volume.

### 2. Soft Delete & Restore Strategy
The module ensures data integrity by never hard-deleting content.

- **Soft Delete**: The `remove()` method sets `deletedAt = new Date()`.
- **Global Filter**: A global Prisma middleware/extension automatically filters out records where `deletedAt` is not null for standard queries.
- **Restore Bypass**: The `restore()` endpoint uses a specialized query pattern (passing an empty object to `deletedAt`) to bypass the global filter, locate the deleted record, and set `deletedAt = null`.

## Data Model

### Article
- **id**: UUID
- **title**: String (150 chars)
- **content**: Text
- **category**: String
- **status**: Enum (DRAFT, PUBLISHED)
- **authorId**: Relation to User
- **deletedAt**: Nullable DateTime (Used for soft delete)

### ReadLog
- **id**: UUID
- **articleId**: Relation to Article
- **readerId**: Nullable Relation to User
- **ipAddress**: String (Added for guest tracking & debounce)
- **readAt**: DateTime (Default: now)

## API Endpoints

### Public / Reader
| Method | Endpoint | Description | Auth |
|Columns|Columns|Columns|Columns|
| `GET` | `/articles` | Get paginated list of published articles | Public |
| `GET` | `/articles/:id` | Read a single article context | Public (Optional JWT) |

### Author Only
| Method | Endpoint | Description | Auth |
|Columns|Columns|Columns|Columns|
| `GET` | `/articles/me` | List articles created by current user | **Bearer Token** |
| `POST` | `/articles` | Create a new article | **Bearer Token** |
| `PATCH` | `/articles/:id` | Update an existing article | **Bearer Token** |
| `DELETE` | `/articles/:id` | Soft delete an article | **Bearer Token** |
| `PATCH` | `/articles/:id/restore` | Restore a soft-deleted article | **Bearer Token** |

## Service Methods

### `findOne(id: string, userId?: string, ipAddress?: string, userAgent?: string)`
Retrieves an article by ID.
- **Input**: Article ID, optional User ID, IP Address, User Agent.
- **Behavior**:
  - Checks if article exists and is not soft-deleted.
  - Emits `article.read` event with provided details.
- **Returns**: Article object or throws NotFoundException.

### `restore(userId: string, articleId: string)`
Restores a previously deleted article.
- **Input**: User ID, Article ID.
- **Behavior**:
  - Bypasses global soft-delete filter to find the target article.
  - Verifies ownership (User must be the author).
  - Resets `deletedAt` to null.

## Implementation Details

### Validation
- **DTOs**: Uses separate DTOs for Create, Update, and Filter operations.
- **Guards**: `JwtAuthGuard` ensures valid tokens; `RolesGuard` strictly enforces `AUTHOR` role for modification endpoints.

### Usage Example (Debounce Check)
If a user with IP `192.168.1.1` reads Article A at `10:00:00`:
1. System logs the read.
2. User refreshes at `10:00:05`.
3. System finds log from `10:00:00` (within 10s window).
4. System **ignores** the second read event.
