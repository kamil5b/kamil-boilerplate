"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserResponse } from "@/shared/response";
import { usePagination, usePermissions } from "@/client/hooks";
import { fetchPaginated, deleteResource, formatRole, formatDate } from "@/client/helpers";
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
  Badge,
  Protected,
} from "@/client/components";
import { AccessPermission } from "@/shared/enums";

interface UsersListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function UsersListPage({ onEdit, onCreate }: UsersListPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.MENU_USER)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);
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
      fetchPaginated("/api/users", page, limit, search),
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteResource("/api/users", id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading users..." />;

  if (authLoading) return <LoadingSpinner message="Loading..." />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        onCreateClick={can(AccessPermission.CREATE_USER) ? onCreate : undefined}
        createButtonText="Create User"
      />
      <ErrorAlert message={error} />
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search users by name or email..."
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <Protected permissions={[AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]}>
                <TableHead className="text-right">Actions</TableHead>
              </Protected>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{formatRole(user.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "outline"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <Protected permissions={[AccessPermission.EDIT_USER, AccessPermission.DELETE_USER]}>
                    <TableCell>
                      <TableActions
                        onEdit={can(AccessPermission.EDIT_USER) ? () => onEdit(user.id) : undefined}
                        onDelete={can(AccessPermission.DELETE_USER) ? () => handleDelete(user.id) : undefined}
                      />
                    </TableCell>
                  </Protected>
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
