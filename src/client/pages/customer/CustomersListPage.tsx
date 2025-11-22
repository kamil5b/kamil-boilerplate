"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CustomerResponse } from "@/shared";
import { usePagination, usePermissions } from "@/client/hooks";
import { fetchPaginated, deleteResource } from "@/client/helpers";
import {
  PageHeader,
  SearchBar,
  Pagination,
  ErrorAlert,
  LoadingSpinner,
  TableActions,
  Protected,
} from "@/client/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { formatDateTime } from "@/client/helpers";
import { AccessPermission } from "@/shared/enums";

interface CustomersListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function CustomersListPage({ onEdit, onCreate }: CustomersListPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.MENU_CUSTOMER)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);
  const {
    data: customers,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    refresh,
    nextPage,
    prevPage,
  } = usePagination<CustomerResponse>({
    fetchFn: (page, limit, search) => fetchPaginated<CustomerResponse>("/api/customers", page, limit, search),
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;

    try {
      await deleteResource("/api/customers", id);
      refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete customer");
    }
  };

  if (authLoading) return <LoadingSpinner message="Loading..." />;
  if (isLoading) return <LoadingSpinner message="Loading customers..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        onCreateClick={can(AccessPermission.CREATE_CUSTOMER) ? onCreate : undefined}
        createButtonText="Create Customer"
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search customers..."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Created At</TableHead>
              <Protected permissions={[AccessPermission.EDIT_CUSTOMER, AccessPermission.DELETE_CUSTOMER]}>
                <TableHead className="text-right">Actions</TableHead>
              </Protected>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phoneNumber}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.address || "-"}</TableCell>
                  <TableCell>{formatDateTime(customer.createdAt)}</TableCell>
                  <Protected permissions={[AccessPermission.EDIT_CUSTOMER, AccessPermission.DELETE_CUSTOMER]}>
                    <TableCell className="text-right">
                      <TableActions
                        onEdit={can(AccessPermission.EDIT_CUSTOMER) ? () => onEdit(customer.id) : undefined}
                        onDelete={can(AccessPermission.DELETE_CUSTOMER) ? () => handleDelete(customer.id, customer.name) : undefined}
                      />
                    </TableCell>
                  </Protected>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPrevious={prevPage}
          onNext={nextPage}
        />
      )}
    </div>
  );
}
