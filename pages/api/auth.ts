import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { hashPassword, comparePassword, signToken } from "../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { action, username, password } = req.body;

    if (action === "register") {
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { username, passwordHash, role: "user" },
      });
      return res.status(201).json({ id: user.id, username: user.username, role: user.role });
    }

    if (action === "login") {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      const token = signToken({ id: user.id, username: user.username, role: user.role });
      return res.json({ token });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  res.status(405).json({ error: "Method not allowed" });
}
