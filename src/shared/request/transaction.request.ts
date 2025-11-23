import { PaginationRequest } from "./common.request";

export interface CreateTransactionRequest {
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    unitQuantityId: string;
    pricePerUnit: number;
    remark?: string;
  }[];
  discounts?: {
    type: string;
    percentage?: number;
    amount?: number;
    transactionItemIndex?: number;
  }[];
  taxes: string[]; // tax IDs
  type: string;
  remark?: string;
  fileId?: string;
}

export interface GetTransactionsRequest extends PaginationRequest {
  type?: string;
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetTransactionSummaryRequest {
  startDate?: string;
  endDate?: string;
}

export interface GetProductTransactionSummaryRequest {
  productId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetTransactionTimeSeriesRequest {
  startDate?: string;
  endDate?: string;
  interval?: string; // 'day', 'week', 'month', 'year'
}
