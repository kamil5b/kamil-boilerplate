import { PoolClient } from "pg";
import { InventoryHistory } from "@/shared/entities";
import { GetInventoryHistoriesRequest } from "@/shared/request";

/**
 * Map database row (snake_case) to InventoryHistory entity (camelCase)
 */
function mapRowToInventoryHistory(row: any): InventoryHistory {
  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    unitQuantityId: row.unit_quantity_id,
    remark: row.remark,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export interface InventoryHistoryRepository {
  findById(client: PoolClient, id: string): Promise<InventoryHistory | null>;
  findAll(client: PoolClient, params: GetInventoryHistoriesRequest): Promise<{ histories: InventoryHistory[]; total: number }>;
  create(client: PoolClient, data: Omit<InventoryHistory, "id" | "createdAt">): Promise<InventoryHistory>;
  createBatch(client: PoolClient, items: Omit<InventoryHistory, "id" | "createdAt">[]): Promise<InventoryHistory[]>;
  getSummaryByProduct(client: PoolClient, productId?: string): Promise<any[]>;
  getTotalQuantity(client: PoolClient, productId: string, unitQuantityId: string): Promise<number>;
}

export function createInventoryHistoryRepository(): InventoryHistoryRepository {
  return {
    async findById(client, id) {
      const result = await client.query(
        `SELECT ih.*, p.name as product_name, uq.name as unit_quantity_name, u.name as created_by_name
         FROM inventory_histories ih
         LEFT JOIN products p ON ih.product_id = p.id
         LEFT JOIN unit_quantities uq ON ih.unit_quantity_id = uq.id
         LEFT JOIN users u ON ih.created_by = u.id
         WHERE ih.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    },

    async findAll(client, params) {
      const { page = 1, limit = 10, productId, unitQuantityId, startDate, endDate } = params;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE 1=1";
      const queryParams: any[] = [];
      let paramCounter = 1;

      if (productId) {
        whereClause += ` AND ih.product_id = $${paramCounter}`;
        queryParams.push(productId);
        paramCounter++;
      }

      if (unitQuantityId) {
        whereClause += ` AND ih.unit_quantity_id = $${paramCounter}`;
        queryParams.push(unitQuantityId);
        paramCounter++;
      }

      if (startDate) {
        whereClause += ` AND ih.created_at >= $${paramCounter}`;
        queryParams.push(startDate);
        paramCounter++;
      }

      if (endDate) {
        whereClause += ` AND ih.created_at <= $${paramCounter}`;
        queryParams.push(endDate);
        paramCounter++;
      }

      const result = await client.query(
        `SELECT ih.*, p.name as product_name, uq.name as unit_quantity_name, u.name as created_by_name
         FROM inventory_histories ih
         LEFT JOIN products p ON ih.product_id = p.id
         LEFT JOIN unit_quantities uq ON ih.unit_quantity_id = uq.id
         LEFT JOIN users u ON ih.created_by = u.id
         ${whereClause}
         ORDER BY ih.created_at DESC
         LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
        [...queryParams, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM inventory_histories ih ${whereClause}`,
        queryParams
      );

      return {
        histories: result.rows,
        total: Number.parseInt(countResult.rows[0].count),
      };
    },

    async create(client, data) {
      const result = await client.query(
        `INSERT INTO inventory_histories (product_id, quantity, unit_quantity_id, remark, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.productId, data.quantity, data.unitQuantityId, data.remark, data.createdBy]
      );
      return mapRowToInventoryHistory(result.rows[0]);
    },

    async createBatch(client, items) {
      if (items.length === 0) return [];

      const values: any[] = [];
      const valueStrings: string[] = [];
      let paramCounter = 1;

      for (const item of items) {
        valueStrings.push(
          `($${paramCounter}, $${paramCounter + 1}, $${paramCounter + 2}, $${paramCounter + 3}, $${paramCounter + 4})`
        );
        values.push(item.productId, item.quantity, item.unitQuantityId, item.remark, item.createdBy);
        paramCounter += 5;
      }

      const result = await client.query(
        `INSERT INTO inventory_histories (product_id, quantity, unit_quantity_id, remark, created_by)
         VALUES ${valueStrings.join(", ")}
         RETURNING *`,
        values
      );

      return result.rows.map(mapRowToInventoryHistory);
    },

    async getSummaryByProduct(client, productId) {
      let whereClause = "WHERE p.deleted_at IS NULL";
      const queryParams: any[] = [];

      if (productId) {
        whereClause += " AND p.id = $1";
        queryParams.push(productId);
      }

      const result = await client.query(
        `SELECT 
          p.id as product_id,
          p.name as product_name,
          uq.id as unit_quantity_id,
          uq.name as unit_quantity_name,
          COALESCE(SUM(ih.quantity), 0) as total_quantity
         FROM products p
         CROSS JOIN unit_quantities uq
         LEFT JOIN inventory_histories ih ON ih.product_id = p.id AND ih.unit_quantity_id = uq.id
         ${whereClause}
         AND uq.deleted_at IS NULL
         GROUP BY p.id, p.name, uq.id, uq.name
         HAVING COALESCE(SUM(ih.quantity), 0) != 0
         ORDER BY p.name, uq.name`,
        queryParams
      );

      return result.rows;
    },

    async getTotalQuantity(client, productId, unitQuantityId) {
      const result = await client.query(
        `SELECT COALESCE(SUM(quantity), 0) as total
         FROM inventory_histories
         WHERE product_id = $1 AND unit_quantity_id = $2`,
        [productId, unitQuantityId]
      );
      return Number.parseFloat(result.rows[0].total);
    },
  };
}
