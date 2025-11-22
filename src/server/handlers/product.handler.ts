import { NextRequest, NextResponse } from "next/server";
import { createProductService } from "../services";
import { AppError, getUserIdFromRequest, createBaseResponse } from "../utils";
import { CreateProductRequest, UpdateProductRequest } from "@/shared/request";

export class ProductHandler {
  private productService = createProductService();

  async getProduct(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const product = await this.productService.getProduct(id);

      return NextResponse.json(
        {
          ...createBaseResponse("Product retrieved successfully"),
          data: product,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProducts(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get("page") || "1");
      const limit = Number.parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || undefined;
      const type = searchParams.get("type") || undefined;

      const result = await this.productService.getProducts({ page, limit, search, type });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createProduct(request: NextRequest): Promise<NextResponse> {
    try {
      const body: CreateProductRequest = await request.json();
      const createdBy = getUserIdFromRequest(request);

      const product = await this.productService.createProduct(body, createdBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Product created successfully"),
          data: product,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProduct(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const body: UpdateProductRequest = await request.json();
      const updatedBy = getUserIdFromRequest(request);

      const product = await this.productService.updateProduct(id, body, updatedBy);

      return NextResponse.json(
        {
          ...createBaseResponse("Product updated successfully"),
          data: product,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteProduct(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const deletedBy = getUserIdFromRequest(request);

      await this.productService.deleteProduct(id, deletedBy);

      return NextResponse.json(
        createBaseResponse("Product deleted successfully"),
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
