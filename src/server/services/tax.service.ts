import { getDbClient } from "../db";
import { createTaxRepository } from "../repositories";
import { AppError } from "../utils/error";
import {
  CreateTaxRequest,
  UpdateTaxRequest,
  GetTaxesRequest,
} from "@/shared/request";
import {
  TaxResponse,
  PaginatedResponse,
} from "@/shared/response";
import { Tax } from "@/shared/entities";

export interface TaxService {
  getTax(id: string): Promise<TaxResponse>;
  getTaxes(params: GetTaxesRequest): Promise<PaginatedResponse<TaxResponse>>;
  createTax(data: CreateTaxRequest, createdBy: string): Promise<TaxResponse>;
  updateTax(id: string, data: UpdateTaxRequest, updatedBy: string): Promise<TaxResponse>;
  deleteTax(id: string, deletedBy: string): Promise<void>;
}

function mapTaxToResponse(tax: any): TaxResponse {
  return {
    id: tax.id,
    name: tax.name,
    value: Number.parseFloat(tax.value),
    remark: tax.remark,
    createdAt: tax.createdAt?.toISOString(),
    updatedAt: tax.updatedAt?.toISOString(),
    createdByName: tax.createdByName,
    updatedByName: tax.updatedByName,
  };
}

export function createTaxService(): TaxService {
  const taxRepo = createTaxRepository();

  return {
    async getTax(id) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const tax = await taxRepo.findById(client, id);
        if (!tax) {
          throw new AppError("Tax not found", 404);
        }

        await client.query("COMMIT");
        return mapTaxToResponse(tax);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getTaxes(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const page = params.page || 1;
        const limit = params.limit || 10;

        const { taxes, total } = await taxRepo.findAll(client, {
          page,
          limit,
          search: params.search,
        });

        await client.query("COMMIT");

        const totalPages = Math.ceil(total / limit);
        const message = taxes.length === 0 ? "OK, But its empty" : "OK";

        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: taxes.map(mapTaxToResponse),
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async createTax(data, createdBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        // Validate tax value
        if (data.value < 0) {
          throw new AppError("Tax value must be non-negative", 400);
        }

        const tax = await taxRepo.create(client, {
          name: data.name,
          value: data.value,
          remark: data.remark || null,
          createdBy,
          updatedBy: createdBy,
          deletedAt: null,
          deletedBy: null,
        });

        await client.query("COMMIT");
        return mapTaxToResponse(tax);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async updateTax(id, data, updatedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const existingTax = await taxRepo.findById(client, id);
        if (!existingTax) {
          throw new AppError("Tax not found", 404);
        }

        // Validate tax value if provided
        if (data.value !== undefined && data.value < 0) {
          throw new AppError("Tax value must be non-negative", 400);
        }

        const updateData: Partial<Tax> = {
          updatedBy,
        };

        if (data.name) updateData.name = data.name;
        if (data.value !== undefined) updateData.value = data.value;
        if (data.remark !== undefined) updateData.remark = data.remark || null;

        const tax = await taxRepo.update(client, id, updateData);
        if (!tax) {
          throw new AppError("Failed to update tax", 500);
        }

        await client.query("COMMIT");
        return mapTaxToResponse(tax);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteTax(id, deletedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const tax = await taxRepo.findById(client, id);
        if (!tax) {
          throw new AppError("Tax not found", 404);
        }

        const deleted = await taxRepo.delete(client, id, deletedBy);
        if (!deleted) {
          throw new AppError("Failed to delete tax", 500);
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
