import { getDbClient } from "../db";
import { createProductRepository } from "../repositories";
import { AppError } from "../utils/error";
import {
  CreateProductRequest,
  UpdateProductRequest,
  GetProductsRequest,
} from "@/shared/request";
import {
  ProductResponse,
  PaginatedResponse,
} from "@/shared/response";
import { Product } from "@/shared/entities";
import { ProductType } from "@/shared/enums";

export interface ProductService {
  getProduct(id: string): Promise<ProductResponse>;
  getProducts(params: GetProductsRequest): Promise<PaginatedResponse<ProductResponse>>;
  createProduct(data: CreateProductRequest, createdBy: string): Promise<ProductResponse>;
  updateProduct(id: string, data: UpdateProductRequest, updatedBy: string): Promise<ProductResponse>;
  deleteProduct(id: string, deletedBy: string): Promise<void>;
}

function mapProductToResponse(product: any): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    type: product.type,
    remark: product.remark,
    createdAt: product.createdAt?.toISOString(),
    updatedAt: product.updatedAt?.toISOString(),
    createdByName: product.created_by_name,
    updatedByName: product.updated_by_name,
  };
}

export function createProductService(): ProductService {
  const productRepo = createProductRepository();

  return {
    async getProduct(id) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const product = await productRepo.findById(client, id);
        if (!product) {
          throw new AppError("Product not found", 404);
        }

        await client.query("COMMIT");
        return mapProductToResponse(product);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getProducts(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const page = params.page || 1;
        const limit = params.limit || 10;

        const { products, total } = await productRepo.findAll(client, {
          page,
          limit,
          search: params.search,
          type: params.type,
        });

        await client.query("COMMIT");

        const totalPages = Math.ceil(total / limit);
        const message = products.length === 0 ? "OK, But its empty" : "OK";

        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: products.map(mapProductToResponse),
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async createProduct(data, createdBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        // Validate product type
        if (!Object.values(ProductType).includes(data.type as ProductType)) {
          throw new AppError("Invalid product type", 400);
        }

        const product = await productRepo.create(client, {
          name: data.name,
          description: data.description,
          type: data.type,
          remark: data.remark || null,
          createdBy,
          updatedBy: createdBy,
          deletedAt: null,
          deletedBy: null,
        });

        await client.query("COMMIT");
        return mapProductToResponse(product);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async updateProduct(id, data, updatedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const existingProduct = await productRepo.findById(client, id);
        if (!existingProduct) {
          throw new AppError("Product not found", 404);
        }

        // Validate product type if provided
        if (data.type && !Object.values(ProductType).includes(data.type as ProductType)) {
          throw new AppError("Invalid product type", 400);
        }

        const updateData: Partial<Product> = {
          updatedBy,
        };

        if (data.name) updateData.name = data.name;
        if (data.description) updateData.description = data.description;
        if (data.type) updateData.type = data.type;
        if (data.remark !== undefined) updateData.remark = data.remark || null;

        const product = await productRepo.update(client, id, updateData);
        if (!product) {
          throw new AppError("Failed to update product", 500);
        }

        await client.query("COMMIT");
        return mapProductToResponse(product);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteProduct(id, deletedBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const product = await productRepo.findById(client, id);
        if (!product) {
          throw new AppError("Product not found", 404);
        }

        const deleted = await productRepo.delete(client, id, deletedBy);
        if (!deleted) {
          throw new AppError("Failed to delete product", 500);
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
