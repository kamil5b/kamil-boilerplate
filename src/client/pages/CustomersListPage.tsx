"use client";

import type { CustomerResponse } from "@/shared";
import { usePagination } from "@/client/hooks";
import { fetchPaginated, deleteResource } from "@/client/helpers";
import {
  PageHeader,
  SearchBar,
  Pagination,
  ErrorAlert,
  LoadingSpinner,
  TableActions,
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

interface CustomersListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function CustomersListPage({ onEdit, onCreate }: CustomersListPageProps) {
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

  if (isLoading) return <LoadingSpinner message="Loading customers..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        onCreateClick={onCreate}
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
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <TableActions
                      onEdit={() => onEdit(customer.id)}
                      onDelete={() => handleDelete(customer.id, customer.name)}
                    />
                  </TableCell>
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
