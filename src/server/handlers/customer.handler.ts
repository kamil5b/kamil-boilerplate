import { NextRequest, NextResponse } from "next/server";
import { createCustomerService } from "../services";
import { AppError, getUserIdFromRequest, createBaseResponse } from "../utils";
import { CreateCustomerRequest, UpdateCustomerRequest } from "@/shared/request";

export class CustomerHandler {
  private customerService = createCustomerService();

  async getCustomer(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const customer = await this.customerService.getCustomer(id);

      return NextResponse.json(
        {
          ...createBaseResponse("Customer retrieved successfully"),
          data: customer,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCustomers(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get("page") || "1");
      const limit = Number.parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || undefined;

      const result = await this.customerService.getCustomers({ page, limit, search });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createCustomer(request: NextRequest): Promise<NextResponse> {
    try {
      const body: CreateCustomerRequest = await request.json();
      const createdBy = getUserIdFromRequest(request);

      const customer = await this.customerService.createCustomer(body, createdBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Customer created successfully"),
          data: customer,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateCustomer(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const body: UpdateCustomerRequest = await request.json();
      const updatedBy = getUserIdFromRequest(request);

      const customer = await this.customerService.updateCustomer(id, body, updatedBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Customer updated successfully"),
          data: customer,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteCustomer(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const deletedBy = getUserIdFromRequest(request);

      await this.customerService.deleteCustomer(id, deletedBy);

      return NextResponse.json(
        createBaseResponse("Customer deleted successfully"),
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
