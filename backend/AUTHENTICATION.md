# NammaFix Backend - Authentication System

## Overview

The NammaFix backend now supports JWT-based authentication with role-based access control for three user types:
- **Citizen**: Can report and track complaints
- **Government**: Can manage all complaints and update statuses
- **News/Media**: Can access complaint data for analysis

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  role VARCHAR(20) CHECK (role IN ('citizen', 'government', 'news')),
  created_at TIMESTAMP WITH TIME ZONE
);
```

## Authentication Endpoints

### 1. Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "citizen"
}
```

**Validation Rules:**
- `name`: 2-100 characters
- `email`: Valid email format
- `password`: Minimum 6 characters
- `role`: Must be one of: `citizen`, `government`, `news`

**Response (201):**
```json
{
  "message": "User registered successfully"
}
```

**Error Responses:**
- `400`: Validation error or email already registered
- `500`: Server error

---

### 2. Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "citizen",
  "user": {
    "user_id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "citizen"
  }
}
```

**Error Responses:**
- `400`: Invalid email or password
- `500`: Server error

---

### 3. Get Profile
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user_id": "uuid-here",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "citizen",
  "created_at": "2026-03-13T10:00:00Z"
}
```

**Error Responses:**
- `401`: Unauthorized (no token or invalid token)
- `500`: Server error

## Protected Endpoints

### Citizen Access
Citizens can access:
- ✅ `POST /api/complaints` - Submit complaints
- ✅ `GET /api/complaints/:id` - Track their complaints
- ✅ `GET /api/heatmap` - View complaint map
- ✅ `GET /api/trending` - View trending issues

### Government Access
Government officials can access:
- ✅ `GET /api/complaints` - View all complaints (requires auth + government role)
- ✅ `PATCH /api/complaints/:id/status` - Update complaint status (requires auth + government role)
- ✅ `GET /api/trending` - View trending issues
- ✅ `GET /api/heatmap` - View complaint map

### News/Media Access
News users can access:
- ✅ `GET /api/trending` - Analyze civic trends
- ✅ `GET /api/heatmap` - View complaint data

## Using Authentication

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "role": "government"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }'
```

**Save the token from the response!**

### 3. Access Protected Endpoints
```bash
curl -X GET http://localhost:3000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Middleware

### authMiddleware
Verifies JWT token and attaches user info to `req.user`:
```javascript
req.user = {
  user_id: "uuid",
  role: "government",
  email: "user@example.com"
}
```

### requireRole(roles)
Restricts access based on user role:
```javascript
// Single role
router.get('/admin', authMiddleware, requireRole('government'), handler);

// Multiple roles
router.get('/data', authMiddleware, requireRole(['government', 'news']), handler);
```

## Security Features

### Password Hashing
- Uses bcrypt with 10 salt rounds
- Passwords never stored in plain text
- Secure password comparison

### JWT Tokens
- Signed with JWT_SECRET
- Expires in 7 days
- Contains: user_id, role, email

### Token Validation
- Verifies signature
- Checks expiration
- Returns 401 for invalid/expired tokens

## Environment Variables

Add to `.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**⚠️ Important**: Change the JWT_SECRET in production!

## Error Handling

### 401 Unauthorized
- No token provided
- Invalid token
- Expired token

### 403 Forbidden
- Valid token but insufficient permissions
- Wrong role for the endpoint

### 400 Bad Request
- Validation errors
- Email already registered
- Invalid credentials

## Role-Based Access Matrix

| Endpoint | Public | Citizen | Government | News |
|----------|--------|---------|------------|------|
| POST /api/complaints | ✅ | ✅ | ✅ | ✅ |
| GET /api/complaints/:id | ✅ | ✅ | ✅ | ✅ |
| GET /api/complaints | ❌ | ❌ | ✅ | ❌ |
| PATCH /api/complaints/:id/status | ❌ | ❌ | ✅ | ❌ |
| GET /api/trending | ✅ | ✅ | ✅ | ✅ |
| GET /api/heatmap | ✅ | ✅ | ✅ | ✅ |

## Testing Authentication

### Create Test Users
```bash
# Citizen
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Citizen","email":"citizen@test.com","password":"test123","role":"citizen"}'

# Government
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Gov","email":"gov@test.com","password":"test123","role":"government"}'

# News
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test News","email":"news@test.com","password":"test123","role":"news"}'
```

### Test Protected Endpoint
```bash
# Login as government
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gov@test.com","password":"test123"}' \
  | jq -r '.token')

# Access protected endpoint
curl -X GET http://localhost:3000/api/complaints \
  -H "Authorization: Bearer $TOKEN"
```

## Migration

The authentication migration has been applied:
```bash
node scripts/runAuthMigration.js
```

This adds:
- `role` column to users table
- `password_hash` column to users table
- Indexes on email and role

## Backward Compatibility

✅ All existing APIs remain functional
✅ Public endpoints still work without authentication
✅ Complaint submission works for anonymous users
✅ No breaking changes to existing functionality

## Next Steps

1. Update frontend to include login/register pages
2. Store JWT token in localStorage/sessionStorage
3. Add token to API requests
4. Implement role-based UI components
5. Add logout functionality

---

**Authentication system is ready for use!**
