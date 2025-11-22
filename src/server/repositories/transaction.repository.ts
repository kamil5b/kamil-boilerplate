import { PoolClient } from "pg";
import { Transaction, TransactionItem, Discount } from "@/shared/entities";
import { GetTransactionsRequest } from "@/shared/request";

/**
 * Map database row (snake_case) to Transaction entity (camelCase)
 */
function mapRowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    customerId: row.customer_id,
    subtotal: row.subtotal,
    totalTax: row.total_tax,
    grandTotal: row.grand_total,
    type: row.type,
    status: row.status,
    remark: row.remark,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

/**
 * Map database row (snake_case) to TransactionItem entity (camelCase)
 */
function mapRowToTransactionItem(row: any): TransactionItem {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitQuantityId: row.unit_quantity_id,
    pricePerUnit: row.price_per_unit,
    total: row.total,
    remark: row.remark,
  };
}

/**
 * Map database row (snake_case) to Discount entity (camelCase)
 */
function mapRowToDiscount(row: any): Discount {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    type: row.type,
    percentage: row.percentage,
    amount: row.amount,
    transactionItemId: row.transaction_item_id,
  };
}

export interface TransactionRepository {
  findById(client: PoolClient, id: string): Promise<any | null>;
  findAll(client: PoolClient, params: GetTransactionsRequest): Promise<{ transactions: any[]; total: number }>;
  create(client: PoolClient, data: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  createTransactionItem(client: PoolClient, data: Omit<TransactionItem, "id">): Promise<TransactionItem>;
  createDiscount(client: PoolClient, data: Omit<Discount, "id">): Promise<Discount>;
  getTransactionItems(client: PoolClient, transactionId: string): Promise<any[]>;
  getDiscounts(client: PoolClient, transactionId: string): Promise<Discount[]>;
  updateStatus(client: PoolClient, id: string, status: string): Promise<Transaction | null>;
  getSummary(client: PoolClient, startDate?: string, endDate?: string): Promise<any>;
  getProductSummary(client: PoolClient, productId?: string, startDate?: string, endDate?: string): Promise<any[]>;
}

export function createTransactionRepository(): TransactionRepository {
  return {
    async findById(client, id) {
      const result = await client.query(
        `SELECT t.*, c.name as customer_name, u.name as created_by_name
         FROM transactions t
         LEFT JOIN customers c ON t.customer_id = c.id
         LEFT JOIN users u ON t.created_by = u.id
         WHERE t.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    },

    async findAll(client, params) {
      const { page = 1, limit = 10, type, status, customerId, startDate, endDate } = params;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE 1=1";
      const queryParams: any[] = [];
      let paramCounter = 1;

      if (type) {
        whereClause += ` AND t.type = $${paramCounter}`;
        queryParams.push(type);
        paramCounter++;
      }

      if (status) {
        whereClause += ` AND t.status = $${paramCounter}`;
        queryParams.push(status);
        paramCounter++;
      }

      if (customerId) {
        whereClause += ` AND t.customer_id = $${paramCounter}`;
        queryParams.push(customerId);
        paramCounter++;
      }

      if (startDate) {
        whereClause += ` AND t.created_at >= $${paramCounter}`;
        queryParams.push(startDate);
        paramCounter++;
      }

      if (endDate) {
        whereClause += ` AND t.created_at <= $${paramCounter}`;
        queryParams.push(endDate);
        paramCounter++;
      }

      const result = await client.query(
        `SELECT t.*, c.name as customer_name, u.name as created_by_name
         FROM transactions t
         LEFT JOIN customers c ON t.customer_id = c.id
         LEFT JOIN users u ON t.created_by = u.id
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
        [...queryParams, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM transactions t ${whereClause}`,
        queryParams
      );

      return {
        transactions: result.rows,
        total: Number.parseInt(countResult.rows[0].count),
      };
    },

    async create(client, data) {
      const result = await client.query(
        `INSERT INTO transactions (customer_id, subtotal, total_tax, grand_total, type, status, remark, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [data.customerId, data.subtotal, data.totalTax, data.grandTotal, data.type, data.status, data.remark, data.createdBy]
      );
      return mapRowToTransaction(result.rows[0]);
    },

    async createTransactionItem(client, data) {
      const result = await client.query(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_quantity_id, price_per_unit, total, remark)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [data.transactionId, data.productId, data.quantity, data.unitQuantityId, data.pricePerUnit, data.total, data.remark]
      );
      return mapRowToTransactionItem(result.rows[0]);
    },

    async createDiscount(client, data) {
      const result = await client.query(
        `INSERT INTO discounts (transaction_id, type, percentage, amount, transaction_item_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.transactionId, data.type, data.percentage, data.amount, data.transactionItemId]
      );
      return mapRowToDiscount(result.rows[0]);
    },

    async getTransactionItems(client, transactionId) {
      const result = await client.query(
        `SELECT ti.*, p.name as product_name, uq.name as unit_quantity_name
         FROM transaction_items ti
         LEFT JOIN products p ON ti.product_id = p.id
         LEFT JOIN unit_quantities uq ON ti.unit_quantity_id = uq.id
         WHERE ti.transaction_id = $1`,
        [transactionId]
      );
      return result.rows;
    },

    async getDiscounts(client, transactionId) {
      const result = await client.query(
        `SELECT * FROM discounts WHERE transaction_id = $1`,
        [transactionId]
      );
      return result.rows.map(mapRowToDiscount);
    },

    async updateStatus(client, id, status) {
      const result = await client.query(
        `UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *`,
        [status, id]
      );
      return result.rows[0] ? mapRowToTransaction(result.rows[0]) : null;
    },

    async getSummary(client, startDate, endDate) {
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

      const result = await client.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN type = 'SELL' THEN grand_total ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN type = 'BUY' THEN grand_total ELSE 0 END), 0) as total_expenses,
          COALESCE(SUM(CASE WHEN type = 'SELL' THEN grand_total WHEN type = 'BUY' THEN -grand_total ELSE 0 END), 0) as net_income,
          COUNT(*) as transaction_count
         FROM transactions
         ${whereClause}`,
        queryParams
      );

      return result.rows[0];
    },

    async getProductSummary(client, productId, startDate, endDate) {
      let whereClause = "WHERE 1=1";
      const queryParams: any[] = [];
      let paramCounter = 1;

      if (productId) {
        whereClause += ` AND ti.product_id = $${paramCounter}`;
        queryParams.push(productId);
        paramCounter++;
      }

      if (startDate) {
        whereClause += ` AND t.created_at >= $${paramCounter}`;
        queryParams.push(startDate);
        paramCounter++;
      }

      if (endDate) {
        whereClause += ` AND t.created_at <= $${paramCounter}`;
        queryParams.push(endDate);
        paramCounter++;
      }

      const result = await client.query(
        `SELECT 
          p.id as product_id,
          p.name as product_name,
          COALESCE(SUM(CASE WHEN t.type = 'SELL' THEN ti.total ELSE 0 END), 0) as revenue,
          COALESCE(SUM(CASE WHEN t.type = 'BUY' THEN ti.total ELSE 0 END), 0) as expenses,
          COALESCE(SUM(CASE WHEN t.type = 'SELL' THEN ti.total WHEN t.type = 'BUY' THEN -ti.total ELSE 0 END), 0) as net_income,
          COALESCE(SUM(CASE WHEN t.type = 'SELL' THEN ti.quantity ELSE 0 END), 0) as quantity_sold,
          COALESCE(SUM(CASE WHEN t.type = 'BUY' THEN ti.quantity ELSE 0 END), 0) as quantity_bought
         FROM products p
         LEFT JOIN transaction_items ti ON ti.product_id = p.id
         LEFT JOIN transactions t ON ti.transaction_id = t.id
         ${whereClause}
         AND p.deleted_at IS NULL
         GROUP BY p.id, p.name
         HAVING COALESCE(SUM(ti.total), 0) != 0
         ORDER BY net_income DESC`,
        queryParams
      );

      return result.rows;
    },
  };
}
