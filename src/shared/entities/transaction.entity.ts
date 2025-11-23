export interface Transaction {
  id: string;
  customerId: string | null;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  type: string;
  status: string;
  remark: string | null;
  fileId: string | null;
  createdAt: Date;
  createdBy: string;
}
