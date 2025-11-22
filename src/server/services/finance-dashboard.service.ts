import { getDbClient } from "../db";
import { createFinanceDashboardRepository } from "../repositories";
import type {
  GetFinanceDashboardRequest,
  FinanceDashboardResponse,
  GrossSales,
  CashflowReport,
  OutstandingBalance,
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

        // Get outstanding balance (transactions - payments)
        const accountsReceivable = cashflowData.inflow - grossSalesData.total_revenue ;
        const accountsPayable =  cashflowData.outflow - grossSalesData.total_expenses;
        
        const outstandingBalance: OutstandingBalance = {
          accountsReceivable,
          accountsPayable,
          netWorkingCapital: accountsReceivable - accountsPayable,
        };

        await client.query("COMMIT");

        return {
          message: "Finance dashboard data retrieved successfully",
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          data: {
            grossSales,
            cashflowReport,
            outstandingBalance,
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
