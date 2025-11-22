import { NextRequest, NextResponse } from "next/server";
import { createPaymentService } from "../services";
import { AppError, getUserIdFromRequest, createBaseResponse } from "../utils";
import { CreatePaymentRequest } from "@/shared/request";

export class PaymentHandler {
  private paymentService = createPaymentService();

  async getPayment(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const payment = await this.paymentService.getPayment(id);

      return NextResponse.json(
        {
          ...createBaseResponse("Payment retrieved successfully"),
          data: payment,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getPayments(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get("page") || "1");
      const limit = Number.parseInt(searchParams.get("limit") || "10");
      const type = searchParams.get("type") || undefined;
      const transactionId = searchParams.get("transactionId") || undefined;
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;

      const result = await this.paymentService.getPayments({
        page,
        limit,
        type,
        transactionId,
        startDate,
        endDate,
      });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createPayment(request: NextRequest): Promise<NextResponse> {
    try {
      const body: CreatePaymentRequest = await request.json();
      const createdBy = getUserIdFromRequest(request);

      const payment = await this.paymentService.createPayment(body, createdBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Payment created successfully"),
          data: payment,
        },
        { status: 201 }
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
