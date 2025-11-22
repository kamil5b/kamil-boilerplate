"use client";

import type { UserResponse } from "@/shared/response";
import { usePagination } from "@/client/hooks";
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
} from "@/client/components";

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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        onCreateClick={onCreate}
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
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell>
                    <TableActions
                      onEdit={() => onEdit(user.id)}
                      onDelete={() => handleDelete(user.id)}
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
