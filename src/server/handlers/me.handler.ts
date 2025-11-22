import { NextRequest, NextResponse } from "next/server";
import { createMeService } from "../services";
import { AppError, getUserIdFromRequest } from "../utils";

export class MeHandler {
  private meService = createMeService();

  async getMe(request: NextRequest): Promise<NextResponse> {
    try {
      // Get user ID from the Authorization header
      const userId = getUserIdFromRequest(request);

      const result = await this.meService.getMe(userId);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): NextResponse {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: error.statusCode }
      );
    }

    console.error("Unexpected error in MeHandler:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        requestedAt: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}

export const meHandler = new MeHandler();
