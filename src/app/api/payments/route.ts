import { NextRequest } from "next/server";
import { PaymentHandler } from "@/server/handlers";

const handler = new PaymentHandler();

export async function GET(request: NextRequest) {
  return handler.getPayments(request);
}

export async function POST(request: NextRequest) {
  return handler.createPayment(request);
}
