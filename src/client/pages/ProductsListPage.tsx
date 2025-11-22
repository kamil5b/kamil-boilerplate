"use client";

import type { ProductResponse } from "@/shared";
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
import { Badge } from "@/client/components/ui/badge";
import { formatDateTime } from "@/client/helpers";

interface ProductsListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function ProductsListPage({ onEdit, onCreate }: ProductsListPageProps) {
  const {
    data: products,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    refresh,
    nextPage,
    prevPage,
  } = usePagination<ProductResponse>({
    fetchFn: (page, limit, search) => fetchPaginated<ProductResponse>("/api/products", page, limit, search),
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;

    try {
      await deleteResource("/api/products", id);
      refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete product");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SELLABLE": return "bg-green-500";
      case "ASSET": return "bg-blue-500";
      case "UTILITY": return "bg-yellow-500";
      case "PLACEHOLDER": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading products..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        onCreateClick={onCreate}
        createButtonText="Create Product"
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search products..."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(product.type)}>{product.type}</Badge>
                  </TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{formatDateTime(product.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <TableActions
                      onEdit={() => onEdit(product.id)}
                      onDelete={() => handleDelete(product.id, product.name)}
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
