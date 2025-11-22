export interface Payment {
  id: string;
  transactionId: string | null;
  type: string;
  amount: number;
  remark: string | null;
  createdAt: Date;
  createdBy: string;
}
