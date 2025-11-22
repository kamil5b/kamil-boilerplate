import { UserRole } from "@/shared/enums/user.enum";
import { AccessPermission } from "@/shared/enums/access_permission.enum";
import { RBACPermissions } from "@/shared/rbac";

export function hasPermission(role: string, permission: AccessPermission): boolean {
  const rbacPermission = RBACPermissions.find((p) => p.role === role);
  if (!rbacPermission) return false;
  return rbacPermission.permissions.includes(permission);
}

export function hasAnyPermission(role: string, permissions: AccessPermission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: string, permissions: AccessPermission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function getUserPermissions(role: string): AccessPermission[] {
  const rbacPermission = RBACPermissions.find((p) => p.role === role);
  return rbacPermission?.permissions || [];
}
