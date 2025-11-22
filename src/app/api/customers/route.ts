import { NextRequest } from "next/server";
import { CustomerHandler } from "@/server/handlers";

const handler = new CustomerHandler();

export async function GET(request: NextRequest) {
  return handler.getCustomers(request);
}

export async function POST(request: NextRequest) {
  return handler.createCustomer(request);
}
