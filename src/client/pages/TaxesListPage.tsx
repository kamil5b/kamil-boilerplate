"use client";

import type { TaxResponse } from "@/shared";
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

interface TaxesListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function TaxesListPage({ onEdit, onCreate }: TaxesListPageProps) {
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

  if (isLoading) return <LoadingSpinner message="Loading taxes..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxes"
        onCreateClick={onCreate}
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
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <TableActions
                      onEdit={() => onEdit(tax.id)}
                      onDelete={() => handleDelete(tax.id, tax.name)}
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
