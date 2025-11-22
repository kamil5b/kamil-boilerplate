import { PoolClient } from "pg";
import { UnitQuantity } from "@/shared/entities";
import { GetUnitQuantitiesRequest } from "@/shared/request";

export interface UnitQuantityRepository {
  findById(client: PoolClient, id: string): Promise<UnitQuantity | null>;
  findAll(client: PoolClient, params: GetUnitQuantitiesRequest): Promise<{ unitQuantities: UnitQuantity[]; total: number }>;
  create(client: PoolClient, data: Omit<UnitQuantity, "id" | "createdAt" | "updatedAt">): Promise<UnitQuantity>;
  update(client: PoolClient, id: string, data: Partial<UnitQuantity>): Promise<UnitQuantity | null>;
  delete(client: PoolClient, id: string, deletedBy: string): Promise<boolean>;
}

export function createUnitQuantityRepository(): UnitQuantityRepository {
  return {
    async findById(client, id) {
      const result = await client.query(
        "SELECT * FROM unit_quantities WHERE id = $1 AND deleted_at IS NULL",
        [id]
      );
      return result.rows[0] || null;
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
        `SELECT * FROM unit_quantities ${whereClause} ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM unit_quantities ${whereClause}`,
        queryParams
      );

      return {
        unitQuantities: result.rows,
        total: Number.parseInt(countResult.rows[0].count),
      };
    },

    async create(client, data) {
      const result = await client.query(
        `INSERT INTO unit_quantities (name, remark, created_by, updated_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.name, data.remark, data.createdBy, data.updatedBy]
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
        `UPDATE unit_quantities SET ${fields.join(", ")} WHERE id = $${paramCounter} AND deleted_at IS NULL RETURNING *`,
        values
      );

      return result.rows[0] || null;
    },

    async delete(client, id, deletedBy) {
      const result = await client.query(
        `UPDATE unit_quantities SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
        [deletedBy, id]
      );
      return result.rowCount! > 0;
    },
  };
}
