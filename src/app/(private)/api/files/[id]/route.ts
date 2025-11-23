import { NextRequest } from "next/server";
import { FileHandler } from "@/server/handlers";

const handler = new FileHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handler.getFile(request, params.id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handler.deleteFile(request, params.id);
}
