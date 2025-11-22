import { NextRequest, NextResponse } from "next/server";
import { createAuthService } from "../services";
import { AppError } from "../utils/error";
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ActivateAccountRequest,
} from "@/shared/request";

export class AuthHandler {
  private authService = createAuthService();

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const body: LoginRequest = await request.json();

      const result = await this.authService.login(body);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async register(request: NextRequest): Promise<NextResponse> {
    try {
      const body: RegisterRequest = await request.json();

      const result = await this.authService.register(body);

      return NextResponse.json(
        {
          message: result.message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async forgotPassword(request: NextRequest): Promise<NextResponse> {
    try {
      const body: ForgotPasswordRequest = await request.json();

      const result = await this.authService.forgotPassword(body);

      return NextResponse.json(
        {
          message: result.message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async resetPassword(request: NextRequest): Promise<NextResponse> {
    try {
      const body: ResetPasswordRequest = await request.json();

      const result = await this.authService.resetPassword(body);

      return NextResponse.json(
        {
          message: result.message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async activateAccount(request: NextRequest): Promise<NextResponse> {
    try {
      const body: ActivateAccountRequest = await request.json();

      const result = await this.authService.activateAccount(body);

      return NextResponse.json(
        {
          message: result.message,
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
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
