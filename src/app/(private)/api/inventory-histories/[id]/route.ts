import { NextRequest } from "next/server";
import { InventoryHistoryHandler } from "@/server/handlers";

const handler = new InventoryHistoryHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handler.getInventoryHistory(request, id);
}
