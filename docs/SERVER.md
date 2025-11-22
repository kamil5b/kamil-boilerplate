# Server Architecture Guide

This directory contains the backend/server-side logic for the application, following a clean layered architecture pattern. The server code is organized into distinct layers with clear separation of concerns.

## 📁 Directory Structure

```
server/
├── db/              # Database connection management
├── handlers/        # HTTP request handlers (controllers)
├── services/        # Business logic layer
├── repositories/    # Data access layer
└── utils/           # Utility functions and helpers
```

## 🏗️ Architecture Overview

The server follows a **strict 3-layer architecture** pattern with clear separation of concerns:

```
HTTP Request → Handler → Service → Repository → Database
                  ↓         ↓          ↓
              HTTP Only  Business   SQL Queries
                         Logic +    (within TX)
                       Transaction
```

### Layer Responsibilities

1. **Handlers** (`handlers/`)
   - ✅ **ONLY** handle HTTP concerns
   - Parse request parameters and body
   - Extract data from request (query params, body, headers)
   - Call appropriate service methods
   - Format responses using service results
   - Handle errors and return appropriate HTTP status codes
   - ❌ **NO** business logic
   - ❌ **NO** validation logic
   - ❌ **NO** database operations

2. **Services** (`services/`)
   - ✅ Implement **ALL** business logic
   - Orchestrate operations across repositories
   - Validate business rules
   - Transform data between layers
   - Throw `AppError` for business rule violations
   - ✅ **Manage transactions**: BEGIN, COMMIT, ROLLBACK
   - Get database client from pool
   - Pass client to repository methods
   - ❌ **NO** SQL queries (except transaction control)
   - ❌ **NO** HTTP handling

3. **Repositories** (`repositories/`)
   - ✅ Direct database interactions using **client from service**
   - Execute SQL queries within transaction
   - Map database rows to domain entities
   - Handle data persistence
   - Accept `PoolClient` parameter in all methods
   - ❌ **NO** business logic
   - ❌ **NO** transaction management (BEGIN/COMMIT/ROLLBACK)
   - ❌ **NO** direct pool usage

4. **Utils** (`utils/`)
   - Shared utility functions
   - Authentication helpers
   - Response formatters
   - Email services

## 📋 Module Structure

Each domain (e.g., users, clients, vendors) follows this pattern:

```typescript
// Handler (HTTP layer only - NO logic)
export class UserHandler {
  private userService = createUserService();
  
  async getUsers(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Parse request parameters (HTTP concerns only)
      const { searchParams } = new URL(request.url);
      const params: GetUsersRequest = {
        page: searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 1,
        limit: searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 10,
        search: searchParams.get("search") || undefined,
      };
      
      // 2. Call service (NO business logic here)
      const result = await this.userService.getUsers(params);
      
      // 3. Return response
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private handleError(error: unknown): NextResponse {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Service (business logic + transaction management)
export interface UserService {
  getUsers(params: GetUsersRequest): Promise<PaginatedResponse<UserResponse>>;
  // ... other methods
}

export function createUserService(): UserService {
  const userRepo = createUserRepository();
  
  return {
    async getUsers(params) {
      // Get database client for transaction
      const client = await getDbClient();
      
      try {
        // Begin transaction
        await client.query('BEGIN');
        
        // Business logic and validation
        const page = params.page || 1;
        const limit = params.limit || 10;
        
        // Call repository with client
        const { users, total } = await userRepo.findAll(client, {
          page,
          limit,
          search: params.search,
        });
        
        // Transform data
        const totalPages = Math.ceil(total / limit);
        const message = users.length === 0 ? "OK, But its empty" : "OK";
        
        // Commit transaction
        await client.query('COMMIT');
        
        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: users.map(mapUserToResponse),
        };
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        throw error;
      } finally {
        // Release client back to pool
        client.release();
      }
    }
  };
}

// Repository (SQL only - within transaction)
export interface UserRepository {
  findAll(client: PoolClient, params: {...}): Promise<{ users: User[]; total: number }>;
  findById(client: PoolClient, id: string): Promise<User | null>;
  // ... other methods
}

export function createUserRepository(): UserRepository {
  return {
    async findAll(client, params) {
      // SQL query using client (within transaction from service)
      const result = await client.query(
        "SELECT * FROM users WHERE deleted_at IS NULL LIMIT $1 OFFSET $2",
        [params.limit, (params.page - 1) * params.limit]
      );
      
      const countResult = await client.query(
        "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"
      );
      
      return {
        users: result.rows.map(mapDbRowToUser),
        total: parseInt(countResult.rows[0].count)
      };
    }
  };
}
```

## 🗂️ Available Modules

### 1. Authentication (`auth.*`)
- **Handler**: `AuthHandler`
- **Service**: `AuthService`
- **Features**:
  - Login with email/password
  - Forgot password (with email reset link)
  - Reset password (with token verification)
  - JWT token generation and verification

### 2. Users (`user.*`)
- **Handler**: `UserHandler`
- **Service**: `UserService`
- **Repository**: `UserRepository`
- **Features**:
  - CRUD operations for users
  - Role-based filtering
  - Search by name/email
  - Pagination and sorting
  - Password management

### 3. Clients (`client.*`)
- **Handler**: `ClientHandler`
- **Service**: `ClientService`
- **Repository**: `ClientRepository`
- **Features**:
  - CRUD operations for clients
  - Search and filtering
  - Pagination
  - Soft deletes

### 4. Vendors (`vendor.*`)
- **Handler**: `VendorHandler`
- **Service**: `VendorService`
- **Repository**: `VendorRepository`
- **Features**:
  - CRUD operations for vendors
  - Search and filtering
  - Pagination
  - Soft deletes

### 5. Client Purchase Orders (`clientPurchaseOrder.*`)
- **Handler**: `ClientPurchaseOrderHandler`
- **Service**: `ClientPurchaseOrderService`
- **Repository**: `ClientPurchaseOrderRepository`
- **Features**:
  - CRUD operations for purchase orders
  - Status filtering
  - Client-based filtering
  - Pagination

## 🔧 Key Components

### Database Connection (`db/index.ts`)

```typescript
import { getDbPool, getDbClient } from '@/server/db';
import type { PoolClient } from 'pg';

// Get pool (rarely used directly - only for non-transactional queries)
const pool = getDbPool();

// Get client for transactions (use in services)
const client = await getDbClient();
try {
  await client.query('BEGIN');
  // ... your queries
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release(); // Always release
}
```

**Features**:
- PostgreSQL connection pool
- Singleton pattern for connection reuse
- `getDbClient()` for transaction management
- Configurable via environment variables
- Auto-reconnection handling

**Transaction Management**:
- Services get client using `getDbClient()`
- Services handle BEGIN, COMMIT, ROLLBACK
- Repositories receive client as parameter
- Always release client in `finally` block

### Error Handling (`utils/response.ts`)

```typescript
import { AppError } from '@/server/utils/response';

// Throw business logic errors
throw new AppError('User not found', 404);
throw new AppError('Invalid credentials', 401);
throw new AppError('Email already exists', 409);

// Create standardized responses
const response = createBaseResponse('Success message');
```

**AppError Properties**:
- `message`: Error description
- `statusCode`: HTTP status code (default: 500)

### Authentication (`utils/auth.ts`)

```typescript
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken,
  generateResetToken,
  verifyResetToken,
  getUserIdFromRequest
} from '@/server/utils/auth';

// Password hashing
const hashed = await hashPassword('password123');
const isValid = await verifyPassword('password123', hashed);

// JWT tokens
const token = generateToken({ userId, email, role });
const payload = verifyToken(token);

// Reset tokens (1 hour expiry)
const resetToken = generateResetToken(email);
const { email } = verifyResetToken(resetToken);

// Extract user from request
const userId = getUserIdFromRequest(request);
```

### Email Service (`utils/email.ts`)

```typescript
import { sendEmail, sendForgotPasswordEmail } from '@/server/utils/email';

// Generic email
await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome!</h1>',
  text: 'Welcome!'
});

// Forgot password email
await sendForgotPasswordEmail(email, resetToken);
```

**Note**: Currently logs to console in development. Implement with SendGrid/AWS SES/etc. for production.

## 🚀 Usage Examples

### Using in API Routes

```typescript
// app/api/(protected)/users/route.ts
import { UserHandler } from '@/server/handlers';

const handler = new UserHandler();

export async function GET(request: NextRequest) {
  return handler.getUsers(request);
}

export async function POST(request: NextRequest) {
  return handler.createUser(request);
}
```

### Using with Dynamic Routes

```typescript
// app/api/(protected)/users/[id]/route.ts
import { UserHandler } from '@/server/handlers';

const handler = new UserHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handler.getUserById(request, params.id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handler.updateUser(request, params.id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handler.deleteUser(request, params.id);
}
```

## 🔐 Security Best Practices

1. **Password Security**
   - Passwords are hashed using bcrypt with salt
   - Never store plain text passwords
   - Use 10 salt rounds (configurable)

2. **JWT Tokens**
   - Set `JWT_SECRET` in environment variables (production)
   - Default expiry: 7 days (configurable via `JWT_EXPIRES_IN`)
   - Tokens include: `userId`, `email`, `role`

3. **Reset Tokens**
   - 1-hour expiry for security
   - Single-use tokens
   - Type-checked to prevent misuse

4. **SQL Injection Protection**
   - All queries use parameterized statements
   - Never concatenate user input into SQL

5. **Soft Deletes**
   - Records are marked as deleted, not removed
   - Queries filter `deleted_at IS NULL`
   - Allows data recovery and audit trails

## 📝 Adding a New Module

To add a new domain (e.g., "products"):

### 1. Create Repository (`repositories/product.repository.ts`)

```typescript
import type { PoolClient } from 'pg';
import type { Product } from '@/shared';

export interface ProductRepository {
  findAll(client: PoolClient, params: {...}): Promise<{ products: Product[]; total: number }>;
  findById(client: PoolClient, id: string): Promise<Product | null>;
  create(client: PoolClient, data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(client: PoolClient, id: string, data: Partial<Product>): Promise<Product | null>;
  delete(client: PoolClient, id: string): Promise<boolean>;
}

export function createProductRepository(): ProductRepository {
  return {
    async findAll(client, params) {
      // SQL query using client (within transaction)
      const result = await client.query(
        'SELECT * FROM products WHERE deleted_at IS NULL LIMIT $1 OFFSET $2',
        [params.limit, (params.page - 1) * params.limit]
      );
      
      const countResult = await client.query(
        'SELECT COUNT(*) FROM products WHERE deleted_at IS NULL'
      );
      
      return {
        products: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    },
    
    async findById(client, id) {
      const result = await client.query(
        'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      return result.rows[0] || null;
    },
    // ... other methods
  };
}
```

### 2. Create Service (`services/product.service.ts`)

```typescript
import { getDbClient } from '../db';
import { createProductRepository } from '../repositories';
import { AppError } from '../utils/response';
import type { ProductResponse, CreateProductRequest } from '@/shared';

export interface ProductService {
  getProducts(params: {...}): Promise<PaginatedResponse<ProductResponse>>;
  getProductById(id: string): Promise<ProductResponse>;
  createProduct(data: CreateProductRequest): Promise<ProductResponse>;
  // ... other methods
}

export function createProductService(): ProductService {
  const productRepo = createProductRepository();
  
  return {
    async getProductById(id) {
      const client = await getDbClient();
      
      try {
        await client.query('BEGIN');
        
        // Business logic
        const product = await productRepo.findById(client, id);
        if (!product) {
          throw new AppError('Product not found', 404);
        }
        
        await client.query('COMMIT');
        return product;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    // ... other methods
  };
}
```

### 3. Create Handler (`handlers/product.handler.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createProductService } from '../services';
import { AppError, createBaseResponse } from '../utils/response';

export class ProductHandler {
  private productService = createProductService();
  
  async getProductById(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      // 1. Parse request (HTTP concerns only - NO logic)
      // id already extracted from URL by Next.js
      
      // 2. Call service
      const product = await this.productService.getProductById(id);
      
      // 3. Return response
      return NextResponse.json({
        ...createBaseResponse(),
        data: product
      }, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private handleError(error: unknown): NextResponse {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Export from Index Files

```typescript
// repositories/index.ts
export * from './product.repository';

// services/index.ts
export * from './product.service';

// handlers/index.ts
export * from './product.handler';
```

### 5. Create API Route

```typescript
// app/api/(protected)/products/[id]/route.ts
import { ProductHandler } from '@/server/handlers';

const handler = new ProductHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handler.getProductById(request, params.id);
}
```

## 🔍 Common Patterns

### Transaction Pattern (CRITICAL)

**Every service method MUST follow this pattern:**

```typescript
// Service layer - ALWAYS use transactions
async getItems(params: GetItemsRequest): Promise<PaginatedResponse<ItemResponse>> {
  const client = await getDbClient();
  
  try {
    // BEGIN transaction
    await client.query('BEGIN');
    
    // Business logic
    const page = params.page || 1;
    const limit = params.limit || 10;
    
    // Call repository with client
    const { items, total } = await itemRepo.findAll(client, { page, limit });
    
    // Transform data
    const totalPages = Math.ceil(total / limit);
    const message = items.length === 0 ? 'OK, But its empty' : 'OK';
    
    // COMMIT transaction
    await client.query('COMMIT');
    
    return {
      message,
      requestedAt: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      meta: { page, limit, totalPages, totalItems: total },
      items: items.map(mapItemToResponse)
    };
  } catch (error) {
    // ROLLBACK on any error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // ALWAYS release client
    client.release();
  }
}
```

### Complex Transaction Pattern (Multiple Operations)

```typescript
// Service layer - Complex operations in single transaction
async createOrderWithItems(data: CreateOrderRequest): Promise<OrderResponse> {
  const client = await getDbClient();
  
  try {
    await client.query('BEGIN');
    
    // 1. Validate business rules
    if (data.items.length === 0) {
      throw new AppError('Order must have at least one item', 400);
    }
    
    // 2. Check inventory
    for (const item of data.items) {
      const product = await productRepo.findById(client, item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 404);
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}`, 400);
      }
    }
    
    // 3. Create order (all in same transaction)
    const order = await orderRepo.create(client, {
      customerId: data.customerId,
      total: data.total,
    });
    
    // 4. Create order items
    for (const item of data.items) {
      await orderItemRepo.create(client, {
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
      
      // 5. Update inventory
      await productRepo.decrementStock(client, item.productId, item.quantity);
    }
    
    // 6. Commit everything together
    await client.query('COMMIT');
    
    return mapOrderToResponse(order);
  } catch (error) {
    // Rollback ALL changes on any error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Pagination Pattern

```typescript
// Repository layer - Accept client parameter
async findAll(client: PoolClient, params) {
  const offset = (params.page - 1) * params.limit;
  
  const countResult = await client.query(
    'SELECT COUNT(*) FROM items WHERE deleted_at IS NULL'
  );
  const total = parseInt(countResult.rows[0].count);
  
  const result = await client.query(
    'SELECT * FROM items WHERE deleted_at IS NULL LIMIT $1 OFFSET $2',
    [params.limit, offset]
  );
  
  return { items: result.rows, total };
}
```

### Search and Filter Pattern

```typescript
// Repository layer - Accept client parameter
async findAll(client: PoolClient, params) {
  let query = 'SELECT * FROM items WHERE deleted_at IS NULL';
  const queryParams: unknown[] = [];
  let paramIndex = 1;
  
  // Search
  if (params.search) {
    query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    queryParams.push(`%${params.search}%`);
    paramIndex++;
  }
  
  // Filter by status
  if (params.status) {
    query += ` AND status = $${paramIndex}`;
    queryParams.push(params.status);
    paramIndex++;
  }
  
  // Sorting
  if (params.sortByName) {
    query += ` ORDER BY name ${params.sortByName}`;
  }
  
  // Pagination
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(params.limit, (params.page - 1) * params.limit);
  
  const result = await client.query(query, queryParams);
  return result.rows;
}
```

### Soft Delete Pattern

```typescript
// Repository layer - Accept client parameter
async delete(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    'UPDATE items SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return result.rowCount > 0;
}

// All queries filter deleted records
'SELECT * FROM items WHERE deleted_at IS NULL'
```

### Handler Pattern (HTTP Only - No Logic)

```typescript
// Handler - Parse request, call service, return response
export class ItemHandler {
  private itemService = createItemService();
  
  async createItem(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Parse request body
      const body: CreateItemRequest = await request.json();
      
      // 2. Call service (ALL logic is in service)
      const item = await this.itemService.createItem(body);
      
      // 3. Return response
      return NextResponse.json(
        {
          ...createBaseResponse('Item created successfully'),
          data: item
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  async getItems(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Parse query parameters
      const { searchParams } = new URL(request.url);
      const params: GetItemsRequest = {
        page: searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 1,
        limit: searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 10,
        search: searchParams.get("search") || undefined,
        status: searchParams.get("status") || undefined,
      };
      
      // 2. Call service
      const result = await this.itemService.getItems(params);
      
      // 3. Return response
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private handleError(error: unknown): NextResponse {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🌍 Environment Variables

Required environment variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sean_alpha_mvp
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

## 🧪 Testing

When writing tests for server components:

1. **Repository Tests**: Mock database queries
2. **Service Tests**: Mock repository methods
3. **Handler Tests**: Mock service methods

Example:

```typescript
// Example test structure (not implemented yet)
describe('UserService', () => {
  it('should throw error when user not found', async () => {
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(null)
    };
    
    const service = createUserService();
    // Override repo...
    
    await expect(service.getUserById('123'))
      .rejects.toThrow(new AppError('User not found', 404));
  });
});
```

## 📚 Related Documentation

- [Shared Types](/src/shared/README.md) - Type definitions and interfaces
- [API Routes](/src/app/api/README.md) - API endpoint documentation
- [Database Migrations](/migrations/README.md) - Database schema and migrations

## ✅ Architecture Checklist

Before committing code, ensure:

### Handler Layer ✓
- [ ] Only handles HTTP concerns (parse request, return response)
- [ ] NO business logic
- [ ] NO validation logic
- [ ] NO database operations
- [ ] Calls service methods only
- [ ] Returns proper HTTP status codes

### Service Layer ✓
- [ ] ALL business logic is here
- [ ] Uses `getDbClient()` to get database client
- [ ] Every method starts with `BEGIN` transaction
- [ ] Every method ends with `COMMIT` on success
- [ ] Every method has `ROLLBACK` in catch block
- [ ] Every method has `client.release()` in finally block
- [ ] Passes client to all repository methods
- [ ] NO direct SQL queries (except BEGIN/COMMIT/ROLLBACK)
- [ ] Throws `AppError` for business rule violations

### Repository Layer ✓
- [ ] ALL methods accept `PoolClient` as first parameter
- [ ] Uses client parameter for all queries (not pool)
- [ ] Only contains SQL queries and data mapping
- [ ] NO business logic
- [ ] NO transaction management (BEGIN/COMMIT/ROLLBACK)
- [ ] NO validation logic
- [ ] Uses parameterized queries (prevents SQL injection)

## 🤝 Contributing

When adding new features, **STRICTLY** follow these rules:

### Handler Rules (HTTP Only)
1. ✅ Parse request parameters, body, headers
2. ✅ Extract data from Next.js request
3. ✅ Call service methods
4. ✅ Format and return HTTP responses
5. ❌ NO validation (do in service)
6. ❌ NO business logic (do in service)
7. ❌ NO database calls (do in repository via service)

### Service Rules (Business Logic + Transactions)
1. ✅ Get client: `const client = await getDbClient()`
2. ✅ Start transaction: `await client.query('BEGIN')`
3. ✅ Implement ALL business logic
4. ✅ Validate ALL business rules
5. ✅ Pass client to repository methods
6. ✅ Commit on success: `await client.query('COMMIT')`
7. ✅ Rollback on error: `await client.query('ROLLBACK')`
8. ✅ Release client: `client.release()` in finally
9. ❌ NO SQL queries (except BEGIN/COMMIT/ROLLBACK)
10. ❌ NO HTTP handling

### Repository Rules (SQL Only)
1. ✅ Accept `PoolClient` as first parameter
2. ✅ Use client for ALL queries
3. ✅ Use parameterized queries: `client.query('SELECT * FROM users WHERE id = $1', [id])`
4. ✅ Map database rows to domain entities
5. ❌ NO business logic
6. ❌ NO validation
7. ❌ NO transaction control (BEGIN/COMMIT/ROLLBACK)
8. ❌ NO direct pool usage

### General Rules
1. Use TypeScript interfaces for all layer contracts
2. Throw `AppError` for business logic violations
3. Implement soft deletes (use `deleted_at IS NULL`)
4. Add JSDoc comments for complex logic
5. Follow existing naming conventions

## 📞 Support

For questions or issues related to the server architecture, please refer to:
- Main project README
- TECH.md for technology stack details
- IMPLEMENTATION.md for implementation guidelines
