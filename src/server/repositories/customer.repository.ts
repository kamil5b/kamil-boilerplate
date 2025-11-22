import { PoolClient } from "pg";
import { Customer } from "@/shared/entities";
import { GetCustomersRequest } from "@/shared/request";

/**
 * Map database row (snake_case) to Customer entity (camelCase)
 */
function mapRowToCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phoneNumber: row.phone_number,
    email: row.email,
    address: row.address,
    description: row.description,
    remark: row.remark,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by,
  };
}

export interface CustomerRepository {
  findById(client: PoolClient, id: string): Promise<Customer | null>;
  findAll(client: PoolClient, params: GetCustomersRequest): Promise<{ customers: Customer[]; total: number }>;
  create(client: PoolClient, data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer>;
  update(client: PoolClient, id: string, data: Partial<Customer>): Promise<Customer | null>;
  delete(client: PoolClient, id: string, deletedBy: string): Promise<boolean>;
}

export function createCustomerRepository(): CustomerRepository {
  return {
    async findById(client, id) {
      const result = await client.query(
        "SELECT * FROM customers WHERE id = $1 AND deleted_at IS NULL",
        [id]
      );
      return result.rows[0] ? mapRowToCustomer(result.rows[0]) : null;
    },

    async findAll(client, params) {
      const { page = 1, limit = 10, search = "" } = params;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE deleted_at IS NULL";
      const queryParams: any[] = [];

      if (search) {
        whereClause += " AND (name ILIKE $1 OR phone_number ILIKE $1 OR email ILIKE $1)";
        queryParams.push(`%${search}%`);
      }

      const result = await client.query(
        `SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM customers ${whereClause}`,
        queryParams
      );

      return {
        customers: result.rows.map(mapRowToCustomer),
        total: Number.parseInt(countResult.rows[0].count),
      };
    },

    async create(client, data) {
      const result = await client.query(
        `INSERT INTO customers (name, phone_number, email, address, description, remark, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [data.name, data.phoneNumber, data.email, data.address, data.description, data.remark, data.createdBy, data.updatedBy]
      );
      return mapRowToCustomer(result.rows[0]);
    },

    async update(client, id, data) {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramCounter++}`);
        values.push(data.name);
      }
      if (data.phoneNumber !== undefined) {
        fields.push(`phone_number = $${paramCounter++}`);
        values.push(data.phoneNumber);
      }
      if (data.email !== undefined) {
        fields.push(`email = $${paramCounter++}`);
        values.push(data.email);
      }
      if (data.address !== undefined) {
        fields.push(`address = $${paramCounter++}`);
        values.push(data.address);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramCounter++}`);
        values.push(data.description);
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
        `UPDATE customers SET ${fields.join(", ")} WHERE id = $${paramCounter} AND deleted_at IS NULL RETURNING *`,
        values
      );

      return result.rows[0] ? mapRowToCustomer(result.rows[0]) : null;
    },

    async delete(client, id, deletedBy) {
      const result = await client.query(
        `UPDATE customers SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
        [deletedBy, id]
      );
      return result.rowCount! > 0;
    },
  };
}
