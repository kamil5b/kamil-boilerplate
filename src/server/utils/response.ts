import { BaseResponse } from "@/shared";

export function createBaseResponse(message: string): BaseResponse {
  return {
    message,
    requestedAt: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
}
