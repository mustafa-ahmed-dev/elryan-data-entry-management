# API Routes Setup Guide

## 📁 File Structure Created

```
app/
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts ✅
│   ├── users/
│   │   ├── route.ts ✅
│   │   └── [id]/
│   │       └── route.ts ✅
│   ├── schedules/
│   │   ├── route.ts ✅
│   │   ├── pending/
│   │   │   └── route.ts ✅
│   │   └── [id]/
│   │       ├── route.ts ✅
│   │       ├── approve/
│   │       │   └── route.ts ✅
│   │       └── reject/
│   │           └── route.ts ✅
│   ├── entries/
│   │   ├── route.ts ✅
│   │   ├── stats/
│   │   │   └── route.ts ✅
│   │   └── [id]/
│   │       └── route.ts ✅
│   ├── evaluations/
│   │   ├── route.ts ✅
│   │   ├── employee/
│   │   │   └── [employeeId]/
│   │   │       └── route.ts ✅
│   │   └── [id]/
│   │       └── route.ts ✅
│   └── reports/
│       ├── employee/
│       │   └── [id]/
│       │       └── route.ts ✅
│       ├── team/
│       │   └── [id]/
│       │       └── route.ts ✅
│       ├── daily/
│       │   └── route.ts ✅
│       ├── quality-trends/
│       │   └── route.ts ✅
│       └── top-performers/
│           └── route.ts ✅

lib/
├── auth.ts ✅ (NextAuth config)
├── middleware/
│   └── auth.ts ✅ (Auth helpers)
├── api/
│   └── utils.ts ✅ (API utilities)
└── validations/
    └── schemas.ts ✅ (Zod schemas)
```

## 🔧 Environment Variables

Add to your `.env` file:

```env
# Database (already configured)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quality_control

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Optional: For production
# NEXTAUTH_URL=https://yourdomain.com
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

## 📦 Required Dependencies

Install these packages if not already installed:

```bash
npm install next-auth argon2 zod
npm install --save-dev @types/argon2
```

## 🚀 Quick Start

### 1. Database Setup

```bash
# Start PostgreSQL (if not running)
docker-compose up -d

# Push schema to database
npm run db:push

# Seed database with admin user
npm run db:seed
```

### 2. Test Authentication

Start the dev server:
```bash
npm run dev
```

Test login with the admin user:
```bash
curl -X POST http://localhost:3000/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mustafa.ahmed@elryan.com",
    "password": "Elryan@12345"
  }'
```

## 📝 API Endpoints Reference

### Authentication
- `POST /api/auth/signin/credentials` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get current session

### Users
- `GET /api/users` - List users (admin/team_leader)
- `POST /api/users` - Create user (admin)
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Deactivate user (admin)

### Schedules
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule (team_leader/admin)
- `GET /api/schedules/[id]` - Get schedule details
- `PATCH /api/schedules/[id]` - Modify approved schedule (admin only)
- `PATCH /api/schedules/[id]/approve` - Approve schedule (admin)
- `PATCH /api/schedules/[id]/reject` - Reject schedule (admin)
- `GET /api/schedules/pending` - Get pending schedules (admin)

### Entries
- `GET /api/entries` - List entries
- `POST /api/entries` - Create entry
- `GET /api/entries/[id]` - Get entry details
- `PATCH /api/entries/[id]` - Update entry
- `DELETE /api/entries/[id]` - Delete entry (admin)
- `GET /api/entries/stats` - Entry statistics

### Evaluations
- `GET /api/evaluations` - List evaluations
- `POST /api/evaluations` - Create evaluation (team_leader/admin)
- `GET /api/evaluations/[id]` - Get evaluation details
- `PATCH /api/evaluations/[id]` - Update evaluation
- `DELETE /api/evaluations/[id]` - Delete evaluation (admin)
- `GET /api/evaluations/employee/[employeeId]` - Employee evaluations

### Reports
- `GET /api/reports/employee/[id]` - Employee performance report
- `GET /api/reports/team/[id]` - Team performance report
- `GET /api/reports/daily` - Daily productivity report
- `GET /api/reports/quality-trends` - Quality trends over time
- `GET /api/reports/top-performers` - Leaderboard

## 🔐 Role-Based Access Control

### Admin
- Full access to all endpoints
- Can create/modify users
- Can approve/reject/modify schedules
- Can delete entries and evaluations

### Team Leader
- Manage team schedules
- Create evaluations for team members
- View team reports and statistics
- Cannot delete or modify other teams

### Employee
- Create own entries
- View own evaluations and performance
- View own schedules
- Cannot access admin or team leader functions

## 🧪 Testing Examples

### Create a User (Admin)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "role": "employee",
    "teamId": 1
  }'
```

### Create an Entry
```bash
curl -X POST http://localhost:3000/api/entries \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "entryTypeId": 1,
    "productName": "Sample Product ABC-123",
    "productDescription": "High quality product",
    "followsNamingConvention": true,
    "followsSpecificationOrder": true,
    "containsUnwantedKeywords": false
  }'
```

### Create a Schedule (Team Leader)
```bash
curl -X POST http://localhost:3000/api/schedules \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "userId": 2,
    "weekStartDate": "2024-01-01",
    "weekEndDate": "2024-01-07",
    "scheduleData": {
      "monday": { "start": "09:00", "end": "17:00", "isWorking": true },
      "tuesday": { "start": "09:00", "end": "17:00", "isWorking": true },
      "wednesday": { "start": "09:00", "end": "17:00", "isWorking": true },
      "thursday": { "start": "09:00", "end": "17:00", "isWorking": true },
      "friday": { "start": "09:00", "end": "17:00", "isWorking": true },
      "saturday": { "start": "09:00", "end": "13:00", "isWorking": false },
      "sunday": { "start": "09:00", "end": "13:00", "isWorking": false }
    }
  }'
```

### Create an Evaluation (Team Leader/Admin)
```bash
curl -X POST http://localhost:3000/api/evaluations \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "entryId": 1,
    "ruleSetId": 1,
    "totalScore": 85,
    "violations": [
      {
        "ruleId": 1,
        "ruleName": "Missing specification",
        "deduction": 15
      }
    ],
    "comments": "Good work, but missing some specifications"
  }'
```

### Get Reports
```bash
# Daily report
curl http://localhost:3000/api/reports/daily?date=2024-01-15 \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Employee performance
curl http://localhost:3000/api/reports/employee/2?startDate=2024-01-01&endDate=2024-01-31 \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Quality trends
curl http://localhost:3000/api/reports/quality-trends?startDate=2024-01-01&endDate=2024-01-31 \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Top performers
curl http://localhost:3000/api/reports/top-performers?startDate=2024-01-01&endDate=2024-01-31 \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## 🎯 Key Features

✅ **Authentication & Authorization**
- JWT-based session management
- Role-based access control (RBAC)
- Secure password hashing with Argon2

✅ **Schedule Management**
- Team leaders create weekly schedules
- Admin approval workflow
- Schedule modification history
- Only admins can modify approved schedules

✅ **Data Entry System**
- Timestamp-based entry tracking
- Entry type categorization
- Quality flags for naming conventions

✅ **Quality Evaluation**
- Scoring system (0-100)
- Violation tracking
- Comments and feedback

✅ **Comprehensive Reports**
- Employee performance analytics
- Team performance comparison
- Daily productivity tracking
- Quality trend analysis
- Top performers leaderboard

✅ **API Best Practices**
- Request validation with Zod
- Standardized error handling
- Pagination support
- Proper HTTP status codes
- Type-safe responses

## 🔍 Next Steps

1. **Testing**: Test all API endpoints with Postman or curl
2. **Frontend Integration**: Build React components to consume these APIs
3. **Error Monitoring**: Add error tracking (e.g., Sentry)
4. **Rate Limiting**: Add rate limiting for production
5. **API Documentation**: Generate OpenAPI/Swagger docs
6. **Unit Tests**: Write tests for API routes

## 📚 Additional Resources

- [NextAuth Documentation](https://next-auth.js.org/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Zod Validation](https://zod.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
