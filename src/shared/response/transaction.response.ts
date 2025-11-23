export interface TransactionItemResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitQuantityId: string;
  unitQuantityName: string;
  pricePerUnit: number;
  total: number;
  remark: string | null;
}

export interface DiscountResponse {
  id: string;
  type: string;
  percentage: number | null;
  amount: number;
  transactionItemId: string | null;
}

export interface TransactionResponse {
  id: string;
  customerId: string | null;
  customerName: string | null;
  items: TransactionItemResponse[];
  discounts: DiscountResponse[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  type: string;
  status: string;
  remark: string | null;
  fileId: string | null;
  createdAt: string;
  createdByName?: string;
}

export interface TransactionSummaryResponse {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  startDate: string;
  endDate: string;
}

export interface TransactionTimeSeriesItemResponse {
  period: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  sellCount: number;
  buyCount: number;
}

export interface ProductTransactionSummaryResponse {
  productId: string;
  productName: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  quantitySold: number;
  quantityBought: number;
}

export interface ProductTransactionTimeSeriesResponse {
  productId: string;
  productName: string;
  data: {
    date: string;
    revenue: number;
    expenses: number;
    netIncome: number;
  }[];
}
