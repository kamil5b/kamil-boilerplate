import { PoolClient } from "pg";
import { User } from "@/shared/entities";
import { GetUsersRequest } from "@/shared/request";

export interface UserRepository {
  findById(client: PoolClient, id: string): Promise<User | null>;
  findByEmail(client: PoolClient, email: string): Promise<User | null>;
  findByActivationToken(client: PoolClient, token: string): Promise<User | null>;
  findByResetToken(client: PoolClient, token: string): Promise<User | null>;
  findAll(client: PoolClient, params: GetUsersRequest): Promise<{ users: User[]; total: number }>;
  create(client: PoolClient, data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  update(client: PoolClient, id: string, data: Partial<User>): Promise<User | null>;
  delete(client: PoolClient, id: string, deletedBy: string): Promise<boolean>;
}

export function createUserRepository(): UserRepository {
  return {
    async findById(client, id) {
      const result = await client.query(
        "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL",
        [id]
      );
      return result.rows[0] || null;
    },

    async findByEmail(client, email) {
      const result = await client.query(
        "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
        [email]
      );
      return result.rows[0] || null;
    },

    async findByActivationToken(client, token) {
      const result = await client.query(
        "SELECT * FROM users WHERE activation_token = $1 AND deleted_at IS NULL",
        [token]
      );
      return result.rows[0] || null;
    },

    async findByResetToken(client, token) {
      const result = await client.query(
        "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW() AND deleted_at IS NULL",
        [token]
      );
      return result.rows[0] || null;
    },

    async findAll(client, params) {
      const { page = 1, limit = 10, search = "", role } = params;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE deleted_at IS NULL";
      const queryParams: any[] = [];
      let paramCounter = 1;

      if (search) {
        whereClause += ` AND (name ILIKE $${paramCounter} OR email ILIKE $${paramCounter})`;
        queryParams.push(`%${search}%`);
        paramCounter++;
      }

      if (role) {
        whereClause += ` AND role = $${paramCounter}`;
        queryParams.push(role);
        paramCounter++;
      }

      const result = await client.query(
        `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
        [...queryParams, limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        queryParams
      );

      return {
        users: result.rows,
        total: Number.parseInt(countResult.rows[0].count),
      };
    },

    async create(client, data) {
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_active, activation_token, remark, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          data.name,
          data.email,
          data.passwordHash,
          data.role,
          data.isActive,
          data.activationToken,
          data.remark,
          data.createdBy,
          data.updatedBy,
        ]
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
      if (data.email !== undefined) {
        fields.push(`email = $${paramCounter++}`);
        values.push(data.email);
      }
      if (data.passwordHash !== undefined) {
        fields.push(`password_hash = $${paramCounter++}`);
        values.push(data.passwordHash);
      }
      if (data.role !== undefined) {
        fields.push(`role = $${paramCounter++}`);
        values.push(data.role);
      }
      if (data.isActive !== undefined) {
        fields.push(`is_active = $${paramCounter++}`);
        values.push(data.isActive);
      }
      if (data.activationToken !== undefined) {
        fields.push(`activation_token = $${paramCounter++}`);
        values.push(data.activationToken);
      }
      if (data.resetPasswordToken !== undefined) {
        fields.push(`reset_password_token = $${paramCounter++}`);
        values.push(data.resetPasswordToken);
      }
      if (data.resetPasswordExpires !== undefined) {
        fields.push(`reset_password_expires = $${paramCounter++}`);
        values.push(data.resetPasswordExpires);
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
        `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramCounter} AND deleted_at IS NULL RETURNING *`,
        values
      );

      return result.rows[0] || null;
    },

    async delete(client, id, deletedBy) {
      const result = await client.query(
        `UPDATE users SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
        [deletedBy, id]
      );
      return result.rowCount! > 0;
    },
  };
}
