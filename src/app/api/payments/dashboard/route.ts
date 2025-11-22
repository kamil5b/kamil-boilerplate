import { NextRequest } from "next/server";
import { PaymentDashboardHandler } from "@/server/handlers";

const handler = new PaymentDashboardHandler();

export async function GET(request: NextRequest) {
  return handler.getPaymentDashboard(request);
}
