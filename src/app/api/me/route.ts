import { NextRequest } from "next/server";
import { meHandler } from "@/server/handlers";

export async function GET(request: NextRequest) {
  return meHandler.getMe(request);
}
