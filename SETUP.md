# Data Entry Quality Management System - Setup Guide

## Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- Git (optional)

## Step-by-Step Setup

### 1. Create the Project Directory
```bash
mkdir data-entry-quality-system
cd data-entry-quality-system
```

### 2. Initialize the Project
```bash
npm init -y
```

### 3. Copy Configuration Files
Create the following files in your project root:
- `docker-compose.yml`
- `.env.example`
- `package.json` (replace the generated one)
- `drizzle.config.ts`

### 4. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and update values if needed (the defaults work for local development).

### 5. Start PostgreSQL with Docker
```bash
docker-compose up -d
```

Check if PostgreSQL is running:
```bash
docker ps
```

You should see a container named `data_entry_db` running.

### 6. Install Dependencies
```bash
npm install
```

### 7. Create the Database Schema Directory
```bash
mkdir -p src/db
```

Copy the schema files:
- `src/db/schema.ts`
- `src/db/index.ts`

### 8. Generate and Run Migrations
```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to database
npm run db:push
```

### 9. Verify Database Setup
You can use Drizzle Studio to inspect your database:
```bash
npm run db:studio
```

This will open a web interface at `https://local.drizzle.studio`

Or connect with any PostgreSQL client:
- Host: localhost
- Port: 5432
- Database: data_entry_system
- User: dataentry_user
- Password: dataentry_password

### 10. Next Steps
Create a seed file to populate initial data:
```bash
touch src/db/seed.ts
```

Then you can run:
```bash
npm run db:seed
```

## Useful Commands

### Docker Commands
```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# Stop and remove all data
docker-compose down -v

# View logs
docker-compose logs -f postgres
```

### Database Commands
```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Run seed file
npm run db:seed
```

### Development Commands
```bash
# Start Next.js dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure
```
data-entry-quality-system/
├── src/
│   ├── db/
│   │   ├── schema.ts          # Database schema
│   │   ├── index.ts           # Database connection
│   │   ├── migrations/        # Generated migration files
│   │   └── seed.ts            # Seed data script
│   ├── app/                   # Next.js app directory
│   └── lib/                   # Utility functions
├── docker-compose.yml         # Docker configuration
├── drizzle.config.ts         # Drizzle ORM configuration
├── .env                       # Environment variables
└── package.json              # Dependencies
```

## Troubleshooting

### Docker Issues
If Docker container fails to start:
```bash
# Check logs
docker-compose logs postgres

# Remove existing container and volume
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues
If you can't connect to the database:
1. Verify Docker container is running: `docker ps`
2. Check the `.env` file has correct credentials
3. Ensure port 5432 is not used by another service

### Migration Issues
If migrations fail:
```bash
# Reset database
docker-compose down -v
docker-compose up -d
npm run db:push
```

## Next Development Phase
After setup is complete, we'll create:
1. Seed data script
2. Authentication setup
3. API routes
4. UI components
5. Reporting features
