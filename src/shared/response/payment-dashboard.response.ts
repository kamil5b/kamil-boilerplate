export interface CustomerPaymentSummary {
  customerId: string | null;
  customerName: string;
  payable: number; // Amount customer owes (from buy transactions)
  receivable: number; // Amount customer is owed (from sell transactions)
}

export interface CustomerPaymentHistoryPoint {
  date: string; // ISO date string
  payable: number;
  receivable: number;
  net: number; // receivable - payable
}

export interface PaymentDashboardResponse {
  message: string;
  requestedAt: string;
  requestId: string;
  data: {
    customerSummaries: CustomerPaymentSummary[];
    historicalData: CustomerPaymentHistoryPoint[];
  };
}
