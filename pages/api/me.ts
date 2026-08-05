import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { getAuthPayload } from "../../lib/requestAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const authUser = getAuthPayload(req);
    if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (authUser.isDemo) {
        return res.json({
            id: authUser.id,
            username: authUser.username,
            role: authUser.role,
            provinceId: authUser.provinceId,
            provinceName: authUser.provinceName,
            isDemo: true,
        });
    }

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { province: true },
    });

    if (!user) {
        return res.status(401).json({ error: "User no longer exists" });
    }

    if (!user.isActive) {
        return res.status(403).json({ error: "Account is disabled" });
    }

    return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        provinceId: user.provinceId,
        provinceName: user.province?.khmerName || user.province?.name || null,
        isDemo: false,
    });
}