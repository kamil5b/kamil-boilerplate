import { NextRequest, NextResponse } from "next/server";
import { createInventoryHistoryService } from "../services";
import { AppError, getUserIdFromRequest, createBaseResponse } from "../utils";
import { ManipulateInventoryRequest } from "@/shared/request";

export class InventoryHistoryHandler {
  private inventoryService = createInventoryHistoryService();

  async getInventoryHistory(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const history = await this.inventoryService.getInventoryHistory(id);

      return NextResponse.json(
        {
          ...createBaseResponse("Inventory history retrieved successfully"),
          data: history,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getInventoryHistories(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get("page") || "1");
      const limit = Number.parseInt(searchParams.get("limit") || "10");
      const productId = searchParams.get("productId") || undefined;
      const unitQuantityId = searchParams.get("unitQuantityId") || undefined;
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;

      const result = await this.inventoryService.getInventoryHistories({
        page,
        limit,
        productId,
        unitQuantityId,
        startDate,
        endDate,
      });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async manipulateInventory(request: NextRequest): Promise<NextResponse> {
    try {
      const body: ManipulateInventoryRequest = await request.json();
      const createdBy = getUserIdFromRequest(request);

      const result = await this.inventoryService.manipulateInventory(body, createdBy);

      return NextResponse.json(
        {
          ...createBaseResponse(result.message),
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getInventorySummary(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const productId = searchParams.get("productId") || undefined;

      const result = await this.inventoryService.getInventorySummary({ productId });

      return NextResponse.json(
        {
          ...createBaseResponse("Inventory summary retrieved successfully"),
          data: result,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getInventoryTimeSeries(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const productId = searchParams.get("productId");
      const unitQuantityId = searchParams.get("unitQuantityId") || undefined;
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;
      const interval = searchParams.get("interval") || "day";

      if (!productId) {
        return NextResponse.json(
          {
            message: "productId is required",
            requestedAt: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
          { status: 400 }
        );
      }

      const result = await this.inventoryService.getInventoryTimeSeries({
        productId,
        unitQuantityId,
        startDate,
        endDate,
        interval,
      });

      return NextResponse.json(
        {
          ...createBaseResponse("Inventory time series retrieved successfully"),
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
