# Auth Module

## Overview
The Auth module handles user registration and authentication.

## Endpoints

### POST /auth/signup
Registers a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword1!",
  "role": "AUTHOR" // or "READER"
}
```

**Responses:**
- `201 Created`: User successfully registered.
- `400 Bad Request`: Validation failure (e.g. weak password).
- `409 Conflict`: Email already exists.

### POST /auth/login
Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "StrongPassword1!"
}
```

**Responses:**
- `200 OK`: Login successful. Returns token and user details.
- `401 Unauthorized`: Invalid credentials.

## Implementation Details
- Uses `argon2` for password hashing and verification.
- Uses `Zod` for strict input validation.
- Checks for duplicate emails before creating user.
