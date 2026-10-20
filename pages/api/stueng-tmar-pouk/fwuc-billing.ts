import type { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const basin = await prisma.basin.findFirst({
    where: { code: "BASIN-TMP-01" },
  });

  if (!basin) {
    return res.status(404).json({ error: "Stueng Tmar Pouk Sub-basin not found." });
  }

  if (req.method === "GET") {
    try {
      const { groupId } = req.query;

      // 1. Water User Groups (FWUC Units)
      const whereWug: any = { basinId: basin.id };
      if (groupId) whereWug.id = parseInt(String(groupId), 10);

      const waterUserGroups = await prisma.waterUserGroup.findMany({
        where: whereWug,
        include: {
          district: { select: { id: true, name: true, khmerName: true } },
          canal: { select: { id: true, code: true, name: true, khmerName: true, canalType: true } },
          fwuc: { select: { id: true, name: true } },
        },
        orderBy: { code: "asc" },
      });

      // 2. Delivery & Disruption Requests
      const requests = await prisma.waterDeliveryRequest.findMany({
        where: {
          waterUserGroup: { basinId: basin.id },
        },
        include: {
          waterUserGroup: {
            select: { id: true, code: true, name: true, khmerName: true, villageName: true, leaderName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // 3. ISC Billing Records
      const billings = await prisma.iscBillingRecord.findMany({
        where: {
          waterUserGroup: { basinId: basin.id },
        },
        include: {
          waterUserGroup: {
            select: { id: true, code: true, name: true, khmerName: true, villageName: true, totalFarmersCount: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Financial aggregation
      const totalInvoicedKhr = billings.reduce((sum, b) => sum + b.totalAmountKhr, 0);
      const totalCollectedKhr = billings.reduce((sum, b) => sum + b.collectedAmountKhr, 0);
      const totalOutstandingKhr = totalInvoicedKhr - totalCollectedKhr;

      return res.status(200).json({
        waterUserGroups,
        requests,
        billings,
        financialSummary: {
          totalInvoicedKhr,
          totalCollectedKhr,
          totalOutstandingKhr,
          collectionPercentage: totalInvoicedKhr ? +((totalCollectedKhr / totalInvoicedKhr) * 100).toFixed(1) : 0,
          standardParcelAreaHa: basin.avgParcelAreaHa, // 5 ha
        },
      });
    } catch (error: any) {
      console.error("FWUC Billing error:", error);
      return res.status(500).json({ error: error?.message || "Failed to fetch FWUC billing data" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      const { action } = data;

      // Action 1: Create Water Delivery Request or Service Disruption
      if (action === "CREATE_REQUEST") {
        const {
          waterUserGroupId,
          requestType,
          requestedVolumeM3,
          requestedDischargeM3s,
          durationDays,
          cropType,
          parcelsCount,
          targetAreaHa,
        } = data;

        if (!waterUserGroupId || !requestType) {
          return res.status(400).json({ error: "Missing required request fields" });
        }

        const count = await prisma.waterDeliveryRequest.count();
        const requestNumber = `REQ-TMP-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

        const newReq = await prisma.waterDeliveryRequest.create({
          data: {
            requestNumber,
            waterUserGroupId: parseInt(String(waterUserGroupId), 10),
            requestType,
            requestedVolumeM3: requestedVolumeM3 ? parseFloat(String(requestedVolumeM3)) : null,
            requestedDischargeM3s: requestedDischargeM3s ? parseFloat(String(requestedDischargeM3s)) : null,
            requestedDate: new Date(),
            durationDays: durationDays ? parseInt(String(durationDays), 10) : 3,
            cropType: cropType || "EARLY_WET_RICE",
            parcelsCount: parcelsCount ? parseInt(String(parcelsCount), 10) : 10,
            targetAreaHa: targetAreaHa ? parseFloat(String(targetAreaHa)) : 50.0,
            status: "PENDING",
          },
        });

        return res.status(201).json({ success: true, request: newReq });
      }

      // Action 2: Update Request Status (PDWRAM / FWUC approval)
      if (action === "UPDATE_REQUEST_STATUS") {
        const { requestId, status, pdwramReviewNotes } = data;
        const updated = await prisma.waterDeliveryRequest.update({
          where: { id: parseInt(String(requestId), 10) },
          data: {
            status,
            pdwramReviewNotes: pdwramReviewNotes || null,
          },
        });
        return res.status(200).json({ success: true, request: updated });
      }

      // Action 3: Create ISC Billing Invoice
      if (action === "CREATE_INVOICE") {
        const {
          waterUserGroupId,
          seasonName,
          year,
          billingType,
          ratePerUnit,
          totalAreaHa,
          totalConsumptionM3,
          dueDate,
          notes,
        } = data;

        const wug = await prisma.waterUserGroup.findUnique({
          where: { id: parseInt(String(waterUserGroupId), 10) },
        });

        if (!wug) {
          return res.status(404).json({ error: "Water user group not found" });
        }

        const count = await prisma.iscBillingRecord.count();
        const invoiceNumber = `INV-TMP-${year || new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

        const area = totalAreaHa ? parseFloat(String(totalAreaHa)) : wug.totalParcelAreaHa;
        const rate = ratePerUnit ? parseFloat(String(ratePerUnit)) : 60000.0; // 60,000 KHR / ha
        const amount = (billingType === "CONSUMPTION_M3" && totalConsumptionM3)
          ? parseFloat(String(totalConsumptionM3)) * rate
          : area * rate;

        const invoice = await prisma.iscBillingRecord.create({
          data: {
            invoiceNumber,
            waterUserGroupId: wug.id,
            seasonName: seasonName || "Season 1 (Apr-Jul)",
            year: year ? parseInt(String(year), 10) : new Date().getFullYear(),
            billingType: billingType || "PER_HECTARE",
            ratePerUnit: rate,
            totalAreaHa: area,
            totalConsumptionM3: totalConsumptionM3 ? parseFloat(String(totalConsumptionM3)) : null,
            totalAmountKhr: amount,
            paymentStatus: "UNPAID",
            collectedAmountKhr: 0,
            dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
            notes: notes || null,
          },
        });

        return res.status(201).json({ success: true, invoice });
      }

      // Action 4: Record ISC Payment Collection
      if (action === "RECORD_PAYMENT") {
        const { invoiceId, paymentAmountKhr } = data;
        const existing = await prisma.iscBillingRecord.findUnique({
          where: { id: parseInt(String(invoiceId), 10) },
        });

        if (!existing) {
          return res.status(404).json({ error: "Invoice not found" });
        }

        const newCollected = existing.collectedAmountKhr + parseFloat(String(paymentAmountKhr));
        let newStatus = "PARTIALLY_PAID";
        if (newCollected >= existing.totalAmountKhr) {
          newStatus = "PAID";
        }

        const updated = await prisma.iscBillingRecord.update({
          where: { id: existing.id },
          data: {
            collectedAmountKhr: newCollected,
            paymentStatus: newStatus,
            paidAt: newStatus === "PAID" ? new Date() : existing.paidAt,
          },
        });

        return res.status(200).json({ success: true, invoice: updated });
      }

      return res.status(400).json({ error: "Unknown action" });
    } catch (error: any) {
      console.error("FWUC Billing action error:", error);
      return res.status(500).json({ error: error?.message || "Failed to process FWUC action" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
