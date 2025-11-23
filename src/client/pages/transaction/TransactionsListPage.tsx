"use client";

import type { TransactionResponse } from "@/shared";
import { ListPageTemplate } from "@/client/template";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import { formatDateTime } from "@/client/helpers";
import { AccessPermission } from "@/shared/enums";

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

interface TransactionsListPageProps {
  onCreate: () => void;
  onView: (id: string) => void;
}

export function TransactionsListPage({ onCreate, onView }: TransactionsListPageProps) {
  return (
    <ListPageTemplate<TransactionResponse>
      title="Transactions"
      menuPermission={AccessPermission.MENU_TRANSACTION}
      createPermission={AccessPermission.CREATE_TRANSACTION}
      apiEndpoint="/api/transactions"
      searchPlaceholder="Search transactions..."
      createButtonText="Create Transaction"
      onCreate={onCreate}
      columns={[
        { 
          header: "Type", 
          accessor: (txn) => (
            <Badge className={getTypeColor(txn.type)}>{txn.type}</Badge>
          )
        },
        { header: "Customer", accessor: (txn) => txn.customerName || "-" },
        { header: "Items", accessor: (txn) => `${txn.items.length} item(s)` },
        { 
          header: "Grand Total", 
          accessor: (txn) => `$${txn.grandTotal.toFixed(2)}`,
          className: "font-medium"
        },
        { 
          header: "Paid Amount", 
          accessor: (txn) => `$${txn.paidAmount.toFixed(2)}`,
          className: "font-medium text-green-600"
        },
        { 
          header: "Status", 
          accessor: (txn) => (
            <Badge className={getStatusColor(txn.status)}>{txn.status}</Badge>
          )
        },
        { header: "Created At", accessor: (txn) => formatDateTime(txn.createdAt) },
        { 
          header: "Actions", 
          accessor: (txn) => (
            <Button
              variant="link"
              size="sm"
              onClick={() => onView(txn.id)}
              className="text-blue-500"
            >
              View
            </Button>
          ),
          className: "text-right"
        },
      ]}
      getDeleteConfirmMessage={() => "Transactions cannot be deleted"}
    />
  );
}
