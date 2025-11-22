# Quick Start Guide

This guide will help you get the application up and running in minutes.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- PostgreSQL 14+ installed and running
- sql-migrate installed (`go install github.com/rubenv/sql-migrate/...@latest`)

## Step 1: Clone and Install

```bash
# Install dependencies
pnpm install
```

## Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and configure:
# - Database credentials (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
# - JWT_SECRET (use a strong random string)
# - Email settings (if using email features)
```

Example `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kamil_boilerplate
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

## Step 3: Setup Database

```bash
# Create database
createdb kamil_boilerplate

# Or using psql
psql -U postgres -c "CREATE DATABASE kamil_boilerplate;"
```

Edit `dbconfig.yml` with your database credentials:
```yaml
development:
  dialect: postgres
  datasource: postgres://postgres:your_password@localhost:5432/kamil_boilerplate?sslmode=disable
  dir: migrations
  table: migrations
```

## Step 4: Run Migrations

```bash
# Run all migrations
sql-migrate up

# Check migration status
sql-migrate status
```

Expected output:
```
+--------------------------------------------+
| Migration                                   | Applied
+--------------------------------------------+
| 001_create_users_table.sql                  | yes
| 002_create_customers_table.sql              | yes
| 003_create_unit_quantities_table.sql        | yes
| 004_create_products_table.sql               | yes
| 005_create_inventory_histories_table.sql    | yes
| 006_create_taxes_table.sql                  | yes
| 007_create_transactions_table.sql           | yes
| 008_create_transaction_items_table.sql      | yes
| 009_create_discounts_table.sql              | yes
| 010_create_payments_table.sql               | yes
| 011_create_payment_details_table.sql        | yes
+--------------------------------------------+
```

## Step 5: Run Development Server

```bash
pnpm dev
```

The API will be available at `http://localhost:3000/api`

## Step 6: Test the API

### Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "Admin123!",
    "role": "SUPER_ADMIN"
  }'
```

### Activate account (check console for token):
```bash
curl -X POST http://localhost:3000/api/auth/activate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ACTIVATION_TOKEN_FROM_CONSOLE"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

This will return a JWT token. Save it for subsequent requests.

### Test protected endpoint:
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Available Endpoints

### Public Routes
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/activate` - Activate account

### Protected Routes (require JWT token)
- `/api/users` - User management
- `/api/customers` - Customer management
- `/api/products` - Product management
- `/api/unit-quantities` - Unit quantity management
- `/api/taxes` - Tax management
- `/api/inventory-histories` - Inventory management
- `/api/transactions` - Transaction management
- `/api/payments` - Payment management

See README.md for complete API documentation.

## Common Issues

### Database connection error
- Check that PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database exists: `psql -U postgres -l | grep kamil_boilerplate`

### Migration errors
- Check `dbconfig.yml` has correct credentials
- Ensure sql-migrate is installed: `sql-migrate --version`
- Try rolling back and reapplying: `sql-migrate down && sql-migrate up`

### JWT token errors
- Ensure JWT_SECRET is set in `.env`
- Check token is included in Authorization header: `Bearer <token>`
- Verify token hasn't expired (default: 7 days)

### Port already in use
- Change PORT in `.env` or kill process using port 3000:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

## Next Steps

1. **Test all endpoints** - Use Postman, Thunder Client, or curl
2. **Create sample data** - Add customers, products, taxes, etc.
3. **Test transactions** - Create a SELL transaction with items and discounts
4. **Test payments** - Add payments to transactions and watch status updates
5. **Build frontend** - Start implementing client pages and components

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Lint code

# Database
sql-migrate up        # Run migrations
sql-migrate down      # Rollback last migration
sql-migrate status    # Check migration status
sql-migrate new name  # Create new migration

# PostgreSQL
psql -U postgres kamil_boilerplate  # Connect to database
\dt                   # List tables
\d users              # Describe users table
\q                    # Quit
```

## Support

For issues or questions:
1. Check README.md for detailed documentation
2. Review docs/ folder for architecture guides
3. Check IMPLEMENTATION_STATUS.md for current status

Happy coding! 🚀
