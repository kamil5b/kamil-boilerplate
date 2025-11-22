"use client";

import type { InventoryHistoryResponse } from "@/shared";
import { usePagination } from "@/client/hooks";
import { fetchPaginated } from "@/client/helpers";
import {
  PageHeader,
  SearchBar,
  Pagination,
  ErrorAlert,
  LoadingSpinner,
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

interface InventoryHistoriesListPageProps {
  onViewSummary: () => void;
  onManipulate: () => void;
}

export function InventoryHistoriesListPage({ onViewSummary, onManipulate }: InventoryHistoriesListPageProps) {
  const {
    data: histories,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    nextPage,
    prevPage,
  } = usePagination<InventoryHistoryResponse>({
    fetchFn: (page, limit, search) => fetchPaginated<InventoryHistoryResponse>("/api/inventory-histories", page, limit, search),
  });

  if (isLoading) return <LoadingSpinner message="Loading inventory histories..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory History"
        onCreateClick={onManipulate}
        createButtonText="Manipulate Inventory"
      />

      <div className="flex gap-2">
        <button
          onClick={onViewSummary}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          View Summary
        </button>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search inventory histories..."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {histories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No inventory histories found
                </TableCell>
              </TableRow>
            ) : (
              histories.map((history) => (
                <TableRow key={history.id}>
                  <TableCell className="font-medium">{history.productName}</TableCell>
                  <TableCell className={history.quantity < 0 ? "text-red-500" : "text-green-500"}>
                    {history.quantity > 0 ? `+${history.quantity}` : history.quantity}
                  </TableCell>
                  <TableCell>{history.unitQuantityName}</TableCell>
                  <TableCell>{history.remark || "-"}</TableCell>
                  <TableCell>{formatDateTime(history.createdAt)}</TableCell>
                  <TableCell>{history.createdByName || "-"}</TableCell>
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
