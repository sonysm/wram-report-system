import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET ?? "fallback-secret";

export interface AuthTokenPayload {
  id: number;
  username: string;
  role: string;
  provinceId: number | null;
  provinceName: string | null;
  isDemo?: boolean;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded !== "object" || decoded === null) {
      return null;
    }

    const id = parseNumber((decoded as { id?: unknown }).id);
    const username = (decoded as { username?: unknown }).username;
    const role = (decoded as { role?: unknown }).role;

    if (id === null || typeof username !== "string" || username.trim() === "" || typeof role !== "string") {
      return null;
    }

    const provinceIdValue = parseNumber((decoded as { provinceId?: unknown }).provinceId);
    const provinceNameValue = (decoded as { provinceName?: unknown }).provinceName;
    const isDemoValue = (decoded as { isDemo?: unknown }).isDemo;

    return {
      id,
      username,
      role,
      provinceId: provinceIdValue,
      provinceName: typeof provinceNameValue === "string" ? provinceNameValue : null,
      isDemo: isDemoValue === true,
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
