import { PoolClient } from "pg";
import type { GetFinanceDashboardRequest } from "@/shared/request";

export interface FinanceDashboardRepository {
  getGrossSales(client: PoolClient, params: GetFinanceDashboardRequest): Promise<any>;
  getCashflowReport(client: PoolClient, params: GetFinanceDashboardRequest): Promise<any>;
}

export function createFinanceDashboardRepository(): FinanceDashboardRepository {
  return {
    async getGrossSales(client, params) {
      const { startDate, endDate } = params;

      let whereClause = "WHERE 1=1";
      const queryParams: any[] = [];
      let paramCounter = 1;

      if (startDate) {
        whereClause += ` AND created_at >= $${paramCounter}`;
        queryParams.push(startDate);
        paramCounter++;
      }

      if (endDate) {
        whereClause += ` AND created_at <= $${paramCounter}`;
        queryParams.push(endDate);
        paramCounter++;
      }

      // Calculate gross sales from transactions
      const result = await client.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN type = 'SELL' THEN grand_total ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN type = 'BUY' THEN grand_total ELSE 0 END), 0) as total_expenses
         FROM transactions
         ${whereClause}`,
        queryParams
      );

      return result.rows[0] || { total_revenue: 0, total_expenses: 0 };
    },

    async getCashflowReport(client, params) {
      const { startDate, endDate } = params;

      let whereClause = "WHERE 1=1";
      const queryParams: any[] = [];
      let paramCounter = 1;

      if (startDate) {
        whereClause += ` AND p.created_at >= $${paramCounter}`;
        queryParams.push(startDate);
        paramCounter++;
      }

      if (endDate) {
        whereClause += ` AND p.created_at <= $${paramCounter}`;
        queryParams.push(endDate);
        paramCounter++;
      }

      // Calculate cashflow from payments
      const result = await client.query(
        `SELECT 
          SUM(CASE WHEN p.amount > 0 THEN p.amount ELSE 0 END) as inflow,
          SUM(CASE WHEN p.amount < 0 THEN p.amount * -1 ELSE 0 END) as outflow
         FROM payments p
         ${whereClause}`,
        queryParams
      );

      return result.rows[0] || { inflow: 0, outflow: 0 };
    },

  };
}
