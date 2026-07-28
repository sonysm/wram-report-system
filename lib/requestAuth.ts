import type { NextApiRequest } from "next";
import { verifyToken, type AuthTokenPayload } from "./auth";

export function getBearerToken(req: NextApiRequest): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return null;
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
        return null;
    }

    return token;
}

export function getAuthPayload(req: NextApiRequest): AuthTokenPayload | null {
    const token = getBearerToken(req);
    if (!token) {
        return null;
    }

    return verifyToken(token);
}