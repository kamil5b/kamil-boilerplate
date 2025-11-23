import { getDbClient } from "../db";
import {
  createTransactionRepository,
  createTaxRepository,
  createProductRepository,
  createUnitQuantityRepository,
  createInventoryHistoryRepository,
  createCustomerRepository,
} from "../repositories";
import { AppError } from "../utils/error";
import {
  CreateTransactionRequest,
  GetTransactionsRequest,
  GetTransactionSummaryRequest,
  GetProductTransactionSummaryRequest,
  GetTransactionTimeSeriesRequest,
} from "@/shared/request";
import {
  TransactionResponse,
  TransactionItemResponse,
  DiscountResponse,
  PaginatedResponse,
  TransactionSummaryResponse,
  ProductTransactionSummaryResponse,
  TransactionTimeSeriesItemResponse,
} from "@/shared/response";
import { TransactionType, TransactionStatus, DiscountType } from "@/shared/enums";

export interface TransactionService {
  getTransaction(id: string): Promise<TransactionResponse>;
  getTransactions(params: GetTransactionsRequest): Promise<PaginatedResponse<TransactionResponse>>;
  createTransaction(data: CreateTransactionRequest, createdBy: string): Promise<TransactionResponse>;
  getTransactionSummary(params: GetTransactionSummaryRequest): Promise<TransactionSummaryResponse>;
  getProductTransactionSummary(params: GetProductTransactionSummaryRequest): Promise<ProductTransactionSummaryResponse[]>;
  getTransactionTimeSeries(params: GetTransactionTimeSeriesRequest): Promise<TransactionTimeSeriesItemResponse[]>;
}

function mapTransactionItemToResponse(item: any): TransactionItemResponse {
  return {
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    quantity: Number.parseFloat(item.quantity),
    unitQuantityId: item.unit_quantity_id,
    unitQuantityName: item.unit_quantity_name,
    pricePerUnit: Number.parseFloat(item.price_per_unit),
    total: Number.parseFloat(item.total),
    remark: item.remark,
  };
}

function mapDiscountToResponse(discount: any): DiscountResponse {
  return {
    id: discount.id,
    type: discount.type,
    percentage: discount.percentage ? Number.parseFloat(discount.percentage) : null,
    amount: Number.parseFloat(discount.amount),
    transactionItemId: discount.transaction_item_id,
  };
}

export function createTransactionService(): TransactionService {
  const transactionRepo = createTransactionRepository();
  const taxRepo = createTaxRepository();
  const productRepo = createProductRepository();
  const unitQuantityRepo = createUnitQuantityRepository();
  const inventoryRepo = createInventoryHistoryRepository();
  const customerRepo = createCustomerRepository();

  return {
    async getTransaction(id) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const transaction = await transactionRepo.findById(client, id);
        if (!transaction) {
          throw new AppError("Transaction not found", 404);
        }

        const items = await transactionRepo.getTransactionItems(client, id);
        const discounts = await transactionRepo.getDiscounts(client, id);

        await client.query("COMMIT");

        return {
          id: transaction.id,
          customerId: transaction.customer_id,
          customerName: transaction.customer_name,
          items: items.map(mapTransactionItemToResponse),
          discounts: discounts.map(mapDiscountToResponse),
          subtotal: Number.parseFloat(transaction.subtotal),
          totalTax: Number.parseFloat(transaction.total_tax),
          grandTotal: Number.parseFloat(transaction.grand_total),
          type: transaction.type,
          status: transaction.status,
          remark: transaction.remark,
          fileId: transaction.file_id,
          createdAt: transaction.created_at?.toISOString(),
          createdByName: transaction.created_by_name,
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getTransactions(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const page = params.page || 1;
        const limit = params.limit || 10;

        const { transactions, total } = await transactionRepo.findAll(client, {
          page,
          limit,
          type: params.type,
          status: params.status,
          customerId: params.customerId,
          startDate: params.startDate,
          endDate: params.endDate,
        });

        // Get items and discounts for each transaction
        const transactionsWithDetails = await Promise.all(
          transactions.map(async (t) => {
            const items = await transactionRepo.getTransactionItems(client, t.id);
            const discounts = await transactionRepo.getDiscounts(client, t.id);

            return {
              id: t.id,
              customerId: t.customer_id,
              customerName: t.customer_name,
              items: items.map(mapTransactionItemToResponse),
              discounts: discounts.map(mapDiscountToResponse),
              subtotal: Number.parseFloat(t.subtotal),
              totalTax: Number.parseFloat(t.total_tax),
              grandTotal: Number.parseFloat(t.grand_total),
              type: t.type,
              status: t.status,
              remark: t.remark,
              fileId: t.file_id,
              createdAt: t.created_at?.toISOString(),
              createdByName: t.created_by_name,
            };
          })
        );

        await client.query("COMMIT");

        const totalPages = Math.ceil(total / limit);
        const message = transactions.length === 0 ? "OK, But its empty" : "OK";

        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: transactionsWithDetails,
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async createTransaction(data, createdBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        // Validate transaction type
        if (!Object.values(TransactionType).includes(data.type as TransactionType)) {
          throw new AppError("Invalid transaction type", 400);
        }

        // Validate customer if provided
        if (data.customerId) {
          const customer = await customerRepo.findById(client, data.customerId);
          if (!customer) {
            throw new AppError("Customer not found", 404);
          }
        }

        // Validate products and calculate subtotal
        let subtotal = 0;
        const validatedItems: any[] = [];

        for (const item of data.items) {
          const product = await productRepo.findById(client, item.productId);
          if (!product) {
            throw new AppError(`Product not found: ${item.productId}`, 404);
          }

          const unitQuantity = await unitQuantityRepo.findById(client, item.unitQuantityId);
          if (!unitQuantity) {
            throw new AppError(`Unit quantity not found: ${item.unitQuantityId}`, 404);
          }

          // For SELL transactions, check inventory availability
          if (data.type === TransactionType.SELL) {
            const currentStock = await inventoryRepo.getTotalQuantity(
              client,
              item.productId,
              item.unitQuantityId
            );

            if (currentStock < item.quantity) {
              throw new AppError(
                `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${item.quantity}`,
                400
              );
            }
          }

          const itemTotal = item.pricePerUnit * item.quantity;
          subtotal += itemTotal;

          validatedItems.push({
            ...item,
            total: itemTotal,
          });
        }

        // Calculate discounts
        let totalDiscount = 0;
        const discountData = data.discounts || [];

        for (const discount of discountData) {
          if (!Object.values(DiscountType).includes(discount.type as DiscountType)) {
            throw new AppError("Invalid discount type", 400);
          }

          let discountAmount = 0;

          if (discount.type === DiscountType.TOTAL_FIXED) {
            discountAmount = discount.amount || 0;
          } else if (discount.type === DiscountType.TOTAL_PERCENTAGE) {
            discountAmount = (subtotal * (discount.percentage || 0)) / 100;
          } else if (discount.type === DiscountType.ITEM_PERCENTAGE || discount.type === DiscountType.ITEM_FIXED) {
            const itemIndex = discount.transactionItemIndex || 0;
            if (itemIndex >= validatedItems.length) {
              throw new AppError("Invalid transaction item index for discount", 400);
            }

            if (discount.type === DiscountType.ITEM_PERCENTAGE) {
              discountAmount = (validatedItems[itemIndex].total * (discount.percentage || 0)) / 100;
            } else {
              discountAmount = discount.amount || 0;
            }
          }

          totalDiscount += discountAmount;
        }

        // Calculate taxes
        const taxes = await taxRepo.findByIds(client, data.taxes);
        let totalTax = 0;

        for (const tax of taxes) {
          totalTax += ((subtotal - totalDiscount) * tax.value) / 100;
        }

        // Calculate grand total
        const grandTotal = subtotal - totalDiscount + totalTax;

        // Create transaction
        const transaction = await transactionRepo.create(client, {
          customerId: data.customerId || null,
          subtotal,
          totalTax,
          grandTotal,
          type: data.type,
          status: TransactionStatus.UNPAID,
          remark: data.remark || null,
          fileId: data.fileId || null,
          createdBy,
        });

        // Create transaction items
        const createdItems = [];
        for (let i = 0; i < validatedItems.length; i++) {
          const item = validatedItems[i];
          const transactionItem = await transactionRepo.createTransactionItem(client, {
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            unitQuantityId: item.unitQuantityId,
            pricePerUnit: item.pricePerUnit,
            total: item.total,
            remark: item.remark || null,
          });
          createdItems.push(transactionItem);
        }

        // Create discounts
        const createdDiscounts = [];
        for (const discount of discountData) {
          let discountAmount = 0;
          let transactionItemId = null;

          if (discount.type === DiscountType.TOTAL_FIXED) {
            discountAmount = discount.amount || 0;
          } else if (discount.type === DiscountType.TOTAL_PERCENTAGE) {
            discountAmount = (subtotal * (discount.percentage || 0)) / 100;
          } else if (discount.type === DiscountType.ITEM_PERCENTAGE || discount.type === DiscountType.ITEM_FIXED) {
            const itemIndex = discount.transactionItemIndex || 0;
            transactionItemId = createdItems[itemIndex].id;

            if (discount.type === DiscountType.ITEM_PERCENTAGE) {
              discountAmount = (validatedItems[itemIndex].total * (discount.percentage || 0)) / 100;
            } else {
              discountAmount = discount.amount || 0;
            }
          }

          const createdDiscount = await transactionRepo.createDiscount(client, {
            transactionId: transaction.id,
            type: discount.type,
            percentage: discount.percentage || null,
            amount: discountAmount,
            transactionItemId,
          });
          createdDiscounts.push(createdDiscount);
        }

        // Update inventory
        for (const item of validatedItems) {
          const inventoryChange = data.type === TransactionType.SELL ? -item.quantity : item.quantity;

          await inventoryRepo.create(client, {
            productId: item.productId,
            quantity: inventoryChange,
            unitQuantityId: item.unitQuantityId,
            remark: `Transaction ${transaction.id}`,
            createdBy,
          });
        }

        await client.query("COMMIT");

        // Fetch complete transaction with items
        const items = await transactionRepo.getTransactionItems(client, transaction.id);

        return {
          id: transaction.id,
          customerId: transaction.customerId,
          customerName: null,
          items: createdItems.map(mapTransactionItemToResponse),
          discounts: createdDiscounts.map(mapDiscountToResponse),
          subtotal,
          totalTax,
          grandTotal,
          type: transaction.type,
          status: transaction.status,
          remark: transaction.remark,
          fileId: transaction.fileId,
          createdAt: transaction.createdAt?.toISOString(),
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getTransactionSummary(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const summary = await transactionRepo.getSummary(
          client,
          params.startDate,
          params.endDate
        );

        await client.query("COMMIT");

        return {
          totalRevenue: Number.parseFloat(summary.total_revenue),
          totalExpenses: Number.parseFloat(summary.total_expenses),
          netIncome: Number.parseFloat(summary.net_income),
          transactionCount: Number.parseInt(summary.transaction_count),
          startDate: params.startDate || "",
          endDate: params.endDate || "",
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getProductTransactionSummary(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const summaryData = await transactionRepo.getProductSummary(
          client,
          params.productId,
          params.startDate,
          params.endDate
        );

        await client.query("COMMIT");

        return summaryData.map((row) => ({
          productId: row.product_id,
          productName: row.product_name,
          revenue: Number.parseFloat(row.revenue),
          expenses: Number.parseFloat(row.expenses),
          netIncome: Number.parseFloat(row.net_income),
          quantitySold: Number.parseFloat(row.quantity_sold),
          quantityBought: Number.parseFloat(row.quantity_bought),
        }));
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getTransactionTimeSeries(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const timeSeriesData = await transactionRepo.getTimeSeries(
          client,
          params.startDate,
          params.endDate,
          params.interval
        );

        await client.query("COMMIT");

        return timeSeriesData.map((item) => ({
          period: item.period.toISOString(),
          revenue: item.revenue,
          expenses: item.expenses,
          netIncome: item.netIncome,
          sellCount: item.sellCount,
          buyCount: item.buyCount,
        }));
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
