import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { hashPassword, comparePassword, signToken } from "../../lib/auth";
import { ensureProvincesSeeded } from "../../lib/provinces";

const DUMMY_USERS = [
  {
    id: -1,
    username: "demo_admin",
    password: "demo12345",
    role: "admin",
    provinceName: null,
  },
  {
    id: -2,
    username: "demo_kandal",
    password: "demo12345",
    role: "user",
    provinceName: "Kandal",
  },
  {
    id: -3,
    username: "demo_user",
    password: "demo12345",
    role: "admin",
    provinceName: null,
  },
] as const;

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { action, username, password } = req.body;
    const cleanUsername = normalizeText(username);
    const cleanPassword = normalizeText(password);

    if (action === "register") {
      const provinceName = normalizeText(req.body?.provinceName);

      if (!cleanUsername || !cleanPassword || !provinceName) {
        return res.status(400).json({ error: "Username, password, and province are required" });
      }

      await ensureProvincesSeeded();

      const province = await prisma.province.findFirst({
        where: {
          OR: [
            { name: { equals: provinceName, mode: "insensitive" } },
            { khmerName: { equals: provinceName, mode: "insensitive" } },
          ],
        },
      });

      if (!province) {
        return res.status(400).json({ error: "Province not found" });
      }

      const existingUser = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const passwordHash = await hashPassword(cleanPassword);
      const user = await prisma.user.create({
        data: {
          username: cleanUsername,
          passwordHash,
          role: "user",
          provinceId: province.id,
        },
        include: { province: true },
      });

      return res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        provinceId: user.provinceId,
        provinceName: user.province?.khmerName || user.province?.name || null,
      });
    }

    if (action === "login") {
      if (!cleanUsername || !cleanPassword) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      await ensureProvincesSeeded();

      const dbUser = await prisma.user.findUnique({
        where: { username: cleanUsername },
        include: { province: true },
      });

      if (dbUser) {
        const valid = await comparePassword(cleanPassword, dbUser.passwordHash);
        if (!valid) return res.status(401).json({ error: "Invalid credentials" });

        const token = signToken({
          id: dbUser.id,
          username: dbUser.username,
          role: dbUser.role,
          provinceId: dbUser.provinceId ?? null,
          provinceName: dbUser.province?.khmerName || dbUser.province?.name || null,
        });

        return res.json({
          token,
          role: dbUser.role,
          provinceId: dbUser.provinceId,
          provinceName: dbUser.province?.khmerName || dbUser.province?.name || null,
        });
      }

      const dummyUser = DUMMY_USERS.find(
        (user) => user.username === cleanUsername && user.password === cleanPassword,
      );

      if (dummyUser) {
        let provinceId: number | null = null;
        let provinceName: string | null = null;

        if (dummyUser.provinceName) {
          const province = await prisma.province.findUnique({ where: { name: dummyUser.provinceName } });
          if (!province) {
            return res.status(500).json({ error: "Province seed failed" });
          }

          provinceId = province.id;
          provinceName = province.khmerName || province.name;
        }

        const token = signToken({
          id: dummyUser.id,
          username: dummyUser.username,
          role: dummyUser.role,
          provinceId,
          provinceName,
          isDemo: true,
        });

        return res.json({
          token,
          role: dummyUser.role,
          provinceId,
          provinceName,
          demo: true,
        });
      }

      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  res.status(405).json({ error: "Method not allowed" });
}
