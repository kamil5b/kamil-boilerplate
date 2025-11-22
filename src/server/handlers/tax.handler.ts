import { NextRequest, NextResponse } from "next/server";
import { createTaxService } from "../services";
import { AppError, getUserIdFromRequest, createBaseResponse } from "../utils";
import { CreateTaxRequest, UpdateTaxRequest } from "@/shared/request";

export class TaxHandler {
  private taxService = createTaxService();

  async getTax(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const tax = await this.taxService.getTax(id);

      return NextResponse.json(
        {
          ...createBaseResponse("Tax retrieved successfully"),
          data: tax,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTaxes(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get("page") || "1");
      const limit = Number.parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || undefined;

      const result = await this.taxService.getTaxes({ page, limit, search });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createTax(request: NextRequest): Promise<NextResponse> {
    try {
      const body: CreateTaxRequest = await request.json();
      const createdBy = getUserIdFromRequest(request);

      const tax = await this.taxService.createTax(body, createdBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Tax created successfully"),
          data: tax,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateTax(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const body: UpdateTaxRequest = await request.json();
      const updatedBy = getUserIdFromRequest(request);

      const tax = await this.taxService.updateTax(id, body, updatedBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Tax updated successfully"),
          data: tax,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteTax(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const deletedBy = getUserIdFromRequest(request);

      await this.taxService.deleteTax(id, deletedBy);

      return NextResponse.json(
        createBaseResponse("Tax deleted successfully"),
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
