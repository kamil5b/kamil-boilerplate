"use client";

import type { UnitQuantityResponse } from "@/shared";
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

interface UnitQuantitiesListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function UnitQuantitiesListPage({ onEdit, onCreate }: UnitQuantitiesListPageProps) {
  const {
    data: unitQuantities,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    refresh,
    nextPage,
    prevPage,
  } = usePagination<UnitQuantityResponse>({
    fetchFn: (page, limit, search) => fetchPaginated<UnitQuantityResponse>("/api/unit-quantities", page, limit, search),
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete unit quantity "${name}"?`)) return;

    try {
      await deleteResource("/api/unit-quantities", id);
      refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete unit quantity");
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading unit quantities..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unit Quantities"
        onCreateClick={onCreate}
        createButtonText="Create Unit Quantity"
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search unit quantities..."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unitQuantities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No unit quantities found
                </TableCell>
              </TableRow>
            ) : (
              unitQuantities.map((uq) => (
                <TableRow key={uq.id}>
                  <TableCell className="font-medium">{uq.name}</TableCell>
                  <TableCell>{uq.remark || "-"}</TableCell>
                  <TableCell>{formatDateTime(uq.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(uq.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <TableActions
                      onEdit={() => onEdit(uq.id)}
                      onDelete={() => handleDelete(uq.id, uq.name)}
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
