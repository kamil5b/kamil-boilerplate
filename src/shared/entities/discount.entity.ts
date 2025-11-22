export interface Discount {
  id: string;
  transactionId: string;
  type: string;
  percentage: number | null;
  amount: number;
  transactionItemId: string | null;
}
