import { NextRequest } from "next/server";
import { FileHandler } from "@/server/handlers";

const handler = new FileHandler();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handler.getFileInfo(request, id);
}
