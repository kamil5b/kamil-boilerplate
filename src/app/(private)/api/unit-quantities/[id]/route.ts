import { NextRequest } from "next/server";
import { UnitQuantityHandler } from "@/server/handlers";

const handler = new UnitQuantityHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handler.getUnitQuantity(request, id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handler.updateUnitQuantity(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handler.deleteUnitQuantity(request, id);
}
