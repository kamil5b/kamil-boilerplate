"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/client/hooks";
import { AccessPermission } from "@/shared/enums";

export interface ProtectedProps {
  children: ReactNode;
  permission?: AccessPermission | string;
  permissions?: (AccessPermission | string)[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function Protected({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: ProtectedProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  // Don't render anything while loading
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Single permission check
  if (permission) {
    return can(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? canAll(permissions)
      : canAny(permissions);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified, render children
  return <>{children}</>;
}
