# Role-Based Access Control (RBAC) - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [Usage Guide](#usage-guide)
5. [Migration Guide](#migration-guide)
6. [Code Examples](#code-examples)
7. [Testing](#testing)
8. [Security](#security)

## Overview

This project implements a comprehensive RBAC system to control access to features and UI elements based on user roles. The implementation follows the principle of least privilege, where users only have access to the features they need to perform their job.

### Key Features
- ✅ Server-side user authentication with JWT
- ✅ Automatic sidebar filtering based on permissions
- ✅ Declarative permission checks with `<Protected>` component
- ✅ Imperative permission checks with `usePermissions()` hook
- ✅ Wait for authentication before checking permissions (prevents redirect loops)
- ✅ Granular permission system (CRUD operations per resource)
- ✅ Role-based permission mapping

## Architecture

### Core Components

1. **Role & Permission Enums** (`src/shared/enums.ts`)
   - `UserRole`: Defines all available user roles
   - `AccessPermission`: Defines all granular permissions

2. **RBAC Configuration** (`src/shared/rbac.ts`)
   - Maps roles to their permissions
   - Central configuration for all role-based access rules

3. **Permission Helpers** (`src/client/helpers/rbac.ts`)
   - `hasPermission()`: Check if user has a specific permission
   - `hasAnyPermission()`: Check if user has any of the permissions
   - `hasAllPermissions()`: Check if user has all permissions
   - `getUserPermissions()`: Get all permissions for a role

4. **API Endpoints**
   - `/api/(protected)/me`: Returns current user info (userId, email, role)
   - Protected by middleware with JWT verification

5. **React Hooks**
   - `useAuth()`: Manages authentication state and fetches user info from API
   - `usePermissions()`: Provides easy access to permission checks in components

6. **Protected Layout** (`src/client/layouts/ProtectedLayout.tsx`)
   - Automatically filters sidebar navigation based on permissions
   - Displays user role and email
   - Integrates with `sidebar.json` configuration

## Usage

### 1. Define Permissions in Sidebar

Edit `src/client/layouts/sidebar.json`:

```json
{
  "navigation": [
    {
      "title": "Users",
      "href": "/users",
      "icon": "users",
      "permissions": "menu_user"
    }
  ]
}
```

### 2. Configure Role Permissions

Edit `src/shared/rbac.ts`:

```typescript
{
  role: UserRole.FINANCE,
  permissions: [
    AccessPermission.MENU_VENDOR,
    AccessPermission.DETAIL_VENDOR,
    AccessPermission.CREATE_VENDOR,
    // ... more permissions
  ],
}
```

### 3. Check Permissions in Components

#### Option A: Using the Protected Component (Recommended)

```tsx
import { Protected } from "@/client/components";
import { AccessPermission } from "@/shared";

function MyComponent() {
  return (
    <div>
      <Protected permission={AccessPermission.CREATE_USER}>
        <Button>Create User</Button>
      </Protected>
      
      <Protected permissions={[AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]}>
        <Button>Manage User</Button>
      </Protected>
      
      <Protected 
        permission={AccessPermission.DELETE_USER}
        fallback={<span className="text-muted-foreground">No permission</span>}
      >
        <Button variant="destructive">Delete User</Button>
      </Protected>
    </div>
  );
}
```

#### Option B: Using the usePermissions Hook

```tsx
import { usePermissions } from "@/client/hooks";
import { AccessPermission } from "@/shared";

function MyComponent() {
  const { can, canAny, role } = usePermissions();

  return (
    <div>
      {can(AccessPermission.CREATE_USER) && (
        <Button>Create User</Button>
      )}
      
      {canAny([AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]) && (
        <Button>Manage User</Button>
      )}
      
      <div>Your role: {role}</div>
    </div>
  );
}
```

### 4. Protect API Routes (Server-side)

The JWT token contains the user's role, which can be verified on the server:

```typescript
import { verifyToken } from "@/server/utils/auth";
import { hasPermission } from "@/server/utils/rbac"; // You may need to create this

// In your API route
const token = request.headers.get("authorization")?.replace("Bearer ", "");
const payload = verifyToken(token);

if (!hasPermission(payload.role, AccessPermission.CREATE_USER)) {
  throw new AppError("Forbidden", 403);
}
```

## User Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access |
| `admin_vm` | Vendor Management admin |
| `admin_trucking` | Trucking admin |
| `sales_vm` | Vendor Management sales |
| `sales_trucking` | Trucking sales |
| `finance` | Finance department |
| `operation` | Operations team |
| `cashier` | Cashier role |

## Permission Structure

Permissions follow a naming convention: `{action}_{resource}`

Examples:
- `menu_user` - Can see Users menu
- `create_user` - Can create users
- `edit_vendor` - Can edit vendors
- `detail_purchase_order` - Can view purchase order details

## Examples by Role

### Super Admin
- Has ALL permissions
- Full access to the system

### Finance
```typescript
permissions: [
  AccessPermission.MENU_VENDOR,
  AccessPermission.DETAIL_VENDOR,
  AccessPermission.CREATE_VENDOR,
  AccessPermission.MENU_CLIENT,
  AccessPermission.DETAIL_CLIENT,
  AccessPermission.CREATE_CLIENT,
  AccessPermission.MENU_CLIENT_PURCHASE_ORDER,
  AccessPermission.DETAIL_CLIENT_PURCHASE_ORDER,
]
```
- Can view and create vendors and clients
- Can view purchase orders (but not create/edit)

### Sales Roles (VM/Trucking)
```typescript
permissions: [
  AccessPermission.MENU_CLIENT_PURCHASE_ORDER,
  AccessPermission.DETAIL_CLIENT_PURCHASE_ORDER,
]
```
- Read-only access to purchase orders

### Admin Roles (VM/Trucking)
```typescript
permissions: [
  AccessPermission.MENU_CLIENT_PURCHASE_ORDER,
  AccessPermission.DETAIL_CLIENT_PURCHASE_ORDER,
  AccessPermission.CREATE_CLIENT_PURCHASE_ORDER,
]
```
- Can view and create purchase orders

## Security Considerations

1. **Client-side RBAC**: The UI-level permission checks are for UX only. They hide/show UI elements but don't provide security.

2. **Server-side Validation**: Always validate permissions on the server before performing sensitive operations.

3. **JWT Token**: The token contains the user role and is signed, making it tamper-proof (as long as JWT_SECRET is secure).

4. **Server-Side User Info**: The client fetches user info from `/api/(protected)/me`, which verifies the JWT and returns trusted user data. This is more secure than client-side JWT decoding.

## Adding New Permissions

1. Add to `AccessPermission` enum in `src/shared/enums.ts`
2. Update role permissions in `src/shared/rbac.ts`
3. Add to sidebar configuration if it's a menu permission
4. Use in components with `usePermissions()` hook

## Testing RBAC

To test different roles:

1. Login as a user with a specific role
2. The sidebar will automatically show only permitted menu items
3. Components using `usePermissions()` will conditionally render based on role

## Best Practices

1. **Principle of Least Privilege**: Only grant permissions that are necessary
2. **Granular Permissions**: Use specific permissions (e.g., `create_user` vs `manage_users`)
3. **Consistent Naming**: Follow the `{action}_{resource}` convention
4. **Server-side Enforcement**: Always validate on the server, not just the client
5. **Audit Trail**: Log permission checks for security auditing
6. **Wait for Auth**: Always check `authLoading` before redirecting based on permissions

---

## Implementation Details

### How Authentication & Authorization Flow Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    RBAC Authentication Flow                      │
└─────────────────────────────────────────────────────────────────┘

1. User Login
   ├── User submits credentials to /api/login
   ├── Server validates credentials
   ├── Server generates JWT token with { userId, email, role }
   └── Client stores token in localStorage

2. Page Load & Auth Check
   ├── useAuth() hook reads token from localStorage
   ├── Hook calls /api/(protected)/me with Authorization header
   ├── Middleware verifies JWT in Edge Runtime (using jose library)
   ├── Server extracts user info from verified token
   └── Returns { userId, email, role } to client

3. Permission Resolution (CRITICAL: Wait for loading!)
   ├── usePermissions() exposes { can, isLoading }
   ├── Pages check: if (authLoading) return; // WAIT!
   ├── After loading, check: if (!can(permission)) redirect
   └── This prevents redirect loops during initial load

4. UI Rendering
   ├── ProtectedLayout filters sidebar based on permissions
   ├── <Protected> component conditionally renders children
   ├── usePermissions().can() checks individual permissions
   └── User sees only permitted features

5. RBAC Permission Lookup
   ├── User role maps to permissions via RBACPermissions array
   ├── hasPermission(userRole, requiredPermission) checks access
   └── Returns true/false based on role's permission array
```

### Key Files & Their Responsibilities

#### Server-Side (JWT & User Info)
- **`src/middleware.ts`**: JWT verification using `jose` (Edge Runtime compatible)
  - Verifies token on every request
  - Sets headers: `x-user-id`, `x-user-email`, `x-user-role`
  - Protects `/api/(protected)/*` routes

- **`src/server/handlers/me.handler.ts`**: HTTP layer for `/api/me` endpoint
  - Extracts user info from middleware headers
  - Returns verified user data to client

- **`src/server/services/me.service.ts`**: Business logic for user info
  - Reads headers set by middleware
  - Validates user existence

#### Client-Side (Permission Checks)
- **`src/client/hooks/useAuth.ts`**: Authentication state management
  - Fetches user from `/api/me` on mount
  - Exposes: `{ user, isLoading, login, logout }`
  - **IMPORTANT**: `isLoading` prevents premature redirects

- **`src/client/hooks/usePermissions.ts`**: Permission checking interface
  - Uses `useAuth()` to get user role
  - Exposes: `{ can, canAny, canAll, permissions, role, isLoading }`
  - All checks wait for auth to complete

- **`src/client/helpers/rbac.ts`**: Core permission logic
  - `hasPermission(userRole, permission)`: Single permission check
  - `hasAnyPermission(userRole, permissions[])`: OR logic
  - `hasAllPermissions(userRole, permissions[])`: AND logic

- **`src/client/components/Protected.tsx`**: Declarative permission component
  - Props: `permission`, `permissions[]`, `requireAll`, `fallback`
  - Renders children only if user has required permissions

#### Configuration
- **`src/shared/rbac.ts`**: Role-to-permissions mapping
  - Central configuration for all RBAC rules
  - Maps each UserRole to AccessPermission[]

- **`src/client/layouts/sidebar.json`**: Navigation configuration
  - Each item can have `permissions` property
  - ProtectedLayout automatically filters menu

### Critical Implementation Detail: Preventing Redirect Loops

**Problem**: Initial page load triggers permission check before user data loads, causing redirect to dashboard.

**Solution**: Always wait for `authLoading` to complete:

```tsx
const { can, isLoading: authLoading } = usePermissions();

useEffect(() => {
  if (authLoading) return; // WAIT for auth to complete!
  
  if (!can(AccessPermission.MENU_USER)) {
    router.push("/dashboard");
  }
}, [can, authLoading, router]);
```

This pattern is implemented in ALL protected pages:
- `UsersListPage`, `UserFormPage`
- `VendorsListPage`, `VendorFormPage`, `VendorDetailPage`
- `ClientsListPage`, `ClientFormPage`, `ClientDetailPage`
- `ClientPurchaseOrdersListPage`, `ClientPurchaseOrderFormPage`, `ClientPurchaseOrderDetailPage`

---

## Usage Guide

### 1. Protect a Page/Route

Add permission check at component level:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/client/hooks";
import { AccessPermission } from "@/shared";

export function MyProtectedPage() {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return; // CRITICAL: Wait for auth!
    
    if (!can(AccessPermission.MENU_MY_RESOURCE)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  return <div>Protected Content</div>;
}
```

### 2. Conditionally Render UI Elements

#### Method A: Using `<Protected>` Component (Declarative)

```tsx
import { Protected } from "@/client/components";
import { AccessPermission } from "@/shared";

// Single permission
<Protected permission={AccessPermission.CREATE_USER}>
  <Button>Create User</Button>
</Protected>

// Multiple permissions (any)
<Protected permissions={[AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]}>
  <Button>Manage User</Button>
</Protected>

// Multiple permissions (all required)
<Protected 
  permissions={[AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]}
  requireAll
>
  <Button>Full Access</Button>
</Protected>

// With fallback
<Protected 
  permission={AccessPermission.DELETE_USER}
  fallback={<span className="text-muted-foreground">No permission</span>}
>
  <Button variant="destructive">Delete</Button>
</Protected>
```

#### Method B: Using `usePermissions()` Hook (Imperative)

```tsx
import { usePermissions } from "@/client/hooks";
import { AccessPermission } from "@/shared";

const { can, canAny, canAll, role } = usePermissions();

// Simple check
{can(AccessPermission.CREATE_USER) && <Button>Create</Button>}

// OR check
{canAny([AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]) && (
  <Button>Manage</Button>
)}

// AND check
{canAll([AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]) && (
  <Button>Full Admin</Button>
)}

// Use in logic
const handleAction = () => {
  if (!can(AccessPermission.DELETE_USER)) {
    alert("No permission");
    return;
  }
  // Perform action
};
```

### 3. Configure Sidebar Navigation

Edit `src/client/layouts/sidebar.json`:

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
      "icon": "users",
      "permissions": "menu_user"
    },
    {
      "title": "Vendors",
      "href": "/vendors",
      "icon": "store",
      "permissions": "menu_vendor"
    }
  ]
}
```

ProtectedLayout automatically filters based on user permissions!

### 4. Add New Permission

**Step 1**: Add to `src/shared/enums.ts`

```typescript
export enum AccessPermission {
  // ... existing permissions
  MENU_MY_RESOURCE = "menu_my_resource",
  DETAIL_MY_RESOURCE = "detail_my_resource",
  CREATE_MY_RESOURCE = "create_my_resource",
  EDIT_MY_RESOURCE = "edit_my_resource",
  DELETE_MY_RESOURCE = "delete_my_resource",
}
```

**Step 2**: Update `src/shared/rbac.ts`

```typescript
export const RBACPermissions: RBACConfig[] = [
  {
    role: UserRole.FINANCE,
    permissions: [
      // ... existing permissions
      AccessPermission.MENU_MY_RESOURCE,
      AccessPermission.DETAIL_MY_RESOURCE,
      AccessPermission.CREATE_MY_RESOURCE,
    ],
  },
  // ... other roles
];
```

**Step 3**: Use in components

```tsx
<Protected permission={AccessPermission.CREATE_MY_RESOURCE}>
  <Button>Create My Resource</Button>
</Protected>
```

---

## Migration Guide

### Migrating Existing Components to Use RBAC

#### Example 1: Basic Button Protection

**Before:**
```tsx
<Button onClick={handleCreate}>Create User</Button>
```

**After:**
```tsx
<Protected permission={AccessPermission.CREATE_USER}>
  <Button onClick={handleCreate}>Create User</Button>
</Protected>
```

#### Example 2: Table Actions

**Before:**
```tsx
<TableActions
  onEdit={() => handleEdit(id)}
  onDelete={() => handleDelete(id)}
/>
```

**After:**
```tsx
const { can } = usePermissions();

<TableActions
  onEdit={can(AccessPermission.EDIT_USER) ? () => handleEdit(id) : undefined}
  onDelete={can(AccessPermission.DELETE_USER) ? () => handleDelete(id) : undefined}
/>
```

#### Example 3: Page Header with Actions

**Before:**
```tsx
<PageHeader 
  title="Users"
  action={<Button>Create User</Button>}
/>
```

**After:**
```tsx
const { can } = usePermissions();

<PageHeader 
  title="Users"
  onCreateClick={can(AccessPermission.CREATE_USER) ? handleCreate : undefined}
  createButtonText="Create User"
/>
```

#### Example 4: Form with Conditional Fields

**Before:**
```tsx
<form>
  <FormField label="Name" name="name" />
  <FormField label="Role" name="role" />
  <Button type="submit">Save</Button>
</form>
```

**After:**
```tsx
<form>
  <FormField label="Name" name="name" />
  
  <Protected permission={AccessPermission.EDIT_USER}>
    <FormField label="Role" name="role" />
  </Protected>
  
  <Button type="submit">Save</Button>
</form>
```

#### Example 5: Protecting an Entire Page

**Before:**
```tsx
export function UsersPage() {
  return <div>Users content</div>;
}
```

**After:**
```tsx
export function UsersPage() {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return; // Wait for auth!
    
    if (!can(AccessPermission.MENU_USER)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  return <div>Users content</div>;
}
```

### Common Patterns

#### Pattern 1: Conditional Button in PageHeader
```tsx
const { can } = usePermissions();

<PageHeader
  title="Users"
  onCreateClick={can(AccessPermission.CREATE_USER) ? onCreate : undefined}
  createButtonText="Create User"
/>
```

#### Pattern 2: Multiple Permissions (OR)
```tsx
<Protected permissions={[
  AccessPermission.EDIT_USER,
  AccessPermission.DELETE_USER
]}>
  <div>Management Tools</div>
</Protected>
```

#### Pattern 3: Multiple Permissions (AND)
```tsx
<Protected 
  permissions={[
    AccessPermission.EDIT_USER,
    AccessPermission.DELETE_USER
  ]}
  requireAll
>
  <div>Full Admin Panel</div>
</Protected>
```

#### Pattern 4: Disable Instead of Hide
```tsx
const { can } = usePermissions();

<Button 
  disabled={!can(AccessPermission.DELETE_USER)}
  onClick={handleDelete}
>
  Delete
</Button>
```

#### Pattern 5: Conditional Table Column
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <Protected permissions={[
        AccessPermission.EDIT_USER,
        AccessPermission.DELETE_USER
      ]}>
        <TableHead>Actions</TableHead>
      </Protected>
    </TableRow>
  </TableHeader>
</Table>
```

### Migration Checklist

- [ ] Identify all actions to protect (Create, Edit, Delete buttons)
- [ ] Add permission checks to page components (with `authLoading` wait)
- [ ] Wrap action buttons with `<Protected>` or use `can()`
- [ ] Update TableActions to use conditional callbacks
- [ ] Test with different user roles
- [ ] Verify no redirect loops on page load
- [ ] Ensure server-side validation exists for protected actions

---

## Code Examples

### Complete Page Example

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/client/hooks";
import { AccessPermission } from "@/shared";
import { 
  PageHeader, 
  Protected, 
  LoadingSpinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableActions,
  Button
} from "@/client/components";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function UsersListPage() {
  const router = useRouter();
  const { can, canAny, role, isLoading: authLoading } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // CRITICAL: Wait for auth before checking permissions
  useEffect(() => {
    if (authLoading) return;
    
    if (!can(AccessPermission.MENU_USER)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    // Fetch users...
    setIsLoading(false);
  };

  const handleCreate = () => {
    router.push("/users/create");
  };

  const handleEdit = (id: string) => {
    router.push(`/users/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete user?")) return;
    // Delete logic...
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header with conditional Create button */}
      <PageHeader
        title="Users"
        onCreateClick={can(AccessPermission.CREATE_USER) ? handleCreate : undefined}
        createButtonText="Create User"
      />

      {/* Role Display */}
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Your Role: <span className="font-medium">{role?.replace(/_/g, " ")}</span>
        </p>
      </div>

      {/* Conditional Info Box */}
      <Protected permission={AccessPermission.CREATE_USER}>
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          ✓ You can create new users
        </div>
      </Protected>

      {/* Users Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            
            {/* Only show Actions column if user can edit or delete */}
            <Protected permissions={[
              AccessPermission.EDIT_USER,
              AccessPermission.DELETE_USER
            ]}>
              <TableHead>Actions</TableHead>
            </Protected>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              
              <Protected permissions={[
                AccessPermission.EDIT_USER,
                AccessPermission.DELETE_USER
              ]}>
                <TableCell>
                  <TableActions
                    onEdit={
                      can(AccessPermission.EDIT_USER)
                        ? () => handleEdit(user.id)
                        : undefined
                    }
                    onDelete={
                      can(AccessPermission.DELETE_USER)
                        ? () => handleDelete(user.id)
                        : undefined
                    }
                  />
                </TableCell>
              </Protected>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Management Panel - requires both Edit AND Delete */}
      <Protected 
        permissions={[
          AccessPermission.EDIT_USER,
          AccessPermission.DELETE_USER
        ]}
        requireAll
      >
        <div className="p-4 bg-purple-50 border border-purple-200 rounded">
          <h4 className="font-semibold mb-2">Advanced User Management</h4>
          <p className="text-sm">You have full user management capabilities</p>
          <Button className="mt-2" variant="outline">
            Advanced Settings
          </Button>
        </div>
      </Protected>

      {/* Info Box - shows if user has ANY management permission */}
      <Protected permissions={[
        AccessPermission.CREATE_USER,
        AccessPermission.EDIT_USER,
        AccessPermission.DELETE_USER
      ]}>
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded">
          <p className="text-sm">
            You have at least one user management permission
          </p>
        </div>
      </Protected>
    </div>
  );
}
```

### Form Page Example

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/client/hooks";
import { AccessPermission } from "@/shared";
import { FormField, Button, Protected } from "@/client/components";

interface UserFormPageProps {
  userId?: string;
}

export function UserFormPage({ userId }: UserFormPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const isEdit = !!userId;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Check permission based on create vs edit
  useEffect(() => {
    if (authLoading) return;
    
    const requiredPermission = isEdit
      ? AccessPermission.EDIT_USER
      : AccessPermission.CREATE_USER;

    if (!can(requiredPermission)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, isEdit, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic...
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Name"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <FormField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />

      {/* Only show role field if user can edit users */}
      <Protected permission={AccessPermission.EDIT_USER}>
        <FormField
          label="Role"
          name="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        />
      </Protected>

      <div className="flex gap-2">
        <Button type="submit">
          {isEdit ? "Update" : "Create"} User
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

### Detail Page Example

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePermissions } from "@/client/hooks";
import { AccessPermission } from "@/shared";
import { Button, Protected, Card, CardContent } from "@/client/components";

export function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { can, isLoading: authLoading } = usePermissions();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!can(AccessPermission.DETAIL_USER)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  const handleEdit = () => {
    router.push(`/users/${params.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this user?")) return;
    // Delete logic...
    router.push("/users");
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        
        <div className="flex gap-2">
          {/* Edit button - only if user has permission */}
          <Protected permission={AccessPermission.EDIT_USER}>
            <Button onClick={handleEdit}>
              Edit
            </Button>
          </Protected>

          {/* Delete button - only if user has permission */}
          <Protected permission={AccessPermission.DELETE_USER}>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </Protected>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Role</dt>
              <dd className="mt-1">{user.role}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Testing

### Testing Different Roles

1. **Super Admin** (should see everything)
   ```bash
   # Login as super admin
   # Verify: All menu items visible
   # Verify: All action buttons visible (Create, Edit, Delete)
   ```

2. **Finance** (limited access)
   ```bash
   # Login as finance user
   # Verify: Can see Vendors, Clients, Purchase Orders
   # Verify: Cannot see Users menu
   # Verify: Can create Vendors/Clients, but not edit Purchase Orders
   ```

3. **Sales** (read-only)
   ```bash
   # Login as sales user
   # Verify: Can see Purchase Orders
   # Verify: No Create/Edit/Delete buttons
   # Verify: Cannot access other modules
   ```

### Testing Checklist

- [ ] Sidebar shows only permitted menu items
- [ ] Create buttons appear only with CREATE permission
- [ ] Edit buttons appear only with EDIT permission
- [ ] Delete buttons appear only with DELETE permission
- [ ] Unauthorized page access redirects to dashboard
- [ ] No redirect loops on page load (authLoading works correctly)
- [ ] Protected components hide/show correctly
- [ ] TableActions show only permitted actions
- [ ] Form fields conditionally render based on permissions
- [ ] No console errors

### Manual Testing Script

```typescript
// Test each role systematically
const testCases = [
  {
    role: "super_admin",
    shouldSee: ["Users", "Vendors", "Clients", "Purchase Orders"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  {
    role: "finance",
    shouldSee: ["Vendors", "Clients", "Purchase Orders"],
    canCreate: { vendors: true, clients: true, purchaseOrders: false },
    canEdit: { vendors: true, clients: true, purchaseOrders: false },
  },
  {
    role: "sales_vm",
    shouldSee: ["Purchase Orders"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
  },
];

// For each test case:
// 1. Login as that role
// 2. Check sidebar navigation
// 3. Visit each page
// 4. Verify buttons visibility
// 5. Attempt unauthorized actions (should fail gracefully)
```

---

## Security

### Critical Security Points

⚠️ **Client-side permission checks are for UX ONLY**

The RBAC implementation on the client (React components, hooks) only controls what users **see**, not what they can **do**. Malicious users can bypass client-side checks.

### ✅ Secure Approach

**Always validate permissions on the server:**

```typescript
// In your API route handler
import { verifyToken } from "@/server/utils/auth";
import { hasPermission } from "@/shared"; // Import from shared
import { AccessPermission, UserRole } from "@/shared";
import { AppError } from "@/server/utils/error";

export async function DELETE(request: Request) {
  // 1. Verify JWT token
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  const payload = verifyToken(token);
  
  // 2. Check permission
  if (!hasPermission(payload.role as UserRole, AccessPermission.DELETE_USER)) {
    throw new AppError("Forbidden - You don't have permission to delete users", 403);
  }

  // 3. Perform action
  await deleteUser(id);
  
  return Response.json({ message: "User deleted" });
}
```

### Security Best Practices

1. **JWT Secret Management**
   ```bash
   # Use strong, random JWT_SECRET
   # Store in environment variables
   # Never commit to version control
   JWT_SECRET=your-super-secure-random-string-min-32-chars
   ```

2. **Token Expiration**
   ```typescript
   // Set reasonable expiration times
   const token = jwt.sign(
     { userId, email, role },
     JWT_SECRET,
     { expiresIn: "7d" } // Adjust based on security requirements
   );
   ```

3. **HTTPS Only**
   - Always use HTTPS in production
   - Tokens transmitted over HTTP can be intercepted

4. **Server-Side Validation**
   - Check permissions in EVERY protected API route
   - Don't trust client-side state
   - Validate user's role from JWT token

5. **Audit Logging**
   ```typescript
   // Log permission checks for security audits
   logger.info("Permission check", {
     userId: user.id,
     action: "DELETE_USER",
     resource: userId,
     granted: hasPermission(user.role, AccessPermission.DELETE_USER),
     timestamp: new Date().toISOString(),
   });
   ```

6. **Input Validation**
   - Validate all inputs on the server
   - Don't rely on client-side validation
   - Use schema validation (Zod, Yup, etc.)

### Common Security Mistakes

❌ **Don't rely only on client-side checks**
```tsx
// BAD - Only client-side check
const handleDelete = async (id: string) => {
  await fetch(`/api/users/${id}`, { method: "DELETE" });
};
```

✅ **Do validate on both client and server**
```tsx
// GOOD - Client check for UX + Server validation
const handleDelete = async (id: string) => {
  // Client check (UX)
  if (!can(AccessPermission.DELETE_USER)) {
    alert("No permission");
    return;
  }
  
  // Server will also validate before deleting
  await fetch(`/api/users/${id}`, { 
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
```

❌ **Don't decode JWT client-side for critical decisions**
```tsx
// BAD - Client decodes token
const payload = jwt.decode(token); // Can be manipulated!
```

✅ **Do fetch user info from verified server endpoint**
```tsx
// GOOD - Server verifies token and returns user info
const response = await fetch("/api/me", {
  headers: { Authorization: `Bearer ${token}` }
});
const user = await response.json();
```

### Role Permissions Matrix

| Role | Users | Vendors | Clients | Purchase Orders |
|------|-------|---------|---------|-----------------|
| Super Admin | Full (CRUD + Menu) | Full (CRUD + Menu) | Full (CRUD + Menu) | Full (CRUD + Menu) |
| Admin VM | - | - | - | View, Create, Menu |
| Admin Trucking | - | - | - | View, Create, Menu |
| Sales VM | - | - | - | View, Menu |
| Sales Trucking | - | - | - | View, Menu |
| Finance | - | View, Create, Menu | View, Create, Menu | View, Menu |
| Operation | - | - | - | View, Menu |
| Cashier | - | - | - | View, Menu |

**Legend:**
- Menu: Can see in sidebar
- View (Detail): Can view details
- Create: Can create new records
- Edit: Can modify existing records
- Delete: Can delete records
- Full: All permissions (CRUD + Menu)

---

## Common Mistakes & Troubleshooting

### Mistake 1: Redirect Loop on Page Load

**Symptom**: Page redirects to dashboard immediately, even for authorized users.

**Cause**: Permission check happens before user data loads.

**Solution**: Always wait for `authLoading`:

```tsx
// ❌ WRONG
useEffect(() => {
  if (!can(AccessPermission.MENU_USER)) {
    router.push("/dashboard");
  }
}, [can, router]);

// ✅ CORRECT
useEffect(() => {
  if (authLoading) return; // Wait!
  
  if (!can(AccessPermission.MENU_USER)) {
    router.push("/dashboard");
  }
}, [can, authLoading, router]);
```

### Mistake 2: Wrong Permission Name

**Symptom**: Permission check always returns false.

**Cause**: Using wrong permission enum or typo.

**Solution**: Use TypeScript enums:

```tsx
// ❌ WRONG - hardcoded string (typo prone)
<Protected permission="menu_user" as any>

// ✅ CORRECT - use enum (type-safe)
<Protected permission={AccessPermission.MENU_USER}>
```

### Mistake 3: Missing Permission in RBAC Config

**Symptom**: User should have access but doesn't.

**Cause**: Permission not added to role's permissions array.

**Solution**: Check `src/shared/rbac.ts`:

```typescript
{
  role: UserRole.FINANCE,
  permissions: [
    AccessPermission.MENU_VENDOR,
    // Make sure the permission is listed!
  ],
}
```

### Mistake 4: Client-Side Only Protection

**Symptom**: Malicious users can bypass restrictions.

**Cause**: No server-side validation.

**Solution**: Add server-side checks:

```typescript
// In API route
if (!hasPermission(userRole, AccessPermission.DELETE_USER)) {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
```

### Debugging Tips

1. **Check auth loading state:**
   ```tsx
   const { can, isLoading } = usePermissions();
   console.log("Auth loading:", isLoading);
   console.log("User can access:", can(AccessPermission.MENU_USER));
   ```

2. **Verify user role:**
   ```tsx
   const { role } = usePermissions();
   console.log("Current role:", role);
   ```

3. **Check API response:**
   ```bash
   curl http://localhost:3000/api/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Verify RBAC configuration:**
   - Check `src/shared/rbac.ts` for role permissions
   - Check `src/shared/enums.ts` for permission names
   - Check `src/client/layouts/sidebar.json` for menu permissions

---

## Summary

### Quick Reference

**Protect a page:**
```tsx
const { can, isLoading: authLoading } = usePermissions();
useEffect(() => {
  if (authLoading) return;
  if (!can(AccessPermission.MENU_USER)) router.push("/dashboard");
}, [can, authLoading, router]);
```

**Protect a button:**
```tsx
<Protected permission={AccessPermission.CREATE_USER}>
  <Button>Create</Button>
</Protected>
```

**Conditional callback:**
```tsx
const { can } = usePermissions();
<Button onClick={can(AccessPermission.DELETE_USER) ? handleDelete : undefined}>
  Delete
</Button>
```

**Add to sidebar:**
```json
{
  "title": "Users",
  "href": "/users",
  "icon": "users",
  "permissions": "menu_user"
}
```

### Key Takeaways

1. ✅ Always wait for `authLoading` before checking permissions
2. ✅ Use TypeScript enums for type-safety
3. ✅ Protect both client (UX) and server (security)
4. ✅ Follow the principle of least privilege
5. ✅ Test with multiple user roles
6. ✅ Use `<Protected>` for declarative checks
7. ✅ Use `usePermissions()` for imperative checks
8. ✅ Configure sidebar in `sidebar.json`
9. ✅ Map roles to permissions in `rbac.ts`
10. ✅ Validate on the server for actual security

---

**For questions or issues, refer to:**
- `src/shared/rbac.ts` - Permission configuration
- `src/client/hooks/usePermissions.ts` - Permission hooks
- `src/client/components/Protected.tsx` - Protected component
- `src/client/layouts/ProtectedLayout.tsx` - Layout implementation
