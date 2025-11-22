"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UnitQuantityResponse } from "@/shared";
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

interface UnitQuantitiesListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function UnitQuantitiesListPage({ onEdit, onCreate }: UnitQuantitiesListPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.MENU_UNIT_QUANTITY)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);
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

  if (authLoading) return <LoadingSpinner message="Loading..." />;
  if (isLoading) return <LoadingSpinner message="Loading unit quantities..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unit Quantities"
        onCreateClick={can(AccessPermission.CREATE_UNIT_QUANTITY) ? onCreate : undefined}
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
              <Protected permissions={[AccessPermission.EDIT_UNIT_QUANTITY, AccessPermission.DELETE_UNIT_QUANTITY]}>
                <TableHead className="text-right">Actions</TableHead>
              </Protected>
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
                  <Protected permissions={[AccessPermission.EDIT_UNIT_QUANTITY, AccessPermission.DELETE_UNIT_QUANTITY]}>
                    <TableCell className="text-right">
                      <TableActions
                        onEdit={can(AccessPermission.EDIT_UNIT_QUANTITY) ? () => onEdit(uq.id) : undefined}
                        onDelete={can(AccessPermission.DELETE_UNIT_QUANTITY) ? () => handleDelete(uq.id, uq.name) : undefined}
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
