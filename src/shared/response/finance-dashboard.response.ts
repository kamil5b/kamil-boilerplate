export interface GrossSales {
  totalRevenue: number; // From SELL transactions
  totalExpenses: number; // From BUY transactions
  netIncome: number; // Revenue - Expenses
}

export interface CashflowReport {
  inflow: number; // Payments from SELL transactions
  outflow: number; // Payments from BUY transactions
  netCashFlow: number; // Inflow - Outflow
}

export interface OutstandingBalance {
  accountsReceivable: number; // Revenue - Inflow (money customers owe us)
  accountsPayable: number; // Expenses - Outflow (money we owe suppliers)
  netWorkingCapital: number; // A/R - A/P
}

export interface FinanceDashboardResponse {
  message: string;
  requestedAt: string;
  requestId: string;
  data: {
    grossSales: GrossSales;
    cashflowReport: CashflowReport;
    outstandingBalance: OutstandingBalance;
  };
}
