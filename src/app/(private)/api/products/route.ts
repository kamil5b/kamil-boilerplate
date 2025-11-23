import { NextRequest } from "next/server";
import { ProductHandler } from "@/server/handlers";

const handler = new ProductHandler();

export async function GET(request: NextRequest) {
  return handler.getProducts(request);
}

export async function POST(request: NextRequest) {
  return handler.createProduct(request);
}
