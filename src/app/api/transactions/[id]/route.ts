import { NextRequest } from "next/server";
import { TransactionHandler } from "@/server/handlers";

const handler = new TransactionHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handler.getTransaction(request, id);
}
