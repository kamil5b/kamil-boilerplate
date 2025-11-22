import { getDbClient } from "../db";
import {
  createInventoryHistoryRepository,
  createProductRepository,
  createUnitQuantityRepository,
} from "../repositories";
import { AppError } from "../utils/error";
import {
  GetInventoryHistoriesRequest,
  ManipulateInventoryRequest,
  GetInventorySummaryRequest,
} from "@/shared/request";
import {
  InventoryHistoryResponse,
  InventorySummaryResponse,
  PaginatedResponse,
} from "@/shared/response";

export interface InventoryHistoryService {
  getInventoryHistory(id: string): Promise<InventoryHistoryResponse>;
  getInventoryHistories(params: GetInventoryHistoriesRequest): Promise<PaginatedResponse<InventoryHistoryResponse>>;
  manipulateInventory(data: ManipulateInventoryRequest, createdBy: string): Promise<{ message: string }>;
  getInventorySummary(params: GetInventorySummaryRequest): Promise<InventorySummaryResponse[]>;
}

function mapInventoryHistoryToResponse(history: any): InventoryHistoryResponse {
  return {
    id: history.id,
    productId: history.product_id,
    productName: history.product_name,
    quantity: Number.parseFloat(history.quantity),
    unitQuantityId: history.unit_quantity_id,
    unitQuantityName: history.unit_quantity_name,
    remark: history.remark,
    createdAt: history.created_at?.toISOString(),
    createdByName: history.created_by_name,
  };
}

export function createInventoryHistoryService(): InventoryHistoryService {
  const inventoryRepo = createInventoryHistoryRepository();
  const productRepo = createProductRepository();
  const unitQuantityRepo = createUnitQuantityRepository();

  return {
    async getInventoryHistory(id) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const history = await inventoryRepo.findById(client, id);
        if (!history) {
          throw new AppError("Inventory history not found", 404);
        }

        await client.query("COMMIT");
        return mapInventoryHistoryToResponse(history);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getInventoryHistories(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const page = params.page || 1;
        const limit = params.limit || 10;

        const { histories, total } = await inventoryRepo.findAll(client, {
          page,
          limit,
          productId: params.productId,
          unitQuantityId: params.unitQuantityId,
          startDate: params.startDate,
          endDate: params.endDate,
        });

        await client.query("COMMIT");

        const totalPages = Math.ceil(total / limit);
        const message = histories.length === 0 ? "OK, But its empty" : "OK";

        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: histories.map(mapInventoryHistoryToResponse),
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async manipulateInventory(data, createdBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        // Validate all products and unit quantities exist
        for (const item of data.items) {
          const product = await productRepo.findById(client, item.productId);
          if (!product) {
            throw new AppError(`Product not found: ${item.productId}`, 404);
          }

          const unitQuantity = await unitQuantityRepo.findById(client, item.unitQuantityId);
          if (!unitQuantity) {
            throw new AppError(`Unit quantity not found: ${item.unitQuantityId}`, 404);
          }

          // Check if quantity would become negative after manipulation
          const currentTotal = await inventoryRepo.getTotalQuantity(
            client,
            item.productId,
            item.unitQuantityId
          );

          const newTotal = currentTotal + item.quantity;
          if (newTotal < 0) {
            throw new AppError(
              `Insufficient inventory for product ${product.name}. Current: ${currentTotal}, Requested: ${Math.abs(item.quantity)}`,
              400
            );
          }
        }

        // Create inventory history records
        const histories = data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitQuantityId: item.unitQuantityId,
          remark: item.remark || data.remark || null,
          createdBy,
        }));

        await inventoryRepo.createBatch(client, histories);

        await client.query("COMMIT");

        return {
          message: "Inventory manipulated successfully",
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getInventorySummary(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const summaryData = await inventoryRepo.getSummaryByProduct(client, params.productId);

        await client.query("COMMIT");

        // Group by product
        const productMap = new Map<string, InventorySummaryResponse>();

        for (const row of summaryData) {
          if (!productMap.has(row.product_id)) {
            productMap.set(row.product_id, {
              productId: row.product_id,
              productName: row.product_name,
              quantities: [],
            });
          }

          const product = productMap.get(row.product_id)!;
          product.quantities.push({
            unitQuantityId: row.unit_quantity_id,
            unitQuantityName: row.unit_quantity_name,
            totalQuantity: Number.parseFloat(row.total_quantity),
          });
        }

        return Array.from(productMap.values());
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
