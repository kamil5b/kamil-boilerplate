import { NextRequest } from "next/server";
import { InventoryHistoryHandler } from "@/server/handlers";

const handler = new InventoryHistoryHandler();

export async function GET(request: NextRequest) {
  return handler.getInventoryHistories(request);
}

export async function POST(request: NextRequest) {
  return handler.manipulateInventory(request);
}
