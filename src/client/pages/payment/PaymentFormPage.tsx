"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CreatePaymentRequest, PaymentResponse, TransactionResponse, UploadFileResponse } from "@/shared";
import { PaymentType, AccessPermission } from "@/shared";
import { usePermissions } from "@/client/hooks";
import { createResource } from "@/client/helpers";
import { validateRequired } from "@/client/helpers/validation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  ErrorAlert,
  FormField,
  FileUpload,
  PaginatedSelect,
} from "@/client/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";

interface PaymentDetailInput {
  identifier: string;
  value: string;
}

interface PaymentFormPageProps {
  transactionId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentFormPage({ transactionId: initialTransactionId, onSuccess, onCancel }: PaymentFormPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [transactionId, setTransactionId] = useState(initialTransactionId || "");
  const [type, setType] = useState<PaymentType>(PaymentType.CASH);
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [details, setDetails] = useState<PaymentDetailInput[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.CREATE_PAYMENT)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  const addDetail = () => {
    setDetails([...details, { identifier: "", value: "" }]);
  };

  const removeDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const updateDetail = (index: number, field: keyof PaymentDetailInput, value: string) => {
    const newDetails = [...details];
    newDetails[index][field] = value;
    setDetails(newDetails);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const typeError = validateRequired(type);
    if (typeError) newErrors.type = typeError;

    const amountError = validateRequired(amount);
    if (amountError) newErrors.amount = amountError;
    else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        newErrors.amount = "Amount must have";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    
    setFileUploadError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "File upload failed");
      }

      const result: { data: UploadFileResponse } = await response.json();
      return result.data.id;
    } catch (err: any) {
      setFileUploadError(err.message || "Failed to upload file");
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      // Upload file first if selected
      let fileId = uploadedFileId;
      if (selectedFile && !uploadedFileId) {
        fileId = await uploadFile();
      }

      const data: CreatePaymentRequest = {
        transactionId: transactionId || undefined,
        type,
        amount: parseFloat(amount),
        details: details.filter(d => d.identifier && d.value),
        remark: remark || undefined,
        fileId: fileId || undefined,
      };

      await createResource<PaymentResponse, CreatePaymentRequest>("/api/payments", data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Payment</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <ErrorAlert message={error} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialTransactionId && (
            <PaginatedSelect<TransactionResponse>
              endpoint="/api/transactions"
              value={transactionId}
              onChange={setTransactionId}
              displayValue={(transaction) => `${transaction.type} - ${transaction.customerName || 'No customer'} - $${transaction.grandTotal.toFixed(2)}`}
              filterValue={(transaction) => `${transaction.type} ${transaction.customerName || ''} ${transaction.id}`}
              getId={(transaction) => transaction.id}
              label="Transaction (Optional)"
              placeholder="Select transaction"
              disabled={isLoading}
              allowClear
            />
          )}
          {initialTransactionId && (
            <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
              Payment for Transaction ID: {initialTransactionId}
            </div>
          )}

          <FormField label="Type" htmlFor="type" required error={errors.type}>
            <Select value={type} onValueChange={(value) => setType(value as PaymentType)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentType.CASH}>Cash</SelectItem>
                <SelectItem value={PaymentType.CARD}>Card</SelectItem>
                <SelectItem value={PaymentType.TRANSFER}>Transfer</SelectItem>
                <SelectItem value={PaymentType.QRIS}>QRIS</SelectItem>
                <SelectItem value={PaymentType.PAPER}>Paper</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Amount" htmlFor="amount" required error={errors.amount}>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
            />
          </FormField>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Details (Optional)</label>
            {details.map((detail, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  placeholder="Identifier (e.g., Card Number)"
                  value={detail.identifier}
                  onChange={(e) => updateDetail(index, "identifier", e.target.value)}
                  disabled={isLoading}
                />
                <Input
                  placeholder="Value"
                  value={detail.value}
                  onChange={(e) => updateDetail(index, "value", e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeDetail(index)}
                  disabled={isLoading}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addDetail}
              disabled={isLoading}
            >
              Add Detail
            </Button>
          </div>

          <FormField label="Remark" htmlFor="remark" error={errors.remark}>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Optional remarks or notes"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Attachment" htmlFor="file" error={fileUploadError || undefined}>
            <FileUpload
              onFileSelect={(file) => {
                setSelectedFile(file);
                setUploadedFileId(null);
                setFileUploadError(null);
              }}
              onFileRemove={() => {
                setSelectedFile(null);
                setUploadedFileId(null);
                setFileUploadError(null);
              }}
              selectedFile={selectedFile}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              maxSizeMB={10}
              disabled={isLoading}
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Payment"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
