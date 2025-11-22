"use client";

import type { UserResponse } from "@/shared/response";
import { ListPageTemplate } from "@/client/template";
import { formatRole, formatDate } from "@/client/helpers";
import { Badge } from "@/client/components";
import { AccessPermission } from "@/shared/enums";

interface UsersListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function UsersListPage({ onEdit, onCreate }: UsersListPageProps) {
  return (
    <ListPageTemplate<UserResponse>
      title="Users"
      menuPermission={AccessPermission.MENU_USER}
      createPermission={AccessPermission.CREATE_USER}
      editPermission={AccessPermission.EDIT_USER}
      deletePermission={AccessPermission.DELETE_USER}
      apiEndpoint="/api/users"
      searchPlaceholder="Search users by name or email..."
      createButtonText="Create User"
      onEdit={onEdit}
      onCreate={onCreate}
      columns={[
        { header: "Name", accessor: (user) => user.name, className: "font-medium" },
        { header: "Email", accessor: (user) => user.email },
        { 
          header: "Role", 
          accessor: (user) => (
            <Badge variant="secondary">{formatRole(user.role)}</Badge>
          )
        },
        { 
          header: "Status", 
          accessor: (user) => (
            <Badge variant={user.isActive ? "default" : "outline"}>
              {user.isActive ? "Active" : "Inactive"}
            </Badge>
          )
        },
        { header: "Created", accessor: (user) => formatDate(user.createdAt), className: "text-muted-foreground" },
      ]}
      getDeleteConfirmMessage={() => "Are you sure you want to delete this user?"}
    />
  );
}
