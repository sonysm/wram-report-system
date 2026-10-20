import React, { useState, useEffect, useMemo } from "react";

interface BasinData {
  id: number;
  code: string;
  name: string;
  khmerName: string;
  provinceId: number;
  mainRiverLengthKm: number;
  tributaryLengthKm: number;
  drySeasonCapacityHa: number;
  wetSeasonCapacityHa: number;
  avgParcelAreaHa: number;
  coordinateX: number;
  coordinateY: number;
  latitude: number;
  longitude: number;
  description: string;
  province?: { id: number; name: string; khmerName: string };
  hydraulicStructures: HydraulicStructure[];
  canals: Canal[];
  waterUserGroups: WaterUserGroup[];
  seasonalAllocations: SeasonalAllocation[];
  floodSurgeAlerts: FloodAlert[];
  inspectionTickets: InspectionTicket[];
  protectedZones: ProtectedZone[];
}

interface HydraulicStructure {
  id: number;
  code: string;
  name: string;
  khmerName: string;
  structureType: string;
  districtId: number | null;
  district?: { id: number; name: string; khmerName: string } | null;
  locationX: number | null;
  locationY: number | null;
  latitude: number | null;
  longitude: number | null;
  gateCount: number;
  currentGateOpeningPercent: number;
  currentDischargeM3s: number;
  maxDesignCapacityM3s: number;
  upstreamWaterLevelM: number;
  downstreamWaterLevelM: number;
  floodMitigationRole: boolean;
  status: string;
}

interface Canal {
  id: number;
  code: string;
  name: string;
  khmerName: string;
  parentStructureId: number | null;
  parentCanalId: number | null;
  canalType: string;
  lengthKm: number;
  designDischargeM3s: number;
  currentFlowM3s: number;
  conveyanceEfficiencyPercent: number;
  linedSectionKm: number;
  unlinedSectionKm: number;
  inspectionRoadCondition: string;
  liningIntegrityStatus: string;
  commandAreaHa: number;
  subCanals?: Canal[];
  parentStructure?: HydraulicStructure | null;
}

interface WaterUserGroup {
  id: number;
  code: string;
  name: string;
  khmerName: string;
  canalId: number | null;
  districtId: number | null;
  district?: { id: number; name: string; khmerName: string } | null;
  canal?: { id: number; code: string; name: string; khmerName: string; canalType?: string } | null;
  villageName: string | null;
  leaderName: string | null;
  leaderContact: string | null;
  totalFarmersCount: number;
  totalParcelAreaHa: number;
}

interface InflowTelemetryLog {
  id: number;
  structureId: number | null;
  structure?: { id: number; code: string; name: string; khmerName: string } | null;
  sourceOrigin: string;
  timestamp: string;
  dischargeM3s: number;
  gateOpeningPercent: number | null;
  waterLevelM: number;
  turbidityNtu: number | null;
  anomalyDetected: boolean;
  anomalyReason: string | null;
  notes: string | null;
}

interface SeasonalAllocation {
  id: number;
  seasonName: string;
  year: number;
  cropSeasonCode: string;
  plannedAreaHa: number;
  allocatedWaterM3: number;
  dispatchedWaterM3: number;
  openCanalSharePercent: number;
  pipeDistributionSharePercent: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface FloodAlert {
  id: number;
  alertLevel: string;
  sourceLocation: string;
  peakInflowM3s: number;
  diversionPlanKh: string;
  riskReductionPercent: number;
  gatesCoordinated: any;
  activeAlert: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

interface InspectionTicket {
  id: number;
  ticketNumber: string;
  canalId: number | null;
  structureId: number | null;
  canal?: { id: number; code: string; name: string; khmerName: string } | null;
  structure?: { id: number; code: string; name: string; khmerName: string } | null;
  assetType: string;
  defectCategory: string;
  severity: string;
  status: string;
  locationX: number | null;
  locationY: number | null;
  latitude: number | null;
  longitude: number | null;
  insideProtectedZone: boolean;
  protectedZoneName: string | null;
  safeguardValidationPassed: boolean;
  description: string;
  actionTaken: string | null;
  createdAt: string;
}

interface WaterDeliveryRequest {
  id: number;
  requestNumber: string;
  waterUserGroupId: number;
  waterUserGroup?: WaterUserGroup;
  requestType: string;
  requestedVolumeM3: number | null;
  requestedDischargeM3s: number | null;
  requestedDate: string;
  durationDays: number;
  cropType: string;
  parcelsCount: number;
  targetAreaHa: number;
  status: string;
  pdwramReviewNotes: string | null;
  createdAt: string;
}

interface IscBillingRecord {
  id: number;
  invoiceNumber: string;
  waterUserGroupId: number;
  waterUserGroup?: WaterUserGroup;
  seasonName: string;
  year: number;
  billingType: string;
  ratePerUnit: number;
  totalAreaHa: number;
  totalConsumptionM3: number | null;
  totalAmountKhr: number;
  paymentStatus: string;
  collectedAmountKhr: number;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
}

interface ProtectedZone {
  id: number;
  zoneName: string;
  zoneType: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  restrictionLevel: string;
  notes: string | null;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export default function StuengTmarPoukFeature() {
  const [activeTab, setActiveTab] = useState<"overview" | "telemetry" | "allocation" | "flood" | "assets" | "fwuc">("overview");
  const [roleView, setRoleView] = useState<"pdwram" | "district" | "fwuc">("pdwram");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Data
  const [basinData, setBasinData] = useState<BasinData | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<InflowTelemetryLog[]>([]);
  const [reachAnalytics, setReachAnalytics] = useState<any>(null);
  const [floodAlerts, setFloodAlerts] = useState<FloodAlert[]>([]);
  const [activeFloodAlert, setActiveFloodAlert] = useState<FloodAlert | null>(null);
  const [tickets, setTickets] = useState<InspectionTicket[]>([]);
  const [deliveryRequests, setDeliveryRequests] = useState<WaterDeliveryRequest[]>([]);
  const [billingRecords, setBillingRecords] = useState<IscBillingRecord[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);

  // Modals & Forms
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [safeguardWarning, setSafeguardWarning] = useState<string | null>(null);

  // Form States - Telemetry
  const [telemetryForm, setTelemetryForm] = useState({
    structureId: "",
    sourceOrigin: "STUENG_TMAR_POUK_MAIN",
    dischargeM3s: "18.5",
    gateOpeningPercent: "60",
    waterLevelM: "4.2",
    turbidityNtu: "28",
    notes: "",
  });

  // Form States - Ticket with Safeguard Coordinates
  const [ticketForm, setTicketForm] = useState({
    canalId: "",
    structureId: "",
    assetType: "CANAL",
    defectCategory: "LINING_INTEGRITY",
    severity: "MEDIUM",
    locationX: "289400",
    locationY: "1541200",
    latitude: "13.935",
    longitude: "103.045",
    description: "",
  });

  // Form States - Delivery Request
  const [requestForm, setRequestForm] = useState({
    waterUserGroupId: "",
    requestType: "WATER_DELIVERY",
    requestedVolumeM3: "40000",
    requestedDischargeM3s: "1.2",
    cropType: "WET_SEASON_RICE_S2",
    parcelsCount: "15",
    targetAreaHa: "75",
    durationDays: "3",
  });

  // Form States - Invoice
  const [invoiceForm, setInvoiceForm] = useState({
    waterUserGroupId: "",
    seasonName: "Season 2 (Oct-Dec)",
    year: "2026",
    billingType: "PER_HECTARE",
    ratePerUnit: "60000",
    totalAreaHa: "250",
    dueDate: "2026-12-31",
  });

  // Fetch sub-basin overview
  const loadOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load sub-basin overview");
      const json = await res.json();
      setBasinData(json.basin);
      setMetrics(json.metrics);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch telemetry
  const loadTelemetryData = async () => {
    try {
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk/telemetry", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTelemetryLogs(json.telemetryLogs || []);
        setReachAnalytics(json.reachAnalytics || null);
      }
    } catch (e) {
      console.error("Failed to load telemetry", e);
    }
  };

  // Fetch flood alerts
  const loadFloodData = async () => {
    try {
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk/flood-mitigation", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setFloodAlerts(json.alerts || []);
        setActiveFloodAlert(json.activeAlert || null);
      }
    } catch (e) {
      console.error("Failed to load flood data", e);
    }
  };

  // Fetch asset tickets
  const loadAssetData = async () => {
    try {
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk/assets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTickets(json.tickets || []);
      }
    } catch (e) {
      console.error("Failed to load assets", e);
    }
  };

  // Fetch FWUC & Billing
  const loadFwucData = async () => {
    try {
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk/fwuc-billing", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setDeliveryRequests(json.requests || []);
        setBillingRecords(json.billings || []);
        setFinancialSummary(json.financialSummary || null);
      }
    } catch (e) {
      console.error("Failed to load FWUC billing", e);
    }
  };

  useEffect(() => {
    loadOverviewData();
    loadTelemetryData();
    loadFloodData();
    loadAssetData();
    loadFwucData();
  }, []);

  // Submit Telemetry
  const handleTelemetrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk/telemetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(telemetryForm),
      });
      if (!res.ok) throw new Error("Failed to record telemetry");
      const json = await res.json();
      setShowTelemetryModal(false);
      loadTelemetryData();
      loadOverviewData();
      if (json.anomalyDetected) {
        alert(`⚠️ ANOMALY DETECTED: ${json.anomalyReason}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit Ticket with Environmental Safeguard Validation
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketForm),
      });
      if (!res.ok) throw new Error("Failed to submit ticket");
      const json = await res.json();
      setShowTicketModal(false);
      loadAssetData();
      loadOverviewData();
      if (json.safeguardAlert && json.safeguardAlert.triggered) {
        setSafeguardWarning(json.safeguardAlert.message);
      } else {
        alert("✅ បានកត់ត្រាប័ណ្ណអធិការកិច្ច O&M ដោយជោគជ័យ (បានឆ្លងកាត់ការត្រួតពិនិត្យសុវត្ថិភាពបរិស្ថាន)");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit Water Delivery Request
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk/fwuc-billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "CREATE_REQUEST",
          ...requestForm,
        }),
      });
      if (!res.ok) throw new Error("Failed to create request");
      setShowRequestModal(false);
      loadFwucData();
      alert("✅ បានបញ្ជូនសំណើសុំទឹកទៅកាន់មន្ទីរធនធានទឹក និងឧតុនិយមដោយជោគជ័យ");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Request Status (Approve)
  const handleApproveRequest = async (requestId: number) => {
    try {
      const token = getStoredToken();
      await fetch("/api/stueng-tmar-pouk/fwuc-billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "UPDATE_REQUEST_STATUS",
          requestId,
          status: "APPROVED",
          pdwramReviewNotes: "មន្ទីរធនធានទឹកបានអនុម័ត និងបញ្ជាបើកទ្វារទឹកតាមកាលវិភាគ។",
        }),
      });
      loadFwucData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit Invoice
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk/fwuc-billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "CREATE_INVOICE",
          ...invoiceForm,
        }),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      setShowInvoiceModal(false);
      loadFwucData();
      alert("✅ បានបង្កើតវិក្កយបត្រថ្លៃសេវាទឹក (ISC) ដោយជោគជ័យ");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Record Payment
  const handleRecordPayment = async (invoiceId: number, amount: number) => {
    try {
      const token = getStoredToken();
      await fetch("/api/stueng-tmar-pouk/fwuc-billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "RECORD_PAYMENT",
          invoiceId,
          paymentAmountKhr: amount,
        }),
      });
      loadFwucData();
      alert("✅ បានកត់ត្រាការទូទាត់ប្រាក់ថ្លៃទឹកដោយជោគជ័យ");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Execute Flood Diversion Protocol (80% risk reduction)
  const handleExecuteFloodDiversion = async () => {
    try {
      const token = getStoredToken();
      const res = await fetch("/api/stueng-tmar-pouk/flood-mitigation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "APPLY_DIVERSION_COORDINATION",
          coordinatedGates: [
            { code: "WEIR-TMP-01", gateOpening: 85 },
            { code: "WEIR-TMP-02", gateOpening: 70 },
            { code: "WEIR-TMP-04", gateOpening: 80 },
            { code: "CTRL-TMP-04", gateOpening: 95 },
            { code: "CTRL-TMP-08", gateOpening: 95 },
          ],
        }),
      });
      if (!res.ok) throw new Error("Failed to execute flood diversion");
      setShowEmergencyModal(false);
      loadFloodData();
      loadOverviewData();
      alert("⚡ បានបញ្ជាបើកទ្វារទឹកពង្វាង និងទ្វារដោះទឹកទាំងអស់ដោយជោគជ័យ! ការពារ និងកាត់បន្ថយគ្រោះទឹកជំនន់រហូតដល់ ៨០%");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Resolve Flood Alert
  const handleResolveAlert = async (alertId: number) => {
    try {
      const token = getStoredToken();
      await fetch("/api/stueng-tmar-pouk/flood-mitigation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "RESOLVE_ALERT",
          alertId,
        }),
      });
      loadFloodData();
      loadOverviewData();
      alert("✅ បានបិទបញ្ចប់ស្ថានភាពអាសន្នទឹកជំនន់");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center rounded-3xl border border-slate-200 bg-white/70 p-12 backdrop-blur-md shadow-sm">
        <div className="flex flex-col items-center gap-4 text-slate-600">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent" />
          <p className="text-sm font-medium">កំពុងទាញយកទិន្នន័យអនុប្រព័ន្ធស្ទឹងថ្មពួក (Loading Stueng Tmar Pouk Sub-basin)...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Safeguard Alert Banner */}
      {safeguardWarning && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/95 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900">បរិស្ថាន និងដែនជម្រកអភិរក្ស (Environmental & Protected Zone Safeguard Triggered)</h4>
              <p className="mt-1 text-xs text-rose-800 leading-relaxed">{safeguardWarning}</p>
            </div>
            <button
              onClick={() => setSafeguardWarning(null)}
              className="rounded-lg p-1 text-rose-600 hover:bg-rose-100 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Hero Header & Multi-Stakeholder Switcher */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-800/20 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 font-semibold text-cyan-300 border border-cyan-400/30">
                អនុប្រព័ន្ធធារាសាស្ត្រគំរូ (Sub-basin Extension)
              </span>
              <span className="rounded-full bg-blue-500/20 px-3 py-1 font-medium text-blue-200 border border-blue-400/20">
                ខេត្តបន្ទាយមានជ័យ (Banteay Meanchey)
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-mono text-emerald-300 border border-emerald-400/20">
                UTM: X=276528, Y=1549682
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-moul leading-tight">
              {basinData?.khmerName || "អនុប្រព័ន្ធធារាសាស្ត្រ និងគ្រប់គ្រងទឹកស្ទឹងថ្មពួក"}
            </h1>
            <p className="text-sm text-cyan-100/80 leading-relaxed">
              ប្រព័ន្ធគ្រប់គ្រង និងបែងចែកទឹកឆ្លងកាត់ស្រុកថ្មពួក ស្វាយចេក និងភ្នំស្រុក តាមដានលំហូរឆ្លងដែនពីប្រទេសថៃ និងខ្ពង់រាបឧត្តរមានជ័យ
              កាត់បន្ថយគ្រោះទឹកជំនន់រហូតដល់ ៨០% និងគ្រប់គ្រងថ្លៃសេវាទឹក (ISC) សកបទ។
            </p>
          </div>

          {/* Role-based Dashboard Switcher */}
          <div className="flex flex-col gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/15 lg:w-72 shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-200/90">
              ទិដ្ឋភាពតួនាទី (Role-Based View)
            </span>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setRoleView("pdwram")}
                className={`rounded-lg py-1.5 font-medium transition-all ${
                  roleView === "pdwram"
                    ? "bg-cyan-600 text-white shadow-sm font-semibold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="Provincial Department of Water Resources & Meteorology"
              >
                PDWRAM
              </button>
              <button
                type="button"
                onClick={() => setRoleView("district")}
                className={`rounded-lg py-1.5 font-medium transition-all ${
                  roleView === "district"
                    ? "bg-cyan-600 text-white shadow-sm font-semibold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="District Local Authorities (Tmar Pouk / Svay Chek / Phnum Srok)"
              >
                ស្រុក (District)
              </button>
              <button
                type="button"
                onClick={() => setRoleView("fwuc")}
                className={`rounded-lg py-1.5 font-medium transition-all ${
                  roleView === "fwuc"
                    ? "bg-cyan-600 text-white shadow-sm font-semibold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="Farmer Water User Community (សកបទ)"
              >
                សកបទ (FWUC)
              </button>
            </div>
            <p className="text-[11px] text-cyan-200/70">
              {roleView === "pdwram" && "🔹 ទិដ្ឋភាពមន្ទីរធនធានទឹកខេត្ត (គ្រប់គ្រងបច្ចេកទេស និងកាលវិភាគ)"}
              {roleView === "district" && "🔹 ទិដ្ឋភាពអាជ្ញាធរស្រុក (តាមដានផលប៉ះពាល់ និងការដោះទឹក)"}
              {roleView === "fwuc" && "🔹 ទិដ្ឋភាពថ្នាក់ដឹកនាំសកបទ (ស្នើសុំទឹក និងប្រមូលថ្លៃសេវា)"}
            </p>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-cyan-800/40 pt-5 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          <div className="rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <span className="text-cyan-300/80 font-medium">ទំនប់ពង្វាងទឹកមេ</span>
            <p className="text-lg font-bold text-white mt-0.5">{metrics?.weirCount || 4} កន្លែង</p>
            <span className="text-[10px] text-slate-300">សំណង់ពង្វាងឆ្លងស្ទឹង</span>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <span className="text-cyan-300/80 font-medium">សំណង់ចែកចាយទឹក</span>
            <p className="text-lg font-bold text-white mt-0.5">{metrics?.controlStructureCount || 16} កន្លែង</p>
            <span className="text-[10px] text-slate-300">ទ្វារទឹក និងស្ថានីយបូម</span>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <span className="text-cyan-300/80 font-medium">ប្រឡាយមេ (Main)</span>
            <p className="text-lg font-bold text-white mt-0.5">16 ខ្សែ <span className="text-xs font-normal">({metrics?.mainCanalLengthKm || 48} km)</span></p>
            <span className="text-[10px] text-slate-300">ផ្លូវអធិការកិច្ច ៤៨ គ.ម</span>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <span className="text-cyan-300/80 font-medium">ប្រឡាយរង & បំពង់</span>
            <p className="text-lg font-bold text-white mt-0.5">48 ខ្សែ <span className="text-xs font-normal">({metrics?.secondaryCanalLengthKm || 96} km)</span></p>
            <span className="text-[10px] text-slate-300">រួមបញ្ចូលបំពង់សម្ពាធ</span>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <span className="text-cyan-300/80 font-medium">ផ្ទៃដីស្រោចស្រព</span>
            <p className="text-lg font-bold text-white mt-0.5">5,000 / 30,000 ha</p>
            <span className="text-[10px] text-slate-300">ប្រាំង ៥ពាន់ / វស្សា ៣ម៉ឺន ហ.ត</span>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
            <span className="text-cyan-300/80 font-medium">ប្រសិទ្ធភាពបញ្ជូនទឹក</span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">{metrics?.avgConveyanceEfficiency || 86.4}%</p>
            <span className="text-[10px] text-slate-300">ស្ទឹង ៥៥ គ.ម + អូរ ២៤ គ.ម</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === "overview"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.53 3.22 3-3.22a.75.75 0 0 0 0-1.06l-3-3.22m-9.06 6.44-3-3.22a.75.75 0 0 1 0-1.06l3-3.22" />
          </svg>
          <span>ផែនទីជលសាស្ត្រ & គំនូសបំព្រួញ (Map & Schema)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("telemetry")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === "telemetry"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span>ជលសាស្ត្រ & តេឡេមេទ្រី (3.1 Telemetry)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("allocation")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === "allocation"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75" />
          </svg>
          <span>បែងចែកទឹក & កាលវិភាគដំណាំ (3.2 Allocation)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("flood")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === "flood"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
          </svg>
          <span>កាត់បន្ថយទឹកជំនន់ ៨០% (3.3 Flood Mitigation)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("assets")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === "assets"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233l2.844-2.844a2.652 2.652 0 00-3.75-3.75l-2.844 2.844m0 0l-3.328 3.328" />
          </svg>
          <span>សារពើពន្ធទ្រព្យ & O&M (3.4 Assets)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("fwuc")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === "fwuc"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6H2.25m0 0v12.75M3 6h15.75a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25H2.25" />
          </svg>
          <span>សកបទ & វិក្កយបត្រ ISC (3.5 FWUC Billing)</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & GEOSPATIAL MAP */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Interactive Geospatial Basin Map (Vector Schematic) */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ប្លង់ជលសាស្ត្រ និងបណ្តាញហេដ្ឋារចនាសម្ព័ន្ធស្ទឹងថ្មពួក (Sub-Basin Hydraulic Schematic)
                </h3>
                <p className="text-xs text-slate-500">
                  បង្ហាញប្រភពទឹកឆ្លងដែនថៃ ខ្ពង់រាបឧត្តរមានជ័យ ស្ទឹងមេ ៥៥ គ.ម អូររង ២៤ គ.ម ទំនប់ពង្វាងទាំង ៤ និងដែនជម្រកការពារធម្មជាតិ
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="h-3 w-3 rounded-full bg-blue-500 inline-block" /> ស្ទឹង & ប្រឡាយ
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="h-3 w-3 rounded-md bg-amber-500 inline-block" /> ទំនប់ពង្វាង (Weir)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="h-3 w-3 rounded-md bg-cyan-600 inline-block" /> សំណង់ចែកចាយ (CTRL)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-rose-700">
                  <span className="h-3 w-3 rounded-md bg-rose-200 border border-rose-400 inline-block" /> ដែនជម្រកការពារ (Safeguard)
                </span>
              </div>
            </div>

            {/* SVG Visual Map */}
            <div className="relative mt-4 h-96 w-full rounded-2xl bg-gradient-to-b from-sky-50/50 via-slate-50 to-emerald-50/30 p-2 overflow-hidden border border-slate-200/70">
              <svg viewBox="0 0 900 400" className="h-full w-full select-none">
                {/* Background Grid */}
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                  </pattern>
                  <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="50%" stopColor="#0369a1" />
                    <stop offset="100%" stopColor="#075985" />
                  </linearGradient>
                </defs>
                <rect width="900" height="400" fill="url(#grid)" />

                {/* Protected Forest Zone 1: Banteay Chhmar Protected Landscape */}
                <rect
                  x="480"
                  y="20"
                  width="220"
                  height="90"
                  rx="12"
                  fill="#ffe4e6"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
                <text x="495" y="45" fill="#9f1239" fontSize="11" fontWeight="bold">
                  🛡️ តំបន់ទេសភាពការពារបន្ទាយឆ្មារ
                </text>
                <text x="495" y="62" fill="#be123c" fontSize="9">
                  (Banteay Chhmar Protected Landscape)
                </text>
                <text x="495" y="78" fill="#e11d48" fontSize="8" fontWeight="600">
                  ហាមដាច់ខាតការរំលោភសាងសង់ (Strict Safeguard)
                </text>

                {/* Protected Forest Zone 2: Ang Trapeng Thmor Reserve */}
                <rect
                  x="640"
                  y="240"
                  width="230"
                  height="120"
                  rx="12"
                  fill="#e0f2fe"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
                <text x="655" y="265" fill="#0369a1" fontSize="11" fontWeight="bold">
                  🪶 តំបន់អភិរក្សសត្វក្រៀលអាងត្រពាំងថ្ម
                </text>
                <text x="655" y="282" fill="#0284c7" fontSize="9">
                  (Ang Trapeng Thmor Sarus Crane Reserve)
                </text>
                <text x="655" y="298" fill="#0369a1" fontSize="8">
                  អាងស្តុក និងដោះទឹកពង្វាង ៨០%
                </text>

                {/* Inflow Arrows */}
                {/* 1. Cross Border Thailand Inflow */}
                <path d="M 30 80 L 110 110" stroke="#0ea5e9" strokeWidth="4" strokeDasharray="6 3" />
                <circle cx="30" cy="80" r="5" fill="#0ea5e9" />
                <text x="20" y="65" fill="#0369a1" fontSize="10" fontWeight="bold">
                  🇹🇭 លំហូរឆ្លងដែនពីប្រទេសថៃ
                </text>
                <text x="20" y="105" fill="#0284c7" fontSize="8">
                  Q = 14.8 m³/s
                </text>

                {/* 2. Oddar Meanchey Plateau Runoff */}
                <path d="M 320 20 L 260 90" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 3" />
                <circle cx="320" cy="20" r="5" fill="#f59e0b" />
                <text x="290" y="15" fill="#b45309" fontSize="10" fontWeight="bold">
                  ⛰️ ខ្ពង់រាបឧត្តរមានជ័យ / ដងរែក
                </text>
                <text x="290" y="30" fill="#d97706" fontSize="8">
                  Q = 38.2 m³/s (Surge source)
                </text>

                {/* Main River Channel (55 km representation) */}
                <path
                  d="M 110 110 Q 180 120 250 115 T 390 170 T 520 220 T 680 270 T 820 310"
                  fill="none"
                  stroke="url(#riverGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <text x="380" y="155" fill="#ffffff" fontSize="9" fontWeight="bold">
                  ស្ទឹងថ្មពួកមេ (55 km Main River)
                </text>

                {/* Tributary Stream (24 km representation) */}
                <path
                  d="M 250 115 Q 260 210 320 280 T 420 340"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <text x="330" y="295" fill="#0284c7" fontSize="9" fontWeight="bold">
                  អូររងបែកខ្នែង (24 km Tributary)
                </text>

                {/* Main Canals (16 Main Canals Branches - 48 km) */}
                <path d="M 250 115 L 210 60" stroke="#10b981" strokeWidth="2.5" />
                <path d="M 250 115 L 180 170" stroke="#10b981" strokeWidth="2.5" />
                <path d="M 390 170 L 410 100" stroke="#10b981" strokeWidth="2.5" />
                <path d="M 390 170 L 370 240" stroke="#10b981" strokeWidth="2.5" />
                <path d="M 520 220 L 560 160" stroke="#10b981" strokeWidth="2.5" />
                <path d="M 520 220 L 510 300" stroke="#10b981" strokeWidth="2.5" />
                <path d="M 680 270 L 630 200" stroke="#10b981" strokeWidth="2.5" />
                <path d="M 680 270 L 670 350" stroke="#10b981" strokeWidth="2.5" />

                {/* Diversion Weirs (4 Key Control Structures) */}
                {/* Weir 1: Headworks Tmar Pouk */}
                <g className="cursor-pointer" onClick={() => setActiveTab("telemetry")}>
                  <rect x="235" y="100" width="30" height="30" rx="6" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
                  <text x="242" y="120" fill="#ffffff" fontSize="10" fontWeight="bold">W1</text>
                  <text x="210" y="95" fill="#78350f" fontSize="9" fontWeight="bold">WEIR-01 (ក្បាលស្ទឹង)</text>
                </g>

                {/* Weir 2: Central Svay Chek */}
                <g className="cursor-pointer" onClick={() => setActiveTab("telemetry")}>
                  <rect x="375" y="155" width="30" height="30" rx="6" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
                  <text x="382" y="175" fill="#ffffff" fontSize="10" fontWeight="bold">W2</text>
                  <text x="350" y="200" fill="#78350f" fontSize="9" fontWeight="bold">WEIR-02 (ស្វាយចេក)</text>
                </g>

                {/* Weir 3: Downstream Phnum Srok */}
                <g className="cursor-pointer" onClick={() => setActiveTab("telemetry")}>
                  <rect x="505" y="205" width="30" height="30" rx="6" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
                  <text x="512" y="225" fill="#ffffff" fontSize="10" fontWeight="bold">W3</text>
                  <text x="490" y="250" fill="#78350f" fontSize="9" fontWeight="bold">WEIR-03 (ភ្នំស្រុក)</text>
                </g>

                {/* Weir 4: Trapeang Thmor Reservoir Regulatory Weir */}
                <g className="cursor-pointer" onClick={() => setActiveTab("flood")}>
                  <rect x="665" y="255" width="30" height="30" rx="6" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
                  <text x="672" y="275" fill="#ffffff" fontSize="10" fontWeight="bold">W4</text>
                  <text x="670" y="245" fill="#78350f" fontSize="9" fontWeight="bold">WEIR-04 (ត្រពាំងថ្ម)</text>
                </g>

                {/* Distribution Control Structures (Sample of 16 points) */}
                <circle cx="210" cy="60" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="180" cy="170" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="410" cy="100" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="370" cy="240" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="560" cy="160" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="510" cy="300" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="630" cy="200" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="670" cy="350" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span className="font-mono">Geographic Center: 14°00'54" N, 102°55'55" E (UTM 48N: X=276528, Y=1549682)</span>
              <span className="font-medium text-cyan-800">
                គ្របដណ្តប់ ៣ ស្រុក៖ ថ្មពួក ({metrics?.mainCanalCount ? 6 : 6} ខ្សែ) • ស្វាយចេក (៥ ខ្សែ) • ភ្នំស្រុក (៥ ខ្សែ)
              </span>
            </div>
          </div>

          {/* District Breakdown & Technical Attributes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">ស្រុកថ្មពួក (Thma Puok)</h4>
                <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-800">
                  ក្បាលស្ទឹង Upstream
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                ទទួលលំហូរទឹកឆ្លងដែនថៃ និងទឹកហូរធ្លាក់ពីជួរភ្នំដងរែក។ ជាទីតាំងនៃទំនប់ក្បាលស្ទឹង WEIR-01 និងសំណង់ចែកចាយទឹកមេ CTRL 01-06។
              </p>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>ប្រឡាយមេ ៣ គ.ម x ៦ ខ្សែ:</span>
                  <span className="font-bold text-slate-900">១៨ គ.ម</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ផ្ទៃដីបញ្ជាស្រោចស្រព:</span>
                  <span className="font-bold text-slate-900">៩,២០០ ហ.ត</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ព្រំប្រទល់អភិរក្ស:</span>
                  <span className="font-semibold text-rose-600">ជាប់ដែនបន្ទាយឆ្មារ</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">ស្រុកស្វាយចេក (Svay Chek)</h4>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-800">
                  កណ្តាលស្ទឹង Mid-reach
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                ជាតំបន់ស្នូលនៃប្រព័ន្ធប្រឡាយមេ និងប្រឡាយរង។ មានទំនប់ពង្វាងកណ្តាល WEIR-02 និងបណ្តាញបំពង់ចែកចាយសម្ពាធទំនើប។
              </p>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>ប្រឡាយមេ ៣ គ.ម x ៥ ខ្សែ:</span>
                  <span className="font-bold text-slate-900">១៥ គ.ម</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ផ្ទៃដីបញ្ជាស្រោចស្រព:</span>
                  <span className="font-bold text-slate-900">១១,៥០០ ហ.ត</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>បណ្តាញបំពង់ចែកចាយ:</span>
                  <span className="font-semibold text-emerald-600">៤ ខ្សែសម្ពាធទំនើប</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">ស្រុកភ្នំស្រុក (Phnum Srok)</h4>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                  ចុងស្ទឹង Downstream
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                ភ្ជាប់ទៅអាងស្តុកទឹកត្រពាំងថ្ម។ ដើរតួនាទីយ៉ាងសំខាន់ក្នុងការដោះទឹកបញ្ចៀសទឹកជំនន់ និងស្តុកទឹកសម្រាប់ស្រោចស្រពរដូវប្រាំង។
              </p>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>ប្រឡាយមេ ៣ គ.ម x ៥ ខ្សែ:</span>
                  <span className="font-bold text-slate-900">១៥ គ.ម</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ផ្ទៃដីបញ្ជាស្រោចស្រព:</span>
                  <span className="font-bold text-slate-900">៩,៣០០ ហ.ត</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ការកាត់បន្ថយជំនន់:</span>
                  <span className="font-semibold text-cyan-700">រហូតដល់ ៨០%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HYDROLOGY & INFLOW TELEMETRY (Feature 3.1) */}
      {activeTab === "telemetry" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                ការតាមដានជលសាស្ត្រ និងតេឡេមេទ្រីលំហូរទឹក (Feature 3.1 Hydrology & Inflow Telemetry)
              </h3>
              <p className="text-xs text-slate-600">
                តាមដានកម្រិតបើកទ្វារទឹក និងបរិមាណបញ្ចេញ (Discharge Volume m³/s) នៅលើទំនប់ពង្វាងទាំង ៤ និងវិភាគការបាត់បង់ទឹកតាមស្ទឹង ៥៥ គ.ម
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTelemetryModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>កត់ត្រាទិន្នន័យតេឡេមេទ្រីថ្មី (Log Reading)</span>
            </button>
          </div>

          {/* 4 Diversion Weirs Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {basinData?.hydraulicStructures
              .filter((s) => s.structureType === "DIVERSION_WEIR")
              .map((weir) => (
                <div
                  key={weir.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-cyan-50 px-2 py-1 font-mono text-[11px] font-bold text-cyan-800">
                      {weir.code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        weir.status === "OPERATIONAL"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {weir.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{weir.khmerName}</h4>
                    <p className="text-[11px] text-slate-500">{weir.name}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>កម្រិតបើកទ្វារទឹក:</span>
                      <span className="font-bold text-cyan-700">{weir.currentGateOpeningPercent}% ({weir.gateCount} ទ្វារ)</span>
                    </div>
                    {/* Visual Progress Bar for Gate */}
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${weir.currentGateOpeningPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>បរិមាណបញ្ចេញទឹក (Discharge):</span>
                      <span className="font-bold text-slate-900">{weir.currentDischargeM3s} m³/s</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>សមត្ថភាពរចនាអតិបរមា:</span>
                      <span className="text-slate-500">{weir.maxDesignCapacityM3s} m³/s</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>កម្ពស់ទឹក ខាងលើ / ខាងក្រោម:</span>
                      <span className="font-semibold text-slate-800">{weir.upstreamWaterLevelM}m / {weir.downstreamWaterLevelM}m</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Reach & Flow Conveyance Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    វិភាគការបញ្ជូនទឹកស្ទឹងធំ ៥៥ គ.ម (Main River Conveyance)
                  </h4>
                  <p className="text-xs text-slate-500">ស្ទឹងថ្មពួកមេ ប្រវែង ៥៥ គីឡូម៉ែត្រ</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  {reachAnalytics?.mainRiver?.conveyanceEfficiencyPercent || 86.8}% Efficiency
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 rounded-2xl p-4">
                <div>
                  <span className="text-slate-500">លំហូរបច្ចុប្បន្ន</span>
                  <p className="text-base font-bold text-slate-900 mt-1">{reachAnalytics?.mainRiver?.currentFlowM3s || 75.5} m³/s</p>
                </div>
                <div>
                  <span className="text-slate-500">ការបាត់បង់ជ្រាប/រំហួត</span>
                  <p className="text-base font-bold text-amber-600 mt-1">{reachAnalytics?.mainRiver?.estimatedLossM3s || 9.1} m³/s</p>
                </div>
                <div>
                  <span className="text-slate-500">ស្ថានភាពលំហូរ</span>
                  <p className="text-base font-bold text-emerald-600 mt-1">OPTIMAL</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Conveyance efficiency ត្រូវបានគណនាតាមគំរូ seepage & evaporation អត្រា ~0.22%/km លើស្ទឹងធម្មជាតិ
                និងកាត់បន្ថយការបាត់បង់តាមរយៈសំណង់និយ័តកម្មកម្រិតទឹកទាំង ៤ កន្លែង។
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    វិភាគបណ្តាញអូររង ២៤ គ.ម (Tributary Flow Analytics)
                  </h4>
                  <p className="text-xs text-slate-500">បណ្តាញអូរ និងស្ទឹងបែកខ្នែង ២៤ គីឡូម៉ែត្រ</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  {reachAnalytics?.tributaries?.conveyanceEfficiencyPercent || 84.2}% Efficiency
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 rounded-2xl p-4">
                <div>
                  <span className="text-slate-500">លំហូរបច្ចុប្បន្ន</span>
                  <p className="text-base font-bold text-slate-900 mt-1">{reachAnalytics?.tributaries?.currentFlowM3s || 22.6} m³/s</p>
                </div>
                <div>
                  <span className="text-slate-500">ការបាត់បង់ជ្រាប/រំហួត</span>
                  <p className="text-base font-bold text-amber-600 mt-1">{reachAnalytics?.tributaries?.estimatedLossM3s || 3.5} m³/s</p>
                </div>
                <div>
                  <span className="text-slate-500">ស្ថានភាពលំហូរ</span>
                  <p className="text-base font-bold text-blue-600 mt-1">NORMAL</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                បណ្តាញអូររងទទួលទឹកពីតំបន់ខ្ពង់រាបជួរភ្នំដងរែក និងផ្ទេរទឹកទៅប្រឡាយរង ៤៨ ខ្សែ ដោយមានការត្រួតពិនិត្យជាតិល្អក់ (Turbidity)
                ដើម្បីទប់ស្កាត់ការកកស្ទះល្បាប់។
              </p>
            </div>
          </div>

          {/* Inflow Telemetry Logs & Anomaly Detection */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  កំណត់ហេតុ និងប្រព័ន្ធចាប់សញ្ញាលំហូរមិនប្រក្រតី (Cross-Border Inflow & Anomaly Logs)
                </h4>
                <p className="text-xs text-slate-500">
                  ស្វ័យប្រវត្តិកំណត់សញ្ញាព្រមាននៅពេលទឹកហូរពីប្រទេសថៃ ឬខ្ពង់រាបឧត្តរមានជ័យកើនឡើងលើសកម្រិតកំណត់
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {telemetryLogs.length} កំណត់ត្រា
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">កាលបរិច្ឆេទ & ម៉ោង</th>
                    <th className="px-4 py-3">ប្រភពលំហូរ (Source Origin)</th>
                    <th className="px-4 py-3">សំណង់ / ទំនប់</th>
                    <th className="px-4 py-3">លំហូរ (m³/s)</th>
                    <th className="px-4 py-3">កម្រិតទ្វារ (%)</th>
                    <th className="px-4 py-3">កម្ពស់ទឹក (m)</th>
                    <th className="px-4 py-3">ការចាប់សញ្ញា (Anomaly Status)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {telemetryLogs.map((log) => (
                    <tr key={log.id} className={log.anomalyDetected ? "bg-rose-50/60" : "hover:bg-slate-50"}>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString("km-KH")}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {log.sourceOrigin === "CROSS_BORDER_THAILAND" && "🇹🇭 ឆ្លងដែនថៃ (Thailand Inflow)"}
                        {log.sourceOrigin === "ODDAR_MEANCHEY_PLATEAU" && "⛰️ ខ្ពង់រាបឧត្តរមានជ័យ / ដងរែក"}
                        {log.sourceOrigin === "STUENG_TMAR_POUK_MAIN" && "ស្ទឹងថ្មពួកមេ (Main Stem)"}
                        {log.sourceOrigin === "TRIBUTARY" && "អូររងបែកខ្នែង (Tributary)"}
                      </td>
                      <td className="px-4 py-3">{log.structure?.khmerName || "ស្ថានីយស្ទង់ទឹក"}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{log.dischargeM3s} m³/s</td>
                      <td className="px-4 py-3">{log.gateOpeningPercent !== null ? `${log.gateOpeningPercent}%` : "-"}</td>
                      <td className="px-4 py-3">{log.waterLevelM} m</td>
                      <td className="px-4 py-3">
                        {log.anomalyDetected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800" title={log.anomalyReason || ""}>
                            ⚠️ កើនឡើងខុសប្រក្រតី (Surge Alert)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                            ✓ ប្រក្រតី (Normal)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULING & WATER ALLOCATION (Feature 3.2) */}
      {activeTab === "allocation" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                ការរៀបចំកាលវិភាគ និងបែងចែកទឹកតាមរដូវកាល (Feature 3.2 Multi-Season Allocation)
              </h3>
              <p className="text-xs text-slate-600">
                គណនាតុល្យភាពទឹកស្រោចស្រព ៥,០០០ ហ.ត (រដូវប្រាំង) ធៀបនឹង ៣០,០០០ ហ.ត (រដូវវស្សា) តម្រឹមតាមវដ្តស្រូវ និងបែងចែករវាងប្រឡាយបើក និងបំពង់សម្ពាធ
              </p>
            </div>
          </div>

          {/* Dynamic Scaling Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dry Season Scaling */}
            <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  រដូវប្រាំង (Dry Season Capacity Scaling)
                </span>
                <span className="text-xs font-mono text-amber-700">មករា - មេសា</span>
              </div>
              <div>
                <p className="text-xs text-slate-500">សមត្ថភាពស្រោចស្រពពង្រីក</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h4 className="text-3xl font-extrabold text-amber-900">5,000 ha</h4>
                  <span className="text-xs text-slate-500">(ពង្រីកពី ៣,០០០ ហ.ត ទៅ ៥,០០០ ហ.ត)</span>
                </div>
              </div>
              <div className="space-y-2 border-t border-amber-100 pt-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>ចំនួនកសិករទទួលផល (~5 ha/farmer):</span>
                  <span className="font-bold text-slate-900">1,000 គ្រួសារកសិករ</span>
                </div>
                <div className="flex justify-between">
                  <span>តម្រូវការទឹកសរុប (8,500 m³/ha):</span>
                  <span className="font-bold text-amber-800">42,500,000 m³</span>
                </div>
                <div className="flex justify-between">
                  <span>វិធីសាស្ត្របញ្ជូនទឹក (Dual Routing):</span>
                  <span className="font-semibold text-slate-800">បំពង់សម្ពាធ ៣០% + ប្រឡាយបេតុង ៧០%</span>
                </div>
              </div>
            </div>

            {/* Wet Season Scaling */}
            <div className="rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/50 via-white to-cyan-50/20 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
                  រដូវវស្សា (Wet Season Capacity Scaling)
                </span>
                <span className="text-xs font-mono text-cyan-700">មេសា - ធ្នូ</span>
              </div>
              <div>
                <p className="text-xs text-slate-500">សមត្ថភាពស្រោចស្រពពេញលេញ</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h4 className="text-3xl font-extrabold text-cyan-900">30,000 ha</h4>
                  <span className="text-xs text-slate-500">(ពង្រីកពី ២៤,០០០ ហ.ត ទៅ ៣០,០០០ ហ.ត)</span>
                </div>
              </div>
              <div className="space-y-2 border-t border-cyan-100 pt-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>ចំនួនកសិករទទួលផល (~5 ha/farmer):</span>
                  <span className="font-bold text-slate-900">6,000 គ្រួសារកសិករ</span>
                </div>
                <div className="flex justify-between">
                  <span>តម្រូវការទឹកសរុប (7,000 m³/ha):</span>
                  <span className="font-bold text-cyan-800">210,000,000 m³</span>
                </div>
                <div className="flex justify-between">
                  <span>វិធីសាស្ត្របញ្ជូនទឹក (Dual Routing):</span>
                  <span className="font-semibold text-slate-800">ប្រឡាយមេ/រង ៧៥% + បំពង់ចែកចាយ ២៥%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bi-annual Cropping Calendar Alignment */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              កាលវិភាគដាំដុះស្រូវ ២ លើកក្នុងមួយឆ្នាំ (Bi-Annual Rice Cropping Calendar Integration)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">🌾 រដូវទី១ (Season 1: April to July)</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    មេសា ដល់ កក្កដា
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  ស្រូវដើមរដូវវស្សា (ស្រូវស្រាលមិនប្រកាន់រដូវ) និងដំណាំរួមផ្សំសាច់ប្រាក់។ ការផ្គត់ផ្គង់ទឹកត្រូវបានផ្តល់អាទិភាពដើម្បីរៀបចំដី និងពន្លកស្រូវមុនពេលភ្លៀងធ្លាក់ជោកជាំ។
                </p>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  គោលដៅស្រោចស្រព៖ <strong>១៤,០០០ ហិកតា</strong> • ទឹកបញ្ចេញ៖ <strong>៩៤,៥០០,០០០ m³</strong>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">🌾 រដូវទី២ (Season 2: October to December)</span>
                  <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold text-cyan-800">
                    តុលា ដល់ ធ្នូ
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  ស្រូវរដូវវស្សាធ្ងន់ និងស្រូវដេញទឹក (Recession Rice)។ ការបញ្ជាទ្វារទឹកពង្វាងដើម្បីស្តុកទឹកពេញអាងត្រពាំងថ្ម និងបញ្ជូនទឹកបំពេញដំណាក់កាលបែកគុម្ព និងចេញកួរ។
                </p>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  គោលដៅស្រោចស្រព៖ <strong>៣០,០០០ ហិកតា</strong> • ទឹកបញ្ចេញ៖ <strong>១៣៥,០០០,០០០ m³</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Dual Conveyance Routing */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              ការគ្រប់គ្រងការបញ្ជូនទឹកទ្វេ (Dual Conveyance: Open Canals vs Pressurized Pipe Networks)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl border border-slate-200 p-4">
                <span className="font-bold text-slate-800">១. ប្រឡាយមេ និងប្រឡាយរងបើកចំហ (Open Canal Network)</span>
                <p className="mt-1 text-slate-500 leading-relaxed">
                  ប្រឡាយមេ ១៦ ខ្សែ (៤៨ គ.ម) និងប្រឡាយរង ៤៨ ខ្សែ (៩៦ គ.ម) សម្រាប់បញ្ជូនទឹកទំនាញដីទ្រង់ទ្រាយធំ ៧៥% នៃផ្ទៃដី។
                </p>
                <div className="mt-3 flex items-center justify-between text-slate-700 bg-slate-50 p-2 rounded-xl">
                  <span>ចំណែកបែងចែកទឹក:</span>
                  <span className="font-bold text-cyan-700">75% (Open Canals)</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <span className="font-bold text-slate-800">២. បណ្តាញបំពង់ចែកចាយសម្ពាធ & ទំនាញ (Modern Pipe Distribution)</span>
                <p className="mt-1 text-slate-500 leading-relaxed">
                  បំពង់ក្រោមដីតភ្ជាប់ពីសំណង់គ្រប់គ្រងទំនើប សម្រាប់ស្រោចស្រពក្បាលដីខ្ពស់ និងដំណាំសាច់ប្រាក់ ប្រសិទ្ធភាពបញ្ជូន ៩៦% (គ្មានការជ្រាប/រំហួត)។
                </p>
                <div className="mt-3 flex items-center justify-between text-slate-700 bg-slate-50 p-2 rounded-xl">
                  <span>ចំណែកបែងចែកទឹក:</span>
                  <span className="font-bold text-emerald-700">25% (Pipe Networks)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FLOOD RISK MITIGATION (Feature 3.3) */}
      {activeTab === "flood" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                ការកាត់បន្ថយគ្រោះទឹកជំនន់ និងការដោះទឹក (Feature 3.3 Flood Mitigation & Drainage)
              </h3>
              <p className="text-xs text-slate-600">
                ប្រព័ន្ធចាប់សញ្ញាជំនន់រហ័សពីខ្ពង់រាប និងការបញ្ជាពង្វាងតាមទំនប់ទាំង ៤ និងទ្វារដោះទឹក ដើម្បីសម្រេចការកាត់បន្ថយគ្រោះទឹកជំនន់រហូតដល់ ៨០%
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <span>បញ្ជាពង្វាងទឹកជំនន់បន្ទាន់ (Emergency Diversion)</span>
            </button>
          </div>

          {/* Active Flood Alert Banner */}
          {activeFloodAlert ? (
            <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white animate-pulse">
                      {activeFloodAlert.alertLevel}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      ការប្រកាសអាសន្នទឹកជំនន់រហ័សពីខ្ពង់រាប (Flash Surge Detection)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700">
                    ប្រភពលំហូរ៖ <strong>{activeFloodAlert.sourceLocation}</strong> | លំហូរកំពូល (Peak Inflow)៖{" "}
                    <strong>{activeFloodAlert.peakInflowM3s} m³/s</strong>
                  </p>
                  <p className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-amber-200 mt-2">
                    💡 ផែនការប្រតិបត្តិការ៖ {activeFloodAlert.diversionPlanKh}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm">
                    កាត់បន្ថយជំនន់ {activeFloodAlert.riskReductionPercent}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleResolveAlert(activeFloodAlert.id)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    បិទបញ្ចប់ការប្រកាសអាសន្ន (Resolve)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 text-xs text-emerald-800 flex items-center gap-3">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>ស្ថានភាពជលសាស្ត្រស្ថិតក្នុងកម្រិតសុវត្ថិភាព។ គ្មានការព្រមានទឹកជំនន់ពីខ្ពង់រាបឧត្តរមានជ័យ ឬប្រទេសថៃនៅពេលនេះទេ។</span>
            </div>
          )}

          {/* Operational Coordination Strategy Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              យន្តការសម្របសម្រួលពង្វាងទឹក ៨០% (80% Flood Risk Reduction Mechanism)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900">ជំហាន ១: ចាប់សញ្ញាដើមទី</div>
                <p className="text-slate-500">
                  ស្ថានីយស្ទង់ជលសាស្ត្រព្រំដែនថៃ និងខ្ពង់រាបដងរែក ជូនដំណឹងលំហូរលើស ៤០ m³/s មុនពេលទឹកជំនន់មកដល់ ៤ ម៉ោង។
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900">ជំហាន ២: បើកទ្វារពង្វាង WEIR-01</div>
                <p className="text-slate-500">
                  បើកទ្វារទឹក ៨៥% នៅក្បាលស្ទឹងថ្មពួក ដើម្បីពង្វាងបរិមាណទឹកលើស ៦០ m³/s ចេញពីតំបន់លំនៅដ្ឋានស្រុកថ្មពួក។
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900">ជំហាន ៣: បញ្ជូនទៅអាងត្រពាំងថ្ម</div>
                <p className="text-slate-500">
                  និយ័តកម្មតាម WEIR-04 បញ្ជូនទឹកចូលអាងត្រពាំងថ្ម ដែលមានសមត្ថភាពស្តុកទឹកធំ ដើម្បីរក្សាទុកប្រើប្រាស់ក្នុងរដូវប្រាំង។
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900">ជំហាន ៤: បើកទ្វារដោះទឹក CTRL</div>
                <p className="text-slate-500">
                  បើកទ្វារដោះទឹក CTRL-04, 08, 12, 16 សម្រេចការការពារផលដំណាំ និងភូមិឋានរហូតដល់ ៨០% នៃផ្ទៃរងគ្រោះ។
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ASSET INVENTORY & O&M TICKETING (Feature 3.4 & Safeguards) */}
      {activeTab === "assets" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                សារពើពន្ធទ្រព្យសម្បត្តិ & ប្រតិបត្តិការថែទាំ O&M (Feature 3.4 Asset Hierarchy & Safeguards)
              </h3>
              <p className="text-xs text-slate-600">
                តភ្ជាប់ខ្សែប្រឡាយមេ ១៦ ខ្សែ (៤៨ គ.ម) និងប្រឡាយរង ៤៨ ខ្សែ (៩៦ គ.ម) ទៅនឹងសំណង់ពង្វាងមេ ព្រមទាំងត្រួតពិនិត្យសុវត្ថិភាពព្រៃការពារបរិស្ថាន
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTicketModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>ចេញប័ណ្ណត្រួតពិនិត្យ O&M (Log Inspection Ticket)</span>
            </button>
          </div>

          {/* Environmental Safeguard Policy Card */}
          <div className="rounded-3xl border border-emerald-300 bg-emerald-50/70 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🛡️</span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-900">
                  វិធានការការពារព្រំប្រទល់បរិស្ថាន និងដែនជម្រកធម្មជាតិ (Geographic & Environmental Safeguards)
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  ប្រព័ន្ធមានកូអរដោនេកំណត់ដែនជម្រក <strong>តំបន់ទេសភាពការពារបន្ទាយឆ្មារ</strong> (Banteay Chhmar Protected Landscape)
                  និង <strong>តំបន់អភិរក្សសត្វក្រៀលអាងត្រពាំងថ្ម</strong>។ រាល់សំណើ ឬប័ណ្ណការងារដែលស្ថិតនៅក្នុងកូអរដោនេការពារ
                  នឹងត្រូវបានប្រព័ន្ធត្រួតពិនិត្យ និងបដិសេធស្វ័យប្រវត្តិ (Geospatial Validation Enforced)។
                </p>
              </div>
            </div>
          </div>

          {/* Asset Hierarchy Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500">កម្រិតទី ១: សំណង់ពង្វាងមេ (Level 1)</span>
              <h4 className="text-xl font-bold text-slate-900">៤ ទំនប់ពង្វាងឆ្លងស្ទឹង</h4>
              <p className="text-xs text-slate-500">
                WEIR-01 (ថ្មពួក) • WEIR-02 (ស្វាយចេក) • WEIR-03 (ភ្នំស្រុក) • WEIR-04 (ត្រពាំងថ្ម)
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500">កម្រិតទី ២: ប្រឡាយមេ (Level 2)</span>
              <h4 className="text-xl font-bold text-slate-900">១៦ ខ្សែ (សរុប ៤៨ គ.ម)</h4>
              <p className="text-xs text-slate-500">
                MC-01 ដល់ MC-16 (ប្រវែង ៣ គ.ម ក្នុង ១ ខ្សែ) ផ្លូវអធិការកិច្ច ៤៨ គ.ម
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500">កម្រិតទី ៣: ប្រឡាយរង & បំពង់ (Level 3)</span>
              <h4 className="text-xl font-bold text-slate-900">៤៨ ខ្សែ (សរុប ៩៦ គ.ម)</h4>
              <p className="text-xs text-slate-500">
                SC-01 ដល់ SC-48 (ប្រវែង ២ គ.ម ក្នុង ១ ខ្សែ) រួមទាំងបណ្តាញបំពង់សម្ពាធ
              </p>
            </div>
          </div>

          {/* O&M Inspection Tickets Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  បញ្ជីប័ណ្ណត្រួតពិនិត្យគុណភាព និងការខូចខាត (Condition & Defect Logging Tickets)
                </h4>
                <p className="text-xs text-slate-500">
                  តាមដានស្នាមប្រេះបេតុងបាតប្រឡាយ ការបាក់ច្រាំង និងស្ថានភាពផ្លូវអធិការកិច្ច
                </p>
              </div>
              <span className="text-xs text-slate-500">សរុប {tickets.length} ប័ណ្ណ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">លេខប័ណ្ណ</th>
                    <th className="px-4 py-3">ទ្រព្យសម្បត្តិ</th>
                    <th className="px-4 py-3">ប្រភេទបញ្ហា</th>
                    <th className="px-4 py-3">កម្រិតហានិភ័យ</th>
                    <th className="px-4 py-3">សុវត្ថិភាពបរិស្ថាន (Safeguard)</th>
                    <th className="px-4 py-3">ស្ថានភាព</th>
                    <th className="px-4 py-3">សកម្មភាពដោះស្រាយ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.ticketNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {t.canal?.khmerName || t.structure?.khmerName || t.assetType}
                      </td>
                      <td className="px-4 py-3">
                        {t.defectCategory === "LINING_INTEGRITY" && "បេតុងបាតប្រឡាយ (Lining Integrity)"}
                        {t.defectCategory === "BANK_EROSION" && "បាក់ច្រាំង (Bank Erosion)"}
                        {t.defectCategory === "ROAD_DAMAGE" && "ខូចផ្លូវអធិការកិច្ច (Road Damage)"}
                        {t.defectCategory === "GATE_LEAKAGE" && "ជ្រាបទឹកទ្វារទឹក (Gate Leakage)"}
                        {t.defectCategory === "SEDIMENTATION" && "កកស្ទះល្បាប់ (Sedimentation)"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            t.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800"
                              : t.severity === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {t.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {t.insideProtectedZone ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            ⛔ រំលោភដែនអភិរក្ស ({t.protectedZoneName?.split(" ")[0]})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            ✓ ឆ្លងកាត់ការត្រួតពិនិត្យ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            t.status === "REJECTED_PROTECTED_ZONE"
                              ? "bg-rose-100 text-rose-800 font-bold"
                              : t.status === "WORK_ORDER_APPROVED"
                              ? "bg-cyan-100 text-cyan-800"
                              : t.status === "REPAIRED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={t.actionTaken || t.description}>
                        {t.actionTaken || t.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FWUC COMMUNITY & ISC BILLING (Feature 3.5) */}
      {activeTab === "fwuc" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                សហគមន៍កសិករប្រើប្រាស់ទឹក (សកបទ) & ការប្រមូលថ្លៃទឹក ISC (Feature 3.5 FWUC & Billing)
              </h3>
              <p className="text-xs text-slate-600">
                ស្នើសុំបញ្ជូនទឹក រាយការណ៍ការរអាក់រអួល និងគណនាថ្លៃសេវាទឹក (ISC) ដោយផ្អែកលើក្បាលដីស្តង់ដារ ៥ ហ.ត ក្នុង ១ គ្រួសារ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>ស្នើសុំទឹក / រាយការណ៍រអាក់រអួល (Delivery Request)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>ចេញវិក្កយបត្រ ISC ថ្មី</span>
              </button>
            </div>
          </div>

          {/* Financial Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs text-slate-500">ទំហំក្បាលដីស្តង់ដារ (Standard Parcel)</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">~5 ha / គ្រួសារ</p>
              <span className="text-[11px] text-slate-400">ជាមធ្យមក្នុង ១ គ្រួសារកសិករ</span>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs text-slate-500">សរុបទឹកប្រាក់វិក្កយបត្រ (Invoiced)</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {((financialSummary?.totalInvoicedKhr || 0) / 1000000).toFixed(1)} លានរៀល
              </p>
              <span className="text-[11px] text-slate-400">អត្រា ៦០,០០០ ៛/ហ.ត (~$15)</span>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs text-slate-500">ប្រមូលបានជាក់ស្តែង (Collected)</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {((financialSummary?.totalCollectedKhr || 0) / 1000000).toFixed(1)} លានរៀល
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">
                អត្រាប្រមូល {financialSummary?.collectionPercentage || 0}%
              </span>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs text-slate-500">នៅសល់មិនទាន់ទូទាត់ (Pending)</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {((financialSummary?.totalOutstandingKhr || 0) / 1000000).toFixed(1)} លានរៀល
              </p>
              <span className="text-[11px] text-amber-600">រង់ចាំរដូវប្រមូលផល</span>
            </div>
          </div>

          {/* Water User Groups (FWUC Units) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              សហគមន៍ និងក្រុមអ្នកប្រើប្រាស់ទឹកតាមបណ្តាញស្ទឹងថ្មពួក (FWUC Units Inventory)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {basinData?.waterUserGroups.map((wug) => (
                <div key={wug.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800">
                      {wug.code}
                    </span>
                    <span className="text-[10px] text-slate-500">{wug.villageName}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900">{wug.khmerName}</h5>
                  <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-200 pt-2">
                    <div className="flex justify-between">
                      <span>ប្រធានក្រុម៖</span>
                      <span className="font-semibold">{wug.leaderName || "លោក សុខ"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>កសិករសមាជិក៖</span>
                      <span className="font-bold text-slate-900">{wug.totalFarmersCount} គ្រួសារ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ផ្ទៃដីដាំដុះសរុប៖</span>
                      <span className="font-bold text-cyan-700">{wug.totalParcelAreaHa} ហ.ត</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ប្រឡាយតភ្ជាប់៖</span>
                      <span className="font-mono text-slate-700">{wug.canal?.code || "MC-01"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Water Delivery Requests Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              សំណើសុំផ្គត់ផ្គង់ទឹក និងរបាយការណ៍រអាក់រអួល (Delivery Requests & Disruptions)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">លេខសំណើ</th>
                    <th className="px-4 py-3">ក្រុមអ្នកប្រើប្រាស់ទឹក (សកបទ)</th>
                    <th className="px-4 py-3">ប្រភេទសំណើ</th>
                    <th className="px-4 py-3">ក្បាលដី / ផ្ទៃដី</th>
                    <th className="px-4 py-3">បរិមាណស្នើសុំ</th>
                    <th className="px-4 py-3">ស្ថានភាព</th>
                    <th className="px-4 py-3">សកម្មភាពមន្ទីរ (PDWRAM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveryRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{req.requestNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{req.waterUserGroup?.khmerName}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-800">
                          {req.requestType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {req.parcelsCount} ក្បាលដី ({req.targetAreaHa} ហ.ត)
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {req.requestedVolumeM3?.toLocaleString()} m³ ({req.requestedDischargeM3s} m³/s)
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "DELIVERING"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {req.status === "PENDING" && roleView === "pdwram" ? (
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(req.id)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                          >
                            អនុម័តបញ្ជូនទឹក
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">{req.pdwramReviewNotes || "បានដំណើរការ"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ISC Billing Invoices Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              បញ្ជីវិក្កយបត្រថ្លៃសេវាទឹក (Irrigation Service Charge - ISC Records)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">លេខវិក្កយបត្រ</th>
                    <th className="px-4 py-3">ក្រុមអ្នកប្រើប្រាស់ទឹក (FWUC)</th>
                    <th className="px-4 py-3">រដូវកាល</th>
                    <th className="px-4 py-3">ផ្ទៃដីដាំដុះ (ha)</th>
                    <th className="px-4 py-3">ទឹកប្រាក់សរុប (៛)</th>
                    <th className="px-4 py-3">បានបង់ (៛)</th>
                    <th className="px-4 py-3">ស្ថានភាពទូទាត់</th>
                    <th className="px-4 py-3">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billingRecords.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{inv.waterUserGroup?.khmerName}</td>
                      <td className="px-4 py-3">{inv.seasonName} ({inv.year})</td>
                      <td className="px-4 py-3">{inv.totalAreaHa} ហ.ត</td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {inv.totalAmountKhr.toLocaleString()} ៛
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        {inv.collectedAmountKhr.toLocaleString()} ៛
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            inv.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.paymentStatus === "PARTIALLY_PAID"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inv.paymentStatus !== "PAID" ? (
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = inv.totalAmountKhr - inv.collectedAmountKhr;
                              handleRecordPayment(inv.id, remaining);
                            }}
                            className="rounded-lg bg-cyan-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-cyan-700"
                          >
                            កត់ត្រាបង់ប្រាក់
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">✓ រួចរាល់</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Telemetry Modal */}
      {showTelemetryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">កត់ត្រាទិន្នន័យតេឡេមេទ្រី & សំណង់ពង្វាង</h4>
              <button onClick={() => setShowTelemetryModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleTelemetrySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">ប្រភពលំហូរ (Inflow Source)</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                  value={telemetryForm.sourceOrigin}
                  onChange={(e) => setTelemetryForm({ ...telemetryForm, sourceOrigin: e.target.value })}
                >
                  <option value="CROSS_BORDER_THAILAND">🇹🇭 លំហូរឆ្លងដែនពីប្រទេសថៃ (Thailand Inflow)</option>
                  <option value="ODDAR_MEANCHEY_PLATEAU">⛰️ ទឹកហូរពីខ្ពង់រាបឧត្តរមានជ័យ / ដងរែក (Plateau Runoff)</option>
                  <option value="STUENG_TMAR_POUK_MAIN">ស្ទឹងថ្មពួកមេ (Main Channel 55 km)</option>
                  <option value="TRIBUTARY">ស្ទឹង និងអូររងបែកខ្នែង (Tributaries 24 km)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">សំណង់ពង្វាងទឹក (Weir Structure)</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                  value={telemetryForm.structureId}
                  onChange={(e) => setTelemetryForm({ ...telemetryForm, structureId: e.target.value })}
                >
                  <option value="">-- ជ្រើសរើសសំណង់ --</option>
                  {basinData?.hydraulicStructures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.khmerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">បរិមាណលំហូរ (m³/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={telemetryForm.dischargeM3s}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, dischargeM3s: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">កម្រិតបើកទ្វារទឹក (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={telemetryForm.gateOpeningPercent}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, gateOpeningPercent: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">កម្ពស់ទឹកខាងលើ (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={telemetryForm.waterLevelM}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, waterLevelM: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">កម្រិតល្អក់ (NTU)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={telemetryForm.turbidityNtu}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, turbidityNtu: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">កំណត់សម្គាល់ (Notes)</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                  value={telemetryForm.notes}
                  onChange={(e) => setTelemetryForm({ ...telemetryForm, notes: e.target.value })}
                  placeholder="ឧ. ទឹកហូរស្របតាមកាលវិភាគ ឬកើនឡើងបន្ទាប់ពីភ្លៀងធ្លាក់"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTelemetryModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700"
                >
                  កត់ត្រាទិន្នន័យ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Inspection Ticket Modal with Safeguard Verification */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">
                ចេញប័ណ្ណត្រួតពិនិត្យ O&M (និងផ្ទៀងផ្ទាត់សុវត្ថិភាពបរិស្ថាន)
              </h4>
              <button onClick={() => setShowTicketModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleTicketSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">ប្រភេទហេដ្ឋារចនាសម្ព័ន្ធ</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={ticketForm.assetType}
                    onChange={(e) => setTicketForm({ ...ticketForm, assetType: e.target.value })}
                  >
                    <option value="CANAL">ប្រឡាយទឹក (Canal)</option>
                    <option value="WEIR">ទំនប់ពង្វាង (Diversion Weir)</option>
                    <option value="CONTROL_STRUCTURE">សំណង់ចែកចាយ (Control Structure)</option>
                    <option value="PIPE_NETWORK">បណ្តាញបំពង់សម្ពាធ (Pipe Network)</option>
                    <option value="INSPECTION_ROAD">ផ្លូវអធិការកិច្ច (Inspection Road)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">ប្រភេទការខូចខាត (Defect Category)</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={ticketForm.defectCategory}
                    onChange={(e) => setTicketForm({ ...ticketForm, defectCategory: e.target.value })}
                  >
                    <option value="LINING_INTEGRITY">បេតុងបាតប្រឡាយ (Lining Integrity)</option>
                    <option value="BANK_EROSION">បាក់ច្រាំង (Bank Erosion)</option>
                    <option value="ROAD_DAMAGE">ខូចខាតផ្លូវអធិការកិច្ច (Road Damage)</option>
                    <option value="GATE_LEAKAGE">ជ្រាបទឹកទ្វារទឹក (Gate Leakage)</option>
                    <option value="SEDIMENTATION">កកស្ទះល្បាប់ (Sedimentation)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">កម្រិតហានិភ័យ (Severity)</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={ticketForm.severity}
                    onChange={(e) => setTicketForm({ ...ticketForm, severity: e.target.value })}
                  >
                    <option value="LOW">កម្រិតទាប (Low)</option>
                    <option value="MEDIUM">មធ្យម (Medium)</option>
                    <option value="HIGH">ខ្ពស់ (High)</option>
                    <option value="CRITICAL">បន្ទាន់ខ្លាំង (Critical)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">ប្រឡាយពាក់ព័ន្ធ</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={ticketForm.canalId}
                    onChange={(e) => setTicketForm({ ...ticketForm, canalId: e.target.value })}
                  >
                    <option value="">-- ជ្រើសរើសប្រឡាយ --</option>
                    {basinData?.canals.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}: {c.khmerName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates with Safeguard Test Alert */}
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px]">
                  📍 ទីតាំងភូមិសាស្ត្រ (សម្រាប់ផ្ទៀងផ្ទាត់ជាមួយដែនជម្រកអភិរក្ស)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500">UTM X</label>
                    <input
                      type="number"
                      className="mt-0.5 w-full rounded-lg border border-slate-300 p-2 text-xs"
                      value={ticketForm.locationX}
                      onChange={(e) => setTicketForm({ ...ticketForm, locationX: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">UTM Y</label>
                    <input
                      type="number"
                      className="mt-0.5 w-full rounded-lg border border-slate-300 p-2 text-xs"
                      value={ticketForm.locationY}
                      onChange={(e) => setTicketForm({ ...ticketForm, locationY: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  សាកល្បង៖ ប្រសិនបើបញ្ចូលទីតាំងនៅក្នុងតំបន់បន្ទាយឆ្មារ (X=295000, Y=1565000) ប្រព័ន្ធនឹងបដិសេធដោយស្វ័យប្រវត្តិ។
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700">ការពិពណ៌នាបញ្ហា (Description)</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                  rows={3}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="រៀបរាប់ពីស្ថានភាពខូចខាតជាក់ស្តែង..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700"
                >
                  បញ្ជូនប័ណ្ណត្រួតពិនិត្យ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delivery Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">ស្នើសុំផ្គត់ផ្គង់ទឹក / រាយការណ៍ការរអាក់រអួល</h4>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">ក្រុមអ្នកប្រើប្រាស់ទឹក (សកបទ / WUG)</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                  value={requestForm.waterUserGroupId}
                  onChange={(e) => setRequestForm({ ...requestForm, waterUserGroupId: e.target.value })}
                  required
                >
                  <option value="">-- ជ្រើសរើសក្រុម --</option>
                  {basinData?.waterUserGroups.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code}: {w.khmerName} ({w.villageName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">ប្រភេទសំណើ</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={requestForm.requestType}
                    onChange={(e) => setRequestForm({ ...requestForm, requestType: e.target.value })}
                  >
                    <option value="WATER_DELIVERY">ស្នើសុំបើកទឹកស្រោចស្រព (Water Delivery)</option>
                    <option value="SERVICE_DISRUPTION">រាយការណ៍រអាក់រអួល (Disruption Report)</option>
                    <option value="CANAL_MAINTENANCE">ស្នើសុំស្តារប្រឡាយ (Canal Maintenance)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">ប្រភេទដំណាំ</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={requestForm.cropType}
                    onChange={(e) => setRequestForm({ ...requestForm, cropType: e.target.value })}
                  >
                    <option value="WET_SEASON_RICE_S2">ស្រូវរដូវវស្សាទី២ (Season 2 Rice)</option>
                    <option value="EARLY_WET_RICE_S1">ស្រូវដើមរដូវវស្សាទី១ (Season 1 Rice)</option>
                    <option value="DRY_SEASON_RICE">ស្រូវរដូវប្រាំង (Dry Season Rice)</option>
                    <option value="CASH_CROP">ដំណាំរួមផ្សំសាច់ប្រាក់ (Cash Crop)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">ចំនួនក្បាលដី</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={requestForm.parcelsCount}
                    onChange={(e) => setRequestForm({ ...requestForm, parcelsCount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">ផ្ទៃដីសរុប (ha)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={requestForm.targetAreaHa}
                    onChange={(e) => setRequestForm({ ...requestForm, targetAreaHa: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">រយៈពេល (ថ្ងៃ)</label>
                  <input
                    type="number"
                    min="1"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={requestForm.durationDays}
                    onChange={(e) => setRequestForm({ ...requestForm, durationDays: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">បរិមាណទឹកប៉ាន់ស្មាន (m³)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={requestForm.requestedVolumeM3}
                    onChange={(e) => setRequestForm({ ...requestForm, requestedVolumeM3: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">លំហូរត្រូវការ (m³/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={requestForm.requestedDischargeM3s}
                    onChange={(e) => setRequestForm({ ...requestForm, requestedDischargeM3s: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700"
                >
                  បញ្ជូនសំណើសុំទឹក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">ចេញវិក្កយបត្រថ្លៃសេវាទឹក (ISC Billing)</h4>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleInvoiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">ក្រុមអ្នកប្រើប្រាស់ទឹក (សកបទ)</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                  value={invoiceForm.waterUserGroupId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, waterUserGroupId: e.target.value })}
                  required
                >
                  <option value="">-- ជ្រើសរើសក្រុម --</option>
                  {basinData?.waterUserGroups.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code}: {w.khmerName} ({w.totalParcelAreaHa} ha)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">រដូវកាល</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={invoiceForm.seasonName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, seasonName: e.target.value })}
                  >
                    <option value="Season 2 (Oct-Dec)">រដូវទី២ (Season 2: Oct-Dec)</option>
                    <option value="Season 1 (Apr-Jul)">រដូវទី១ (Season 1: Apr-Jul)</option>
                    <option value="Dry Season">រដូវប្រាំង (Dry Season)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">ឆ្នាំ</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={invoiceForm.year}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, year: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">ផ្ទៃដីគិតថ្លៃ (ហិកតា)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={invoiceForm.totalAreaHa}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAreaHa: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">អត្រាគិតថ្លៃ (រៀល/ហ.ត)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5"
                    value={invoiceForm.ratePerUnit}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, ratePerUnit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-900 border border-cyan-200">
                <span className="font-bold">ទឹកប្រាក់សរុបប៉ាន់ស្មាន៖ </span>
                <span className="text-base font-extrabold text-cyan-800">
                  {(parseFloat(invoiceForm.totalAreaHa || "0") * parseFloat(invoiceForm.ratePerUnit || "0")).toLocaleString()} ៛
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2 font-bold text-white hover:bg-cyan-700"
                >
                  ចេញវិក្កយបត្រ ISC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Emergency Diversion Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border-2 border-rose-300 space-y-4">
            <div className="flex items-center gap-3 border-b border-rose-100 pb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md">
                ⚡
              </div>
              <div>
                <h4 className="text-base font-bold text-rose-900">
                  បញ្ជាបើកពង្វាងទឹកជំនន់បន្ទាន់ (80% Risk Reduction Protocol)
                </h4>
                <p className="text-xs text-rose-700">សម្របសម្រួលទ្វារទឹកពង្វាង និងទ្វារដោះទឹកទាំងអស់ដោយស្វ័យប្រវត្តិ</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              ប្រព័ន្ធនឹងបញ្ជាបើកទ្វារទឹកពង្វាងនៅទំនប់ក្បាលស្ទឹង <strong>WEIR-TMP-01</strong> ដល់ ៨៥%,
              <strong>WEIR-TMP-04</strong> (អាងត្រពាំងថ្ម) ដល់ ៨០% និងទ្វារដោះទឹក <strong>CTRL-04, 08</strong> ដល់ ៩៥%។
              វិធានការនេះនឹងកាត់បន្ថយគ្រោះទឹកជំនន់រហូតដល់ <strong>៨០%</strong> លើភូមិឋាន និងផលដំណាំ។
            </p>

            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-mono">
                <span>WEIR-TMP-01 (Headworks):</span>
                <span className="font-bold text-rose-600">85% Gate Opening</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>WEIR-TMP-04 (Trapeng Thmor Intake):</span>
                <span className="font-bold text-rose-600">80% Gate Opening</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>CTRL-TMP-04 & CTRL-TMP-08 (Drainage):</span>
                <span className="font-bold text-rose-600">95% Full Spillway</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleExecuteFloodDiversion}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-md"
              >
                អនុវត្តការបញ្ជាបន្ទាន់ភ្លាមៗ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
