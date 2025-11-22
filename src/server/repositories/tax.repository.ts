import { PoolClient } from "pg";
import { Tax } from "@/shared/entities";
import { GetTaxesRequest } from "@/shared/request";

export interface TaxRepository {
  findById(client: PoolClient, id: string): Promise<Tax | null>;
  findAll(client: PoolClient, params: GetTaxesRequest): Promise<{ taxes: Tax[]; total: number }>;
  findByIds(client: PoolClient, ids: string[]): Promise<Tax[]>;
  create(client: PoolClient, data: Omit<Tax, "id" | "createdAt" | "updatedAt">): Promise<Tax>;
  update(client: PoolClient, id: string, data: Partial<Tax>): Promise<Tax | null>;
  delete(client: PoolClient, id: string, deletedBy: string): Promise<boolean>;
}

export function createTaxRepository(): TaxRepository {
  return {
    async findById(client, id) {
      const result = await client.query(
        "SELECT * FROM taxes WHERE id = $1 AND deleted_at IS NULL",
        [id]
      );
      return result.rows[0] || null;
    },

    async findByIds(client, ids) {
      if (ids.length === 0) return [];
      const result = await client.query(
        "SELECT * FROM taxes WHERE id = ANY($1) AND deleted_at IS NULL",
        [ids]
      );
      return result.rows;
    },

    async findAll(client, params) {
      const { page = 1, limit = 10, search = "" } = params;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE deleted_at IS NULL";
      const queryParams: any[] = [];

      if (search) {
        whereClause += " AND name ILIKE $1";
        queryParams.push(`%${search}%`);
      }

      const result = await client.query(
        `SELECT * FROM taxes ${whereClause} ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM taxes ${whereClause}`,
        queryParams
      );

      return {
        taxes: result.rows,
        total: Number.parseInt(countResult.rows[0].count),
      };
    },

    async create(client, data) {
      const result = await client.query(
        `INSERT INTO taxes (name, value, remark, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.name, data.value, data.remark, data.createdBy, data.updatedBy]
      );
      return result.rows[0];
    },

    async update(client, id, data) {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramCounter++}`);
        values.push(data.name);
      }
      if (data.value !== undefined) {
        fields.push(`value = $${paramCounter++}`);
        values.push(data.value);
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
        `UPDATE taxes SET ${fields.join(", ")} WHERE id = $${paramCounter} AND deleted_at IS NULL RETURNING *`,
        values
      );

      return result.rows[0] || null;
    },

    async delete(client, id, deletedBy) {
      const result = await client.query(
        `UPDATE taxes SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
        [deletedBy, id]
      );
      return result.rowCount! > 0;
    },
  };
}
