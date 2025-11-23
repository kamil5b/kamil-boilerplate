export interface Payment {
  id: string;
  transactionId: string | null;
  type: string;
  direction: string;
  amount: number;
  remark: string | null;
  fileId: string | null;
  createdAt: Date;
  createdBy: string;
}
