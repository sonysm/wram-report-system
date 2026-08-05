import type { NextApiRequest } from "next";
import prisma from "./db";
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

export async function getActiveAuthPayload(req: NextApiRequest): Promise<AuthTokenPayload | null> {
    const authPayload = getAuthPayload(req);
    if (!authPayload) {
        return null;
    }

    if (authPayload.isDemo) {
        return authPayload;
    }

    const user = await prisma.user.findUnique({
        where: { id: authPayload.id },
        select: {
            id: true,
            username: true,
            role: true,
            provinceId: true,
            isActive: true,
            province: {
                select: {
                    name: true,
                    khmerName: true,
                },
            },
        },
    });

    if (!user || !user.isActive) {
        return null;
    }

    return {
        id: user.id,
        username: user.username,
        role: user.role,
        provinceId: user.provinceId,
        provinceName: user.province?.khmerName || user.province?.name || null,
        isDemo: false,
    };
}