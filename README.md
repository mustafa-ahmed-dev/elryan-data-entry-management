# 📋 Implementation Checklist

Follow this checklist to ensure complete and correct implementation of your API routes.

## ✅ Phase 1: Prerequisites

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running (Docker or local)
- [ ] Next.js 16 project initialized
- [ ] Database schema created and pushed
- [ ] Database seeded with admin user

## ✅ Phase 2: Install Dependencies

```bash
npm install next-auth argon2 zod
npm install --save-dev @types/argon2
```

**Verify installation:**
- [ ] `next-auth` installed
- [ ] `argon2` installed
- [ ] `zod` installed
- [ ] TypeScript types installed

## ✅ Phase 3: Environment Configuration

Create/update `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quality_control
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Checklist:**
- [ ] `.env` file exists
- [ ] `DATABASE_URL` is correct
- [ ] `NEXTAUTH_URL` is set
- [ ] `NEXTAUTH_SECRET` is generated and set
- [ ] `.env` is in `.gitignore`

## ✅ Phase 4: Create Directory Structure

Run this command:
```bash
mkdir -p lib/middleware lib/api lib/validations \
  app/api/auth/[...nextauth] \
  app/api/users/[id] \
  app/api/schedules/{pending,[id]/{approve,reject}} \
  app/api/entries/{stats,[id]} \
  app/api/evaluations/{employee/[employeeId],[id]} \
  app/api/reports/{employee/[id],team/[id],daily,quality-trends,top-performers}
```

**Verify directories:**
- [ ] `lib/middleware` exists
- [ ] `lib/api` exists
- [ ] `lib/validations` exists
- [ ] All `app/api/*` directories exist

## ✅ Phase 5: Create and Populate Core Library Files

### lib/auth.ts
- [ ] File created: `lib/auth.ts`
- [ ] Content copied from artifact `auth_config`
- [ ] No TypeScript errors
- [ ] Imports resolve correctly

### lib/middleware/auth.ts
- [ ] File created: `lib/middleware/auth.ts`
- [ ] Content copied from artifact `auth_middleware`
- [ ] No TypeScript errors
- [ ] Imports resolve correctly

### lib/api/utils.ts
- [ ] File created: `lib/api/utils.ts`
- [ ] Content copied from artifact `api_utils`
- [ ] No TypeScript errors
- [ ] Imports resolve correctly

### lib/validations/schemas.ts
- [ ] File created: `lib/validations/schemas.ts`
- [ ] Content copied from artifact `validation_schemas`
- [ ] No TypeScript errors
- [ ] Imports resolve correctly

## ✅ Phase 6: Create API Route Files

### Authentication
- [ ] `app/api/auth/[...nextauth]/route.ts` created
- [ ] Content copied from artifact `nextauth_route`

### Users API
- [ ] `app/api/users/route.ts` created
- [ ] `app/api/users/[id]/route.ts` created
- [ ] Content copied from artifacts

### Schedules API
- [ ] `app/api/schedules/route.ts` created
- [ ] `app/api/schedules/[id]/route.ts` created
- [ ] `app/api/schedules/[id]/approve/route.ts` created
- [ ] `app/api/schedules/[id]/reject/route.ts` created
- [ ] `app/api/schedules/pending/route.ts` created
- [ ] Content copied from artifacts

### Entries API
- [ ] `app/api/entries/route.ts` created
- [ ] `app/api/entries/[id]/route.ts` created
- [ ] `app/api/entries/stats/route.ts` created
- [ ] Content copied from artifacts

### Evaluations API
- [ ] `app/api/evaluations/route.ts` created
- [ ] `app/api/evaluations/[id]/route.ts` created
- [ ] `app/api/evaluations/employee/[employeeId]/route.ts` created
- [ ] Content copied from artifacts

### Reports API
- [ ] `app/api/reports/employee/[id]/route.ts` created
- [ ] `app/api/reports/team/[id]/route.ts` created
- [ ] `app/api/reports/daily/route.ts` created
- [ ] `app/api/reports/quality-trends/route.ts` created
- [ ] `app/api/reports/top-performers/route.ts` created
- [ ] Content copied from artifacts

## ✅ Phase 7: Verification

### File Count Verification
```bash
# Should return 4
ls lib/*.ts lib/*/*.ts 2>/dev/null | wc -l

# Should return 19
find app/api -name "route.ts" | wc -l
```

**Checklist:**
- [ ] 4 core library files exist
- [ ] 19 API route files exist
- [ ] Total 23 files created

### TypeScript Compilation
```bash
npm run build
```

**Checklist:**
- [ ] No TypeScript errors
- [ ] No missing import errors
- [ ] No module resolution errors
- [ ] Build completes successfully

## ✅ Phase 8: Database Setup

```bash
# Make sure database is running
docker-compose up -d

# Push schema
npm run db:push

# Seed database
npm run db:seed
```

**Verify:**
- [ ] Database is running
- [ ] Schema is pushed
- [ ] Admin user exists in database
- [ ] Can connect to database

## ✅ Phase 9: Start Development Server

```bash
npm run dev
```

**Checklist:**
- [ ] Server starts without errors
- [ ] No compilation errors
- [ ] Can access http://localhost:3000
- [ ] No console errors

## ✅ Phase 10: Test API Endpoints

### Manual Testing

**Test 1: Authentication**
```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"mustafa.ahmed@elryan.com","password":"Elryan@12345"}'
```
- [ ] Returns successful response
- [ ] Session cookie is set

**Test 2: Get Users (requires auth)**
```bash
curl http://localhost:3000/api/users \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```
- [ ] Returns list of users
- [ ] Pagination works

**Test 3: Get Daily Report**
```bash
curl http://localhost:3000/api/reports/daily \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```
- [ ] Returns daily statistics
- [ ] No errors

### Automated Testing

**Run test script:**
```bash
node test-api.js
```

**Checklist:**
- [ ] Authentication tests pass
- [ ] Users API tests pass
- [ ] Entries API tests pass
- [ ] Schedules API tests pass
- [ ] Evaluations API tests pass
- [ ] Reports API tests pass

## ✅ Phase 11: Common Issues Resolution

### Issue: "Cannot find module '@/lib/auth'"
**Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```
- [ ] Fixed

### Issue: "Module not found: Can't resolve 'argon2'"
**Solution:**
```bash
npm install argon2
```
- [ ] Fixed

### Issue: "NEXTAUTH_SECRET is not set"
**Solution:**
- [ ] Add `NEXTAUTH_SECRET` to `.env`
- [ ] Restart dev server

### Issue: Database connection fails
**Solution:**
- [ ] Check Docker is running
- [ ] Verify `DATABASE_URL` in `.env`
- [ ] Run `docker-compose up -d`

## ✅ Phase 12: Final Verification

Run all checks:

```bash
# Check all files exist
find lib app/api -name "*.ts" -type f | sort

# Verify TypeScript compilation
npm run build

# Run development server
npm run dev

# Test APIs
node test-api.js
```

**Final Checklist:**
- [ ] All 23 files created
- [ ] No TypeScript errors
- [ ] Server runs successfully
- [ ] All API endpoints respond correctly
- [ ] Authentication works
- [ ] Role-based access works
- [ ] Database operations work

## 🎯 Success Criteria

You're ready to move forward when:

✅ All files are created and contain correct code  
✅ No TypeScript compilation errors  
✅ Server starts without errors  
✅ Can login with admin credentials  
✅ API endpoints return expected responses  
✅ Database operations work correctly  
✅ Test script passes all tests  

## 📝 Next Steps After Completion

1. **Create frontend components** to consume these APIs
2. **Add API documentation** (Swagger/OpenAPI)
3. **Implement rate limiting** for production
4. **Add monitoring** (error tracking, logging)
5. **Write unit tests** for API routes
6. **Set up CI/CD pipeline**

---

## 🆘 Need Help?

If you encounter issues:

1. Check the error message carefully
2. Verify all imports are correct
3. Ensure environment variables are set
4. Check database connection
5. Review the artifact mapping document
6. Verify file paths match exactly

**Common Commands:**
```bash
# Restart everything fresh
docker-compose restart
npm run db:push
npm run db:seed
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# View database
npm run db:studio
```
