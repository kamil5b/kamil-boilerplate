"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PaymentResponse } from "@/shared";
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

interface PaymentsListPageProps {
  onCreate: () => void;
  onView: (id: string) => void;
}

export function PaymentsListPage({ onCreate, onView }: PaymentsListPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.MENU_PAYMENT)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);
  const {
    data: payments,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    nextPage,
    prevPage,
  } = usePagination<PaymentResponse>({
    fetchFn: (page, limit, search) => fetchPaginated<PaymentResponse>("/api/payments", page, limit, search),
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CASH": return "bg-green-500";
      case "CARD": return "bg-blue-500";
      case "TRANSFER": return "bg-purple-500";
      case "QRIS": return "bg-pink-500";
      case "PAPER": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  if (authLoading) return <LoadingSpinner message="Loading..." />;
  if (isLoading) return <LoadingSpinner message="Loading payments..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        onCreateClick={can(AccessPermission.CREATE_PAYMENT) ? onCreate : undefined}
        createButtonText="Create Payment"
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search payments..."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Badge className={getTypeColor(payment.type)}>{payment.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{payment.transactionId || "-"}</TableCell>
                  <TableCell>
                    {payment.details.length > 0 
                      ? `${payment.details.length} detail(s)` 
                      : "-"}
                  </TableCell>
                  <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => onView(payment.id)}
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
