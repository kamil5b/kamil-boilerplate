import { NextRequest } from "next/server";
import { TransactionHandler } from "@/server/handlers";

const handler = new TransactionHandler();

export async function GET(request: NextRequest) {
  return handler.getTransactions(request);
}

export async function POST(request: NextRequest) {
  return handler.createTransaction(request);
}
