# Author Module

The **Author Module** provides specialized tools and dashboards for content creators. It focuses on aggregating performance metrics and providing insights into article engagement.

## Overview

Key capabilities:
- **Author Dashboard**: A centralized view for authors to monitor their content performance.
- **Analytics Aggregation**: Real-time calculation of total views based on daily analytics data.
- **Role-Based Access**: Strictly restricted to users with the `AUTHOR` role.

## Endpoints

### 1. Author Dashboard
Retrieves a paginated list of the authenticated author's articles, enriched with aggregated view counts.

- **URL**: `/author/dashboard`
- **Method**: `GET`
- **Auth**: Bearer Token (Required, Role: AUTHOR)
- **Query Parameters**:
  - `page`: Page number (Default: 1)
  - `limit`: Items per page (Default: 10)
  
- **Response**:
  ```json
  {
    "Success": true,
    "Message": "Author dashboard retrieved successfully",
    "Object": [
      {
        "id": "uuid...",
        "title": "My Article Title",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "status": "PUBLISHED",
        "totalViews": 150 // Aggregated count from daily analytics
      }
    ],
    "PageNumber": 1,
    "PageSize": 10,
    "TotalSize": 5,
    "Errors": null
  }
  ```

## Implementation Details

### Analytics Aggregation Strategy
Instead of storing a running `total_views` counter on the Article table (which can lead to write contention), the system calculates total views dynamically.

1. **Source Data**: The `DailyAnalytics` table stores view counts per article per day.
2. **Aggregation**: When the dashboard is requested, the service fetches articles along with their related `DailyAnalytics` records.
3. **Calculation**: The service reduces the daily records into a single `totalViews` sum in-memory before returning the response.

### Security
This module is protected by strict Role-Based Access Control (RBAC):
- **JwtAuthGuard**: Validates the access token.
- **RolesGuard**: Checks the user's role claim.
- **@Roles('AUTHOR')**: Ensures only users with the `AUTHOR` role can access these endpoints. Attempts by `READER` users will result in a `403 Forbidden` error.
