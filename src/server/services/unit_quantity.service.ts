import { getDbClient } from "../db";
import { createUnitQuantityRepository } from "../repositories";
import { AppError } from "../utils/error";
import {
  CreateUnitQuantityRequest,
  UpdateUnitQuantityRequest,
  GetUnitQuantitiesRequest,
} from "@/shared/request";
import {
  UnitQuantityResponse,
  PaginatedResponse,
} from "@/shared/response";
import { UnitQuantity } from "@/shared/entities";

export interface UnitQuantityService {
  getUnitQuantity(id: string): Promise<UnitQuantityResponse>;
  getUnitQuantities(params: GetUnitQuantitiesRequest): Promise<PaginatedResponse<UnitQuantityResponse>>;
  createUnitQuantity(data: CreateUnitQuantityRequest, createdBy: string): Promise<UnitQuantityResponse>;
  updateUnitQuantity(id: string, data: UpdateUnitQuantityRequest, updatedBy: string): Promise<UnitQuantityResponse>;
  deleteUnitQuantity(id: string, deletedBy: string): Promise<void>;
}

function mapUnitQuantityToResponse(unitQuantity: any): UnitQuantityResponse {
  return {
    id: unitQuantity.id,
    name: unitQuantity.name,
    remark: unitQuantity.remark,
    createdAt: unitQuantity.created_at?.toISOString(),
    updatedAt: unitQuantity.updated_at?.toISOString(),
    createdByName: unitQuantity.created_by_name,
    updatedByName: unitQuantity.updated_by_name,
  };
}

export function createUnitQuantityService(): UnitQuantityService {
  const unitQuantityRepo = createUnitQuantityRepository();

  return {
    async getUnitQuantity(id) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const unitQuantity = await unitQuantityRepo.findById(client, id);
        if (!unitQuantity) {
          throw new AppError("Unit quantity not found", 404);
        }

        await client.query("COMMIT");
        return mapUnitQuantityToResponse(unitQuantity);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getUnitQuantities(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const page = params.page || 1;
        const limit = params.limit || 10;

        const { unitQuantities, total } = await unitQuantityRepo.findAll(client, {
          page,
          limit,
          search: params.search,
        });

        await client.query("COMMIT");

        const totalPages = Math.ceil(total / limit);
        const message = unitQuantities.length === 0 ? "OK, But its empty" : "OK";

        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: unitQuantities.map(mapUnitQuantityToResponse),
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async createUnitQuantity(data, createdBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const unitQuantity = await unitQuantityRepo.create(client, {
          name: data.name,
          remark: data.remark || null,
          createdBy,
          updatedBy: createdBy,
          deletedAt: null,
          deletedBy: null,
        });

        await client.query("COMMIT");
        return mapUnitQuantityToResponse(unitQuantity);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async updateUnitQuantity(id, data, updatedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const existingUnitQuantity = await unitQuantityRepo.findById(client, id);
        if (!existingUnitQuantity) {
          throw new AppError("Unit quantity not found", 404);
        }

        const updateData: Partial<UnitQuantity> = {
          updatedBy,
        };

        if (data.name) updateData.name = data.name;
        if (data.remark !== undefined) updateData.remark = data.remark || null;

        const unitQuantity = await unitQuantityRepo.update(client, id, updateData);
        if (!unitQuantity) {
          throw new AppError("Failed to update unit quantity", 500);
        }

        await client.query("COMMIT");
        return mapUnitQuantityToResponse(unitQuantity);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteUnitQuantity(id, deletedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const unitQuantity = await unitQuantityRepo.findById(client, id);
        if (!unitQuantity) {
          throw new AppError("Unit quantity not found", 404);
        }

        const deleted = await unitQuantityRepo.delete(client, id, deletedBy);
        if (!deleted) {
          throw new AppError("Failed to delete unit quantity", 500);
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
