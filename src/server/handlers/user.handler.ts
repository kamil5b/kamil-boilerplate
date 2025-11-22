import { NextRequest, NextResponse } from "next/server";
import { createUserService } from "../services";
import { AppError, getUserIdFromRequest, createBaseResponse } from "../utils";
import { CreateUserRequest, UpdateUserRequest } from "@/shared/request";

export class UserHandler {
  private userService = createUserService();

  async getUser(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const user = await this.userService.getUser(id);

      return NextResponse.json(
        {
          ...createBaseResponse("User retrieved successfully"),
          data: user,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUsers(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get("page") || "1");
      const limit = Number.parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || undefined;
      const role = searchParams.get("role") || undefined;

      const result = await this.userService.getUsers({ page, limit, search, role });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createUser(request: NextRequest): Promise<NextResponse> {
    try {
      const body: CreateUserRequest = await request.json();
      const createdBy = getUserIdFromRequest(request);

      const user = await this.userService.createUser(body, createdBy);

      return NextResponse.json(
        {
          ...createBaseResponse("User created successfully"),
          data: user,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateUser(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const body: UpdateUserRequest = await request.json();
      const updatedBy = getUserIdFromRequest(request);

      const user = await this.userService.updateUser(id, body, updatedBy);

      return NextResponse.json(
        {
          ...createBaseResponse("User updated successfully"),
          data: user,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteUser(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const deletedBy = getUserIdFromRequest(request);

      await this.userService.deleteUser(id, deletedBy);

      return NextResponse.json(
        createBaseResponse("User deleted successfully"),
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
