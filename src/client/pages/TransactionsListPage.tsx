"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TransactionResponse } from "@/shared";
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
import { Badge } from "@/client/components/ui/badge";
import { formatDateTime } from "@/client/helpers";
import { AccessPermission } from "@/shared/enums";

interface TransactionsListPageProps {
  onCreate: () => void;
  onView: (id: string) => void;
}

export function TransactionsListPage({ onCreate, onView }: TransactionsListPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.MENU_TRANSACTION)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);
  const {
    data: transactions,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    nextPage,
    prevPage,
  } = usePagination<TransactionResponse>({
    fetchFn: (page, limit, search) => fetchPaginated<TransactionResponse>("/api/transactions", page, limit, search),
  });

  const getTypeColor = (type: string) => {
    return type === "SELL" ? "bg-green-500" : "bg-red-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-green-500";
      case "PARTIALLY_PAID": return "bg-yellow-500";
      case "UNPAID": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (authLoading) return <LoadingSpinner message="Loading..." />;
  if (isLoading) return <LoadingSpinner message="Loading transactions..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        onCreateClick={can(AccessPermission.CREATE_TRANSACTION) ? onCreate : undefined}
        createButtonText="Create Transaction"
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search transactions..."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Grand Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Badge className={getTypeColor(transaction.type)}>{transaction.type}</Badge>
                  </TableCell>
                  <TableCell>{transaction.customerName || "-"}</TableCell>
                  <TableCell>{transaction.items.length} item(s)</TableCell>
                  <TableCell className="font-medium">${transaction.grandTotal.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => onView(transaction.id)}
                      className="text-blue-500 hover:underline"
                    >
                      View
                    </button>
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
