import { getDbClient } from "../db";
import { createFinanceDashboardRepository } from "../repositories";
import type {
  GetFinanceDashboardRequest,
  FinanceDashboardResponse,
  GrossSales,
  CashflowReport,
  TradeAccount,
  DeferredItems,
  BalanceSheetPosition,
} from "@/shared";

export interface FinanceDashboardService {
  getFinanceDashboard(params: GetFinanceDashboardRequest): Promise<FinanceDashboardResponse>;
}

export function createFinanceDashboardService(): FinanceDashboardService {
  const dashboardRepo = createFinanceDashboardRepository();

  return {
    async getFinanceDashboard(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        // Get gross sales from transactions
        const grossSalesData = await dashboardRepo.getGrossSales(client, params);
        const totalRevenue = parseFloat(grossSalesData.total_revenue);
        const totalExpenses = parseFloat(grossSalesData.total_expenses);
        const grossSales: GrossSales = {
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses,
        };

        // Get cashflow from payments
        const cashflowData = await dashboardRepo.getCashflowReport(client, params);
        const inflow = parseFloat(cashflowData.inflow);
        const outflow = parseFloat(cashflowData.outflow);
        const cashflowReport: CashflowReport = {
          inflow,
          outflow,
          netCashFlow: inflow - outflow,
        };

        // Get trade account
        // A/R = Total sales that haven't been paid yet
        // A/P = Total purchases that haven't been paid yet
        const accountsReceivable = Math.max(0, totalRevenue - inflow);
        const accountsPayable = Math.max(0, totalExpenses - outflow);
        
        const tradeAccount: TradeAccount = {
          accountsReceivable,
          accountsPayable,
          outstandingBalance: accountsReceivable - accountsPayable,
        };

        // Get deferred items
        // Unearned Revenue = Payments received before earning (advance payments from customers)
        // Prepaid Expenses = Payments made before expenses incurred (advance payments to suppliers)
        const unearnedRevenue = Math.max(0, inflow - totalRevenue);
        const prepaidExpenses = Math.max(0, outflow - totalExpenses);
        const deferredItems: DeferredItems = {
          unearnedRevenue,
          prepaidExpenses,
          netDeferredPosition: unearnedRevenue - prepaidExpenses,
        };

        // Get balance sheet position
        // Current Assets = Cash (Net Cash Flow) + Accounts Receivable
        // Current Liabilities = Accounts Payable + Unearned Revenue
        const netCashFlow = inflow - outflow;
        const currentAssets = netCashFlow + accountsReceivable;
        const currentLiabilities = accountsPayable + unearnedRevenue;
        const balanceSheetPosition: BalanceSheetPosition = {
          currentAssets,
          currentLiabilities,
          netWorkingCapital: currentAssets - currentLiabilities,
        };

        await client.query("COMMIT");

        return {
          message: "Finance dashboard data retrieved successfully",
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          data: {
            grossSales,
            cashflowReport,
            tradeAccount,
            deferredItems,
            balanceSheetPosition,
          },
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
