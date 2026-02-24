# Auth Module

The **Auth Module** handles user authentication, registration, and session management using JWT (JSON Web Tokens). It provides secure endpoints for signing up, logging in, and retrieving the current user's profile, forming the foundation for the platform's role-based access control.

## Overview

### Key Capabilities
- **User Registration**: Secure sign-up process with password hashing using `argon2`.
- **Authentication**: Login mechanism that issues access tokens (JWT).
- **Profile Retrieval**: Protected endpoint to fetch authenticated user details.
- **Security**: 
  - Standardized error handling.
  - Role-based payload in JWT (`sub`, `role`).
  - Strict input validation using Zod schemas.

## API Endpoints

### 1. Register User
Creates a new user account.

- **URL**: `/auth/signup`
- **Method**: `POST`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!",
    "name": "John Doe",
    "role": "AUTHOR" // or "READER"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "Success": true,
    "Message": "User created successfully",
    "Object": {
      "id": "uuid...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "AUTHOR",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "Errors": null
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (e.g., weak password).
  - `409 Conflict`: Email already exists.

### 2. Login
Authenticates a user and returns an access token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "Success": true,
    "Message": "Login successful",
    "Object": {
      "user": { ...user details without password... },
      "token": "eyJhbGciOiJIUzI1NiIsIn..."
    },
    "Errors": null
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid credentials.

### 3. Get Current User (Me)
Retrieves the profile of the currently logged-in user.

- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth**: Bearer Token (Required)
- **Response (200 OK)**:
  ```json
  {
    "Success": true,
    "Message": "User retrieved successfully",
    "Object": {
      "id": "uuid...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "AUTHOR"
    },
    "Errors": null
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token.

## Implementation Details

### Security Measures
- **Hashing**: Passwords are hashed using the Argon2 algorithm, which is robust against GPU-based attacks.
- **JWT Strategy**: Access tokens are signed using a secret key and contain the user's ID (`sub`) and role (`role`).
- **Data Protection**: Password fields are explicitly excluded from all response objects to prevent leakage.

### Validation & Guards
- **Zod DTOs**: Input data is strictly validated against schemas ensuring correct email format and password complexity.
- **Passport Integration**: The module integrates with Passport.js strategies, utilized by `JwtAuthGuard` to protect routes.
