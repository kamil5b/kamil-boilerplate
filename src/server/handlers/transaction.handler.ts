import { NextRequest, NextResponse } from "next/server";
import { createTransactionService } from "../services";
import { AppError, getUserIdFromRequest, createBaseResponse } from "../utils";
import { CreateTransactionRequest } from "@/shared/request";

export class TransactionHandler {
  private transactionService = createTransactionService();

  async getTransaction(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const transaction = await this.transactionService.getTransaction(id);

      return NextResponse.json(
        {
          ...createBaseResponse("Transaction retrieved successfully"),
          data: transaction,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTransactions(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get("page") || "1");
      const limit = Number.parseInt(searchParams.get("limit") || "10");
      const type = searchParams.get("type") || undefined;
      const status = searchParams.get("status") || undefined;
      const customerId = searchParams.get("customerId") || undefined;
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;

      const result = await this.transactionService.getTransactions({
        page,
        limit,
        type,
        status,
        customerId,
        startDate,
        endDate,
      });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createTransaction(request: NextRequest): Promise<NextResponse> {
    try {
      const body: CreateTransactionRequest = await request.json();
      const createdBy = getUserIdFromRequest(request);

      const transaction = await this.transactionService.createTransaction(body, createdBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Transaction created successfully"),
          data: transaction,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTransactionSummary(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;

      const result = await this.transactionService.getTransactionSummary({
        startDate,
        endDate,
      });

      return NextResponse.json(
        {
          ...createBaseResponse("Transaction summary retrieved successfully"),
          data: result,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProductTransactionSummary(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const productId = searchParams.get("productId") || undefined;
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;

      const result = await this.transactionService.getProductTransactionSummary({
        productId,
        startDate,
        endDate,
      });

      return NextResponse.json(
        {
          ...createBaseResponse("Product transaction summary retrieved successfully"),
          data: result,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): NextResponse {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          message: error.message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: error.statusCode }
      );
    }
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        requestedAt: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
