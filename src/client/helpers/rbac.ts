import { UserRole } from "@/shared/enums/user.enum";
import { AccessPermission } from "@/shared/enums/access_permission.enum";
import { RBACPermissions } from "@/shared/rbac";

export function hasPermission(role: UserRole | string, permission: AccessPermission | string): boolean {
  const rbacPermission = RBACPermissions.find((p) => p.role === role);
  if (!rbacPermission) return false;
  return rbacPermission.permissions.includes(permission as AccessPermission);
}

export function hasAnyPermission(role: UserRole | string, permissions: (AccessPermission | string)[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole | string, permissions: (AccessPermission | string)[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function getUserPermissions(role: UserRole | string): AccessPermission[] {
  const rbacPermission = RBACPermissions.find((p) => p.role === role);
  return rbacPermission?.permissions || [];
}
