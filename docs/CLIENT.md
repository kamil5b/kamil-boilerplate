# Client Architecture Guide

This directory contains the frontend/client-side logic for the application, organized as reusable React components, pages, hooks, and helpers. The client code follows a modular, component-based architecture designed for use with Next.js App Router.

## 📁 Directory Structure

```
client/
├── components/      # Reusable UI components
│   ├── ui/          # Base UI components (shadcn/ui)
│   └── *.tsx        # Composed components
├── helpers/         # Utility functions
├── hooks/           # Custom React hooks
├── layouts/         # Layout components
├── pages/           # Page-level components
├── index.ts         # Main export file
└── utils.ts         # Utility functions (cn)
```

## 🏗️ Architecture Overview

The client follows a **component composition pattern**:

```
App Route → Page Component → Layout → Components → UI Elements
              ↓                ↓           ↓
           Hooks          Helpers      Primitives
```

### Layer Responsibilities

1. **Pages** (`pages/`)
   - Page-level components with business logic
   - Handle data fetching and state management
   - Compose multiple components
   - Receive callback props for navigation
   - **25 Page Components**:
     - Auth: `LoginPage`, `RegisterPage`
     - Dashboard: `DashboardPage`, `TransactionDashboardPage`
     - Users: `UsersListPage`, `UserFormPage`
     - Customers: `CustomersListPage`, `CustomerFormPage`
     - Products: `ProductsListPage`, `ProductFormPage`, `ProductInventoryDetailPage`, `ProductTransactionDetailPage`
     - Unit Quantities: `UnitQuantitiesListPage`, `UnitQuantityFormPage`
     - Taxes: `TaxesListPage`, `TaxFormPage`
     - Inventory: `InventoryHistoriesListPage`, `InventoryManipulatePage`, `InventorySummaryPage`
     - Transactions: `TransactionsListPage`, `TransactionFormPage`, `TransactionDetailPage`
     - Payments: `PaymentsListPage`, `PaymentFormPage`, `PaymentDetailPage`

2. **Layouts** (`layouts/`)
   - Wrap page content with common structure
   - Handle authentication checks
   - Provide navigation (sidebar, header)
   - Two types: `ProtectedLayout` (with sidebar) and `PublicLayout`
   - Sidebar navigation filtered by user permissions

3. **Components** (`components/`)
   - Reusable UI building blocks
   - Presentational components
   - Composed from UI primitives
   - Examples: `PageHeader`, `SearchBar`, `Pagination`

4. **Hooks** (`hooks/`)
   - Custom React hooks for shared logic
   - State management patterns
   - Side effect encapsulation
   - **Available Hooks**:
     - `useAuth` - Authentication state and operations
     - `usePagination` - Pagination and data fetching
     - `usePermissions` - RBAC permission checks
     - `useDebounce` - Debounce values for search/input

5. **Helpers** (`helpers/`)
   - Pure utility functions
   - API request handlers
   - Formatters and validators
   - No React dependencies

## 📦 Module Overview

### 1. Components (`components/`)

#### Composed Components

**PageHeader** - Title and action button for pages
```tsx
import { PageHeader } from '@/client/components';

<PageHeader 
  title="Users" 
  onCreateClick={handleCreate}
  createButtonText="Create User"
/>
```

**SearchBar** - Search input with icon
```tsx
import { SearchBar } from '@/client/components';

<SearchBar
  value={search}
  onChange={setSearch}
  placeholder="Search users..."
/>
```

**Pagination** - Page navigation controls
```tsx
import { Pagination } from '@/client/components';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPrevious={prevPage}
  onNext={nextPage}
/>
```

**FormField** - Form field with label and error
```tsx
import { FormField } from '@/client/components';

<FormField label="Email" htmlFor="email" required error={errors.email}>
  <Input id="email" type="email" value={email} onChange={...} />
</FormField>
```

**TableActions** - Action buttons for table rows
```tsx
import { TableActions } from '@/client/components';

<TableActions
  onView={() => navigate(`/users/${id}`)}
  onEdit={() => navigate(`/users/${id}/edit`)}
  onDelete={() => handleDelete(id)}
/>
```

**ErrorAlert** - Display error messages
```tsx
import { ErrorAlert } from '@/client/components';

<ErrorAlert message={error} />
```

**LoadingSpinner** - Loading state indicator
```tsx
import { LoadingSpinner } from '@/client/components';

{isLoading && <LoadingSpinner message="Loading users..." />}
```

**Protected** - Conditional rendering based on permissions
```tsx
import { Protected } from '@/client/components';
import { AccessPermission } from '@/shared';

<Protected permission={AccessPermission.CREATE_USER}>
  <Button>Create User</Button>
</Protected>

<Protected permissions={[AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]}>
  <Button>Manage User</Button>
</Protected>
```

**PaginatedSelect** - Searchable dropdown with infinite scroll
```tsx
import { PaginatedSelect } from '@/client/components';
import type { UserResponse } from '@/shared';

<PaginatedSelect<UserResponse>
  endpoint="/api/users"
  value={userId}
  onChange={setUserId}
  placeholder="Select a user"
  displayValue={(user) => user.name}
  filterValue={(user) => `${user.name} ${user.email}`}
  getId={(user) => user.id}
  label="User"
  extraParams={{ filterByRole: [UserRole.OPERATION] }}
  allowClear
  pageSize={20}
/>
```

#### UI Primitives (`components/ui/`)

Base components from shadcn/ui:
- `Button` - Button component with variants
- `Input` - Text input field
- `Select` - Dropdown select
- `Table` - Table components (Table, TableHeader, TableRow, etc.)
- `Card` - Card container components
- `Badge` - Status badges
- `Label` - Form labels
- `Textarea` - Multi-line text input
- `Separator` - Visual divider

### 2. Hooks (`hooks/`)

#### `useAuth`

Authentication state and operations.

```tsx
import { useAuth } from '@/client/hooks';

function MyComponent() {
  const { token, isAuthenticated, isLoading, login, logout, getAuthHeaders } = useAuth();
  
  // Login user
  login('jwt-token-here');
  
  // Logout user
  logout();
  
  // Get auth headers for requests
  const headers = getAuthHeaders();
  
  // Check auth status
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
}
```

**Features**:
- Manages auth token in localStorage
- Auto-redirects on login/logout
- Loading state during initialization
- Returns authorization headers

#### `usePagination`

Pagination and data fetching hook.

```tsx
import { usePagination } from '@/client/hooks';
import { fetchPaginated } from '@/client/helpers';

function UsersPage() {
  const {
    data,           // Current page data
    page,           // Current page number
    totalPages,     // Total number of pages
    totalItems,     // Total number of items
    search,         // Current search query
    setSearch,      // Update search query
    isLoading,      // Loading state
    error,          // Error message
    refresh,        // Refresh current page
    nextPage,       // Go to next page
    prevPage,       // Go to previous page
    goToPage        // Go to specific page
  } = usePagination({
    fetchFn: (page, limit, search) => 
      fetchPaginated('/api/users', page, limit, search),
    initialPage: 1,
    initialLimit: 10
  });
}
```

**Features**:
- Automatic data fetching
- Search with debouncing
- Error handling
- Loading states
- Pagination controls

#### `usePermissions`

Role-based access control permission checks.

```tsx
import { usePermissions } from '@/client/hooks';
import { AccessPermission } from '@/shared';

function MyComponent() {
  const { can, canAny, canAll, role, isLoading } = usePermissions();
  
  // Check single permission
  if (can(AccessPermission.CREATE_USER)) {
    // Show create button
  }
  
  // Check any of multiple permissions
  if (canAny([AccessPermission.EDIT_USER, AccessPermission.DELETE_USER])) {
    // Show manage button
  }
  
  // Check all permissions
  if (canAll([AccessPermission.DETAIL_PRODUCT, AccessPermission.EDIT_PRODUCT])) {
    // Show edit product details button
  }
  
  return <div>Your role: {role}</div>;
}
```

**Features**:
- Check single or multiple permissions
- Get current user role
- Loading state during auth check
- Based on user info from `/api/me` endpoint

#### `useDebounce`

Debounce values for search inputs.

```tsx
import { useDebounce } from '@/client/hooks';

function SearchComponent() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  useEffect(() => {
    // This only runs 500ms after user stops typing
    fetchResults(debouncedSearch);
  }, [debouncedSearch]);
}
```

### 3. Helpers (`helpers/`)

#### RBAC Functions (`helpers/rbac.ts`)

**hasPermission** - Check if user has a specific permission
```tsx
import { hasPermission } from '@/client/helpers';
import { UserRole, AccessPermission } from '@/shared';

const canCreate = hasPermission(UserRole.CASHIER, AccessPermission.CREATE_TRANSACTION);
// returns true or false
```

**hasAnyPermission** - Check if user has any of the permissions
```tsx
import { hasAnyPermission } from '@/client/helpers';

const canManage = hasAnyPermission(
  UserRole.ADMIN,
  [AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]
);
```

**hasAllPermissions** - Check if user has all permissions
```tsx
import { hasAllPermissions } from '@/client/helpers';

const canFullAccess = hasAllPermissions(
  UserRole.FINANCE,
  [AccessPermission.DETAIL_TRANSACTION, AccessPermission.SUMMARY_TRANSACTION]
);
```

**getUserPermissions** - Get all permissions for a role
```tsx
import { getUserPermissions } from '@/client/helpers';
import { UserRole } from '@/shared';

const permissions = getUserPermissions(UserRole.WAREHOUSE_MANAGER);
// returns array of AccessPermission
```

#### API Functions (`helpers/api.ts`)

**apiRequest** - Base API request function
```tsx
import { apiRequest } from '@/client/helpers';

const data = await apiRequest<UserResponse>('/api/users/123', {
  method: 'GET'
});
```

**fetchPaginated** - Fetch paginated data
```tsx
import { fetchPaginated } from '@/client/helpers';

const response = await fetchPaginated<UserResponse>(
  '/api/users',
  page,      // 1
  limit,     // 10
  search,    // 'john'
  { sortBy: 'name' }  // Extra params
);
// Response includes: items, meta (page, limit, totalPages, totalItems)
```

**fetchById** - Fetch single resource by ID
```tsx
import { fetchById } from '@/client/helpers';

const user = await fetchById<UserResponse>('/api/users', '123');
```

**createResource** - Create new resource
```tsx
import { createResource } from '@/client/helpers';

const newUser = await createResource<UserResponse, CreateUserRequest>(
  '/api/users',
  { name: 'John', email: 'john@example.com', role: 'ADMIN' }
);
```

**updateResource** - Update existing resource
```tsx
import { updateResource } from '@/client/helpers';

const updatedUser = await updateResource<UserResponse, UpdateUserRequest>(
  '/api/users',
  '123',
  { name: 'John Updated' }
);
```

**deleteResource** - Delete resource
```tsx
import { deleteResource } from '@/client/helpers';

await deleteResource('/api/users', '123');
```

**Features**:
- Automatic auth token injection
- JSON content type handling
- Error handling
- Type-safe responses

#### Formatters (`helpers/formatters.ts`)

```tsx
import { formatDate, formatDateTime, formatRole, truncate } from '@/client/helpers';

// Format dates
formatDate('2024-01-15T10:30:00Z');        // "Jan 15, 2024"
formatDateTime('2024-01-15T10:30:00Z');    // "Jan 15, 2024, 10:30 AM"

// Format role enum
formatRole('SUPER_ADMIN');                  // "Super Admin"
formatRole('ADMIN_VM');                     // "Admin Vm"

// Truncate strings
truncate('Long text here...', 10);         // "Long text..."
```

#### Validators (`helpers/validation.ts`)

```tsx
import { 
  isValidEmail, 
  isValidPhone, 
  isStrongPassword, 
  validateRequired 
} from '@/client/helpers';

// Email validation
isValidEmail('user@example.com');           // true
isValidEmail('invalid-email');              // false

// Phone validation (10+ digits, allows spaces, dashes, +, parentheses)
isValidPhone('+1 (555) 123-4567');         // true
isValidPhone('123');                        // false

// Password strength (8+ chars, 1 uppercase, 1 lowercase, 1 number)
isStrongPassword('SecurePass123');         // true
isStrongPassword('weak');                   // false

// Required field validation
validateRequired('value');                  // null (valid)
validateRequired('');                       // "This field is required"
validateRequired(null);                     // "This field is required"
```

### 4. Layouts (`layouts/`)

#### `ProtectedLayout`

Layout for authenticated pages with sidebar navigation.

```tsx
import { ProtectedLayout } from '@/client/layouts';

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      <div>Your protected content here</div>
    </ProtectedLayout>
  );
}
```

**Features**:
- Authentication check (redirects to /login if not authenticated)
- Collapsible sidebar with navigation
- User menu with logout
- Active route highlighting
- Responsive design
- Configurable via `sidebar.json`

**Sidebar Configuration** (`layouts/sidebar.json`):
```json
{
  "navigation": [
    {
      "title": "Dashboard",
      "href": "/dashboard",
      "icon": "dashboard"
    },
    {
      "title": "Users",
      "href": "/users",
      "icon": "users"
    }
  ]
}
```

Available icons: `dashboard`, `users`, `store`, `briefcase`, `fileText`

### 6. PaginatedSelect Component

A powerful searchable dropdown with infinite scroll, debounced search, and filter support.

**Key Features**:
- **Searchable**: Real-time search with 300ms debounce
- **Infinite Scroll**: Auto-loads more items as you scroll
- **Filterable**: Support for custom API filters (e.g., `filterByRole`)
- **Type-safe**: Full TypeScript generics support
- **Clear button**: Optional reset functionality

**Basic Usage**:
```tsx
import { PaginatedSelect } from '@/client/components';
import type { UserResponse } from '@/shared';

<PaginatedSelect<UserResponse>
  endpoint="/api/users"
  value={userId}
  onChange={setUserId}
  placeholder="Select a user"
  displayValue={(user) => user.name}
  getId={(user) => user.id}
  label="User"
/>
```

**With Search Filtering**:
```tsx
<PaginatedSelect<CostCodeResponse>
  endpoint="/api/cost-codes"
  value={costCodeId}
  onChange={setCostCodeId}
  displayValue={(code) => `${code.code} - ${code.title}`}
  filterValue={(code) => `${code.code} ${code.title}`}
  getId={(code) => code.id}
  label="Cost Code"
/>
```

**With Custom Filters**:
```tsx
<PaginatedSelect<UserResponse>
  endpoint="/api/users"
  value={operatorId}
  onChange={setOperatorId}
  displayValue={(user) => user.name}
  getId={(user) => user.id}
  extraParams={{ filterByRole: [UserRole.OPERATION] }}
  pageSize={20}
/>
```

See `PaginatedSelect.README.md` and `PaginatedSelect.examples.tsx` for complete documentation.

#### `PublicLayout`

Simple centered layout for public pages (login, forgot password, etc.).

```tsx
import { PublicLayout } from '@/client/layouts';

export default function LoginPage() {
  return (
    <PublicLayout>
      <div>Your login form here</div>
    </PublicLayout>
  );
}
```

**Features**:
- Centered content
- Background styling
- No authentication required

### 7. Pages (`pages/`)

Page components are full-featured components that:
- Use hooks for data fetching and state
- Compose multiple components
- Handle user interactions
- Receive navigation callbacks as props

#### Pattern: List Pages

Example: `UsersListPage`

```tsx
import { UsersListPage } from '@/client/pages';

// In Next.js route component
export default function UsersRoute() {
  const router = useRouter();
  
  return (
    <UsersListPage
      onEdit={(id) => router.push(`/users/${id}/edit`)}
      onCreate={() => router.push('/users/new')}
    />
  );
}
```

**Features**:
- Pagination with `usePagination`
- Search functionality
- Table display
- CRUD operations
- Loading and error states

#### Pattern: Form Pages

Example: `UserFormPage`

```tsx
import { UserFormPage } from '@/client/pages';

// In Next.js route component
export default function UserEditRoute({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <UserFormPage
      userId={params.id}           // Optional: for edit mode
      onSuccess={() => router.push('/users')}
      onCancel={() => router.back()}
    />
  );
}
```

**Features**:
- Create and edit modes
- Form validation
- Error handling
- Loading states
- Auto-load data in edit mode

#### Pattern: Detail Pages

Example: `ClientDetailPage`

```tsx
import { ClientDetailPage } from '@/client/pages';

// In Next.js route component
export default function ClientRoute({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <ClientDetailPage
      clientId={params.id}
      onEdit={(id) => router.push(`/clients/${id}/edit`)}
      onBack={() => router.push('/clients')}
    />
  );
}
```

**Features**:
- Display detailed information
- Loading states
- Error handling
- Navigation actions

#### Available Pages

- **Auth Pages**: `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`
- **User Pages**: `UsersListPage`, `UserFormPage`
- **Client Pages**: `ClientsListPage`, `ClientFormPage`, `ClientDetailPage`
- **Vendor Pages**: `VendorsListPage`, `VendorFormPage`, `VendorDetailPage`
- **Purchase Order Pages**: `ClientPurchaseOrdersListPage`, `ClientPurchaseOrderFormPage`, `ClientPurchaseOrderDetailPage`

## 🚀 Usage in Next.js App Router

### Protected Route Example

```tsx
// app/(protected)/users/page.tsx
import { ProtectedLayout } from '@/client/layouts';
import { UsersListPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <UsersListPage
        onEdit={(id) => router.push(`/users/${id}/edit`)}
        onCreate={() => router.push('/users/new')}
      />
    </ProtectedLayout>
  );
}
```

### Public Route Example

```tsx
// app/(public)/login/page.tsx
'use client';

import { PublicLayout } from '@/client/layouts';
import { LoginPage } from '@/client/pages';
import { useAuth } from '@/client/hooks';

export default function LoginRoute() {
  const { login } = useAuth();
  
  return (
    <PublicLayout>
      <LoginPage onSuccess={login} />
    </PublicLayout>
  );
}
```

### Dynamic Route Example

```tsx
// app/(protected)/users/[id]/edit/page.tsx
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

## 🎨 Styling with Tailwind CSS

All components use Tailwind CSS for styling. The `cn` utility combines class names intelligently:

```tsx
import { cn } from '@/client/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  "more-classes"
)} />
```

**Features**:
- Automatic class deduplication
- Tailwind class merging
- Conditional classes

## 🔐 Authentication Flow

1. **Login**:
   ```tsx
   const { login } = useAuth();
   
   // After successful API login
   login(token); // Stores token, redirects to /dashboard
   ```

2. **Protected Pages**:
   ```tsx
   // ProtectedLayout automatically checks authentication
   // Redirects to /login if not authenticated
   ```

3. **API Requests**:
   ```tsx
   // apiRequest automatically includes Bearer token
   const data = await apiRequest('/api/users');
   ```

4. **Logout**:
   ```tsx
   const { logout } = useAuth();
   
   logout(); // Removes token, redirects to /login
   ```

## 📝 Adding New Features

### Adding a New List Page

1. **Create the page component** (`pages/ProductsListPage.tsx`):

```tsx
"use client";

import type { ProductResponse } from '@/shared';
import { usePagination } from '@/client/hooks';
import { fetchPaginated, deleteResource } from '@/client/helpers';
import {
  PageHeader,
  SearchBar,
  Pagination,
  ErrorAlert,
  LoadingSpinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableActions,
} from '@/client/components';

interface ProductsListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function ProductsListPage({ onEdit, onCreate }: ProductsListPageProps) {
  const {
    data: products,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    refresh,
    nextPage,
    prevPage,
  } = usePagination<ProductResponse>({
    fetchFn: (page, limit, search) =>
      fetchPaginated('/api/products', page, limit, search),
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteResource('/api/products', id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        onCreateClick={onCreate}
        createButtonText="Create Product"
      />
      <ErrorAlert message={error} />
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search products..."
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>
                    <TableActions
                      onEdit={() => onEdit(product.id)}
                      onDelete={() => handleDelete(product.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
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

2. **Export from index** (`pages/index.ts`):

```tsx
export * from './ProductsListPage';
```

3. **Use in route** (`app/(protected)/products/page.tsx`):

```tsx
'use client';

import { ProtectedLayout } from '@/client/layouts';
import { ProductsListPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <ProductsListPage
        onEdit={(id) => router.push(`/products/${id}/edit`)}
        onCreate={() => router.push('/products/new')}
      />
    </ProtectedLayout>
  );
}
```

### Adding a New Form Page

1. **Create the page component** (`pages/ProductFormPage.tsx`):

```tsx
"use client";

import { useState, useEffect } from 'react';
import type { CreateProductRequest, ProductResponse } from '@/shared';
import { createResource, updateResource, fetchById } from '@/client/helpers';
import { validateRequired } from '@/client/helpers/validation';
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

interface ProductFormPageProps {
  productId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductFormPage({ productId, onSuccess, onCancel }: ProductFormPageProps) {
  const isEdit = !!productId;
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
  });
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const product = await fetchById<ProductResponse>('/api/products', productId!);
      setFormData({ name: product.name, price: product.price });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameError = validateRequired(formData.name);
    if (nameError) newErrors.name = nameError;
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
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
        await updateResource('/api/products', productId!, formData);
      } else {
        await createResource('/api/products', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Product' : 'Create Product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorAlert message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>
            <FormField label="Price" htmlFor="price" required error={errors.price}>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
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

2. **Export and use in routes** as shown above.

### Adding a New Custom Hook

```tsx
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Export from hooks/index.ts
export * from './useDebounce';
```

## 🎯 Best Practices

1. **Component Composition**
   - Keep components small and focused
   - Use composition over complex props
   - Extract reusable patterns into components

2. **Type Safety**
   - Import types from `@/shared`
   - Use TypeScript interfaces for props
   - Avoid `any` types

3. **Error Handling**
   - Always handle API errors
   - Show user-friendly error messages
   - Use ErrorAlert component consistently

4. **Loading States**
   - Show LoadingSpinner during data fetching
   - Disable buttons during submissions
   - Provide feedback for user actions

5. **Form Validation**
   - Validate on submit
   - Show field-level errors
   - Use validation helpers from `helpers/validation.ts`

6. **API Calls**
   - Use helper functions from `helpers/api.ts`
   - Handle errors with try/catch
   - Type API responses

7. **State Management**
   - Use hooks for local state
   - Lift state up when needed
   - Consider custom hooks for complex logic

8. **Navigation**
   - Pass navigation callbacks as props to pages
   - Use Next.js router in route components
   - Keep page components navigation-agnostic

## 📚 Related Documentation

- [Server Architecture](/src/server/README.md) - Backend API documentation
- [Shared Types](/src/shared/README.md) - Type definitions and interfaces
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Next.js App Router](https://nextjs.org/docs/app) - Framework documentation

## 🤝 Contributing

When adding new features:

1. Follow existing patterns (List, Form, Detail pages)
2. Use TypeScript with proper types
3. Implement error handling and loading states
4. Use existing components and helpers
5. Keep components focused and reusable
6. Add components to appropriate index files
7. Test with different screen sizes (responsive design)
8. Update sidebar.json for new protected routes

## 📞 Support

For questions or issues related to the client architecture, please refer to:
- Main project README
- TECH.md for technology stack details
- IMPLEMENTATION.md for implementation guidelines
