"use client";

import type { PaymentResponse } from "@/shared";
import { ListPageTemplate } from "@/client/template";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import { formatDateTime } from "@/client/helpers";
import { AccessPermission } from "@/shared/enums";

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

interface PaymentsListPageProps {
  onCreate: () => void;
  onView: (id: string) => void;
}

export function PaymentsListPage({ onCreate, onView }: PaymentsListPageProps) {
  return (
    <ListPageTemplate<PaymentResponse>
      title="Payments"
      menuPermission={AccessPermission.MENU_PAYMENT}
      createPermission={AccessPermission.CREATE_PAYMENT}
      apiEndpoint="/api/payments"
      searchPlaceholder="Search payments..."
      createButtonText="Create Payment"
      onCreate={onCreate}
      columns={[
        { 
          header: "Type", 
          accessor: (payment) => (
            <Badge className={getTypeColor(payment.type)}>{payment.type}</Badge>
          )
        },
        { 
          header: "Direction", 
          accessor: (payment) => (
            <Badge variant={payment.direction === "INFLOW" ? "default" : "destructive"}>
              {payment.direction}
            </Badge>
          )
        },
        { 
          header: "Amount", 
          accessor: (payment) => (
            <span className={payment.direction === "OUTFLOW" ? "text-red-600" : "text-green-600"}>
              {payment.direction === "OUTFLOW" ? "-" : "+"}${payment.amount.toFixed(2)}
            </span>
          ),
          className: "font-medium"
        },
        { 
          header: "Transaction ID", 
          accessor: (payment) => payment.transactionId || "-",
          className: "font-mono text-sm"
        },
        { 
          header: "Details", 
          accessor: (payment) => payment.details.length > 0 ? `${payment.details.length} detail(s)` : "-"
        },
        { header: "Created At", accessor: (payment) => formatDateTime(payment.createdAt) },
        { 
          header: "Actions", 
          accessor: (payment) => (
            <Button
              variant="link"
              size="sm"
              onClick={() => onView(payment.id)}
              className="text-blue-500"
            >
              View
            </Button>
          ),
          className: "text-right"
        },
      ]}
      getDeleteConfirmMessage={() => "Payments cannot be deleted"}
    />
  );
}
