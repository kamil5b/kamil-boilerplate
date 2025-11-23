import { PaginationRequest } from "./common.request";

export interface CreatePaymentRequest {
  transactionId?: string;
  type: string;
  direction: string;
  amount: number;
  details?: {
    identifier: string;
    value: string;
  }[];
  remark?: string;
  fileId?: string;
}

export interface GetPaymentsRequest extends PaginationRequest {
  type?: string;
  transactionId?: string;
  startDate?: string;
  endDate?: string;
}
