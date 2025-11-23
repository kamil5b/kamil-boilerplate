import { NextRequest } from "next/server";
import { TransactionHandler } from "@/server/handlers";

const handler = new TransactionHandler();

export async function GET(request: NextRequest) {
  return handler.getProductTransactionSummary(request);
}
