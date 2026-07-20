import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set");
}

export function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set. Please configure it in your environment.");
  }
  return JWT_SECRET;
}

export function getUser(request: NextRequest): string | null {
  const token = request.cookies.get("marketrun_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

export function signToken(payload: { id: string; email: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { id: string; email: string };
  } catch {
    return null;
  }
}
