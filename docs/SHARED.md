# Shared Module

This folder contains all shared types, interfaces, entities, enums, and configurations used across both client and server code in the application.

## Structure

```
shared/
├── entities/          # Database entity interfaces
├── enums/            # Application enums
├── rbac/             # Role-Based Access Control
├── request/          # API request types
├── response/         # API response types
└── index.ts          # Main export file
```

## Folders

### `entities/`
Database entity interfaces that match the database schema. Each entity represents a table in PostgreSQL.

**Files:**
- `user.entity.ts` - User entity with roles
- `vendor.entity.ts` - Vendor entity
- `client.entity.ts` - Client entity
- `client_purchase_order.entity.ts` - Client purchase order entity
- `vendor_purchase_order.entity.ts` - Vendor purchase order entity
- `cost_code.entity.ts` - Cost code entity
- `vehicle.entity.ts` - Vehicle entity
- `tax.entity.ts` - Tax entity
- `file_upload.entity.ts` - File upload entity

**Example:**
```typescript
import { User } from "@/shared/entities";
// or
import { User } from "@/shared";
```

### `enums/`
Application-wide enumerations organized by domain.

**Files:**
- `user.enum.ts` - UserRole enum
- `access_permission.enum.ts` - AccessPermission enum
- `purchase_order.enum.ts` - PurchaseOrderStatus, PurchaseOrderCategory, PurchaseOrderType
- `vendor_purchase_order.enum.ts` - VendorPurchaseOrderStatus, VendorPurchaseOrderType

**Example:**
```typescript
import { UserRole, AccessPermission } from "@/shared/enums";
// or
import { UserRole } from "@/shared";
```

### `rbac/`
Role-Based Access Control configuration and permissions.

**Files:**
- `rbac.ts` - RBACPermission interface and RBACPermissions array mapping roles to permissions

**Example:**
```typescript
import { RBACPermissions } from "@/shared/rbac";
// or
import { RBACPermissions } from "@/shared";
```

### `request/`
Request types for API endpoints organized by domain.

**Files:**
- `common.request.ts` - PaginationRequest (base for all list queries)
- `user.request.ts` - CreateUserRequest, UpdateUserRequest, GetUsersRequest
- `vendor.request.ts` - CreateVendorRequest, UpdateVendorRequest, GetVendorsRequest
- `client.request.ts` - CreateClientRequest, UpdateClientRequest, GetClientsRequest
- `auth.request.ts` - LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
- `client_purchase_order.request.ts` - Client PO request types
- `vendor_purchase_order.request.ts` - Vendor PO request types
- `cost_code.request.ts` - Cost code request types
- `vehicle.request.ts` - Vehicle request types

**Example:**
```typescript
import { CreateUserRequest, GetUsersRequest } from "@/shared/request";
// or
import { CreateUserRequest } from "@/shared";
```

### `response/`
Response types for API endpoints organized by domain.

**Files:**
- `common.response.ts` - BaseResponse, PaginationMeta, PaginatedResponse
- `user.response.ts` - UserResponse
- `vendor.response.ts` - VendorResponse
- `client.response.ts` - ClientResponse
- `auth.response.ts` - LoginResponse, AuthTokenPayload
- `tax.response.ts` - TaxResponse
- `client_purchase_order.response.ts` - Client PO response types
- `vendor_purchase_order.response.ts` - Vendor PO response types
- `cost_code.response.ts` - CostCodeResponse
- `vehicle.response.ts` - VehicleResponse

**Example:**
```typescript
import { UserResponse, PaginatedResponse } from "@/shared/response";
// or
import { UserResponse } from "@/shared";
```

## Usage

### Import from subfolder (recommended for clarity)
```typescript
import { User } from "@/shared/entities";
import { UserRole } from "@/shared/enums";
import { CreateUserRequest } from "@/shared/request";
import { UserResponse } from "@/shared/response";
import { RBACPermissions } from "@/shared/rbac";
```

### Import from root (shorter)
```typescript
import { 
  User, 
  UserRole, 
  CreateUserRequest, 
  UserResponse,
  RBACPermissions 
} from "@/shared";
```

## Adding New Types

When adding a new domain (e.g., "Product"):

1. **Create entity** (if database table exists):
   ```typescript
   // shared/entities/product.entity.ts
   export interface Product {
     id: string;
     name: string;
     createdAt: Date;
     updatedAt: Date;
     deletedAt: Date | null;
   }
   ```

2. **Create enums** (if needed):
   ```typescript
   // shared/enums/product.enum.ts
   export enum ProductStatus {
     ACTIVE = "active",
     INACTIVE = "inactive",
   }
   ```

3. **Create request types**:
   ```typescript
   // shared/request/product.request.ts
   import { PaginationRequest } from "./common.request";
   
   export interface CreateProductRequest {
     name: string;
   }
   
   export interface UpdateProductRequest {
     name?: string;
   }
   
   export interface GetProductsRequest extends PaginationRequest {
     sortByName?: "asc" | "desc";
   }
   ```

4. **Create response types**:
   ```typescript
   // shared/response/product.response.ts
   export interface ProductResponse {
     id: string;
     name: string;
     createdAt: string;
     updatedAt: string;
   }
   ```

5. **Export from index files**:
   ```typescript
   // shared/entities/index.ts
   export * from "./product.entity";
   
   // shared/enums/index.ts
   export * from "./product.enum";
   
   // shared/request/index.ts
   export * from "./product.request";
   
   // shared/response/index.ts
   export * from "./product.response";
   ```

## Best Practices

1. **One domain per file** - Keep related types together
2. **Use descriptive names** - Follow pattern: `{Domain}{Type}.{category}.ts`
3. **Export from index** - Always add exports to subfolder index.ts
4. **Extend common types** - Use PaginationRequest, BaseResponse as base
5. **Keep it pure** - No business logic, only type definitions
6. **Document complex types** - Add JSDoc comments for complex interfaces
7. **Use enums for constants** - Avoid magic strings

## Common Patterns

### Pagination Request
```typescript
export interface GetResourcesRequest extends PaginationRequest {
  sortByField?: "asc" | "desc";
  filterByStatus?: Status[];
}
```

### Response with Relations
```typescript
export interface ResourceResponse {
  id: string;
  name: string;
  relatedId: string;
  relatedName?: string;  // Populated from join
  createdAt: string;
  updatedAt: string;
}
```

### Optional Fields in Update
```typescript
export interface UpdateResourceRequest {
  name?: string;        // All fields optional
  status?: Status;      // for partial updates
}
```

## Notes

- All dates in entities use `Date` type
- All dates in responses use `string` type (RFC3339 format)
- All IDs use UUID format
- Soft deletes use `deletedAt: Date | null`
- Request/Response types mirror API contract
