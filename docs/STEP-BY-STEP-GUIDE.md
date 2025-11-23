# Step by step guide

## 1. Create `.sql` migration file
- Location: `migrations/XXX_description.sql`
- Include table creation with proper indexes
- Add soft delete support (`deleted_at` column)
- Use UUID for primary keys (`gen_random_uuid()`)

## 2. Create entity, enums, and interfaces in `shared`

### 2.1 Create Entity (if applicable)
- Location: `src/shared/entities/<name>.entity.ts`
- Define entity interface matching database schema
- Include `id`, `createdAt`, `updatedAt`, `deletedAt` fields
- Use camelCase for property names (snake_case in DB will be mapped)
- Export from `src/shared/entities/index.ts`
- Examples: `user.entity.ts`, `customer.entity.ts`, `product.entity.ts`

### 2.2 Create Enums (if applicable)
- Location: `src/shared/enums/<name>.enum.ts`
- Define domain-specific enums (Status, Type, Category, etc.)
- Use lowercase with underscores for enum values (e.g., `raw_material`, `finished_goods`)
- Export from `src/shared/enums/index.ts`
- Examples: `product.enum.ts` (ProductType), `transaction.enum.ts` (TransactionType, TransactionStatus), `payment.enum.ts` (PaymentType, PaymentStatus)

### 2.3 Create Request Types
- Location: `src/shared/request/<name>.request.ts`
- Define `Create<Name>Request` with required fields
- Define `Update<Name>Request` with optional fields
- Define `Get<Names>Request` extending `PaginationRequest`
- Export from `src/shared/request/index.ts`

### 2.4 Create Response Types
- Location: `src/shared/response/<name>.response.ts`
- Define `<Name>Response` with all fields as strings (dates in RFC3339)
- Include populated relation fields (e.g., `relatedName?`)
- Export from `src/shared/response/index.ts`

### 2.5 Update RBAC (if adding permissions)
- Location: `src/shared/enums/access_permission.enum.ts`
- Add new permissions following the pattern:
  - `MENU_*` - Can see menu item (e.g., `MENU_PRODUCT`, `MENU_TRANSACTION`)
  - `CREATE_*` - Can create resource (e.g., `CREATE_PRODUCT`, `CREATE_TRANSACTION`)
  - `DETAIL_*` - Can view details (e.g., `DETAIL_PRODUCT`, `DETAIL_TRANSACTION`)
  - `EDIT_*` - Can edit resource (e.g., `EDIT_PRODUCT`, `EDIT_TRANSACTION`)
  - `DELETE_*` - Can delete resource (e.g., `DELETE_PRODUCT`, `DELETE_TRANSACTION`)
  - `SUMMARY_*` - Can view summaries (e.g., `SUMMARY_TRANSACTION`, `SUMMARY_INVENTORY_HISTORY`)
- Location: `src/shared/rbac/rbac.ts`
- Update role permissions array for relevant roles (super_admin, admin, warehouse_manager, cashier, finance)

Note: All types are automatically available from `@/shared` or specific subfolders

## 3. Migrate
```bash
sql-migrate up
```

## 4. Create the API Endpoints

### 4.1 Create the repository
- Location: `src/server/repositories/<name>.repository.ts`
- **CRITICAL**: ALL methods MUST accept `PoolClient` as first parameter
- Implement data access methods:
  - `findById(client: PoolClient, id: string): Promise<Entity | null>`
  - `findAll(client: PoolClient, params: GetRequest): Promise<{ items: Entity[]; total: number }>`
  - `create(client: PoolClient, data: CreateRequest): Promise<Entity>`
  - `update(client: PoolClient, id: string, data: UpdateRequest): Promise<Entity | null>`
  - `delete(client: PoolClient, id: string): Promise<boolean>` - soft delete
- Use **client parameter** for ALL queries (NOT pool)
- Use parameterized queries to prevent SQL injection
- Return properly typed results
- ❌ **NO** business logic
- ❌ **NO** transaction management (BEGIN/COMMIT/ROLLBACK)
- ❌ **NO** validation

**Example:**
```typescript
export interface UserRepository {
  findById(client: PoolClient, id: string): Promise<User | null>;
  findAll(client: PoolClient, params: GetUsersRequest): Promise<{ users: User[]; total: number }>;
  create(client: PoolClient, data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(client: PoolClient, id: string, data: Partial<User>): Promise<User | null>;
  delete(client: PoolClient, id: string): Promise<boolean>;
}

export function createUserRepository(): UserRepository {
  return {
    async findById(client, id) {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      return result.rows[0] || null;
    },
    // ... other methods
  };
}
```

### 4.2 Create the service
- Location: `src/server/services/<name>.service.ts`
- **CRITICAL**: Every method MUST follow transaction pattern
- Implement business logic layer:
  - `get<Name>(id: string): Promise<Response>`
  - `get<Names>(params: GetRequest): Promise<PaginatedResponse<Response>>`
  - `create<Name>(data: CreateRequest): Promise<Response>`
  - `update<Name>(id: string, data: UpdateRequest): Promise<Response>`
  - `delete<Name>(id: string): Promise<void>`
- **Transaction Pattern (REQUIRED)**:
  1. Get client: `const client = await getDbClient()`
  2. Start transaction: `await client.query('BEGIN')`
  3. Implement ALL business logic and validation
  4. Pass client to repository methods
  5. Commit on success: `await client.query('COMMIT')`
  6. Rollback on error: `await client.query('ROLLBACK')` in catch
  7. Release client: `client.release()` in finally
- Throw `AppError` for business rule violations
- ❌ **NO** SQL queries (except BEGIN/COMMIT/ROLLBACK)
- ❌ **NO** HTTP handling

**Example:**
```typescript
export interface UserService {
  getUser(id: string): Promise<UserResponse>;
  getUsers(params: GetUsersRequest): Promise<PaginatedResponse<UserResponse>>;
  createUser(data: CreateUserRequest): Promise<UserResponse>;
  updateUser(id: string, data: UpdateUserRequest): Promise<UserResponse>;
  deleteUser(id: string): Promise<void>;
}

export function createUserService(): UserService {
  const userRepo = createUserRepository();
  
  return {
    async getUser(id) {
      const client = await getDbClient();
      
      try {
        await client.query('BEGIN');
        
        const user = await userRepo.findById(client, id);
        if (!user) {
          throw new AppError('User not found', 404);
        }
        
        await client.query('COMMIT');
        return mapUserToResponse(user);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    
    async getUsers(params) {
      const client = await getDbClient();
      
      try {
        await client.query('BEGIN');
        
        const page = params.page || 1;
        const limit = params.limit || 10;
        
        const { users, total } = await userRepo.findAll(client, { page, limit, search: params.search });
        
        await client.query('COMMIT');
        
        const totalPages = Math.ceil(total / limit);
        const message = users.length === 0 ? 'OK, But its empty' : 'OK';
        
        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: users.map(mapUserToResponse)
        };
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

### 4.3 Create the handler
- Location: `src/server/handlers/<name>.handler.ts`
- **CRITICAL**: Handlers are HTTP-only layer
- Implement HTTP request handlers:
  - `get<Name>(request: NextRequest, id: string): Promise<NextResponse>`
  - `get<Names>(request: NextRequest): Promise<NextResponse>`
  - `create<Name>(request: NextRequest): Promise<NextResponse>`
  - `update<Name>(request: NextRequest, id: string): Promise<NextResponse>`
  - `delete<Name>(request: NextRequest, id: string): Promise<NextResponse>`
- ✅ Parse request body and query params (HTTP concerns only)
- ✅ Call service methods
- ✅ Format and return HTTP responses
- ✅ Handle errors with proper status codes
- ❌ **NO** business logic
- ❌ **NO** validation (do in service)
- ❌ **NO** database operations

**Example:**
```typescript
export class UserHandler {
  private userService = createUserService();
  
  async getUser(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      // 1. Extract data from request (HTTP only)
      const userId = getUserIdFromRequest(request);
      
      // 2. Call service (ALL logic here)
      const user = await this.userService.getUser(id);
      
      // 3. Return response
      return NextResponse.json({
        ...createBaseResponse('User retrieved successfully'),
        data: user
      }, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  async getUsers(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Parse query params (HTTP only)
      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get('page') || '1');
      const limit = Number.parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      
      // 2. Call service (ALL logic here)
      const result = await this.userService.getUsers({ page, limit, search });
      
      // 3. Return response
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  async createUser(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Parse request body (HTTP only)
      const body = await request.json();
      const userId = getUserIdFromRequest(request);
      
      // 2. Call service (ALL logic here)
      const user = await this.userService.createUser(body);
      
      // 3. Return response
      return NextResponse.json({
        ...createBaseResponse('User created successfully'),
        data: user
      }, { status: 201 });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private handleError(error: unknown): NextResponse {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message, requestedAt: new Date().toISOString(), requestId: crypto.randomUUID() },
        { status: error.statusCode }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error', requestedAt: new Date().toISOString(), requestId: crypto.randomUUID() },
      { status: 500 }
    );
  }
}
```

### 4.4 Export from index files
```typescript
// repositories/index.ts
export * from './<name>.repository';

// services/index.ts
export * from './<name>.service';

// handlers/index.ts
export * from './<name>.handler';
```

### 4.5 Create API routes
- List: `src/app/(private)/api/<names>/route.ts`
  - GET: list with pagination
  - POST: create new item
- Detail: `src/app/(private)/api/<names>/[id]/route.ts`
  - GET: get single item
  - PUT: update item
  - DELETE: soft delete item
- Routes are **minimal wrappers** that only import and call handler methods
- All routes in `(private)/api/` automatically require JWT authentication via middleware
- Public routes go in `(public)/api/` (e.g., auth endpoints)

**Example:**
```typescript
// app/(private)/api/users/route.ts
import { NextRequest } from 'next/server';
import { UserHandler } from '@/server/handlers';

const handler = new UserHandler();

export async function GET(request: NextRequest) {
  return handler.getUsers(request);
}

export async function POST(request: NextRequest) {
  return handler.createUser(request);
}
```

```typescript
// app/(private)/api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { UserHandler } from '@/server/handlers';

const handler = new UserHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handler.getUser(request, params.id);
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

## 5. Create the Pages

### 5.1 Create List Page Component
- Location: `src/client/pages/<domain>/<Names>ListPage.tsx` (organized by domain folder)
  - Example: `src/client/pages/user/UsersListPage.tsx`, `src/client/pages/product/ProductsListPage.tsx`

**Option A: Use ListPageTemplate (Recommended for standard CRUD)**
- Import `ListPageTemplate` from `@/client/template`
- Configure columns, permissions, and callbacks
- Minimal boilerplate, consistent patterns

**Example using ListPageTemplate**:
```typescript
import { ListPageTemplate, type ColumnConfig } from "@/client/template";
import { AccessPermission } from "@/shared/enums";
import type { CustomerResponse } from "@/shared";

export function CustomersListPage({ onEdit, onCreate }: { onEdit: (id: string) => void; onCreate: () => void }) {
  const columns: ColumnConfig<CustomerResponse>[] = [
    { header: "Name", accessor: (customer) => customer.name },
    { header: "Email", accessor: (customer) => customer.email },
    { header: "Phone", accessor: (customer) => customer.phone || "-" },
  ];

  return (
    <ListPageTemplate<CustomerResponse>
      title="Customers"
      menuPermission={AccessPermission.MENU_CUSTOMER}
      createPermission={AccessPermission.CREATE_CUSTOMER}
      editPermission={AccessPermission.EDIT_CUSTOMER}
      deletePermission={AccessPermission.DELETE_CUSTOMER}
      apiEndpoint="/api/customers"
      searchPlaceholder="Search customers..."
      createButtonText="Create Customer"
      onEdit={onEdit}
      onCreate={onCreate}
      columns={columns}
      getDeleteConfirmMessage={(customer) => `Are you sure you want to delete "${customer.name}"?`}
    />
  );
}
```

**Option B: Custom Implementation (For complex or unique pages)**
- Use `usePagination` hook from `@/client/hooks`
- Use API helpers: `fetchPaginated`, `deleteResource` from `@/client/helpers`
- Use shadcn/ui components from `@/client/components`:
  - `PageHeader` - title with create button
  - `SearchBar` - search input
  - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` - data display
  - `TableActions` - view/edit/delete buttons
  - `Pagination` - page navigation
  - `LoadingSpinner` - loading state
  - `ErrorAlert` - error display
  - `Button` with lucide-react icons (Plus, Eye, Pencil, Trash2)
  - `Badge` for status/tags (e.g., transaction status, payment status)
  - `Protected` component for permission-based rendering (optional)
- Accept `onEdit` and `onCreate` callback props (for navigation)
- Include search functionality with debouncing
- Add delete with confirmation dialog
- Handle loading and error states
- Export from domain index: `src/client/pages/<domain>/index.ts`
- Ensure exported from main index: `src/client/pages/index.ts`

**Example:**
```typescript
"use client";

import type { UserResponse } from '@/shared';
import { usePagination } from '@/client/hooks';
import { fetchPaginated, deleteResource } from '@/client/helpers';
import {
  PageHeader,
  SearchBar,
  Pagination,
  ErrorAlert,
  LoadingSpinner,
  TableActions,
} from '@/client/components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table';

interface UsersListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function UsersListPage({ onEdit, onCreate }: UsersListPageProps) {
  const {
    data: users,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    refresh,
    nextPage,
    prevPage,
  } = usePagination<UserResponse>({
    fetchFn: (page, limit, search) =>
      fetchPaginated('/api/users', page, limit, search),
    initialPage: 1,
    initialLimit: 10
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteResource('/api/users', id);
      refresh();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Users" 
        onCreateClick={onCreate}
        createButtonText="Create User"
      />
      
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search users..."
      />
      
      {error && <ErrorAlert message={error} />}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell className="text-right">
                <TableActions
                  onEdit={() => onEdit(user.id)}
                  onDelete={() => handleDelete(user.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPrevious={prevPage}
        onNext={nextPage}
      />
    </div>
  );
}
```

### 5.2 Create Form Page Component (Create & Edit)
- Location: `src/client/pages/<domain>/<Name>FormPage.tsx` (organized by domain folder)
  - Example: `src/client/pages/user/UserFormPage.tsx`, `src/client/pages/product/ProductFormPage.tsx`
- Accept optional `<name>Id` prop (undefined = create mode, string = edit mode)

**Option A: Use FormPageTemplate (Recommended for standard forms)**
- Import `FormPageTemplate` from `@/client/template`
- Configure fields, validation, and transformations
- Minimal boilerplate, consistent patterns
- Supports custom fields (e.g., PaginatedSelect)

**Example using FormPageTemplate**:
```typescript
import { FormPageTemplate, type FormFieldConfig } from "@/client/template";
import { AccessPermission } from "@/shared/enums";
import type { CustomerResponse, CreateCustomerRequest } from "@/shared";
import { validateRequired, isValidEmail } from "@/client/helpers/validation";

interface FormData {
  name: string;
  email: string;
  phone: string;
}

export function CustomerFormPage({ customerId, onSuccess, onCancel }: { customerId?: string; onSuccess: () => void; onCancel: () => void }) {
  const fields: FormFieldConfig<FormData>[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter name",
      required: true,
      initialValue: "",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "customer@example.com",
      required: true,
      initialValue: "",
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      placeholder: "+1 (555) 123-4567",
      initialValue: "",
    },
  ];

  return (
    <FormPageTemplate<CustomerResponse, CreateCustomerRequest, FormData>
      title="Customer"
      entityId={customerId}
      createPermission={AccessPermission.CREATE_CUSTOMER}
      editPermission={AccessPermission.EDIT_CUSTOMER}
      apiEndpoint="/api/customers"
      fields={fields}
      onSuccess={onSuccess}
      onCancel={onCancel}
      validate={(data) => {
        const errors: Record<string, string> = {};
        if (validateRequired(data.name)) errors.name = "Name is required";
        if (validateRequired(data.email)) errors.email = "Email is required";
        else if (!isValidEmail(data.email)) errors.email = "Invalid email";
        return errors;
      }}
      transformToRequest={(data) => ({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
      })}
      transformFromResponse={(response) => ({
        name: response.name,
        email: response.email,
        phone: response.phone || "",
      })}
    />
  );
}
```

**Option B: Custom Implementation (For complex forms)**
- Use API helpers: `fetchById`, `createResource`, `updateResource` from `@/client/helpers`
- Use validation helpers from `@/client/helpers/validation`
- Use shadcn/ui components from `@/client/components`:
  - `Card`, `CardHeader`, `CardTitle`, `CardContent` - form container
  - `FormField` - field wrapper with label and error
  - `Input`, `Textarea` - form inputs
  - `Select` or `PaginatedSelect` - dropdowns
  - `Button` with variants (default, outline)
  - `LoadingSpinner` - loading state
  - `ErrorAlert` - error display
  - `Separator` - section divider (if needed)
- Load existing data in edit mode on mount
- Implement client-side validation
- Handle form submission (create or update)
- Accept `onSuccess` and `onCancel` callback props
- Show loading states during data fetch and submission
- Export from domain index: `src/client/pages/<domain>/index.ts`
- Ensure exported from main index: `src/client/pages/index.ts`

**Example:**
```typescript
"use client";

import { useState, useEffect } from 'react';
import type { CreateUserRequest, UpdateUserRequest, UserResponse } from '@/shared';
import { UserRole } from '@/shared';
import { createResource, updateResource, fetchById } from '@/client/helpers';
import { validateRequired, isValidEmail } from '@/client/helpers/validation';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  ErrorAlert,
  LoadingSpinner,
} from '@/client/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select';

interface UserFormPageProps {
  userId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserFormPage({ userId, onSuccess, onCancel }: UserFormPageProps) {
  const isEdit = !!userId;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: UserRole.CASHIER,
  });
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userId) loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const user = await fetchById<UserResponse>('/api/users', userId!);
      setFormData({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        role: user.role,
      });
    } catch (err) {
      setError('Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const nameError = validateRequired(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateRequired(formData.email);
    if (emailError) newErrors.email = emailError;
    else if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email format';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      if (isEdit) {
        await updateResource<UserResponse, UpdateUserRequest>(
          '/api/users',
          userId!,
          formData
        );
      } else {
        await createResource<UserResponse, CreateUserRequest>(
          '/api/users',
          formData
        );
      }
      onSuccess();
    } catch (err) {
      setError(isEdit ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit User' : 'Create User'}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <ErrorAlert message={error} />}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </FormField>
            
            <FormField label="Email" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </FormField>
            
            <FormField label="Phone Number" htmlFor="phoneNumber">
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="Enter phone number"
              />
            </FormField>
            
            <FormField label="Role" htmlFor="role" required>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.3 Export from index files
```typescript
// pages/<domain>/index.ts
export * from './<Names>ListPage';
export * from './<Name>FormPage';
```

```typescript
// pages/index.ts
// Organized by domain
export * from './<domain>';
```

### 5.4 Create App Routes
Routes are **minimal wrappers** that handle navigation only.

**List route:** `src/app/(protected)/<names>/page.tsx`
```typescript
'use client';

import { ProtectedLayout } from '@/client/layouts';
import { UsersListPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <UsersListPage
        onCreate={() => router.push('/users/create')}
        onEdit={(id) => router.push(`/users/${id}/edit`)}
      />
    </ProtectedLayout>
  );
}
```

**Create route:** `src/app/(protected)/<names>/create/page.tsx`
```typescript
'use client';

import { ProtectedLayout } from '@/client/layouts';
import { UserFormPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function CreateUserPage() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <UserFormPage
        onSuccess={() => router.push('/users')}
        onCancel={() => router.back()}
      />
    </ProtectedLayout>
  );
}
```

**Edit route:** `src/app/(protected)/<names>/[id]/page.tsx`
```typescript
'use client';

import { ProtectedLayout } from '@/client/layouts';
import { UserFormPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <UserFormPage
        userId={params.id}
        onSuccess={() => router.push('/users')}
        onCancel={() => router.back()}
      />
    </ProtectedLayout>
  );
}
```

**Note:** The edit page can use the same path as detail view (`[id]/page.tsx`) or separate path (`[id]/edit/page.tsx`) depending on your routing preference.

### 5.5 Update Sidebar Navigation (if needed)
- Location: `src/client/layouts/navigation.json`
- Add new menu item:
```json
{
  "navigation": [
    {
      "title": "Users",
      "href": "/users",
      "icon": "users"
    }
  ]
}
```

Available icons from lucide-react: `LayoutDashboard`, `Users`, `Store`, `Package`, `Boxes`, `History`, `Receipt`, `CreditCard`, `DollarSign`, `Percent`, `Settings`

## 6. Architecture Checklist

Before committing, ensure:

### Handler Layer ✓
- [ ] Only handles HTTP concerns (parse request, return response)
- [ ] NO business logic
- [ ] NO validation logic
- [ ] NO database operations
- [ ] Calls service methods only
- [ ] Returns proper HTTP status codes
- [ ] Uses `handleError()` method for error handling

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
- [ ] Validates business rules
- [ ] Transforms data between layers

### Repository Layer ✓
- [ ] ALL methods accept `PoolClient` as first parameter
- [ ] Uses client parameter for all queries (not pool)
- [ ] Only contains SQL queries and data mapping
- [ ] NO business logic
- [ ] NO transaction management (BEGIN/COMMIT/ROLLBACK)
- [ ] NO validation logic
- [ ] Uses parameterized queries (prevents SQL injection)
- [ ] Implements soft deletes (`deleted_at IS NULL`)

### Page Components ✓
- [ ] Uses `usePagination` hook for list pages
- [ ] Uses API helpers (`fetchPaginated`, `createResource`, etc.)
- [ ] Uses validation helpers
- [ ] Accepts navigation callbacks as props
- [ ] Implements loading states
- [ ] Implements error handling
- [ ] Uses shadcn/ui components consistently
- [ ] Uses `Protected` component for permission-based UI (optional)
- [ ] Uses `usePermissions` hook for conditional logic (optional)
- [ ] Exports from `pages/index.ts`

### Route Components ✓
- [ ] Minimal wrappers (navigation logic only)
- [ ] Imports from `@/client/pages` or `@/client/layouts`
- [ ] NO business logic
- [ ] NO API calls
- [ ] Uses Next.js router for navigation

## Best Practices

### Backend (Server)
1. **Strict Layering**
   - Handler: HTTP only
   - Service: Business logic + transactions
   - Repository: SQL only
   
2. **Transaction Management**
   - ALWAYS use transactions in services
   - ALWAYS release client in finally block
   - Rollback on any error
   
3. **Error Handling**
   - Throw `AppError` for business logic errors
   - Use appropriate HTTP status codes
   - Log unexpected errors
   
4. **Security**
   - Use parameterized queries
   - Hash passwords with bcrypt
   - Validate JWT tokens
   - Implement soft deletes
   
5. **Code Organization**
   - One domain per file
   - Export from index files
   - Follow naming conventions

### Frontend (Client)
1. **Component Architecture**
   - Keep components small and focused
   - Use composition over complex props
   - Extract reusable patterns
   
2. **State Management**
   - Use hooks for local state
   - Lift state up when needed
   - Use custom hooks for complex logic
   
3. **API Integration**
   - Use helper functions from `@/client/helpers/api`
   - Handle errors with try/catch
   - Type API responses
   
4. **Form Validation**
   - Validate on submit
   - Show field-level errors
   - Use validation helpers
   
5. **Navigation**
   - Pass callbacks as props to pages
   - Use Next.js router in route components
   - Keep pages navigation-agnostic

### Shared
1. **Type Safety**
   - Use TypeScript strictly
   - Import types from `@/shared`
   - Avoid `any` types
   
2. **Organization**
   - One domain per file
   - Export from index files
   - Follow naming conventions
   
3. **Consistency**
   - Entities: database schema
   - Requests: API input
   - Responses: API output
   - Enums: constants

## Testing Checklist

- [ ] Pagination works (next, previous, page numbers)
- [ ] Search functionality works with debouncing
- [ ] Create operation succeeds
- [ ] Update operation succeeds
- [ ] Delete operation succeeds with confirmation
- [ ] Loading states display correctly
- [ ] Error messages display correctly
- [ ] Form validation works (client-side)
- [ ] API validation works (server-side)
- [ ] Authentication required for protected routes
- [ ] Sidebar navigation works
- [ ] Responsive design works on mobile

## Common Patterns Reference

### Using PaginatedSelect
```typescript
import { PaginatedSelect } from '@/client/components';
import type { CustomerResponse } from '@/shared';

<PaginatedSelect<CustomerResponse>
  endpoint="/api/customers"
  value={customerId}
  onChange={setCustomerId}
  placeholder="Select customer"
  displayValue={(customer) => customer.name}
  filterValue={(customer) => `${customer.name} ${customer.email || ''} ${customer.phoneNumber || ''}`}
  getId={(customer) => customer.id}
  label="Customer"
  allowClear
  pageSize={20}
/>
```

### Complex Transaction Example
```typescript
// Service - Multiple operations in one transaction (POS Transaction with Items)
async createTransaction(data: CreateTransactionRequest): Promise<TransactionResponse> {
  const client = await getDbClient();
  
  try {
    await client.query('BEGIN');
    
    // 1. Validate
    if (!data.items || data.items.length === 0) {
      throw new AppError('Transaction must have at least one item', 400);
    }
    
    // 2. Validate customer exists (if provided)
    if (data.customerId) {
      const customer = await customerRepo.findById(client, data.customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }
    }
    
    // 3. Create transaction
    const transaction = await transactionRepo.create(client, {
      customerId: data.customerId,
      type: data.type,
      status: TransactionStatus.PENDING,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
      createdBy: data.createdBy,
    });
    
    // 4. Create transaction items
    let subtotal = 0;
    for (const item of data.items) {
      // Validate product exists
      const product = await productRepo.findById(client, item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 404);
      }
      
      const itemTotal = item.quantity * item.price;
      subtotal += itemTotal;
      
      await transactionItemRepo.create(client, {
        transactionId: transaction.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal,
      });
      
      // Update inventory for sell transactions
      if (data.type === TransactionType.SELL) {
        await inventoryHistoryRepo.create(client, {
          productId: item.productId,
          quantity: -item.quantity,
          type: 'remove',
          transactionId: transaction.id,
          createdBy: data.createdBy,
        });
      }
    }
    
    // 5. Apply discounts
    let discountAmount = 0;
    if (data.discounts) {
      for (const discount of data.discounts) {
        await discountRepo.create(client, {
          transactionId: transaction.id,
          ...discount,
        });
        discountAmount += discount.amount;
      }
    }
    
    // 6. Calculate taxes
    let taxAmount = 0;
    if (data.taxIds && data.taxIds.length > 0) {
      for (const taxId of data.taxIds) {
        const tax = await taxRepo.findById(client, taxId);
        if (tax) {
          taxAmount += (subtotal - discountAmount) * (tax.rate / 100);
        }
      }
    }
    
    // 7. Update transaction totals
    const total = subtotal - discountAmount + taxAmount;
    await transactionRepo.update(client, transaction.id, {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    });
    
    await client.query('COMMIT');
    
    // 8. Fetch complete transaction with relations
    const completeTransaction = await transactionRepo.findById(client, transaction.id);
    return mapTransactionToResponse(completeTransaction);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## Related Documentation

- [CLIENT.md](./CLIENT.md) - Client-side architecture and components
- [SERVER.md](./SERVER.md) - Server-side architecture and 3-layer pattern
- [SHARED.md](./SHARED.md) - Shared types, entities, enums, and interfaces
- [RBAC.md](./RBAC.md) - Role-based access control guide
- [TECH.md](./TECH.md) - Technology stack and architecture rules
- [SMTP_CONFIGURATION.md](./SMTP_CONFIGURATION.md) - Email configuration guide
- [README.md](../README.md) - Project overview and setup
