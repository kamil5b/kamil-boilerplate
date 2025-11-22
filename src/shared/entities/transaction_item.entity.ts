export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  quantity: number;
  unitQuantityId: string;
  pricePerUnit: number;
  total: number;
  remark: string | null;
}
