import { NextRequest } from "next/server";
import { PaymentHandler } from "@/server/handlers";

const handler = new PaymentHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handler.getPayment(request, id);
}
