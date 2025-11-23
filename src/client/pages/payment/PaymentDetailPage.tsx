"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PaymentResponse } from "@/shared";
import { AccessPermission } from "@/shared";
import { usePermissions } from "@/client/hooks";
import { fetchById } from "@/client/helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  LoadingSpinner,
  FilePreview,
} from "@/client/components";
import { Badge } from "@/client/components/ui/badge";
import { formatDateTime } from "@/client/helpers";

interface PaymentDetailPageProps {
  paymentId: string;
  onBack: () => void;
}

export function PaymentDetailPage({ paymentId, onBack }: PaymentDetailPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.DETAIL_PAYMENT)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  useEffect(() => {
    fetchById<PaymentResponse>("/api/payments", paymentId)
      .then(setPayment)
      .catch((err) => setError(err.message || "Failed to load payment"))
      .finally(() => setIsLoading(false));
  }, [paymentId]);

  if (isLoading) return <LoadingSpinner message="Loading payment..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!payment) return <ErrorAlert message="Payment not found" />;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Details</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Back
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Payment ID</label>
              <p className="font-mono text-sm">{payment.id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Type</label>
              <div className="mt-1">
                <Badge className={getTypeColor(payment.type)}>{payment.type}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Amount</label>
              <p className="text-2xl font-bold">${payment.amount.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Created At</label>
              <p>{formatDateTime(payment.createdAt)}</p>
            </div>
            {payment.transactionId && (
              <div className="col-span-2">
                <label className="text-sm text-gray-500">Transaction ID</label>
                <p className="font-mono text-sm">{payment.transactionId}</p>
              </div>
            )}
            {payment.createdByName && (
              <div>
                <label className="text-sm text-gray-500">Created By</label>
                <p>{payment.createdByName}</p>
              </div>
            )}
          </div>

          {payment.remark && (
            <div>
              <label className="text-sm text-gray-500">Remark</label>
              <p className="mt-1 p-3 bg-gray-50 rounded">{payment.remark}</p>
            </div>
          )}

          {payment.details && payment.details.length > 0 && (
            <div>
              <label className="text-sm text-gray-500 block mb-2">Payment Details</label>
              <div className="border rounded divide-y">
                {payment.details.map((detail) => (
                  <div key={detail.id} className="p-3 flex justify-between">
                    <span className="font-medium">{detail.identifier}</span>
                    <span className="text-gray-600">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payment.fileId && (
            <div>
              <label className="text-sm text-gray-500 block mb-2">Attachment</label>
              <FilePreview fileId={payment.fileId} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
