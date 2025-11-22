import { getDbClient } from "../db";
import { createUserRepository } from "../repositories";
import { AppError } from "../utils/error";
import { hashPassword } from "../utils/auth";
import {
  CreateUserRequest,
  UpdateUserRequest,
  GetUsersRequest,
} from "@/shared/request";
import {
  UserResponse,
  PaginatedResponse,
  DataResponse,
  BaseResponse,
} from "@/shared/response";
import { User } from "@/shared/entities";

export interface UserService {
  getUser(id: string): Promise<UserResponse>;
  getUsers(params: GetUsersRequest): Promise<PaginatedResponse<UserResponse>>;
  createUser(data: CreateUserRequest, createdBy: string): Promise<UserResponse>;
  updateUser(id: string, data: UpdateUserRequest, updatedBy: string): Promise<UserResponse>;
  deleteUser(id: string, deletedBy: string): Promise<void>;
}

function mapUserToResponse(user: any): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    remark: user.remark,
    createdAt: user.created_at?.toISOString(),
    updatedAt: user.updated_at?.toISOString(),
    createdByName: user.created_by_name,
    updatedByName: user.updated_by_name,
  };
}

export function createUserService(): UserService {
  const userRepo = createUserRepository();

  return {
    async getUser(id) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const user = await userRepo.findById(client, id);
        if (!user) {
          throw new AppError("User not found", 404);
        }

        await client.query("COMMIT");
        return mapUserToResponse(user);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getUsers(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const page = params.page || 1;
        const limit = params.limit || 10;

        const { users, total } = await userRepo.findAll(client, {
          page,
          limit,
          search: params.search,
          role: params.role,
        });

        await client.query("COMMIT");

        const totalPages = Math.ceil(total / limit);
        const message = users.length === 0 ? "OK, But its empty" : "OK";

        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: users.map(mapUserToResponse),
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async createUser(data, createdBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        // Validate email uniqueness
        const existingUser = await userRepo.findByEmail(client, data.email);
        if (existingUser) {
          throw new AppError("Email already exists", 400);
        }

        // Hash password
        const passwordHash = hashPassword(data.password);

        // Create user
        const user = await userRepo.create(client, {
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role,
          isActive: true, // Admin-created users are active by default
          activationToken: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          remark: data.remark || null,
          createdBy,
          updatedBy: createdBy,
          deletedAt: null,
          deletedBy: null,
        });

        await client.query("COMMIT");
        return mapUserToResponse(user);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async updateUser(id, data, updatedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const existingUser = await userRepo.findById(client, id);
        if (!existingUser) {
          throw new AppError("User not found", 404);
        }

        // Check email uniqueness if changing email
        if (data.email && data.email !== existingUser.email) {
          const emailExists = await userRepo.findByEmail(client, data.email);
          if (emailExists) {
            throw new AppError("Email already exists", 400);
          }
        }

        const updateData: Partial<User> = {
          updatedBy,
        };

        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        if (data.role) updateData.role = data.role;
        if (data.remark !== undefined) updateData.remark = data.remark || null;
        if (data.password) {
          updateData.passwordHash = hashPassword(data.password);
        }

        const user = await userRepo.update(client, id, updateData);
        if (!user) {
          throw new AppError("Failed to update user", 500);
        }

        await client.query("COMMIT");
        return mapUserToResponse(user);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteUser(id, deletedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const user = await userRepo.findById(client, id);
        if (!user) {
          throw new AppError("User not found", 404);
        }

        // Prevent deleting yourself
        if (id === deletedBy) {
          throw new AppError("Cannot delete your own account", 400);
        }

        const deleted = await userRepo.delete(client, id, deletedBy);
        if (!deleted) {
          throw new AppError("Failed to delete user", 500);
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
