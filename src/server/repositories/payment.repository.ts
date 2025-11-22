import { PoolClient } from "pg";
import { Payment, PaymentDetail } from "@/shared/entities";
import { GetPaymentsRequest } from "@/shared/request";

/**
 * Map database row (snake_case) to Payment entity (camelCase)
 */
function mapRowToPayment(row: any): Payment {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    type: row.type,
    amount: row.amount,
    remark: row.remark,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

/**
 * Map database row (snake_case) to PaymentDetail entity (camelCase)
 */
function mapRowToPaymentDetail(row: any): PaymentDetail {
  return {
    id: row.id,
    paymentId: row.payment_id,
    identifier: row.identifier,
    value: row.value,
  };
}

export interface PaymentRepository {
  findById(client: PoolClient, id: string): Promise<any | null>;
  findAll(client: PoolClient, params: GetPaymentsRequest): Promise<{ payments: any[]; total: number }>;
  create(client: PoolClient, data: Omit<Payment, "id" | "createdAt">): Promise<Payment>;
  createPaymentDetail(client: PoolClient, data: Omit<PaymentDetail, "id">): Promise<PaymentDetail>;
  getPaymentDetails(client: PoolClient, paymentId: string): Promise<PaymentDetail[]>;
  getTotalPaidForTransaction(client: PoolClient, transactionId: string): Promise<number>;
}

export function createPaymentRepository(): PaymentRepository {
  return {
    async findById(client, id) {
      const result = await client.query(
        `SELECT p.*, u.name as created_by_name
         FROM payments p
         LEFT JOIN users u ON p.created_by = u.id
         WHERE p.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    },

    async findAll(client, params) {
      const { page = 1, limit = 10, type, transactionId, startDate, endDate } = params;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE 1=1";
      const queryParams: any[] = [];
      let paramCounter = 1;

      if (type) {
        whereClause += ` AND p.type = $${paramCounter}`;
        queryParams.push(type);
        paramCounter++;
      }

      if (transactionId) {
        whereClause += ` AND p.transaction_id = $${paramCounter}`;
        queryParams.push(transactionId);
        paramCounter++;
      }

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

      const result = await client.query(
        `SELECT p.*, u.name as created_by_name
         FROM payments p
         LEFT JOIN users u ON p.created_by = u.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
        [...queryParams, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM payments p ${whereClause}`,
        queryParams
      );

      return {
        payments: result.rows,
        total: Number.parseInt(countResult.rows[0].count),
      };
    },

    async create(client, data) {
      const result = await client.query(
        `INSERT INTO payments (transaction_id, type, amount, remark, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.transactionId, data.type, data.amount, data.remark, data.createdBy]
      );
      return mapRowToPayment(result.rows[0]);
    },

    async createPaymentDetail(client, data) {
      const result = await client.query(
        `INSERT INTO payment_details (payment_id, identifier, value)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.paymentId, data.identifier, data.value]
      );
      return mapRowToPaymentDetail(result.rows[0]);
    },

    async getPaymentDetails(client, paymentId) {
      const result = await client.query(
        `SELECT * FROM payment_details WHERE payment_id = $1`,
        [paymentId]
      );
      return result.rows.map(mapRowToPaymentDetail);
    },

    async getTotalPaidForTransaction(client, transactionId) {
      const result = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM payments
         WHERE transaction_id = $1`,
        [transactionId]
      );
      return Number.parseFloat(result.rows[0].total);
    },
  };
}
