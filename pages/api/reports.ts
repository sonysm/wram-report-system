import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const report = await prisma.entry.groupBy({
    by: ["category", "departmentId"],
    _sum: { value: true },
  });

  res.json(report);
}
