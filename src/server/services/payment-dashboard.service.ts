import { getDbClient } from "../db";
import { createPaymentDashboardRepository } from "../repositories";
import type {
  GetPaymentDashboardRequest,
  PaymentDashboardResponse,
  CustomerPaymentSummary,
  CustomerPaymentHistoryPoint,
} from "@/shared";

export interface PaymentDashboardService {
  getPaymentDashboard(params: GetPaymentDashboardRequest): Promise<PaymentDashboardResponse>;
}

export function createPaymentDashboardService(): PaymentDashboardService {
  const dashboardRepo = createPaymentDashboardRepository();

  return {
    async getPaymentDashboard(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        // Get customer payment summaries
        const summaryRows = await dashboardRepo.getCustomerPaymentSummaries(client, params);
        const customerSummaries: CustomerPaymentSummary[] = summaryRows.map((row) => ({
          customerId: row.customer_id === '00000000-0000-0000-0000-000000000000' ? null : row.customer_id,
          customerName: row.customer_name,
          payable: parseFloat(row.payable),
          receivable: parseFloat(row.receivable),
        }));

        // Get historical data for line graph
        const historicalRows = await dashboardRepo.getCustomerPaymentHistorical(client, params);
        const historicalData: CustomerPaymentHistoryPoint[] = historicalRows.map((row) => ({
          date: row.date.toISOString(),
          payable: parseFloat(row.payable),
          receivable: parseFloat(row.receivable),
          net: parseFloat(row.net),
        }));

        await client.query("COMMIT");

        return {
          message: "Payment dashboard data retrieved successfully",
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          data: {
            customerSummaries,
            historicalData,
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
