"use client";

import { useState, useEffect } from "react";
import type { TransactionResponse } from "@/shared";
import { fetchById } from "@/client/helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

interface TransactionDetailPageProps {
  transactionId: string;
  onBack: () => void;
  onCreatePayment: (transactionId: string) => void;
}

export function TransactionDetailPage({ transactionId, onBack, onCreatePayment }: TransactionDetailPageProps) {
  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchById<TransactionResponse>("/api/transactions", transactionId)
      .then(setTransaction)
      .catch((err) => setError(err.message || "Failed to load transaction"))
      .finally(() => setIsLoading(false));
  }, [transactionId]);

  if (isLoading) return <LoadingSpinner message="Loading transaction..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!transaction) return <ErrorAlert message="Transaction not found" />;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transaction Details</h1>
        <div className="flex gap-2">
          {transaction.status !== "PAID" && (
            <button
              onClick={() => onCreatePayment(transactionId)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Payment
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Back
          </button>
        </div>
      </div>

      {/* Transaction Info */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Transaction ID</label>
              <p className="font-mono text-sm">{transaction.id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Type</label>
              <div className="mt-1">
                <Badge className={getTypeColor(transaction.type)}>{transaction.type}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <div className="mt-1">
                <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Customer</label>
              <p>{transaction.customerName || "No customer"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Created At</label>
              <p>{formatDateTime(transaction.createdAt)}</p>
            </div>
            {transaction.createdByName && (
              <div>
                <label className="text-sm text-gray-500">Created By</label>
                <p>{transaction.createdByName}</p>
              </div>
            )}
          </div>

          {transaction.remark && (
            <div>
              <label className="text-sm text-gray-500">Remark</label>
              <p className="mt-1 p-3 bg-gray-50 rounded">{transaction.remark}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Price/Unit</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transaction.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unitQuantityName}</TableCell>
                  <TableCell className="text-right">${item.pricePerUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Discounts */}
      {transaction.discounts && transaction.discounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Discounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transaction.discounts.map((discount) => (
                <div key={discount.id} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{discount.type}</span>
                  <span className="text-gray-600">
                    {discount.percentage ? `${discount.percentage}%` : ""} 
                    {" "}
                    -${discount.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">${transaction.subtotal.toFixed(2)}</span>
            </div>
            {transaction.discounts && transaction.discounts.length > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Total Discounts</span>
                <span className="font-medium">
                  -${transaction.discounts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="font-medium">${transaction.totalTax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span>${transaction.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
