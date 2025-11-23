import { getDbClient } from "../db";
import {
  createPaymentRepository,
  createTransactionRepository,
} from "../repositories";
import { AppError } from "../utils/error";
import {
  CreatePaymentRequest,
  GetPaymentsRequest,
} from "@/shared/request";
import {
  PaymentResponse,
  PaymentDetailResponse,
  PaginatedResponse,
} from "@/shared/response";
import { PaymentType, PaymentDirection, TransactionStatus } from "@/shared/enums";

export interface PaymentService {
  getPayment(id: string): Promise<PaymentResponse>;
  getPayments(params: GetPaymentsRequest): Promise<PaginatedResponse<PaymentResponse>>;
  createPayment(data: CreatePaymentRequest, createdBy: string): Promise<PaymentResponse>;
}

function mapPaymentDetailToResponse(detail: any): PaymentDetailResponse {
  return {
    id: detail.id,
    identifier: detail.identifier,
    value: detail.value,
  };
}

export function createPaymentService(): PaymentService {
  const paymentRepo = createPaymentRepository();
  const transactionRepo = createTransactionRepository();

  return {
    async getPayment(id) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const payment = await paymentRepo.findById(client, id);
        if (!payment) {
          throw new AppError("Payment not found", 404);
        }

        const details = await paymentRepo.getPaymentDetails(client, id);

        await client.query("COMMIT");

        return {
          id: payment.id,
          transactionId: payment.transaction_id,
          type: payment.type,
          direction: payment.direction,
          amount: Number.parseFloat(payment.amount),
          details: details.map(mapPaymentDetailToResponse),
          remark: payment.remark,
          fileId: payment.file_id,
          createdAt: payment.created_at?.toISOString(),
          createdByName: payment.created_by_name,
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getPayments(params) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const page = params.page || 1;
        const limit = params.limit || 10;

        const { payments, total } = await paymentRepo.findAll(client, {
          page,
          limit,
          type: params.type,
          transactionId: params.transactionId,
          startDate: params.startDate,
          endDate: params.endDate,
        });

        // Get details for each payment
        const paymentsWithDetails = await Promise.all(
          payments.map(async (p) => {
            const details = await paymentRepo.getPaymentDetails(client, p.id);

            return {
              id: p.id,
              transactionId: p.transaction_id,
              type: p.type,
              direction: p.direction,
              amount: Number.parseFloat(p.amount),
              details: details.map(mapPaymentDetailToResponse),
              remark: p.remark,
              fileId: p.file_id,
              createdAt: p.created_at?.toISOString(),
              createdByName: p.created_by_name,
            };
          })
        );

        await client.query("COMMIT");

        const totalPages = Math.ceil(total / limit);
        const message = payments.length === 0 ? "OK, But its empty" : "OK";

        return {
          message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          meta: { page, limit, totalPages, totalItems: total },
          items: paymentsWithDetails,
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async createPayment(data, createdBy) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        // Validate payment type
        if (!Object.values(PaymentType).includes(data.type as PaymentType)) {
          throw new AppError("Invalid payment type", 400);
        }

        // Validate payment direction
        if (!Object.values(PaymentDirection).includes(data.direction as PaymentDirection)) {
          throw new AppError("Invalid payment direction", 400);
        }

        // Calculate signed amount based on direction (for calculations)
        const signedAmount = data.direction === PaymentDirection.OUTFLOW ? -data.amount : data.amount;

        // If transaction ID is provided, validate and update transaction status
        let transaction = null;
        if (data.transactionId) {
          transaction = await transactionRepo.findById(client, data.transactionId);
          if (!transaction) {
            throw new AppError("Transaction not found", 404);
          }

          // Calculate total paid (with signed amounts)
          const totalPaid = await paymentRepo.getTotalPaidForTransaction(client, data.transactionId);
          const newTotalPaid = totalPaid + signedAmount;

          // Update transaction status
          let newStatus = transaction.status;
          const grandTotal = Number.parseFloat(transaction.grand_total);
          
          // For BUY transactions, negative payments (OUTFLOW) indicate money owed to supplier
          if (transaction.type === 'BUY') {
            if (newTotalPaid <= grandTotal) {
              newStatus = TransactionStatus.PAID;
            } else if (newTotalPaid < 0) {
              newStatus = TransactionStatus.PARTIALLY_PAID;
            }
          } else {
            // For SELL transactions, use normal logic
            if (newTotalPaid >= grandTotal) {
              newStatus = TransactionStatus.PAID;
            } else if (newTotalPaid > 0) {
              newStatus = TransactionStatus.PARTIALLY_PAID;
            }
          }

          if (newStatus !== transaction.status) {
            await transactionRepo.updateStatus(client, data.transactionId, newStatus);
          }

          // Check for overpayment (for INFLOW only)
          if (data.direction === PaymentDirection.INFLOW && newTotalPaid > Number.parseFloat(transaction.grand_total)) {
            throw new AppError(
              `Payment amount exceeds remaining balance. Remaining: ${Number.parseFloat(transaction.grand_total) - totalPaid}`,
              400
            );
          }
        }

        // Create payment (store absolute amount with direction)
        const payment = await paymentRepo.create(client, {
          transactionId: data.transactionId || null,
          type: data.type,
          direction: data.direction,
          amount: Math.abs(data.amount),
          remark: data.remark || null,
          fileId: data.fileId || null,
          createdBy,
        });

        // Create payment details
        const details = [];
        if (data.details && data.details.length > 0) {
          for (const detail of data.details) {
            const paymentDetail = await paymentRepo.createPaymentDetail(client, {
              paymentId: payment.id,
              identifier: detail.identifier,
              value: detail.value,
            });
            details.push(paymentDetail);
          }
        }

        await client.query("COMMIT");

        return {
          id: payment.id,
          transactionId: payment.transactionId,
          type: payment.type,
          direction: payment.direction,
          amount: payment.amount,
          details: details.map(mapPaymentDetailToResponse),
          remark: payment.remark,
          fileId: payment.fileId,
          createdAt: payment.createdAt?.toISOString(),
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
