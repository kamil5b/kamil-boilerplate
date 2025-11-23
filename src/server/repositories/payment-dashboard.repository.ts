import { PoolClient } from "pg";
import type { GetPaymentDashboardRequest } from "@/shared/request";

export interface PaymentDashboardRepository {
  getCustomerPaymentSummaries(
    client: PoolClient,
    params: GetPaymentDashboardRequest
  ): Promise<any[]>;
  getCustomerPaymentHistorical(
    client: PoolClient,
    params: GetPaymentDashboardRequest
  ): Promise<any[]>;
}

export function createPaymentDashboardRepository(): PaymentDashboardRepository {
  return {
    async getCustomerPaymentSummaries(client, params) {
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

      // Calculate payable and receivable per customer from payments
      // Payable: customer owes us (payments from BUY transactions with signed amounts)
      // Receivable: customer paid us (payments from SELL transactions with signed amounts)
      const result = await client.query(
        `SELECT 
          COALESCE(c.id, '00000000-0000-0000-0000-000000000000') as customer_id,
          COALESCE(c.name, 'Anonymous') as customer_name,
          COALESCE(SUM(CASE 
            WHEN t.type = 'BUY' THEN 
              CASE WHEN p.direction = 'OUTFLOW' THEN -p.amount ELSE p.amount END
            ELSE 0 
          END), 0) as payable,
          COALESCE(SUM(CASE 
            WHEN t.type = 'SELL' THEN 
              CASE WHEN p.direction = 'OUTFLOW' THEN -p.amount ELSE p.amount END
            ELSE 0 
          END), 0) as receivable
         FROM payments p
         LEFT JOIN transactions t ON p.transaction_id = t.id
         LEFT JOIN customers c ON t.customer_id = c.id
         ${whereClause}
         GROUP BY c.id, c.name
         ORDER BY customer_name`,
        queryParams
      );

      return result.rows;
    },

    async getCustomerPaymentHistorical(client, params) {
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

      // Group by date and calculate daily payment totals with signed amounts
      const result = await client.query(
        `SELECT 
          DATE(p.created_at) as date,
          COALESCE(SUM(CASE 
            WHEN t.type = 'BUY' THEN 
              CASE WHEN p.direction = 'OUTFLOW' THEN -p.amount ELSE p.amount END
            ELSE 0 
          END), 0) as payable,
          COALESCE(SUM(CASE 
            WHEN t.type = 'SELL' THEN 
              CASE WHEN p.direction = 'OUTFLOW' THEN -p.amount ELSE p.amount END
            ELSE 0 
          END), 0) as receivable,
          COALESCE(SUM(CASE 
            WHEN t.type = 'SELL' THEN 
              CASE WHEN p.direction = 'OUTFLOW' THEN -p.amount ELSE p.amount END
            ELSE 0 
          END), 0) - 
          COALESCE(SUM(CASE 
            WHEN t.type = 'BUY' THEN 
              CASE WHEN p.direction = 'OUTFLOW' THEN -p.amount ELSE p.amount END
            ELSE 0 
          END), 0) as net
         FROM payments p
         LEFT JOIN transactions t ON p.transaction_id = t.id
         ${whereClause}
         GROUP BY DATE(p.created_at)
         ORDER BY date ASC`,
        queryParams
      );

      return result.rows;
    },
  };
}
