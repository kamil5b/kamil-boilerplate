import { NextRequest } from "next/server";
import { FinanceDashboardHandler } from "@/server/handlers";

const handler = new FinanceDashboardHandler();

export async function GET(request: NextRequest) {
  return handler.getFinanceDashboard(request);
}
