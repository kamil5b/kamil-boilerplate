import { NextRequest } from "next/server";
import { FileHandler } from "@/server/handlers";

const handler = new FileHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handler.getFile(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handler.deleteFile(request, id);
}
