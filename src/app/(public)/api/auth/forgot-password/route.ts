import { NextRequest } from "next/server";
import { AuthHandler } from "@/server/handlers";

const handler = new AuthHandler();

export async function POST(request: NextRequest) {
  return handler.forgotPassword(request);
}
