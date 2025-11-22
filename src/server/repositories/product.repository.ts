import { PoolClient } from "pg";
import { Product } from "@/shared/entities";
import { GetProductsRequest } from "@/shared/request";

/**
 * Map database row (snake_case) to Product entity (camelCase)
 */
function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    remark: row.remark,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by,
  };
}

export interface ProductRepository {
  findById(client: PoolClient, id: string): Promise<Product | null>;
  findAll(client: PoolClient, params: GetProductsRequest): Promise<{ products: Product[]; total: number }>;
  create(client: PoolClient, data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>;
  update(client: PoolClient, id: string, data: Partial<Product>): Promise<Product | null>;
  delete(client: PoolClient, id: string, deletedBy: string): Promise<boolean>;
}

export function createProductRepository(): ProductRepository {
  return {
    async findById(client, id) {
      const result = await client.query(
        "SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL",
        [id]
      );
      return result.rows[0] ? mapRowToProduct(result.rows[0]) : null;
    },

    async findAll(client, params) {
      const { page = 1, limit = 10, search = "", type } = params;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE deleted_at IS NULL";
      const queryParams: any[] = [];
      let paramCounter = 1;

      if (search) {
        whereClause += ` AND (name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`;
        queryParams.push(`%${search}%`);
        paramCounter++;
      }

      if (type) {
        whereClause += ` AND type = $${paramCounter}`;
        queryParams.push(type);
        paramCounter++;
      }

      const result = await client.query(
        `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
        [...queryParams, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM products ${whereClause}`,
        queryParams
      );

      return {
        products: result.rows.map(mapRowToProduct),
        total: Number.parseInt(countResult.rows[0].count),
      };
    },

    async create(client, data) {
      const result = await client.query(
        `INSERT INTO products (name, description, type, remark, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.name, data.description, data.type, data.remark, data.createdBy, data.updatedBy]
      );
      return mapRowToProduct(result.rows[0]);
    },

    async update(client, id, data) {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramCounter++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramCounter++}`);
        values.push(data.description);
      }
      if (data.type !== undefined) {
        fields.push(`type = $${paramCounter++}`);
        values.push(data.type);
      }
      if (data.remark !== undefined) {
        fields.push(`remark = $${paramCounter++}`);
        values.push(data.remark);
      }
      if (data.updatedBy !== undefined) {
        fields.push(`updated_by = $${paramCounter++}`);
        values.push(data.updatedBy);
      }

      if (fields.length === 0) return null;

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.query(
        `UPDATE products SET ${fields.join(", ")} WHERE id = $${paramCounter} AND deleted_at IS NULL RETURNING *`,
        values
      );

      return result.rows[0] ? mapRowToProduct(result.rows[0]) : null;
    },

    async delete(client, id, deletedBy) {
      const result = await client.query(
        `UPDATE products SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
        [deletedBy, id]
      );
      return result.rowCount! > 0;
    },
  };
}
