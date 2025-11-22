import { getDbClient } from "../db";
import { createCustomerRepository } from "../repositories";
import { AppError } from "../utils/error";
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  GetCustomersRequest,
} from "@/shared/request";
import {
  CustomerResponse,
  PaginatedResponse,
} from "@/shared/response";
import { Customer } from "@/shared/entities";

export interface CustomerService {
  getCustomer(id: string): Promise<CustomerResponse>;
  getCustomers(params: GetCustomersRequest): Promise<PaginatedResponse<CustomerResponse>>;
  createCustomer(data: CreateCustomerRequest, createdBy: string): Promise<CustomerResponse>;
  updateCustomer(id: string, data: UpdateCustomerRequest, updatedBy: string): Promise<CustomerResponse>;
  deleteCustomer(id: string, deletedBy: string): Promise<void>;
}

function mapCustomerToResponse(customer: any): CustomerResponse {
  return {
    id: customer.id,
    name: customer.name,
    phoneNumber: customer.phone_number,
    email: customer.email,
    address: customer.address,
    description: customer.description,
    remark: customer.remark,
    createdAt: customer.created_at?.toISOString(),
    updatedAt: customer.updated_at?.toISOString(),
    createdByName: customer.created_by_name,
    updatedByName: customer.updated_by_name,
  };
}

export function createCustomerService(): CustomerService {
  const customerRepo = createCustomerRepository();

  return {
    async getCustomer(id) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const customer = await customerRepo.findById(client, id);
        if (!customer) {
          throw new AppError("Customer not found", 404);
        }

        await client.query("COMMIT");
        return mapCustomerToResponse(customer);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getCustomers(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const page = params.page || 1;
        const limit = params.limit || 10;

        const { customers, total } = await customerRepo.findAll(client, {
          page,
          limit,
          search: params.search,
        });

        await client.query("COMMIT");

        const totalPages = Math.ceil(total / limit);
        const message = customers.length === 0 ? "OK, But its empty" : "OK";

        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: customers.map(mapCustomerToResponse),
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async createCustomer(data, createdBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const customer = await customerRepo.create(client, {
          name: data.name,
          phoneNumber: data.phoneNumber,
          email: data.email || null,
          address: data.address || null,
          description: data.description || null,
          remark: data.remark || null,
          createdBy,
          updatedBy: createdBy,
          deletedAt: null,
          deletedBy: null,
        });

        await client.query("COMMIT");
        return mapCustomerToResponse(customer);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async updateCustomer(id, data, updatedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const existingCustomer = await customerRepo.findById(client, id);
        if (!existingCustomer) {
          throw new AppError("Customer not found", 404);
        }

        const updateData: Partial<Customer> = {
          updatedBy,
        };

        if (data.name) updateData.name = data.name;
        if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
        if (data.email !== undefined) updateData.email = data.email || null;
        if (data.address !== undefined) updateData.address = data.address || null;
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.remark !== undefined) updateData.remark = data.remark || null;

        const customer = await customerRepo.update(client, id, updateData);
        if (!customer) {
          throw new AppError("Failed to update customer", 500);
        }

        await client.query("COMMIT");
        return mapCustomerToResponse(customer);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteCustomer(id, deletedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const customer = await customerRepo.findById(client, id);
        if (!customer) {
          throw new AppError("Customer not found", 404);
        }

        const deleted = await customerRepo.delete(client, id, deletedBy);
        if (!deleted) {
          throw new AppError("Failed to delete customer", 500);
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
