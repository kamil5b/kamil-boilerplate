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

export interface TradeAccount {
  accountsReceivable: number; // Revenue - Inflow (money customers owe us)
  accountsPayable: number; // Expenses - Outflow (money we owe suppliers)
  outstandingBalance: number; // A/R - A/P
}

export interface DeferredItems {
  unearnedRevenue: number; // Inflow - Revenue (payments received before earning)
  prepaidExpenses: number; // Outflow - Expenses (payments made before incurring)
  netDeferredPosition: number; // U/R - P/E
}

export interface BalanceSheetPosition {
  currentAssets: number; // A/R + U/R
  currentLiabilities: number; // A/P + P/E
  netWorkingCapital: number; // C/A - C/L
}

export interface FinanceDashboardResponse {
  message: string;
  requestedAt: string;
  requestId: string;
  data: {
    grossSales: GrossSales;
    cashflowReport: CashflowReport;
    tradeAccount: TradeAccount;
    deferredItems: DeferredItems;
    balanceSheetPosition: BalanceSheetPosition;
  };
}
