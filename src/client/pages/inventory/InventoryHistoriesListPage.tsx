"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { InventoryHistoryResponse } from "@/shared";
import { usePagination, usePermissions } from "@/client/hooks";
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
import { AccessPermission } from "@/shared/enums";

interface InventoryHistoriesListPageProps {
  onManipulate: () => void;
}

export function InventoryHistoriesListPage({ onManipulate }: InventoryHistoriesListPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.MENU_INVENTORY)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);
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

  if (authLoading) return <LoadingSpinner message="Loading..." />;
  if (isLoading) return <LoadingSpinner message="Loading inventory histories..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory History"
        onCreateClick={can(AccessPermission.MANIPULATE_INVENTORY) ? onManipulate : undefined}
        createButtonText="Manipulate Inventory"
      />

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
