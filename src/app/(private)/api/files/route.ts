import { NextRequest } from "next/server";
import { FileHandler } from "@/server/handlers";

const handler = new FileHandler();

export async function POST(request: NextRequest) {
  return handler.uploadFile(request);
}
