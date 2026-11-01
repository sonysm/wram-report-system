import type { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

export interface SystemNotification {
  id: string;
  type: "ALERT" | "FLOOD" | "SUBPROJECT" | "WEATHER" | "SYSTEM";
  severity: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";
  title: string;
  message: string;
  link?: string;
  timestamp: string;
  read?: boolean;
  provinceName?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const notifications: SystemNotification[] = [];

      // 1. Water Level Alerts (Stations reaching or exceeding warning levels)
      try {
        const warningReports = await prisma.stationReport.findMany({
          take: 5,
          orderBy: { reportDate: "desc" },
          include: {
            station: {
              include: { province: true },
            },
          },
        });

        for (const rep of warningReports) {
          const warnLevel = rep.station.warningLevel || 0;
          if (warnLevel > 0 && rep.waterLevel >= warnLevel) {
            notifications.push({
              id: `warn-station-${rep.id}`,
              type: "ALERT",
              severity: "CRITICAL",
              title: `ប្រកាសអាសន្នកម្ពស់ទឹក៖ ស្ថានីយ ${rep.station.khmerName || rep.station.name}`,
              message: `កម្ពស់ទឹកបច្ចុប្បន្ន ${rep.waterLevel.toFixed(2)}m បានឡើងដល់ ឬលើសកម្រិតប្រុងប្រយ័ត្ន (${warnLevel.toFixed(2)}m) នៅ${rep.station.province?.khmerName || ""}។`,
              link: "/station-reports",
              timestamp: rep.reportDate.toISOString(),
              provinceName: rep.station.province?.khmerName,
            });
          }
        }
      } catch (err) {
        console.warn("Could not query station warning alerts", err);
      }

      // 2. Recent Provincial Flood Reports
      try {
        const recentFloodReports = await prisma.provincialFloodReport.findMany({
          take: 4,
          orderBy: { reportDate: "desc" },
          include: {
            province: true,
          },
        });

        for (const f of recentFloodReports) {
          const totalDamaged = f.damagedRiceCrops || 0;
          if (f.affectedFamilies > 0 || totalDamaged > 0) {
            notifications.push({
              id: `flood-rep-${f.id}`,
              type: "FLOOD",
              severity: f.affectedFamilies > 50 ? "CRITICAL" : "WARNING",
              title: `របាយការណ៍ស្ថានភាពទឹកជំនន់៖ ${f.province.khmerName || f.province.name}`,
              message: `រងផលប៉ះពាល់ ${f.affectedFamilies.toLocaleString()} គ្រួសារ និងខូចខាតដំណាំស្រូវ ${totalDamaged.toFixed(1)} ហិកតា។`,
              link: "/flood-reports",
              timestamp: f.reportDate.toISOString(),
              provinceName: f.province.khmerName,
            });
          }
        }
      } catch (err) {
        console.warn("Could not query flood reports for notifications", err);
      }

      // 3. Subproject Research Concept Notes
      try {
        const recentSubprojects = await prisma.subprojectPlan.findMany({
          take: 4,
          orderBy: { updatedAt: "desc" },
          include: {
            province: true,
          },
        });

        for (const sp of recentSubprojects) {
          notifications.push({
            id: `subproj-${sp.id}`,
            type: "SUBPROJECT",
            severity: sp.status === "APPROVED" ? "SUCCESS" : "INFO",
            title: `សំណើអនុគម្រោង៖ ${sp.subprojectName}`,
            message: `អនុគម្រោងស្ថិតក្នុង${sp.province.khmerName || sp.province.name} ស្ថានភាព៖ ${sp.status === "APPROVED" ? "បានអនុម័ត" : sp.status === "UNDER_STUDY" ? "កំពុងសិក្សា" : "បានស្នើសុំ"}។`,
            link: "/subprojects",
            timestamp: sp.updatedAt.toISOString(),
            provinceName: sp.province.khmerName,
          });
        }
      } catch (err) {
        console.warn("Could not query subproject plans for notifications", err);
      }

      // 4. General System Announcement
      notifications.push({
        id: "system-welcome-notice",
        type: "SYSTEM",
        severity: "INFO",
        title: "ប្រព័ន្ធរាយការណ៍ និងគ្រប់គ្រងធនធានទឹក WRAM ដំណើរការផ្លូវការ",
        message: "សូមស្វាគមន៍មកកាន់ប្រព័ន្ធ WRAM សម្រាប់តាមដានរបាយការណ៍ទឹកភ្លៀង ស្ថានីយឧតុនិយម-ជលសាស្ត្រ និងផែនការអនុគម្រោង។",
        link: "/about",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      });

      // Filter by province if not admin
      let filtered = notifications;
      if (user.role !== "admin" && user.provinceName) {
        filtered = notifications.filter(
          (n) => !n.provinceName || n.provinceName === user.provinceName || n.type === "SYSTEM"
        );
      }

      // Sort by timestamp descending
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return res.status(200).json({
        notifications: filtered,
        total: filtered.length,
      });
    } catch (error: any) {
      console.error("Notifications fetch error:", error);
      return res.status(500).json({ error: error?.message || "Failed to fetch notifications" });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
