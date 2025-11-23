import { NextRequest } from "next/server";
import { TaxHandler } from "@/server/handlers";

const handler = new TaxHandler();

export async function GET(request: NextRequest) {
  return handler.getTaxes(request);
}

export async function POST(request: NextRequest) {
  return handler.createTax(request);
}
