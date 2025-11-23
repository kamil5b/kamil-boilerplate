import { NextRequest } from "next/server";
import { UserHandler } from "@/server/handlers";

const handler = new UserHandler();

export async function GET(request: NextRequest) {
  return handler.getUsers(request);
}

export async function POST(request: NextRequest) {
  return handler.createUser(request);
}
