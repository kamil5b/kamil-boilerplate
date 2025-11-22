"use client";

import { useAuth } from "./useAuth";
import { hasPermission, hasAnyPermission, hasAllPermissions, getUserPermissions } from "@/client/helpers/rbac";
import { AccessPermission } from "@/shared/enums/access_permission.enum";

export function usePermissions() {
  const { user, isLoading } = useAuth();
  
  const role = user?.role || null;

  const can = (permission: AccessPermission | string): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  const canAny = (permissions: (AccessPermission | string)[]): boolean => {
    if (!role) return false;
    return hasAnyPermission(role, permissions);
  };

  const canAll = (permissions: (AccessPermission | string)[]): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, permissions);
  };

  const permissions = role ? getUserPermissions(role) : [];

  return {
    can,
    canAny,
    canAll,
    permissions,
    role,
    isLoading,
  };
}
