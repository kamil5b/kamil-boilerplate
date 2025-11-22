# Fullstack Next JS Monolith

Model (shared):
- folder name inside src: `shared`
- Modular architecture with organized folders:
  - `shared/entities/` - Database entity interfaces (matching DB schema)
  - `shared/enums/` - Application enums organized by domain
  - `shared/rbac/` - Role-Based Access Control configuration
  - `shared/request/` - API request types organized by domain
  - `shared/response/` - API response types organized by domain
- Each domain has its own file (e.g., `user.entity.ts`, `user.request.ts`, `user.response.ts`)
- All exports available from `@/shared` or subfolders (e.g., `@/shared/entities`)

Controller (backend):
- folder name inside src: `server`
- **3-Layer Architecture** with strict separation:
  - `server/handlers/` - HTTP layer (parse request, return response) - NO business logic
  - `server/services/` - Business logic + Transaction management (BEGIN/COMMIT/ROLLBACK)
  - `server/repositories/` - Data access layer (SQL queries only, accepts PoolClient)
  - `server/db/` - Database connection pool management
  - `server/utils/` - Utilities (auth, response, email)
- PostgreSQL with connection pooling
- No ORM - raw SQL with parameterized queries
- Migration using `sql-migrate`
- **Transaction Pattern (CRITICAL)**:
  - Services get client: `const client = await getDbClient()`
  - Services manage: `BEGIN` → business logic → `COMMIT` / `ROLLBACK`
  - Repositories receive client and execute queries within transaction
  - Always release: `client.release()` in finally block

View (frontend):
- folder name inside src: `client`
- Modular architecture with organized folders:
  - `client/template/` - Generic page templates for CRUD operations
    - `ListPageTemplate` - Reusable list page with pagination, search, CRUD
    - `FormPageTemplate` - Reusable form page for create/edit operations
    - Reduces boilerplate code with configurable templates
  - `client/pages/` - Page components organized by domain (25+ page components)
    - `pages/auth/` - Auth pages (LoginPage, RegisterPage)
    - `pages/dashboard/` - Dashboard page (DashboardPage)
    - `pages/user/` - User management (UsersListPage, UserFormPage)
    - `pages/customer/` - Customer management (CustomersListPage, CustomerFormPage)
    - `pages/product/` - Product management (ProductsListPage, ProductFormPage, ProductInventoryDetailPage, ProductTransactionDetailPage)
    - `pages/unit-quantity/` - Unit quantity management (UnitQuantitiesListPage, UnitQuantityFormPage)
    - `pages/tax/` - Tax management (TaxesListPage, TaxFormPage)
    - `pages/inventory/` - Inventory management (InventoryHistoriesListPage, InventoryManipulatePage, InventorySummaryPage)
    - `pages/transaction/` - Transaction management (TransactionsListPage, TransactionFormPage, TransactionDetailPage, TransactionDashboardPage)
    - `pages/payment/` - Payment management (PaymentsListPage, PaymentFormPage, PaymentDetailPage, PaymentDashboardPage)
    - `pages/finance/` - Finance dashboard (FinanceDashboardPage)
  - `client/layouts/` - Layout components (ProtectedLayout, PublicLayout)
  - `client/template/` - Generic page templates for CRUD operations
    - `ListPageTemplate` - Reusable list page with pagination, search, CRUD
    - `FormPageTemplate` - Reusable form page for create/edit operations
    - Reduces boilerplate code with configurable templates
  - `client/components/` - Reusable UI components
    - shadcn/ui base components (ui folder)
    - Composed components: PageHeader, SearchBar, Pagination, TableActions, etc.
    - Form components: FormField, PaginatedSelect, ErrorAlert, LoadingSpinner
    - Protected component for conditional rendering based on permissions
  - `client/hooks/` - Custom React hooks (useAuth, usePagination, usePermissions, useDebounce)
  - `client/helpers/` - Utility functions (api, formatters, validation, rbac)
  - `client/utils.ts` - shadcn/ui cn utility
- React 19 based
- Tailwind CSS v4 + shadcn/ui for styling
- lucide-react for icons
- recharts for data visualization
- Additional Radix UI primitives:
  - @radix-ui/react-label, react-select, react-separator, react-slot

App Route rules:
- `src/app/api/**/route.ts` **ONLY** import from `@/server/handlers`
  - Minimal wrappers that call handler methods
  - NO business logic in routes
- `src/app/**/page.tsx` **ONLY** import from `@/client/pages` or `@/client/layouts`
  - Minimal wrappers that handle navigation callbacks
  - Pass `router.push()` callbacks to page components
  - NO business logic in routes
- There must be 2 levels of privilege:
    - `src/app/(public)/**/route.ts||page.tsx` for public page/API
    - `src/app/(protected)/**/route.ts||page.tsx||layout.tsx` for authenticated page/API
- Page components are navigation-agnostic (receive callbacks as props)

Auth:
- Using JWT Token system (jsonwebtoken)
- Password hashing with bcryptjs
- Super admin from DB Migration (without password, must forgot password)
- Forgot Password send email
- Super admin can create user without password and send forgot password to user's email
- Public and Protected layout must be different (use `@/client/layouts`)
- Protected layout has sidebar navigation with lucide-react icons
- If user has login, it goes to dashboard. If user hard code to `/login` then must goes back to dashboard
- Authentication state managed via localStorage (`auth_token`)
- Middleware protects routes at `/api/(protected)/*` and `/(protected)/*`

Response:
- All responses must extend from common:
```json
{
    "message": "string",
    "requestedAt": "rfc3999",
    "requestId": "uuid"
}
```
- Error response just like:
```json
STATUS CODE: 4XX (user's fault), 5XX (internal fault)
{
    "message": "error message",
    "requestedAt": "rfc3999",
    "requestId": "uuid"
}

```
- Success response:
```json
STATUS CODE: 2XX
{
    "message": "OK",
    "requestedAt": "rfc3999",
    "requestId": "uuid",
    ...
}
```

Pagination
- Must be GET request
- Request query parameters:
    - `page` - Current page number (default: 1)
    - `limit` - Items per page (default: 10)
    - `search` - Search query string (optional)
    - `sortByX` - Sort field with value "asc" or "desc" (optional)
    - `filterByX` - Array of IDs to filter (optional)
- Response must be:
```json
STATUS CODE: 200
{
    "message": "OK",
    "requestedAt": "rfc3999",
    "requestId": "uuid",
    "meta": {
        "page":1,
        "limit":10,
        "totalPages":1,
        "totalItems":1,
    },
    "items": [
        {
            ....
        }
    ]
}
```
- If OK but empty then the message += ", But its empty"
- Client-side: Use `usePagination` hook with `fetchPaginated` helper
- Server-side: Implement in repository with OFFSET/LIMIT

## Architecture Patterns

### Backend Layer Responsibilities

**Handler (HTTP Only)**
- ✅ Parse request parameters, body, headers
- ✅ Call service methods
- ✅ Format and return HTTP responses
- ❌ NO business logic
- ❌ NO validation
- ❌ NO database operations

**Service (Business Logic + Transactions)**
- ✅ ALL business logic and validation
- ✅ Transaction management (BEGIN/COMMIT/ROLLBACK)
- ✅ Get client: `const client = await getDbClient()`
- ✅ Pass client to repository methods
- ✅ Release client in finally: `client.release()`
- ✅ Throw `AppError` for business rule violations
- ❌ NO SQL queries (except BEGIN/COMMIT/ROLLBACK)
- ❌ NO HTTP handling

**Repository (Data Access)**
- ✅ Accept `PoolClient` as first parameter in ALL methods
- ✅ Execute SQL queries using client parameter
- ✅ Use parameterized queries: `client.query('SELECT * FROM users WHERE id = $1', [id])`
- ✅ Map database rows to domain entities
- ❌ NO business logic
- ❌ NO validation
- ❌ NO transaction management
- ❌ NO direct pool usage

### Frontend Component Hierarchy

```
App Route (minimal wrapper)
    ↓
Layout (ProtectedLayout / PublicLayout)
    ↓
Page Component (business logic)
    ↓ (optional: use templates)
Templates (ListPageTemplate / FormPageTemplate)
    ↓
Composed Components (PageHeader, SearchBar, etc.)
    ↓
UI Primitives (Button, Input, Table, etc.)
```

**Route Components**
- Minimal wrappers (navigation only)
- Import from `@/client/pages` or `@/client/layouts`
- Pass navigation callbacks to pages
- NO business logic, NO API calls

**Page Components**
- Business logic and state management
- Use hooks: `usePagination`, `useAuth`
- Use helpers: `fetchPaginated`, `createResource`, etc.
- Accept callbacks for navigation
- Handle loading and error states

**Composed Components**
- Reusable UI building blocks
- Examples: `PageHeader`, `SearchBar`, `Pagination`, `TableActions`
- Located in `@/client/components`

**UI Primitives**
- Base shadcn/ui components
- Located in `@/client/components/ui`
- Examples: `Button`, `Input`, `Table`, `Card`

## Security Best Practices

- **SQL Injection**: Use parameterized queries ALWAYS
- **Passwords**: Hash with bcrypt, never store plain text
- **JWT**: Secure secret in production, 7-day expiry
- **Soft Deletes**: Use `deleted_at IS NULL` in queries
- **Authorization**: Check permissions in handlers via `getUserIdFromRequest()`
- **RBAC**: Configure in `@/shared/rbac/rbac.ts`

## Development Workflow

1. Create migration file (`migrations/XXX_description.sql`)
2. Define types in `@/shared` (entities, enums, requests, responses)
3. Run migration: `sql-migrate up`
4. Create repository (data access)
5. Create service (business logic + transactions)
6. Create handler (HTTP layer)
7. Create API routes (minimal wrappers)
8. Create page components (with hooks and helpers)
9. Create app routes (navigation callbacks)
10. Update sidebar if needed (`layouts/sidebar.json`)

## Key Dependencies

- **Backend**: `pg`, `bcryptjs`, `jsonwebtoken`, `sql-migrate`
- **Frontend**: `react@19`, `next`, `tailwindcss@4`, `shadcn/ui`, `lucide-react`
- **Advanced Components**: `cmdk`, `@radix-ui/react-popover`, `@radix-ui/react-icons`

## Documentation

- `/src/server/README.md` - Server architecture guide
- `/src/client/README.md` - Client architecture guide
- `/src/shared/README.md` - Shared types documentation
- `/STEP-BY-STEP-GUIDE.md` - Implementation guide
- `/IMPLEMENTATION.md` - Implementation details
