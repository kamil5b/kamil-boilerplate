import { NextRequest, NextResponse } from "next/server";
import { createUnitQuantityService } from "../services";
import { AppError, getUserIdFromRequest, createBaseResponse } from "../utils";
import { CreateUnitQuantityRequest, UpdateUnitQuantityRequest } from "@/shared/request";

export class UnitQuantityHandler {
  private unitQuantityService = createUnitQuantityService();

  async getUnitQuantity(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const unitQuantity = await this.unitQuantityService.getUnitQuantity(id);

      return NextResponse.json(
        {
          ...createBaseResponse("Unit quantity retrieved successfully"),
          data: unitQuantity,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUnitQuantities(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get("page") || "1");
      const limit = Number.parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || undefined;

      const result = await this.unitQuantityService.getUnitQuantities({ page, limit, search });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createUnitQuantity(request: NextRequest): Promise<NextResponse> {
    try {
      const body: CreateUnitQuantityRequest = await request.json();
      const createdBy = getUserIdFromRequest(request);

      const unitQuantity = await this.unitQuantityService.createUnitQuantity(body, createdBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Unit quantity created successfully"),
          data: unitQuantity,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateUnitQuantity(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const body: UpdateUnitQuantityRequest = await request.json();
      const updatedBy = getUserIdFromRequest(request);

      const unitQuantity = await this.unitQuantityService.updateUnitQuantity(id, body, updatedBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Unit quantity updated successfully"),
          data: unitQuantity,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteUnitQuantity(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const deletedBy = getUserIdFromRequest(request);

      await this.unitQuantityService.deleteUnitQuantity(id, deletedBy);

      return NextResponse.json(
        createBaseResponse("Unit quantity deleted successfully"),
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
