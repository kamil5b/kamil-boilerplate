import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AuthTokenPayload } from "@/shared";
import { AppError } from "./error";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || "7d";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
}

export function verifyToken(token: string | null): AuthTokenPayload {
  if (!token) {
    throw new AppError("No token provided", 401);
  }

  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    throw new AppError("Invalid token", 401);
  }
}

export function getUserIdFromRequest(request: Request): string {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || null;
  const payload = verifyToken(token);
  return payload.userId;
}

export function getUserRoleFromRequest(request: Request): string {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || null;
  const payload = verifyToken(token);
  return payload.role;
}
