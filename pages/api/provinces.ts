import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { ensureProvincesSeeded } from "../../lib/provinces";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    await ensureProvincesSeeded();

    const provinces = await prisma.province.findMany({
        select: { id: true, name: true, khmerName: true },
        orderBy: { khmerName: "asc" },
    });

    return res.json({ provinces });
}