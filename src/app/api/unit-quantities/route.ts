import { NextRequest } from "next/server";
import { UnitQuantityHandler } from "@/server/handlers";

const handler = new UnitQuantityHandler();

export async function GET(request: NextRequest) {
  return handler.getUnitQuantities(request);
}

export async function POST(request: NextRequest) {
  return handler.createUnitQuantity(request);
}
