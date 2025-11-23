export interface PaymentDetailResponse {
  id: string;
  identifier: string;
  value: string;
}

export interface PaymentResponse {
  id: string;
  transactionId: string | null;
  type: string;
  direction: string;
  amount: number;
  details: PaymentDetailResponse[];
  remark: string | null;
  fileId: string | null;
  createdAt: string;
  createdByName?: string;
}
