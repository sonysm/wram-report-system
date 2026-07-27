import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { category, value, departmentId } = req.body;
    const entry = await prisma.entry.create({
      data: { category, value: parseFloat(value), departmentId },
    });
    return res.json(entry);
  }

  if (req.method === "GET") {
    const entries = await prisma.entry.findMany({ include: { department: true } });
    return res.json(entries);
  }

  res.status(405).json({ error: "Method not allowed" });
}
