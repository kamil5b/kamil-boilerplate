# Kamil Boilerplate - POS & Inventory Management System

A complete POS (Point of Sale) and Inventory Management system built with Next.js 16, TypeScript, and PostgreSQL.

## Features

- **Authentication System**: Login, register, forgot password, account activation with JWT
- **User Management**: RBAC with 5 roles (Super Admin, Admin, Warehouse Manager, Cashier, Finance)
- **Customer Management**: Full CRUD for customer data
- **Product Management**: Products with types (Raw Material, Finished Goods, Service), units, and inventory tracking
- **Unit Quantity Management**: Configurable units of measurement
- **Inventory Management**: Real-time stock tracking, manipulation (add/remove), and detailed summaries
- **Transaction Management**: Buy/Sell transactions with multiple items, discounts, and taxes
- **Payment Management**: Multiple payment types (Cash, Card, QRIS, Transfer) with status tracking
- **Tax Management**: Configurable tax rates
- **Analytics & Reports**: Transaction summaries, product-specific reports, inventory summaries
- **Role-Based Access Control**: Granular permissions across all features

## Tech Stack

- **Frontend**: Next.js 16.0.3, React 19.2.0, TypeScript 5
- **UI Library**: Radix UI primitives, Tailwind CSS v4, shadcn/ui components, lucide-react icons
- **Charts**: Recharts for data visualization
- **Backend**: Next.js API Routes with 3-layer architecture (Handler → Service → Repository)
- **Database**: PostgreSQL with pg driver, raw SQL queries
- **Authentication**: JWT tokens (jsonwebtoken), bcryptjs for password hashing
- **Email**: nodemailer for account activation and password reset

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── auth/           # Public auth endpoints
│   │   ├── users/          # User CRUD
│   │   ├── customers/      # Customer CRUD
│   │   ├── products/       # Product CRUD
│   │   ├── taxes/          # Tax CRUD
│   │   ├── unit-quantities/ # Unit quantity CRUD
│   │   ├── inventory-histories/  # Inventory operations
│   │   ├── transactions/   # Transaction management
│   │   ├── payments/       # Payment processing
│   │   ├── me/             # Current user info
│   │   └── mail/           # Email utilities
│   ├── (protected)/        # Protected routes
│   │   ├── customers/      # Customer pages
│   │   ├── dashboard/      # Dashboard
│   │   ├── inventory-histories/  # Inventory pages
│   │   ├── payments/       # Payment pages
│   │   ├── products/       # Product pages
│   │   ├── taxes/          # Tax pages
│   │   ├── transactions/   # Transaction pages
│   │   ├── unit-quantities/ # Unit quantity pages
│   │   └── users/          # User pages
│   ├── (public)/           # Public routes
│   │   ├── login/          # Login page
│   │   └── register/       # Register page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── client/                  # Client-side code
│   ├── components/         # Reusable UI components
│   ├── helpers/            # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Layout components
│   └── pages/              # Page components
├── server/                  # Server-side code
│   ├── db/                 # Database connection pool
│   ├── handlers/           # HTTP request handlers
│   ├── services/           # Business logic + transactions
│   ├── repositories/       # Data access layer (SQL)
│   └── utils/              # Utilities (auth, error, email)
└── shared/                  # Shared types
    ├── entities/           # Database entity interfaces
    ├── enums/              # Application enums
    ├── request/            # API request types
    ├── response/           # API response types
    └── rbac/               # RBAC configuration

migrations/                  # SQL migration files (11 migrations)
docs/                       # Documentation
```

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 14+
- sql-migrate (for running migrations)

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd kamil-boilerplate
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database credentials (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
- JWT_SECRET (use a strong random string)
- Email configuration (if using email features)

4. **Setup database**

Create the PostgreSQL database:
```bash
createdb kamil_boilerplate
```

Install sql-migrate:
```bash
go install github.com/rubenv/sql-migrate/...@latest
# or
brew install sql-migrate
```

Create `dbconfig.yml` in project root:
```yaml
development:
  dialect: postgres
  datasource: postgres://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME?sslmode=disable
  dir: migrations
  table: migrations
```

Run migrations:
```bash
sql-migrate up
```

5. **Run the development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## API Documentation

### Authentication (Public)

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/activate` - Activate account with token

### Protected Endpoints

All endpoints below require `Authorization: Bearer <token>` header.

**Users**
- `GET /api/users` - List users (paginated, searchable, filterable by role)
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Soft delete user

**Customers**
- `GET /api/customers` - List customers (paginated, searchable)
- `GET /api/customers/{id}` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Soft delete customer

**Products**
- `GET /api/products` - List products (paginated, searchable, filterable by type)
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Soft delete product

**Taxes**
- `GET /api/taxes` - List taxes (paginated, searchable)
- `GET /api/taxes/{id}` - Get tax by ID
- `POST /api/taxes` - Create tax
- `PUT /api/taxes/{id}` - Update tax
- `DELETE /api/taxes/{id}` - Soft delete tax

**Unit Quantities**
- `GET /api/unit-quantities` - List unit quantities (paginated, searchable)
- `GET /api/unit-quantities/{id}` - Get unit quantity by ID
- `POST /api/unit-quantities` - Create unit quantity
- `PUT /api/unit-quantities/{id}` - Update unit quantity
- `DELETE /api/unit-quantities/{id}` - Soft delete unit quantity

**Inventory**
- `GET /api/inventory-histories` - List inventory history (filterable by product, date)
- `GET /api/inventory-histories/{id}` - Get inventory history by ID
- `POST /api/inventory-histories` - Manipulate inventory (add/remove stock)
- `GET /api/inventory-histories/summary` - Get inventory summary

**Transactions**
- `GET /api/transactions` - List transactions (filterable by type, status, customer, date)
- `GET /api/transactions/{id}` - Get transaction by ID
- `POST /api/transactions` - Create transaction (with items, discounts, taxes)
- `GET /api/transactions/summary` - Get transaction summary with analytics
- `GET /api/transactions/product-summary` - Get product-specific transaction analytics

**Payments**
- `GET /api/payments` - List payments (filterable by type, transaction, date)
- `GET /api/payments/{id}` - Get payment by ID
- `POST /api/payments` - Create payment (auto-updates transaction status)

## RBAC Permissions

### Super Admin
Full access to all features

### Admin
All permissions except user management

### Warehouse Manager
- Products: Full CRUD
- Inventory: Full CRUD + summary
- Transactions: Read only
- Unit Quantities: Full CRUD

### Cashier
- Customers: Full CRUD
- Transactions: Create + Read
- Payments: Create + Read
- Products: Read only
- Taxes: Read only

### Finance
- Transactions: Read + summary
- Payments: Full CRUD
- Taxes: Full CRUD
- Customers: Read only
- Inventory: Read + summary

## Architecture

### 3-Layer Pattern

1. **Handlers** (`src/server/handlers/`)
   - Parse HTTP requests
   - Call service methods
   - Format responses
   - NO business logic

2. **Services** (`src/server/services/`)
   - Business logic
   - Transaction management (BEGIN/COMMIT/ROLLBACK)
   - Validation
   - Call repository methods

3. **Repositories** (`src/server/repositories/`)
   - SQL queries only
   - Accept PoolClient for transactions
   - Return raw data

### Transaction Pattern

Every service method follows:
```typescript
const client = await getDbClient();
try {
  await client.query('BEGIN');
  // Business logic + repository calls
  await client.query('COMMIT');
  return result;
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## Development

**Run development server:**
```bash
pnpm dev
```

**Build for production:**
```bash
pnpm build
```

**Start production server:**
```bash
pnpm start
```

**Lint code:**
```bash
pnpm lint
```

## Database Migrations

**Create new migration:**
```bash
sql-migrate new <migration_name>
```

**Run migrations:**
```bash
sql-migrate up
```

**Rollback migration:**
```bash
sql-migrate down
```

**Check migration status:**
```bash
sql-migrate status
```

## Environment Variables

See `.env.example` for all required variables:

- `DB_*`: Database connection settings
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time
- `FRONTEND_URL`: Frontend URL for email links
- `EMAIL_*`: Email server configuration

## Documentation

See `docs/` folder for detailed documentation:

- `CLIENT.md` - Client-side implementation guide (components, pages, hooks, helpers)
- `SERVER.md` - Server-side architecture (3-layer pattern, handlers, services, repositories)
- `SHARED.md` - Shared types and interfaces (entities, enums, request/response types)
- `RBAC.md` - Role-based access control (permissions, roles, Protected component)
- `TECH.md` - Technical specifications (architecture rules, patterns, conventions)
- `STEP-BY-STEP-GUIDE.md` - Development guide (step-by-step instructions)
- `SMTP_CONFIGURATION.md` - Email configuration guide

## License

MIT
