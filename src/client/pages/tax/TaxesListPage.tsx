"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TaxResponse } from "@/shared";
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

interface TaxesListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function TaxesListPage({ onEdit, onCreate }: TaxesListPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.MENU_TAX)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);
  const {
    data: taxes,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    refresh,
    nextPage,
    prevPage,
  } = usePagination<TaxResponse>({
    fetchFn: (page, limit, search) => fetchPaginated<TaxResponse>("/api/taxes", page, limit, search),
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete tax "${name}"?`)) return;

    try {
      await deleteResource("/api/taxes", id);
      refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete tax");
    }
  };

  if (authLoading) return <LoadingSpinner message="Loading..." />;
  if (isLoading) return <LoadingSpinner message="Loading taxes..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxes"
        onCreateClick={can(AccessPermission.CREATE_TAX) ? onCreate : undefined}
        createButtonText="Create Tax"
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search taxes..."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value (%)</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead>Created At</TableHead>
              <Protected permissions={[AccessPermission.EDIT_TAX, AccessPermission.DELETE_TAX]}>
                <TableHead className="text-right">Actions</TableHead>
              </Protected>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No taxes found
                </TableCell>
              </TableRow>
            ) : (
              taxes.map((tax) => (
                <TableRow key={tax.id}>
                  <TableCell className="font-medium">{tax.name}</TableCell>
                  <TableCell>{tax.value}%</TableCell>
                  <TableCell>{tax.remark || "-"}</TableCell>
                  <TableCell>{formatDateTime(tax.createdAt)}</TableCell>
                  <Protected permissions={[AccessPermission.EDIT_TAX, AccessPermission.DELETE_TAX]}>
                    <TableCell className="text-right">
                      <TableActions
                        onEdit={can(AccessPermission.EDIT_TAX) ? () => onEdit(tax.id) : undefined}
                        onDelete={can(AccessPermission.DELETE_TAX) ? () => handleDelete(tax.id, tax.name) : undefined}
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
