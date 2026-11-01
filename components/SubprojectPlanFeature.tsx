import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  provinceId: number | null;
  provinceName: string | null;
}

interface ProvinceOption {
  id: number;
  name: string;
  khmerName: string;
  code?: string | null;
  sortOrder?: number | null;
}

interface DistrictOption {
  id: number;
  name: string;
  khmerName: string;
  provinceId: number;
}

interface CommuneOption {
  id: number;
  name: string;
  khmerName: string;
  districtId: number | null;
  provinceId: number;
}

export interface SubprojectPlanItem {
  id: number;
  subprojectCode: string | null;
  subprojectName: string;
  subprojectEnglishName: string | null;
  provinceId: number;
  districtId: number | null;
  communeId: number | null;
  userId: number | null;
  status: "DRAFT" | "PROPOSED" | "UNDER_STUDY" | "APPROVED" | "COMPLETED" | string;

  // Chapter 1
  riverBasinName: string;
  coordinateX: number | null;
  coordinateY: number | null;
  latitude: number | null;
  longitude: number | null;
  keyLocationsDescription: string | null;

  // Chapter 2
  catchmentRainfallSource: string | null;
  mainRiverLengthKm: number | null;
  tributaryLengthKm: number | null;
  existingDrySeasonAreaHa: number | null;
  existingWetSeasonAreaHa: number | null;
  postProjectDrySeasonAreaHa: number | null;
  postProjectWetSeasonAreaHa: number | null;
  avgLandPerPersonHa: number | null;
  basinOverviewDescription: string | null;
  basinPlannedInvestments: string | null;
  riverBasinCommitteeStatus: string | null;

  // Chapter 3
  proposedComponentsSummary: string | null;
  riverRestorationLengthKm: number | null;
  streamRestorationLengthKm: number | null;
  weirsCount: number | null;
  distributionStructuresCount: number | null;
  mainCanalsCount: number | null;
  mainCanalsLengthKm: number | null;
  secondaryCanalsCount: number | null;
  secondaryCanalsLengthKm: number | null;
  commandAreaEstimateHa: number | null;
  pastOrOngoingStudies: string | null;

  // Chapter 4
  existingInfraDescription: string | null;
  existingCanalsCondition: string | null;
  existingReservoirsCondition: string | null;
  existingDrainageCondition: string | null;
  existingFloodEmbankments: string | null;
  existingRoadsCondition: string | null;
  otherExistingInfra: string | null;

  // Chapter 5
  climateDescription: string | null;
  soilAndTopography: string | null;
  surfaceWaterResources: string | null;
  groundwaterResources: string | null;
  landUseDescription: string | null;
  cropPatternAndSeasonality: string | null;
  farmSizeAndTenure: string | null;
  fwucStatusAndInstitutions: string | null;
  farmingPracticesAndPumping: string | null;

  // Chapter 6
  subprojectRationale: string | null;
  constraintsAddressed: string | null;
  expectedBenefits: string | null;
  integrationIntoBasinPlan: string | null;

  // Chapter 7
  modernizationCanalDistribution: string | null;
  pipeDistributionSystems: string | null;
  floodManagementDrainage: string | null;
  inspectionAccessRoads: string | null;
  managementEquipmentFacilities: string | null;
  agriculturalSupportServices: string | null;
  institutionalSustainabilityOandM: string | null;

  // Chapter 8
  totalEstimatedCostUsd: number | null;
  costPerHectareUsd: number | null;
  costBreakdownMajorItems: string | null;
  pumpingLiftMeters: number | null;
  pumpingDischargeLs: number | null;

  // Chapter 9
  stakeholderConsultationsDetails: string | null;
  farmerInterestHighValueCrops: string | null;
  farmerInterestModernization: string | null;
  farmerFwucWillingness: string | null;
  majorFarmerBenefits: string | null;

  // Chapter 10
  resettlementImpacts: string | null;
  lossOfAssetsImpacts: string | null;
  environmentalImpactsProtection: string | null;
  safeguardMitigationMeasures: string | null;

  // Attachments
  mapRiverBasinNotes: string | null;
  schematicRiverBasinNotes: string | null;
  mapSubprojectNotes: string | null;
  additionalAttachmentsNotes: string | null;

  createdAt: string;
  updatedAt: string;
  province?: ProvinceOption;
  district?: DistrictOption | null;
  commune?: CommuneOption | null;
  user?: { id: number; username: string } | null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export default function SubprojectPlanFeature() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const isAdmin = currentUser?.role === "admin";
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [communes, setCommunes] = useState<CommuneOption[]>([]);
  const [plans, setPlans] = useState<SubprojectPlanItem[]>([]);

  // Navigation / views
  const [currentView, setCurrentView] = useState<"list" | "form" | "view">("list");
  const [activeFormTab, setActiveFormTab] = useState<number>(1);
  const [selectedPlan, setSelectedPlan] = useState<SubprojectPlanItem | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Filters
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Loading & statuses
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const [authError, setAuthError] = useState<string>("");

  const printRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    subprojectCode: "",
    subprojectName: "",
    subprojectEnglishName: "",
    provinceId: "",
    districtId: "",
    communeId: "",
    status: "PROPOSED",

    // Chapter 1
    riverBasinName: "",
    coordinateX: "",
    coordinateY: "",
    latitude: "",
    longitude: "",
    keyLocationsDescription: "",

    // Chapter 2
    catchmentRainfallSource: "",
    mainRiverLengthKm: "",
    tributaryLengthKm: "",
    existingDrySeasonAreaHa: "",
    existingWetSeasonAreaHa: "",
    postProjectDrySeasonAreaHa: "",
    postProjectWetSeasonAreaHa: "",
    avgLandPerPersonHa: "",
    basinOverviewDescription: "",
    basinPlannedInvestments: "",
    riverBasinCommitteeStatus: "",

    // Chapter 3
    proposedComponentsSummary: "",
    riverRestorationLengthKm: "",
    streamRestorationLengthKm: "",
    weirsCount: "",
    distributionStructuresCount: "",
    mainCanalsCount: "",
    mainCanalsLengthKm: "",
    secondaryCanalsCount: "",
    secondaryCanalsLengthKm: "",
    commandAreaEstimateHa: "",
    pastOrOngoingStudies: "",

    // Chapter 4
    existingInfraDescription: "",
    existingCanalsCondition: "",
    existingReservoirsCondition: "",
    existingDrainageCondition: "",
    existingFloodEmbankments: "",
    existingRoadsCondition: "",
    otherExistingInfra: "",

    // Chapter 5
    climateDescription: "",
    soilAndTopography: "",
    surfaceWaterResources: "",
    groundwaterResources: "",
    landUseDescription: "",
    cropPatternAndSeasonality: "",
    farmSizeAndTenure: "",
    fwucStatusAndInstitutions: "",
    farmingPracticesAndPumping: "",

    // Chapter 6
    subprojectRationale: "",
    constraintsAddressed: "",
    expectedBenefits: "",
    integrationIntoBasinPlan: "",

    // Chapter 7
    modernizationCanalDistribution: "",
    pipeDistributionSystems: "",
    floodManagementDrainage: "",
    inspectionAccessRoads: "",
    managementEquipmentFacilities: "",
    agriculturalSupportServices: "",
    institutionalSustainabilityOandM: "",

    // Chapter 8
    totalEstimatedCostUsd: "",
    costPerHectareUsd: "",
    costBreakdownMajorItems: "",
    pumpingLiftMeters: "",
    pumpingDischargeLs: "",

    // Chapter 9
    stakeholderConsultationsDetails: "",
    farmerInterestHighValueCrops: "",
    farmerInterestModernization: "",
    farmerFwucWillingness: "",
    majorFarmerBenefits: "",

    // Chapter 10
    resettlementImpacts: "",
    lossOfAssetsImpacts: "",
    environmentalImpactsProtection: "",
    safeguardMitigationMeasures: "",

    // Attachments
    mapRiverBasinNotes: "",
    schematicRiverBasinNotes: "",
    mapSubprojectNotes: "",
    additionalAttachmentsNotes: "",
  });

  const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // Initial fetch
  useEffect(() => {
    const loadInitialData = async () => {
      const token = getToken();
      if (!token) {
        setAuthError("សូមចូលគណនីជាមុនសិន (Please login first).");
        setIsLoading(false);
        return;
      }

      try {
        const userRes = await fetch("/api/me", { headers: authHeaders(token) });
        if (!userRes.ok) throw new Error("Session expired.");
        const user: CurrentUser = await userRes.json();
        setCurrentUser(user);

        // Fetch provinces
        const provRes = await fetch("/api/provinces", { headers: authHeaders(token) });
        if (provRes.ok) {
          const provData = await provRes.json();
          const list = provData.provinces || provData;
          setProvinces(list);
        }

        // Set initial province for non-admin
        if (user.role !== "admin" && user.provinceId) {
          setSelectedProvinceFilter(String(user.provinceId));
          setFormData((prev) => ({ ...prev, provinceId: String(user.provinceId) }));
          void fetchDistricts(String(user.provinceId));
        }

        await fetchPlans(token, user.role === "admin" ? "all" : String(user.provinceId || ""));
      } catch (err: any) {
        setAuthError(err?.message || "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const fetchPlans = async (token?: string, provinceFilter?: string) => {
    const t = token || getToken();
    if (!t) return;
    try {
      let url = "/api/subprojects?";
      if (provinceFilter && provinceFilter !== "all") {
        url += `provinceId=${provinceFilter}&`;
      }
      const res = await fetch(url, { headers: authHeaders(t) });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (e) {
      console.error("Failed to fetch subproject plans:", e);
    }
  };

  const fetchDistricts = async (pId: string) => {
    if (!pId) {
      setDistricts([]);
      return;
    }
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/districts?provinceId=${pId}`, { headers: authHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setDistricts(data.districts || data || []);
      }
    } catch (err) {
      console.error("Failed to load districts", err);
    }
  };

  const fetchCommunes = async (dId: string) => {
    if (!dId) {
      setCommunes([]);
      return;
    }
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/communes?districtId=${dId}`, { headers: authHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setCommunes(data.communes || data || []);
      }
    } catch (err) {
      console.error("Failed to load communes", err);
    }
  };

  const handleProvinceFilterChange = (pId: string) => {
    setSelectedProvinceFilter(pId);
    void fetchPlans(undefined, pId);
  };

  const handleFormProvinceChange = (pId: string) => {
    setFormData((prev) => ({ ...prev, provinceId: pId, districtId: "", communeId: "" }));
    setDistricts([]);
    setCommunes([]);
    if (pId) void fetchDistricts(pId);
  };

  const handleFormDistrictChange = (dId: string) => {
    setFormData((prev) => ({ ...prev, districtId: dId, communeId: "" }));
    setCommunes([]);
    if (dId) void fetchCommunes(dId);
  };

  const resetForm = () => {
    setFormData({
      subprojectCode: "",
      subprojectName: "",
      subprojectEnglishName: "",
      provinceId: !isAdmin && currentUser?.provinceId ? String(currentUser.provinceId) : "",
      districtId: "",
      communeId: "",
      status: "PROPOSED",
      riverBasinName: "",
      coordinateX: "",
      coordinateY: "",
      latitude: "",
      longitude: "",
      keyLocationsDescription: "",
      catchmentRainfallSource: "",
      mainRiverLengthKm: "",
      tributaryLengthKm: "",
      existingDrySeasonAreaHa: "",
      existingWetSeasonAreaHa: "",
      postProjectDrySeasonAreaHa: "",
      postProjectWetSeasonAreaHa: "",
      avgLandPerPersonHa: "",
      basinOverviewDescription: "",
      basinPlannedInvestments: "",
      riverBasinCommitteeStatus: "",
      proposedComponentsSummary: "",
      riverRestorationLengthKm: "",
      streamRestorationLengthKm: "",
      weirsCount: "",
      distributionStructuresCount: "",
      mainCanalsCount: "",
      mainCanalsLengthKm: "",
      secondaryCanalsCount: "",
      secondaryCanalsLengthKm: "",
      commandAreaEstimateHa: "",
      pastOrOngoingStudies: "",
      existingInfraDescription: "",
      existingCanalsCondition: "",
      existingReservoirsCondition: "",
      existingDrainageCondition: "",
      existingFloodEmbankments: "",
      existingRoadsCondition: "",
      otherExistingInfra: "",
      climateDescription: "",
      soilAndTopography: "",
      surfaceWaterResources: "",
      groundwaterResources: "",
      landUseDescription: "",
      cropPatternAndSeasonality: "",
      farmSizeAndTenure: "",
      fwucStatusAndInstitutions: "",
      farmingPracticesAndPumping: "",
      subprojectRationale: "",
      constraintsAddressed: "",
      expectedBenefits: "",
      integrationIntoBasinPlan: "",
      modernizationCanalDistribution: "",
      pipeDistributionSystems: "",
      floodManagementDrainage: "",
      inspectionAccessRoads: "",
      managementEquipmentFacilities: "",
      agriculturalSupportServices: "",
      institutionalSustainabilityOandM: "",
      totalEstimatedCostUsd: "",
      costPerHectareUsd: "",
      costBreakdownMajorItems: "",
      pumpingLiftMeters: "",
      pumpingDischargeLs: "",
      stakeholderConsultationsDetails: "",
      farmerInterestHighValueCrops: "",
      farmerInterestModernization: "",
      farmerFwucWillingness: "",
      majorFarmerBenefits: "",
      resettlementImpacts: "",
      lossOfAssetsImpacts: "",
      environmentalImpactsProtection: "",
      safeguardMitigationMeasures: "",
      mapRiverBasinNotes: "",
      schematicRiverBasinNotes: "",
      mapSubprojectNotes: "",
      additionalAttachmentsNotes: "",
    });
    setEditingId(null);
    setActiveFormTab(1);
    setMessage("");
    setStatusType("");
  };

  const handleEditClick = (plan: SubprojectPlanItem) => {
    setEditingId(plan.id);
    setFormData({
      subprojectCode: plan.subprojectCode || "",
      subprojectName: plan.subprojectName || "",
      subprojectEnglishName: plan.subprojectEnglishName || "",
      provinceId: String(plan.provinceId || ""),
      districtId: plan.districtId ? String(plan.districtId) : "",
      communeId: plan.communeId ? String(plan.communeId) : "",
      status: plan.status || "PROPOSED",
      riverBasinName: plan.riverBasinName || "",
      coordinateX: plan.coordinateX !== null ? String(plan.coordinateX) : "",
      coordinateY: plan.coordinateY !== null ? String(plan.coordinateY) : "",
      latitude: plan.latitude !== null ? String(plan.latitude) : "",
      longitude: plan.longitude !== null ? String(plan.longitude) : "",
      keyLocationsDescription: plan.keyLocationsDescription || "",
      catchmentRainfallSource: plan.catchmentRainfallSource || "",
      mainRiverLengthKm: plan.mainRiverLengthKm !== null ? String(plan.mainRiverLengthKm) : "",
      tributaryLengthKm: plan.tributaryLengthKm !== null ? String(plan.tributaryLengthKm) : "",
      existingDrySeasonAreaHa: plan.existingDrySeasonAreaHa !== null ? String(plan.existingDrySeasonAreaHa) : "",
      existingWetSeasonAreaHa: plan.existingWetSeasonAreaHa !== null ? String(plan.existingWetSeasonAreaHa) : "",
      postProjectDrySeasonAreaHa: plan.postProjectDrySeasonAreaHa !== null ? String(plan.postProjectDrySeasonAreaHa) : "",
      postProjectWetSeasonAreaHa: plan.postProjectWetSeasonAreaHa !== null ? String(plan.postProjectWetSeasonAreaHa) : "",
      avgLandPerPersonHa: plan.avgLandPerPersonHa !== null ? String(plan.avgLandPerPersonHa) : "",
      basinOverviewDescription: plan.basinOverviewDescription || "",
      basinPlannedInvestments: plan.basinPlannedInvestments || "",
      riverBasinCommitteeStatus: plan.riverBasinCommitteeStatus || "",
      proposedComponentsSummary: plan.proposedComponentsSummary || "",
      riverRestorationLengthKm: plan.riverRestorationLengthKm !== null ? String(plan.riverRestorationLengthKm) : "",
      streamRestorationLengthKm: plan.streamRestorationLengthKm !== null ? String(plan.streamRestorationLengthKm) : "",
      weirsCount: plan.weirsCount !== null ? String(plan.weirsCount) : "",
      distributionStructuresCount: plan.distributionStructuresCount !== null ? String(plan.distributionStructuresCount) : "",
      mainCanalsCount: plan.mainCanalsCount !== null ? String(plan.mainCanalsCount) : "",
      mainCanalsLengthKm: plan.mainCanalsLengthKm !== null ? String(plan.mainCanalsLengthKm) : "",
      secondaryCanalsCount: plan.secondaryCanalsCount !== null ? String(plan.secondaryCanalsCount) : "",
      secondaryCanalsLengthKm: plan.secondaryCanalsLengthKm !== null ? String(plan.secondaryCanalsLengthKm) : "",
      commandAreaEstimateHa: plan.commandAreaEstimateHa !== null ? String(plan.commandAreaEstimateHa) : "",
      pastOrOngoingStudies: plan.pastOrOngoingStudies || "",
      existingInfraDescription: plan.existingInfraDescription || "",
      existingCanalsCondition: plan.existingCanalsCondition || "",
      existingReservoirsCondition: plan.existingReservoirsCondition || "",
      existingDrainageCondition: plan.existingDrainageCondition || "",
      existingFloodEmbankments: plan.existingFloodEmbankments || "",
      existingRoadsCondition: plan.existingRoadsCondition || "",
      otherExistingInfra: plan.otherExistingInfra || "",
      climateDescription: plan.climateDescription || "",
      soilAndTopography: plan.soilAndTopography || "",
      surfaceWaterResources: plan.surfaceWaterResources || "",
      groundwaterResources: plan.groundwaterResources || "",
      landUseDescription: plan.landUseDescription || "",
      cropPatternAndSeasonality: plan.cropPatternAndSeasonality || "",
      farmSizeAndTenure: plan.farmSizeAndTenure || "",
      fwucStatusAndInstitutions: plan.fwucStatusAndInstitutions || "",
      farmingPracticesAndPumping: plan.farmingPracticesAndPumping || "",
      subprojectRationale: plan.subprojectRationale || "",
      constraintsAddressed: plan.constraintsAddressed || "",
      expectedBenefits: plan.expectedBenefits || "",
      integrationIntoBasinPlan: plan.integrationIntoBasinPlan || "",
      modernizationCanalDistribution: plan.modernizationCanalDistribution || "",
      pipeDistributionSystems: plan.pipeDistributionSystems || "",
      floodManagementDrainage: plan.floodManagementDrainage || "",
      inspectionAccessRoads: plan.inspectionAccessRoads || "",
      managementEquipmentFacilities: plan.managementEquipmentFacilities || "",
      agriculturalSupportServices: plan.agriculturalSupportServices || "",
      institutionalSustainabilityOandM: plan.institutionalSustainabilityOandM || "",
      totalEstimatedCostUsd: plan.totalEstimatedCostUsd !== null ? String(plan.totalEstimatedCostUsd) : "",
      costPerHectareUsd: plan.costPerHectareUsd !== null ? String(plan.costPerHectareUsd) : "",
      costBreakdownMajorItems: plan.costBreakdownMajorItems || "",
      pumpingLiftMeters: plan.pumpingLiftMeters !== null ? String(plan.pumpingLiftMeters) : "",
      pumpingDischargeLs: plan.pumpingDischargeLs !== null ? String(plan.pumpingDischargeLs) : "",
      stakeholderConsultationsDetails: plan.stakeholderConsultationsDetails || "",
      farmerInterestHighValueCrops: plan.farmerInterestHighValueCrops || "",
      farmerInterestModernization: plan.farmerInterestModernization || "",
      farmerFwucWillingness: plan.farmerFwucWillingness || "",
      majorFarmerBenefits: plan.majorFarmerBenefits || "",
      resettlementImpacts: plan.resettlementImpacts || "",
      lossOfAssetsImpacts: plan.lossOfAssetsImpacts || "",
      environmentalImpactsProtection: plan.environmentalImpactsProtection || "",
      safeguardMitigationMeasures: plan.safeguardMitigationMeasures || "",
      mapRiverBasinNotes: plan.mapRiverBasinNotes || "",
      schematicRiverBasinNotes: plan.schematicRiverBasinNotes || "",
      mapSubprojectNotes: plan.mapSubprojectNotes || "",
      additionalAttachmentsNotes: plan.additionalAttachmentsNotes || "",
    });

    if (plan.provinceId) void fetchDistricts(String(plan.provinceId));
    if (plan.districtId) void fetchCommunes(String(plan.districtId));
    setActiveFormTab(1);
    setCurrentView("form");
  };

  const handleViewClick = (plan: SubprojectPlanItem) => {
    setSelectedPlan(plan);
    setCurrentView("view");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("តើអ្នកពិតជាចង់លុបផែនការអនុគម្រោងនេះមែនទេ? (Are you sure you want to delete this subproject plan?)")) {
      return;
    }
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/subprojects/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
        if (selectedPlan?.id === id) setSelectedPlan(null);
        if (currentView === "view") setCurrentView("list");
        setMessage("បានលុបអនុគម្រោងដោយជោគជ័យ");
        setStatusType("success");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to delete");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setIsSubmitting(true);
    setMessage("");

    const targetProvinceId = isAdmin ? formData.provinceId : currentUser?.provinceId;
    if (!targetProvinceId) {
      setMessage("សូមជ្រើសរើសខេត្ត (Please select province)");
      setStatusType("error");
      setIsSubmitting(false);
      return;
    }

    if (!formData.subprojectName.trim()) {
      setMessage("សូមបញ្ចូលឈ្មោះអនុគម្រោង (Please enter subproject name)");
      setStatusType("error");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        provinceId: targetProvinceId,
      };

      const url = editingId ? `/api/subprojects/${editingId}` : "/api/subprojects";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save subproject plan");
      }

      const savedItem = await res.json();
      setMessage(editingId ? "បានកែប្រែអនុគម្រោងដោយជោគជ័យ!" : "បានបង្កើតសំណើអនុគម្រោងដោយជោគជ័យ!");
      setStatusType("success");

      // Refresh list
      await fetchPlans(token, selectedProvinceFilter);
      setSelectedPlan(savedItem);
      setCurrentView("view");
      resetForm();
    } catch (err: any) {
      setMessage(err?.message || "Error submitting form");
      setStatusType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (selectedProvinceFilter !== "all" && String(p.provinceId) !== selectedProvinceFilter) {
        return false;
      }
      if (selectedStatusFilter !== "ALL" && p.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (p.subprojectName || "").toLowerCase();
        const code = (p.subprojectCode || "").toLowerCase();
        const basin = (p.riverBasinName || "").toLowerCase();
        const prov = (p.province?.khmerName || p.province?.name || "").toLowerCase();
        const dist = (p.district?.khmerName || p.district?.name || "").toLowerCase();
        return name.includes(q) || code.includes(q) || basin.includes(q) || prov.includes(q) || dist.includes(q);
      }
      return true;
    });
  }, [plans, selectedProvinceFilter, selectedStatusFilter, searchQuery]);

  // Export to Excel
  const exportToExcel = () => {
    const rows = filteredPlans.map((p, idx) => ({
      "ល.រ": idx + 1,
      "កូដអនុគម្រោង": p.subprojectCode || "",
      "ឈ្មោះអនុគម្រោង": p.subprojectName,
      "ឈ្មោះជាភាសាអង់គ្លេស": p.subprojectEnglishName || "",
      "ខេត្ត": p.province?.khmerName || p.province?.name || "",
      "ស្រុក/ខណ្ឌ": p.district?.khmerName || p.district?.name || "",
      "ឈ្មោះអាងទន្លេ": p.riverBasinName || "",
      "ស្ថានភាព": p.status,
      "ផ្ទៃដីស្រោចស្រពបច្ចុប្បន្ន-ប្រាំង (ha)": p.existingDrySeasonAreaHa ?? "",
      "ផ្ទៃដីស្រោចស្រពបច្ចុប្បន្ន-វស្សា (ha)": p.existingWetSeasonAreaHa ?? "",
      "ផ្ទៃដីក្រោយកែលម្អ-ប្រាំង (ha)": p.postProjectDrySeasonAreaHa ?? "",
      "ផ្ទៃដីក្រោយកែលម្អ-វស្សា (ha)": p.postProjectWetSeasonAreaHa ?? "",
      "ប្រវែងស្តារស្ទឹង (km)": p.riverRestorationLengthKm ?? "",
      "ប្រវែងស្តារអូរ (km)": p.streamRestorationLengthKm ?? "",
      "សំណង់ស្ទាក់ទឹក": p.weirsCount ?? "",
      "សំណង់ចែកចាយទឹក": p.distributionStructuresCount ?? "",
      "ប្រឡាយមេ (ខ្សែ)": p.mainCanalsCount ?? "",
      "ប្រវែងប្រឡាយមេ (km)": p.mainCanalsLengthKm ?? "",
      "ប្រឡាយរង (ខ្សែ)": p.secondaryCanalsCount ?? "",
      "ប្រវែងប្រឡាយរង (km)": p.secondaryCanalsLengthKm ?? "",
      "តម្លៃប៉ាន់ស្មានសរុប ($)": p.totalEstimatedCostUsd ?? "",
      "តម្លៃក្នុងមួយហិកតា ($/ha)": p.costPerHectareUsd ?? "",
      "កាលបរិច្ឆេទបង្កើត": new Date(p.createdAt).toLocaleDateString("km-KH"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SubprojectPlans");
    XLSX.writeFile(wb, `subproject_research_plans_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">បានអនុម័ត (Approved)</span>;
      case "UNDER_STUDY":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">កំពុងសិក្សា (Under Study)</span>;
      case "PROPOSED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">បានស្នើសុំ (Proposed)</span>;
      case "DRAFT":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">សេចក្តីព្រាង (Draft)</span>;
      case "COMPLETED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">បានបញ្ចប់ (Completed)</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">កំពុងទាញយកទិន្នន័យអនុគម្រោង...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 max-w-lg mx-auto">
        <p className="text-red-700 dark:text-red-300 font-medium mb-4">{authError}</p>
        <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">ទៅកាន់ទំព័រ Login</a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-1">
              <span>ក្រសួងធនធានទឹក និងឧតុនិយម • MOWRAM</span>
              <span>•</span>
              <span>Candidate Sub-Project Concept Note</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              សំណើសុំ និងផែនការស្រាវជ្រាវអនុគម្រោង (Sub-Project Concept Notes)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ប្រព័ន្ធរៀបចំ និងគ្រប់គ្រងសំណើអនុគម្រោងធារាសាស្ត្រតាមបណ្តារាជធានី-ខេត្ត (១០ ជំពូក តាមគំរូទម្រង់ Proforma)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentView !== "list" && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView("list");
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                ← ត្រឡប់ទៅបញ្ជីអនុគម្រោង
              </button>
            )}

            {currentView === "view" && selectedPlan && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center gap-2 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                បោះពុម្ពទម្រង់ (Print Document)
              </button>
            )}

            {currentView === "list" && (
              <>
                <button
                  type="button"
                  onClick={exportToExcel}
                  className="px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-sm flex items-center gap-2 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  នាំចេញ Excel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setCurrentView("form");
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  បង្កើតសំណើអនុគម្រោងថ្មី
                </button>
              </>
            )}
          </div>
        </div>

        {/* Global Alert Messages */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm flex items-center justify-between ${
              statusType === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200 border border-red-200 dark:border-red-800"
            }`}
          >
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="text-xs font-bold px-2 py-0.5 opacity-70 hover:opacity-100">✕</button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: SUBPROJECT LIST                                        */}
      {/* ============================================================== */}
      {currentView === "list" && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xl">
                {plans.length}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">អនុគម្រោងសរុប</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">Total Subprojects</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xl">
                {plans.filter((p) => p.status === "APPROVED").length}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">បានអនុម័តរួច</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Approved Plans</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold text-xl">
                {plans.filter((p) => p.status === "PROPOSED" || p.status === "UNDER_STUDY").length}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">កំពុងស្នើសុំ/សិក្សា</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">In Review / Study</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold text-xl">
                {new Set(plans.map((p) => p.provinceId)).size}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">ខេត្តដែលមានអនុគម្រោង</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">Provinces Active</p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Province filter */}
              {isAdmin ? (
                <div className="w-full sm:w-56">
                  <select
                    value={selectedProvinceFilter}
                    onChange={(e) => handleProvinceFilterChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">គ្រប់ខេត្តទាំងអស់ (All Provinces)</option>
                    {provinces.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.khmerName || prov.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  ខេត្តរបស់អ្នក៖ {currentUser?.provinceName || "N/A"}
                </div>
              )}

              {/* Status filter */}
              <div className="w-full sm:w-48">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">គ្រប់ស្ថានភាព (All Status)</option>
                  <option value="PROPOSED">បានស្នើសុំ (Proposed)</option>
                  <option value="UNDER_STUDY">កំពុងសិក្សា (Under Study)</option>
                  <option value="APPROVED">បានអនុម័ត (Approved)</option>
                  <option value="DRAFT">សេចក្តីព្រាង (Draft)</option>
                  <option value="COMPLETED">បានបញ្ចប់ (Completed)</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="ស្វែងរកតាមឈ្មោះ, កូដ, អាងទន្លេ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Table / Cards */}
          {filteredPlans.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">មិនមានសំណើអនុគម្រោងទេ</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">ពុំទាន់មានទិន្នន័យស្រាវជ្រាវអនុគម្រោងស្របតាមលក្ខខណ្ឌស្វែងរកនេះឡើយ។</p>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setCurrentView("form");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
              >
                + បង្កើតសំណើអនុគម្រោងថ្មី
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {plan.subprojectCode || `SP-${plan.id}`}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                          {plan.subprojectName}
                        </h3>
                        {plan.subprojectEnglishName && (
                          <p className="text-xs text-slate-400 italic line-clamp-1">
                            {plan.subprojectEnglishName}
                          </p>
                        )}
                      </div>
                      <div>{getStatusBadge(plan.status)}</div>
                    </div>

                    {/* Location Badge */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">📍 ទីតាំង៖</span>
                        <span>
                          {plan.province?.khmerName || plan.province?.name || "N/A"}
                          {plan.district ? ` • ស្រុក${plan.district.khmerName || plan.district.name}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">🌊 អាងទន្លេ៖</span>
                        <span>{plan.riverBasinName || "N/A"}</span>
                      </div>
                      {(plan.coordinateX || plan.latitude) && (
                        <div className="text-[11px] font-mono text-slate-400">
                          {plan.coordinateX ? `X: ${plan.coordinateX}, Y: ${plan.coordinateY}` : `Lat: ${plan.latitude}, Lng: ${plan.longitude}`}
                        </div>
                      )}
                    </div>

                    {/* Metrics snapshot */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="text-slate-400 text-[11px]">ផ្ទៃដីក្រោយកែលម្អ</div>
                        <div className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                          {plan.postProjectWetSeasonAreaHa
                            ? `${plan.postProjectWetSeasonAreaHa.toLocaleString()} ha (វស្សា)`
                            : plan.commandAreaEstimateHa
                            ? `${plan.commandAreaEstimateHa.toLocaleString()} ha`
                            : "N/A"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="text-slate-400 text-[11px]">តម្លៃប៉ាន់ស្មាន</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                          {plan.totalEstimatedCostUsd
                            ? `$${plan.totalEstimatedCostUsd.toLocaleString()}`
                            : "កំពុងប៉ាន់ស្មាន"}
                        </div>
                      </div>
                    </div>

                    {/* Key actions / Components preview */}
                    {plan.proposedComponentsSummary && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {plan.proposedComponentsSummary}
                      </p>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      កាលបរិច្ឆេទ៖ {new Date(plan.updatedAt).toLocaleDateString("km-KH")}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewClick(plan)}
                        className="px-2.5 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 font-medium rounded transition"
                      >
                        មើលលម្អិត (View)
                      </button>

                      {(isAdmin || plan.provinceId === currentUser?.provinceId) && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditClick(plan)}
                            className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium rounded transition"
                          >
                            កែប្រែ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(plan.id)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 font-medium rounded transition"
                          >
                            លុប
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: FULL CONCEPT NOTE DOCUMENT VIEW (Official Proforma)   */}
      {/* ============================================================== */}
      {currentView === "view" && selectedPlan && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentView("list")}
              className="px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
            >
              ← ត្រឡប់ទៅបញ្ជីអនុគម្រោង
            </button>

            <div className="flex items-center gap-2">
              {(isAdmin || selectedPlan.provinceId === currentUser?.provinceId) && (
                <button
                  type="button"
                  onClick={() => handleEditClick(selectedPlan)}
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition"
                >
                  កែប្រែសំណើនេះ (Edit)
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow flex items-center gap-2 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                បោះពុម្ពជាឯកសារផ្លូវការ (Print Form)
              </button>
            </div>
          </div>

          {/* Printable Document Sheet */}
          <div
            ref={printRef}
            className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg max-w-5xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none print:max-w-none"
          >
            {/* Document Header with Royal Emblem & Ministry */}
            <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6">
              <h4 className="font-semibold text-sm tracking-wide">ព្រះរាជាណាចក្រកម្ពុជា</h4>
              <h5 className="font-semibold text-xs tracking-wider">ជាតិ សាសនា ព្រះមហាក្សត្រ</h5>
              <div className="text-xs font-serif italic text-slate-500">3 3 3</div>

              <div className="pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">ក្រសួងធនធានទឹក និងឧតុនិយម • MOWRAM</p>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Candidate Sub-Project Concept Note Outline (Proforma)
                </h1>
                <h2 className="text-lg font-bold text-blue-900 mt-0.5">
                  ព័ត៌មានសម្រាប់សំណើអនុគម្រោងស្រាវជ្រាវ និងអភិវឌ្ឍន៍
                </h2>
                <div className="inline-flex items-center gap-3 mt-3 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-medium">
                  <span>កូដអនុគម្រោង៖ {selectedPlan.subprojectCode || "SP-MOWRAM"}</span>
                  <span>•</span>
                  <span>ស្ថានភាព៖ {selectedPlan.status}</span>
                </div>
              </div>
            </div>

            {/* Document Table Structure (Chapters 1 to 10) */}
            <div className="space-y-6">
              {/* CHAPTER 1 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>១. ទីតាំងអនុគម្រោង (1. Subproject Location)</span>
                  <span className="text-xs font-normal text-slate-500">ឈ្មោះអាងទន្លេ ខេត្ត និងកូអរដោនេ</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold text-slate-700">ឈ្មោះអនុគម្រោង៖</span>{" "}
                      <span className="font-bold text-slate-900">{selectedPlan.subprojectName}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">ឈ្មោះជាភាសាអង់គ្លេស៖</span>{" "}
                      <span className="text-slate-800">{selectedPlan.subprojectEnglishName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">រាជធានី-ខេត្ត៖</span>{" "}
                      <span className="text-slate-800">{selectedPlan.province?.khmerName || selectedPlan.province?.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">ស្រុក/ខណ្ឌ៖</span>{" "}
                      <span className="text-slate-800">{selectedPlan.district?.khmerName || selectedPlan.district?.name || "មិនទាន់កំណត់"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">ឈ្មោះអាងទន្លេ៖</span>{" "}
                      <span className="text-slate-800">{selectedPlan.riverBasinName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">កូអរដោនេ X/Y (UTM)៖</span>{" "}
                      <span className="font-mono text-slate-800">
                        {selectedPlan.coordinateX ? `X=${selectedPlan.coordinateX}, Y=${selectedPlan.coordinateY}` : "N/A"}
                      </span>
                    </div>
                  </div>
                  {selectedPlan.keyLocationsDescription && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-700">ពិពណ៌នាទីតាំងសំខាន់ៗ៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed">{selectedPlan.keyLocationsDescription}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAPTER 2 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>២. ការពិពណ៌នាទូទៅនៃអាងទន្លេ (2. Overview of River Basin)</span>
                  <span className="text-xs font-normal text-slate-500">ប្រភពទឹកភ្លៀង ហេដ្ឋារចនាសម្ព័ន្ធ និងតម្រូវការទឹក</span>
                </div>
                <div className="p-4 space-y-4 text-sm">
                  {selectedPlan.basinOverviewDescription && (
                    <div>
                      <span className="font-semibold text-slate-700">ព័ត៌មានទូទៅនៃអាងទន្លេ៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed">{selectedPlan.basinOverviewDescription}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-xs text-slate-500">ស្ទឹងចាស់ (គម)</div>
                      <div className="font-bold text-slate-800">{selectedPlan.mainRiverLengthKm ?? "N/A"} km</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ដៃអូរ (គម)</div>
                      <div className="font-bold text-slate-800">{selectedPlan.tributaryLengthKm ?? "N/A"} km</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ស្រោចស្រពបច្ចុប្បន្ន (ប្រាំង)</div>
                      <div className="font-bold text-slate-800">{selectedPlan.existingDrySeasonAreaHa ? `${selectedPlan.existingDrySeasonAreaHa.toLocaleString()} ha` : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ស្រោចស្រពបច្ចុប្បន្ន (វស្សា)</div>
                      <div className="font-bold text-slate-800">{selectedPlan.existingWetSeasonAreaHa ? `${selectedPlan.existingWetSeasonAreaHa.toLocaleString()} ha` : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ក្រោយកែលម្អ (ប្រាំង)</div>
                      <div className="font-bold text-blue-700">{selectedPlan.postProjectDrySeasonAreaHa ? `${selectedPlan.postProjectDrySeasonAreaHa.toLocaleString()} ha` : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ក្រោយកែលម្អ (វស្សា)</div>
                      <div className="font-bold text-blue-700">{selectedPlan.postProjectWetSeasonAreaHa ? `${selectedPlan.postProjectWetSeasonAreaHa.toLocaleString()} ha` : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ផ្ទៃដីមធ្យម/ម្នាក់</div>
                      <div className="font-bold text-slate-800">{selectedPlan.avgLandPerPersonHa ? `${selectedPlan.avgLandPerPersonHa} ha` : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ប្រភពទឹកភ្លៀង</div>
                      <div className="font-semibold text-slate-800 text-xs truncate">{selectedPlan.catchmentRainfallSource || "N/A"}</div>
                    </div>
                  </div>

                  {selectedPlan.riverBasinCommitteeStatus && (
                    <div>
                      <span className="font-semibold text-slate-700">គណៈកម្មការគ្រប់គ្រងអាងទន្លេ៖</span>{" "}
                      <span className="text-slate-800">{selectedPlan.riverBasinCommitteeStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAPTER 3 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>៣. ពិពណ៌នាស្តីពីអនុគម្រោងដែលបានស្នើ និងព័ត៌មានធ្លាប់មានស្រាប់ (3. Proposed Subproject & Studies)</span>
                  <span className="text-xs font-normal text-slate-500">សមាសភាគ និងការសិក្សាកន្លងមក</span>
                </div>
                <div className="p-4 space-y-4 text-sm">
                  {selectedPlan.proposedComponentsSummary && (
                    <div>
                      <span className="font-semibold text-slate-700">សមាសភាគនៃអនុគម្រោងដែលបានស្នើ៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed">{selectedPlan.proposedComponentsSummary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/60 p-3 rounded-lg border border-blue-200">
                    <div>
                      <div className="text-xs text-slate-500">ស្តារស្ទឹង</div>
                      <div className="font-bold text-blue-900">{selectedPlan.riverRestorationLengthKm ?? 0} km</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ស្តារអូរ</div>
                      <div className="font-bold text-blue-900">{selectedPlan.streamRestorationLengthKm ?? 0} km</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">សំណង់ស្ទាក់ទឹក</div>
                      <div className="font-bold text-blue-900">{selectedPlan.weirsCount ?? 0} កន្លែង</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">សំណង់ចែកចាយទឹក</div>
                      <div className="font-bold text-blue-900">{selectedPlan.distributionStructuresCount ?? 0} កន្លែង</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ប្រឡាយមេ</div>
                      <div className="font-bold text-blue-900">{selectedPlan.mainCanalsCount ?? 0} ខ្សែ ({selectedPlan.mainCanalsLengthKm ?? 0} km)</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">ប្រឡាយរង</div>
                      <div className="font-bold text-blue-900">{selectedPlan.secondaryCanalsCount ?? 0} ខ្សែ ({selectedPlan.secondaryCanalsLengthKm ?? 0} km)</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-slate-500">ប៉ាន់ស្មានផ្ទៃដីស្រោចស្រពសរុប</div>
                      <div className="font-bold text-blue-900">{selectedPlan.commandAreaEstimateHa ? `${selectedPlan.commandAreaEstimateHa.toLocaleString()} ha` : "N/A"}</div>
                    </div>
                  </div>

                  {selectedPlan.pastOrOngoingStudies && (
                    <div>
                      <span className="font-semibold text-slate-700">ការសិក្សាកន្លងមក ឬកំពុងបន្ត៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed">{selectedPlan.pastOrOngoingStudies}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAPTER 4 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>៤. ការពិពណ៌នាអំពីហេដ្ឋារចនាសម្ព័ន្ធដែលមានស្រាប់ (4. Existing Infrastructure)</span>
                  <span className="text-xs font-normal text-slate-500">ប្រឡាយ អាងទឹក ប្រព័ន្ធដោះទឹក ផ្លូវ</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  {selectedPlan.existingInfraDescription && (
                    <div>
                      <span className="font-semibold text-slate-700">ទិដ្ឋភាពទូទៅនៃហេដ្ឋារចនាសម្ព័ន្ធស្រាប់៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line">{selectedPlan.existingInfraDescription}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <span className="font-bold text-slate-700 block">ប្រឡាយទឹក៖</span>
                      <span className="text-slate-700">{selectedPlan.existingCanalsCondition || "N/A"}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <span className="font-bold text-slate-700 block">អាងទឹក/ទំនប់៖</span>
                      <span className="text-slate-700">{selectedPlan.existingReservoirsCondition || "N/A"}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <span className="font-bold text-slate-700 block">ប្រព័ន្ធរំដោះទឹក៖</span>
                      <span className="text-slate-700">{selectedPlan.existingDrainageCondition || "N/A"}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <span className="font-bold text-slate-700 block">ផ្លូវគមនាគមន៍៖</span>
                      <span className="text-slate-700">{selectedPlan.existingRoadsCondition || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHAPTER 5 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>៥. ពិពណ៌នាពីផ្ទៃដីស្រោចស្រពរបស់ប្រព័ន្ធ (5. Command Area Description)</span>
                  <span className="text-xs font-normal text-slate-500">ធនធានធម្មជាតិ សង្គម និងកសិកម្ម</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><span className="font-semibold text-slate-700">អាកាសធាតុ៖</span> <span className="text-slate-800">{selectedPlan.climateDescription || "N/A"}</span></div>
                    <div><span className="font-semibold text-slate-700">ប្រភេទដី & សណ្ឋានដី៖</span> <span className="text-slate-800">{selectedPlan.soilAndTopography || "N/A"}</span></div>
                    <div><span className="font-semibold text-slate-700">ធនធានទឹកលើដី៖</span> <span className="text-slate-800">{selectedPlan.surfaceWaterResources || "N/A"}</span></div>
                    <div><span className="font-semibold text-slate-700">ធនធានទឹកក្រោមដី៖</span> <span className="text-slate-800">{selectedPlan.groundwaterResources || "N/A"}</span></div>
                    <div><span className="font-semibold text-slate-700">ដំណាំ និងវដ្តដាំដុះ៖</span> <span className="text-slate-800">{selectedPlan.cropPatternAndSeasonality || "N/A"}</span></div>
                    <div><span className="font-semibold text-slate-700">ការកាន់កាប់ដី & ទំហំ៖</span> <span className="text-slate-800">{selectedPlan.farmSizeAndTenure || "N/A"}</span></div>
                    <div><span className="font-semibold text-slate-700">ស្ថាប័ន & សហគមន៍ FWUC៖</span> <span className="text-slate-800">{selectedPlan.fwucStatusAndInstitutions || "N/A"}</span></div>
                    <div><span className="font-semibold text-slate-700">ការអនុវត្តដាំដុះ & គ្រឿងចក្រ៖</span> <span className="text-slate-800">{selectedPlan.farmingPracticesAndPumping || "N/A"}</span></div>
                  </div>
                </div>
              </div>

              {/* CHAPTER 6 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>៦. មូលហេតុដែលជ្រើសរើសអនុគម្រោង (6. Subproject Rationale & Benefits)</span>
                  <span className="text-xs font-normal text-slate-500">មូលហេតុ ឧបសគ្គ និងផលប្រយោជន៍</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  {selectedPlan.subprojectRationale && (
                    <div>
                      <span className="font-semibold text-slate-700">មូលហេតុចម្បង៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed bg-emerald-50/50 p-2.5 rounded border border-emerald-100">{selectedPlan.subprojectRationale}</p>
                    </div>
                  )}
                  {selectedPlan.constraintsAddressed && (
                    <div>
                      <span className="font-semibold text-slate-700">ឧបសគ្គ និងបញ្ហាប្រឈមដែលត្រូវដោះស្រាយ៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed bg-amber-50/50 p-2.5 rounded border border-amber-100">{selectedPlan.constraintsAddressed}</p>
                    </div>
                  )}
                  {selectedPlan.expectedBenefits && (
                    <div>
                      <span className="font-semibold text-slate-700">ផលប្រយោជន៍រំពឹងទុក (សង្គម សេដ្ឋកិច្ច យេនឌ័រ)៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed bg-blue-50/50 p-2.5 rounded border border-blue-100">{selectedPlan.expectedBenefits}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAPTER 7 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>៧. ទំនើបកម្មដែលបានស្នើឡើង (7. Proposed Modernisation Works)</span>
                  <span className="text-xs font-normal text-slate-500">ទំនើបកម្ម ៧ ចំណុចសំខាន់ៗ</span>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-800">
                    {selectedPlan.modernizationCanalDistribution && (
                      <li><span className="font-semibold">កែលម្អប្រព័ន្ធប្រឡាយ៖</span> {selectedPlan.modernizationCanalDistribution}</li>
                    )}
                    {selectedPlan.pipeDistributionSystems && (
                      <li><span className="font-semibold">ប្រព័ន្ធទុយោចែកចាយទឹក៖</span> {selectedPlan.pipeDistributionSystems}</li>
                    )}
                    {selectedPlan.floodManagementDrainage && (
                      <li><span className="font-semibold">ការគ្រប់គ្រងទឹកជំនន់ & រំដោះទឹក៖</span> {selectedPlan.floodManagementDrainage}</li>
                    )}
                    {selectedPlan.inspectionAccessRoads && (
                      <li><span className="font-semibold">ផ្លូវអធិការកិច្ច៖</span> {selectedPlan.inspectionAccessRoads}</li>
                    )}
                    {selectedPlan.managementEquipmentFacilities && (
                      <li><span className="font-semibold">ឧបករណ៍ សម្ភារៈ & អគារគ្រប់គ្រង៖</span> {selectedPlan.managementEquipmentFacilities}</li>
                    )}
                    {selectedPlan.agriculturalSupportServices && (
                      <li><span className="font-semibold">ការជួយគាំទ្រផ្នែកកសិកម្ម៖</span> {selectedPlan.agriculturalSupportServices}</li>
                    )}
                    {selectedPlan.institutionalSustainabilityOandM && (
                      <li><span className="font-semibold">ការពង្រឹងស្ថាប័ន & និរន្តរភាព O&M៖</span> {selectedPlan.institutionalSustainabilityOandM}</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* CHAPTER 8 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>៨. តម្លៃប៉ាន់ស្មាន (8. Indicative Costs)</span>
                  <span className="text-xs font-normal text-slate-500">ចំណាយសរុប ចំណាយក្នុងមួយហិកតា និងការបែងចែកថវិកា</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                    <div>
                      <div className="text-xs text-slate-500">តម្លៃប៉ាន់ស្មានសរុប</div>
                      <div className="text-xl font-black text-emerald-800">
                        {selectedPlan.totalEstimatedCostUsd ? `$${selectedPlan.totalEstimatedCostUsd.toLocaleString()}` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">តម្លៃប៉ាន់ស្មានក្នុង ១ ហិកតា</div>
                      <div className="text-xl font-bold text-emerald-800">
                        {selectedPlan.costPerHectareUsd ? `$${selectedPlan.costPerHectareUsd.toLocaleString()} / ha` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">កម្ពស់ & បរិមាណបូមទឹក</div>
                      <div className="text-sm font-semibold text-slate-800 mt-1">
                        {selectedPlan.pumpingLiftMeters ? `កម្ពស់ ${selectedPlan.pumpingLiftMeters}m • ${selectedPlan.pumpingDischargeLs || 0} l/s` : "មិនទាមទារការបូម"}
                      </div>
                    </div>
                  </div>
                  {selectedPlan.costBreakdownMajorItems && (
                    <div>
                      <span className="font-semibold text-slate-700">មុខសញ្ញាចំណាយធំៗ៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line">{selectedPlan.costBreakdownMajorItems}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAPTER 9 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>៩. ការពិគ្រោះយោបល់ភាគីពាក់ព័ន្ធ និងផលប្រយោជន៍កសិករ (9. Consultations & Farmer Interest)</span>
                  <span className="text-xs font-normal text-slate-500">ការចូលរួមរបស់សហគមន៍ និងអាជ្ញាធរ</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  {selectedPlan.stakeholderConsultationsDetails && (
                    <div>
                      <span className="font-semibold text-slate-700">ការពិគ្រោះយោបល់កន្លងមក៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line">{selectedPlan.stakeholderConsultationsDetails}</p>
                    </div>
                  )}
                  {selectedPlan.majorFarmerBenefits && (
                    <div>
                      <span className="font-semibold text-slate-700">ផលប្រយោជន៍ចម្បងៗរបស់កសិករ៖</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-line">{selectedPlan.majorFarmerBenefits}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAPTER 10 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>១០. ផលប៉ះពាល់សង្គម និងបរិស្ថាន (10. Safeguards)</span>
                  <span className="text-xs font-normal text-slate-500">ការធានាមិនប៉ះពាល់តំបន់ការពារ និងការតាំងទីលំនៅ</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 font-medium">
                    🛡️ {selectedPlan.environmentalImpactsProtection || "សូមធានាថាការអនុវត្តអនុគម្រោងនេះ មិនធ្វើឱ្យប៉ះពាល់ដល់តំបន់អភិរក្ស និងតំបន់ការពារណាមួយឡើយ។"}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="font-semibold text-slate-700">ការផ្លាស់ទីផ្ទះសម្បែង៖</span>
                      <p className="text-slate-800 mt-0.5">{selectedPlan.resettlementImpacts || "គ្មានការផ្លាស់ទីផ្ទះសម្បែង"}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">ការបាត់បង់ទ្រព្យសម្បត្តិ៖</span>
                      <p className="text-slate-800 mt-0.5">{selectedPlan.lossOfAssetsImpacts || "គ្មានការបាត់បង់ទ្រព្យសម្បត្តិធំដុំ"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ATTACHMENTS & SIGNATURES */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-800 flex items-center justify-between border-b border-slate-300">
                  <span>ឧបសម្ព័ន្ធ ផែនទី និងកំណត់សម្គាល់ (Attachments & Maps)</span>
                  <span className="text-xs font-normal text-slate-500">ផែនទីអាងទន្លេ ដ្យាក្រាម និងផែនទីអនុគម្រោង</span>
                </div>
                <div className="p-4 space-y-2 text-sm text-slate-800">
                  <p>• <span className="font-semibold">ផែនទីអាងទន្លេ៖</span> {selectedPlan.mapRiverBasinNotes || "ភ្ជាប់ផែនទីបង្ហាញពីទីតាំង និងវិសាលភាពហេដ្ឋារចនាសម្ព័ន្ធ"}</p>
                  <p>• <span className="font-semibold">ដ្យាក្រាមអាងទន្លេ៖</span> {selectedPlan.schematicRiverBasinNotes || "ដ្យាក្រាមបង្ហាញពីហេដ្ឋារចនាសម្ព័ន្ធ អាងស្តុកទឹក និងតម្រូវការទឹក"}</p>
                  <p>• <span className="font-semibold">ផែនទីអនុគម្រោង៖</span> {selectedPlan.mapSubprojectNotes || "ផែនទីបង្ហាញពីផ្ទៃដីស្រោចស្រព ប្រឡាយ និងសំណង់ស្ទាក់ទឹក"}</p>
                  {selectedPlan.additionalAttachmentsNotes && (
                    <p className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                      កំណត់សម្គាល់បន្ថែម៖ {selectedPlan.additionalAttachmentsNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Signatures Section in Print */}
              <div className="pt-8 grid grid-cols-2 text-center text-sm font-semibold text-slate-800 print:block">
                <div>
                  <p className="font-normal text-xs text-slate-500">បានពិនិត្យ និងវាយតម្លៃដោយ</p>
                  <p className="mt-1">ប្រធានមន្ទីរធនធានទឹក និងឧតុនិយម</p>
                  <div className="h-16"></div>
                  <p className="text-xs text-slate-400">....................................................</p>
                </div>
                <div>
                  <p className="font-normal text-xs text-slate-500">រៀបចំ និងដាក់ស្នើដោយ</p>
                  <p className="mt-1">មន្ត្រីទទួលបន្ទុកគម្រោង / អ្នកស្រាវជ្រាវ</p>
                  <div className="h-16"></div>
                  <p className="text-xs text-slate-400">....................................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: DATA ENTRY & EDIT FORM (10 Chapters Wizard)            */}
      {/* ============================================================== */}
      {currentView === "form" && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingId ? "កែប្រែព័ត៌មានសំណើអនុគម្រោង" : "បញ្ចូលព័ត៌មានសំណើអនុគម្រោងស្រាវជ្រាវថ្មី"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  បំពេញព័ត៌មានតាមជំពូកនីមួយៗ (ជំពូកទី ១ ដល់ ជំពូកទី ១០ ផ្អែកតាមទម្រង់ផ្លូវការ)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView("list");
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
                >
                  {isSubmitting ? "កំពុងរក្សាទុក..." : editingId ? "រក្សាទុកការកែប្រែ" : "ដាក់ស្នើសំណើអនុគម្រោង"}
                </button>
              </div>
            </div>

            {/* Stepper / Tabs (1 to 10) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
              {[
                { step: 1, title: "១. ទីតាំង" },
                { step: 2, title: "២. អាងទន្លេ" },
                { step: 3, title: "៣. សមាសភាគ" },
                { step: 4, title: "៤. ហេដ្ឋារចនាសម្ព័ន្ធ" },
                { step: 5, title: "៥. ផ្ទៃដីស្រោចស្រព" },
                { step: 6, title: "៦. មូលហេតុ" },
                { step: 7, title: "៧. ទំនើបកម្ម" },
                { step: 8, title: "៨. តម្លៃប៉ាន់ស្មាន" },
                { step: 9, title: "៩. ការពិគ្រោះយោបល់" },
                { step: 10, title: "១០. សុវត្ថិភាពសង្គម" },
              ].map((tab) => (
                <button
                  key={tab.step}
                  type="button"
                  onClick={() => setActiveFormTab(tab.step)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                    activeFormTab === tab.step
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{tab.title}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: LOCATION */}
            {activeFormTab === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>📍 ជំពូកទី ១៖ ទីតាំងអនុគម្រោង (Subproject Location)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ឈ្មោះអនុគម្រោង * (Subproject Name)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. អនុគម្រោងប្រព័ន្ធស្ទឹងថ្មពួក"
                      value={formData.subprojectName}
                      onChange={(e) => setFormData({ ...formData, subprojectName: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ឈ្មោះជាភាសាអង់គ្លេស (English Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stueng Tmar Pouk Subproject"
                      value={formData.subprojectEnglishName}
                      onChange={(e) => setFormData({ ...formData, subprojectEnglishName: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      កូដអនុគម្រោង (Code)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. SP-BMC-001 (ឬទុកទទេដើម្បីបង្កើតស្វ័យប្រវត្តិ)"
                      value={formData.subprojectCode}
                      onChange={(e) => setFormData({ ...formData, subprojectCode: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      រាជធានី-ខេត្ត * (Province)
                    </label>
                    {isAdmin ? (
                      <select
                        required
                        value={formData.provinceId}
                        onChange={(e) => handleFormProvinceChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="">-- ជ្រើសរើសខេត្ត --</option>
                        {provinces.map((prov) => (
                          <option key={prov.id} value={prov.id}>
                            {prov.khmerName || prov.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={currentUser?.provinceName || ""}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ស្រុក/ខណ្ឌ (District)
                    </label>
                    <select
                      value={formData.districtId}
                      onChange={(e) => handleFormDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">-- ជ្រើសរើសស្រុក --</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.khmerName || d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ឃុំ/សង្កាត់ (Commune)
                    </label>
                    <select
                      value={formData.communeId}
                      onChange={(e) => setFormData({ ...formData, communeId: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">-- ជ្រើសរើសឃុំ --</option>
                      {communes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.khmerName || c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ឈ្មោះអាងទន្លេ (River Basin Name)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. ប្រព័ន្ធស្ទឹងថ្មពួក"
                      value={formData.riverBasinName}
                      onChange={(e) => setFormData({ ...formData, riverBasinName: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      កូអរដោនេ X (UTM)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="276528"
                      value={formData.coordinateX}
                      onChange={(e) => setFormData({ ...formData, coordinateX: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      កូអរដោនេ Y (UTM)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="1549682"
                      value={formData.coordinateY}
                      onChange={(e) => setFormData({ ...formData, coordinateY: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ស្ថានភាពអនុគម្រោង (Status)
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="PROPOSED">បានស្នើសុំ (Proposed)</option>
                      <option value="UNDER_STUDY">កំពុងសិក្សា (Under Study)</option>
                      <option value="APPROVED">បានអនុម័ត (Approved)</option>
                      <option value="DRAFT">សេចក្តីព្រាង (Draft)</option>
                      <option value="COMPLETED">បានបញ្ចប់ (Completed)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    កូអរដោនេ និងការពិពណ៌នាទីតាំងសំខាន់ៗ (អាងទឹក ទំនប់ស្ទាក់ទឹក ។ល។)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ពិពណ៌នាទីតាំងសំខាន់ៗ ទំនប់ស្ទាក់ អាងស្តុកទឹក..."
                    value={formData.keyLocationsDescription}
                    onChange={(e) => setFormData({ ...formData, keyLocationsDescription: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: RIVER BASIN */}
            {activeFormTab === 2 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>🌊 ជំពូកទី ២៖ ការពិពណ៌នាទូទៅនៃអាងទន្លេ (Overview of River Basin)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រវែងស្ទឹងចាស់ (គម)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="55"
                      value={formData.mainRiverLengthKm}
                      onChange={(e) => setFormData({ ...formData, mainRiverLengthKm: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រវែងដៃអូរ (គម)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="24"
                      value={formData.tributaryLengthKm}
                      onChange={(e) => setFormData({ ...formData, tributaryLengthKm: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផ្ទៃដីស្រោចស្រពបច្ចុប្បន្ន-ប្រាំង (ha)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="3000"
                      value={formData.existingDrySeasonAreaHa}
                      onChange={(e) => setFormData({ ...formData, existingDrySeasonAreaHa: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផ្ទៃដីស្រោចស្រពបច្ចុប្បន្ន-វស្សា (ha)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="24000"
                      value={formData.existingWetSeasonAreaHa}
                      onChange={(e) => setFormData({ ...formData, existingWetSeasonAreaHa: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផ្ទៃដីក្រោយកែលម្អ-ប្រាំង (ha)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="5000"
                      value={formData.postProjectDrySeasonAreaHa}
                      onChange={(e) => setFormData({ ...formData, postProjectDrySeasonAreaHa: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផ្ទៃដីក្រោយកែលម្អ-វស្សា (ha)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="30000"
                      value={formData.postProjectWetSeasonAreaHa}
                      onChange={(e) => setFormData({ ...formData, postProjectWetSeasonAreaHa: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផ្ទៃដីជាមធ្យម/ម្នាក់ (ha)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="5"
                      value={formData.avgLandPerPersonHa}
                      onChange={(e) => setFormData({ ...formData, avgLandPerPersonHa: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផ្ទៃរងទឹកភ្លៀង និងប្រភពទឹក
                    </label>
                    <input
                      type="text"
                      placeholder="មកពីប្រទេសថៃ និងតំបន់ខ្ពង់រាប..."
                      value={formData.catchmentRainfallSource}
                      onChange={(e) => setFormData({ ...formData, catchmentRainfallSource: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ព័ត៌មានទូទៅនៃអាងទន្លេ ហេដ្ឋារចនាសម្ព័ន្ធ និងបរិមាណតម្រូវការទឹក
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ពិពណ៌នាអំពីអាងទន្លេ ហេដ្ឋារចនាសម្ព័ន្ធ និងតម្រូវការប្រើប្រាស់ទឹក..."
                    value={formData.basinOverviewDescription}
                    onChange={(e) => setFormData({ ...formData, basinOverviewDescription: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផែនការអភិវឌ្ឍន៍ និងបញ្ហាប្រឈមក្នុងអាងទន្លេ
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ផែនការវិនិយោគដែលមានស្រាប់ ទាំងក្នុង និងក្រៅ MOWRAM..."
                      value={formData.basinPlannedInvestments}
                      onChange={(e) => setFormData({ ...formData, basinPlannedInvestments: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ស្ថានភាពគណៈកម្មការគ្រប់គ្រងអាងទន្លេ (RBMC)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ការបង្កើត និងដំណើរការនៃគណៈកម្មការគ្រប់គ្រងអាងទន្លេ..."
                      value={formData.riverBasinCommitteeStatus}
                      onChange={(e) => setFormData({ ...formData, riverBasinCommitteeStatus: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PROPOSED COMPONENTS & STUDIES */}
            {activeFormTab === 3 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>🏗️ ជំពូកទី ៣៖ សមាសភាគនៃអនុគម្រោងដែលបានស្នើ (Proposed Components & Studies)</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    សេចក្តីសង្ខេបសមាសភាគអនុគម្រោងដែលស្នើឡើង
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ឧ. ស្តារស្ទឹង ៥៥ គម, សាងសង់សំណង់ស្ទាក់ទឹក ៤ កន្លែង, សំណង់ចែកចាយទឹក ១៦ កន្លែង, ប្រឡាយមេ ១៦ ខ្សែ..."
                    value={formData.proposedComponentsSummary}
                    onChange={(e) => setFormData({ ...formData, proposedComponentsSummary: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ស្តារស្ទឹងប្រវែង (គម)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="55"
                      value={formData.riverRestorationLengthKm}
                      onChange={(e) => setFormData({ ...formData, riverRestorationLengthKm: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ស្តារអូរប្រវែង (គម)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="24"
                      value={formData.streamRestorationLengthKm}
                      onChange={(e) => setFormData({ ...formData, streamRestorationLengthKm: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      សំណង់ស្ទាក់ទឹក (កន្លែង)
                    </label>
                    <input
                      type="number"
                      placeholder="4"
                      value={formData.weirsCount}
                      onChange={(e) => setFormData({ ...formData, weirsCount: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      សំណង់ចែកចាយទឹក (កន្លែង)
                    </label>
                    <input
                      type="number"
                      placeholder="16"
                      value={formData.distributionStructuresCount}
                      onChange={(e) => setFormData({ ...formData, distributionStructuresCount: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រឡាយមេ (ខ្សែ)
                    </label>
                    <input
                      type="number"
                      placeholder="16"
                      value={formData.mainCanalsCount}
                      onChange={(e) => setFormData({ ...formData, mainCanalsCount: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រវែងប្រឡាយមេសរុប (គម)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="48"
                      value={formData.mainCanalsLengthKm}
                      onChange={(e) => setFormData({ ...formData, mainCanalsLengthKm: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រឡាយរង (ខ្សែ)
                    </label>
                    <input
                      type="number"
                      placeholder="48"
                      value={formData.secondaryCanalsCount}
                      onChange={(e) => setFormData({ ...formData, secondaryCanalsCount: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រវែងប្រឡាយរងសរុប (គម)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="96"
                      value={formData.secondaryCanalsLengthKm}
                      onChange={(e) => setFormData({ ...formData, secondaryCanalsLengthKm: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប៉ាន់ស្មានផ្ទៃដីស្រោចស្រពសរុប (Command Area, ha)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="35000"
                      value={formData.commandAreaEstimateHa}
                      onChange={(e) => setFormData({ ...formData, commandAreaEstimateHa: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ការសិក្សាដែលបានធ្វើរួច ឬកំពុងបន្ត (Studies Carried Out)
                    </label>
                    <input
                      type="text"
                      placeholder="កាលបរិច្ឆេទ អ្នកសិក្សា ទិន្នន័យពី PDWRAM / IAMS..."
                      value={formData.pastOrOngoingStudies}
                      onChange={(e) => setFormData({ ...formData, pastOrOngoingStudies: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: EXISTING INFRASTRUCTURE */}
            {activeFormTab === 4 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>🏢 ជំពូកទី ៤៖ ហេដ្ឋារចនាសម្ព័ន្ធដែលមានស្រាប់ (Existing Infrastructure)</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ពិពណ៌នាអំពីហេដ្ឋារចនាសម្ព័ន្ធដែលមានស្រាប់
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ស្ថានភាពហេដ្ឋារចនាសម្ព័ន្ធ កាលបរិច្ឆេទសាងសង់ និងការកែលម្អកន្លងមក..."
                    value={formData.existingInfraDescription}
                    onChange={(e) => setFormData({ ...formData, existingInfraDescription: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រឡាយទឹកដែលមានស្រាប់ (Canals Condition)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ប្រឡាយមេ ប្រឡាយរង ដីធម្មជាតិ ឬបេតុង និងស្ថានភាព..."
                      value={formData.existingCanalsCondition}
                      onChange={(e) => setFormData({ ...formData, existingCanalsCondition: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      អាងស្តុកទឹក និងទំនប់ (Reservoirs & Dams)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ចំណុះស្តុក (MCM) ផ្ទៃទឹក (ha) និងបញ្ហាប្រឈម..."
                      value={formData.existingReservoirsCondition}
                      onChange={(e) => setFormData({ ...formData, existingReservoirsCondition: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រព័ន្ធរំដោះទឹក (Drainage System)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ប្រព័ន្ធ និងសំណង់រំដោះទឹក..."
                      value={formData.existingDrainageCondition}
                      onChange={(e) => setFormData({ ...formData, existingDrainageCondition: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផ្លូវគមនាគមន៍ (Roads Condition)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ផ្លូវបេតុង ក្រួសក្រហម ឬដី និងស្ថានភាពខូចខាត..."
                      value={formData.existingRoadsCondition}
                      onChange={(e) => setFormData({ ...formData, existingRoadsCondition: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: COMMAND AREA */}
            {activeFormTab === 5 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>🌾 ជំពូកទី ៥៖ ពិពណ៌នាពីផ្ទៃដីស្រោចស្រព និងកសិកម្ម (Command Area & Agriculture)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      លក្ខខណ្ឌអាកាសធាតុ (Climate)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. ក្តៅហើយសើម"
                      value={formData.climateDescription}
                      onChange={(e) => setFormData({ ...formData, climateDescription: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រភេទដី & សណ្ឋានដី (Soil & Topography)
                    </label>
                    <input
                      type="text"
                      placeholder="ដីកសិកម្ម ដីឥដ្ឋ ដីខ្សាច់..."
                      value={formData.soilAndTopography}
                      onChange={(e) => setFormData({ ...formData, soilAndTopography: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ធនធានទឹកលើដី (Surface Water)
                    </label>
                    <input
                      type="text"
                      placeholder="ស្ទឹង និងទឹកភ្លៀងពីតំបន់ខ្ពង់រាប..."
                      value={formData.surfaceWaterResources}
                      onChange={(e) => setFormData({ ...formData, surfaceWaterResources: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ធនធានទឹកក្រោមដី (Groundwater)
                    </label>
                    <input
                      type="text"
                      placeholder="កម្រិត និងការប្រើប្រាស់ទឹកក្រោមដី..."
                      value={formData.groundwaterResources}
                      onChange={(e) => setFormData({ ...formData, groundwaterResources: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រភេទដំណាំ និងវដ្តដាំដុះ (Crops & Seasonality)
                    </label>
                    <input
                      type="text"
                      placeholder="ស្រូវ ២ដង/ឆ្នាំ (ខែ៤-៧ និង ខែ១០-១២)..."
                      value={formData.cropPatternAndSeasonality}
                      onChange={(e) => setFormData({ ...formData, cropPatternAndSeasonality: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ការកាន់កាប់ដី និងទំហំកសិដ្ឋាន (Tenure)
                    </label>
                    <input
                      type="text"
                      placeholder="ដីឯកជន (មធ្យម ៥ ហិកតា/នាក់)..."
                      value={formData.farmSizeAndTenure}
                      onChange={(e) => setFormData({ ...formData, farmSizeAndTenure: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ស្ថាប័នពាក់ព័ន្ធ & សហគមន៍កសិករ (FWUC)
                    </label>
                    <input
                      type="text"
                      placeholder="សកបទ (FWUC), អាជ្ញាធរមូលដ្ឋាន..."
                      value={formData.fwucStatusAndInstitutions}
                      onChange={(e) => setFormData({ ...formData, fwucStatusAndInstitutions: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ការអនុវត្តដាំដុះ & គ្រឿងចក្រ (Practices & Equipment)
                    </label>
                    <input
                      type="text"
                      placeholder="ប្រើគ្រឿងចក្រ, ម៉ាស៊ីនបូមទឹក និងប្រព័ន្ធអគ្គីសនី..."
                      value={formData.farmingPracticesAndPumping}
                      onChange={(e) => setFormData({ ...formData, farmingPracticesAndPumping: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: RATIONALE */}
            {activeFormTab === 6 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>🎯 ជំពូកទី ៦៖ មូលហេតុដែលជ្រើសរើសអនុគម្រោង (Rationale & Integration)</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    មូលហេតុចម្បងក្នុងការជ្រើសរើសអនុគម្រោង
                  </label>
                  <textarea
                    rows={3}
                    placeholder="១. ជាតំបន់មានប្រភពទឹកច្បាស់លាស់ 
២. មានសក្តានុពលដាំដុះ 
៣. កាត់បន្ថយទឹកជំនន់ ៨០%..."
                    value={formData.subprojectRationale}
                    onChange={(e) => setFormData({ ...formData, subprojectRationale: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ឧបសគ្គ និងបញ្ហាប្រឈមដែលត្រូវដោះស្រាយ
                    </label>
                    <textarea
                      rows={3}
                      placeholder="១. តំបន់លិចលង់រហ័ស 
២. មិនទាន់មានប្រព័ន្ធប្រឡាយរំដោះទឹក..."
                      value={formData.constraintsAddressed}
                      onChange={(e) => setFormData({ ...formData, constraintsAddressed: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផលប្រយោជន៍រំពឹងទុក (បរិស្ថាន សេដ្ឋកិច្ច យេនឌ័រ)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="លើកកម្ពស់ជីវភាព កាត់បន្ថយភាពក្រីក្រ បង្កើនការងារដល់ស្ត្រី..."
                      value={formData.expectedBenefits}
                      onChange={(e) => setFormData({ ...formData, expectedBenefits: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ការផ្សារភ្ជាប់ទៅក្នុងផែនការគ្រប់គ្រងអាងទន្លេ (Integration into Basin Plan)
                  </label>
                  <input
                    type="text"
                    placeholder="តើអនុគម្រោងបំពេញបន្ថែមយ៉ាងដូចម្តេចដល់ហេដ្ឋារចនាសម្ព័ន្ធដទៃក្នុងអាង..."
                    value={formData.integrationIntoBasinPlan}
                    onChange={(e) => setFormData({ ...formData, integrationIntoBasinPlan: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 7: MODERNISATION */}
            {activeFormTab === 7 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>💡 ជំពូកទី ៧៖ ទំនើបកម្មដែលបានស្នើឡើង (Proposed Modernisation)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ១. ធ្វើទំនើបកម្មប្រព័ន្ធប្រឡាយ និងកាត់បន្ថយការបាត់បង់ទឹក
                    </label>
                    <textarea
                      rows={2}
                      placeholder="កាត់បន្ថយការបាត់បង់ទឹក និងធ្វើទំនើបកម្មសំណង់ចែកចាយ..."
                      value={formData.modernizationCanalDistribution}
                      onChange={(e) => setFormData({ ...formData, modernizationCanalDistribution: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ២. ការប្រើប្រាស់ប្រព័ន្ធទុយោ (Piped Systems)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ប្រព័ន្ធទុយោសម្ពាធ ឬទំនាញ..."
                      value={formData.pipeDistributionSystems}
                      onChange={(e) => setFormData({ ...formData, pipeDistributionSystems: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ៣. ការគ្រប់គ្រងទឹកជំនន់ និងប្រព័ន្ធដោះទឹក (Flood & Drainage)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="រៀបចំសណ្តរ និងប្រឡាយដោះទឹកជំនន់..."
                      value={formData.floodManagementDrainage}
                      onChange={(e) => setFormData({ ...formData, floodManagementDrainage: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ៤. ការធ្វើផ្លូវអធិការកិច្ច (Inspection Roads)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ផ្លូវអធិការកិច្ចតាមខ្នងប្រឡាយ..."
                      value={formData.inspectionAccessRoads}
                      onChange={(e) => setFormData({ ...formData, inspectionAccessRoads: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ៥. ឧបករណ៍ សម្ភារៈ និងអគារគ្រប់គ្រង (Facilities & Equipment)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ប្រព័ន្ធតាមដានកម្ពស់ទឹក ឧបករណ៍វាស់វែង និងអគារ..."
                      value={formData.managementEquipmentFacilities}
                      onChange={(e) => setFormData({ ...formData, managementEquipmentFacilities: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ៦. ការជួយគាំទ្រផ្នែកកសិកម្ម (Agricultural Support)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ការបណ្តុះបណ្តាលកសិករ ទីផ្សារកសិផល..."
                      value={formData.agriculturalSupportServices}
                      onChange={(e) => setFormData({ ...formData, agriculturalSupportServices: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ៧. ការបង្កើតស្ថាប័ន ការប្រមូលវិភាគទាន និងការថែទាំ O&M
                    </label>
                    <input
                      type="text"
                      placeholder="បង្កើត និងពង្រឹង FWUC, ការប្រមូលវិភាគទានសេវាទឹក (ISC) និងនិរន្តរភាព O&M..."
                      value={formData.institutionalSustainabilityOandM}
                      onChange={(e) => setFormData({ ...formData, institutionalSustainabilityOandM: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: COSTS */}
            {activeFormTab === 8 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>💰 ជំពូកទី ៨៖ តម្លៃប៉ាន់ស្មាន (Indicative Costs)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      តម្លៃប៉ាន់ស្មានសរុប (USD)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="18500000"
                      value={formData.totalEstimatedCostUsd}
                      onChange={(e) => {
                        const total = e.target.value;
                        const area = formData.commandAreaEstimateHa || formData.postProjectWetSeasonAreaHa;
                        const perHa = total && area && Number(area) > 0 ? (Number(total) / Number(area)).toFixed(2) : formData.costPerHectareUsd;
                        setFormData({ ...formData, totalEstimatedCostUsd: total, costPerHectareUsd: perHa });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      តម្លៃប៉ាន់ស្មានក្នុង ១ ហិកតា ($/ha)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="528"
                      value={formData.costPerHectareUsd}
                      onChange={(e) => setFormData({ ...formData, costPerHectareUsd: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      កម្ពស់បូមទឹក (ម៉ែត្រ) - បើមាន
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="3.5"
                      value={formData.pumpingLiftMeters}
                      onChange={(e) => setFormData({ ...formData, pumpingLiftMeters: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      បរិមាណបូមទឹក (លីត្រ/វិនាទី)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="850"
                      value={formData.pumpingDischargeLs}
                      onChange={(e) => setFormData({ ...formData, pumpingDischargeLs: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ការបែងចែកចំណាយ និងមុខសញ្ញាចំណាយធំៗ
                  </label>
                  <textarea
                    rows={3}
                    placeholder="តម្លៃប៉ាន់ស្មានស្តារឡើងវិញ សំណង់ស្ទាក់ទឹក ប្រឡាយមេ-រង..."
                    value={formData.costBreakdownMajorItems}
                    onChange={(e) => setFormData({ ...formData, costBreakdownMajorItems: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 9: CONSULTATIONS */}
            {activeFormTab === 9 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>👥 ជំពូកទី ៩៖ ការពិគ្រោះយោបល់ និងផលប្រយោជន៍កសិករ (Consultations & Farmer Interest)</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    កិច្ចប្រជុំពិគ្រោះយោបល់ជាមួយភាគីពាក់ព័ន្ធ
                  </label>
                  <textarea
                    rows={3}
                    placeholder="មានការចូលរួមពីមន្ទីរធនធានទឹក និងឧតុនិយម អាជ្ញាធរមូលដ្ឋាន..."
                    value={formData.stakeholderConsultationsDetails}
                    onChange={(e) => setFormData({ ...formData, stakeholderConsultationsDetails: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ផលប្រយោជន៍ចម្បងៗរបស់កសិករ (Farmer Benefits)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="១. ដំណាំមានទីផ្សារ និងតម្លៃសមរម្យ 
២. ការប្តូរមកប្រើទំនើបកម្មកសិកម្ម 
៣. ចង់បានប្រព័ន្ធស្រោចស្រពគ្រប់ជ្រុងជ្រោយ..."
                    value={formData.majorFarmerBenefits}
                    onChange={(e) => setFormData({ ...formData, majorFarmerBenefits: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 10: SAFEGUARDS & ATTACHMENTS */}
            {activeFormTab === 10 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>🛡️ ជំពូកទី ១០៖ ផលប៉ះពាល់សង្គម បរិស្ថាន និងឧបសម្ព័ន្ធ (Safeguards & Attachments)</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ការធានាមិនប៉ះពាល់តំបន់ការពារ និងតំបន់អភិរក្ស * (Environmental Safeguards)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="សូមធានាថាការអនុវត្តអនុគម្រោងនេះ មិនធ្វើឱ្យប៉ះពាល់ដល់តំបន់អភិរក្ស និងតំបន់ការពារណាមួយឡើយ..."
                    value={formData.environmentalImpactsProtection}
                    onChange={(e) => setFormData({ ...formData, environmentalImpactsProtection: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ផលប៉ះពាល់ការផ្លាស់ទីផ្ទះសម្បែង (Resettlement Impacts)
                    </label>
                    <input
                      type="text"
                      placeholder="គ្មានការផ្លាស់ទីផ្ទះសម្បែង ឬមានតិចតួច..."
                      value={formData.resettlementImpacts}
                      onChange={(e) => setFormData({ ...formData, resettlementImpacts: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ការបាត់បង់ទ្រព្យសម្បត្តិ (Loss of Assets)
                    </label>
                    <input
                      type="text"
                      placeholder="ប៉ះពាល់តិចតួចលើដីកសិកម្មតាមខ្នងប្រឡាយ..."
                      value={formData.lossOfAssetsImpacts}
                      onChange={(e) => setFormData({ ...formData, lossOfAssetsImpacts: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-2">ឧបសម្ព័ន្ធ ផែនទី និងកំណត់សម្គាល់បន្ថែម</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">កំណត់សម្គាល់ផែនទីអាងទន្លេ</label>
                      <input
                        type="text"
                        placeholder="ផែនទីបង្ហាញទីតាំង និងវិសាលភាព..."
                        value={formData.mapRiverBasinNotes}
                        onChange={(e) => setFormData({ ...formData, mapRiverBasinNotes: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">កំណត់សម្គាល់ដ្យាក្រាមអាងទន្លេ</label>
                      <input
                        type="text"
                        placeholder="ដ្យាក្រាមបង្ហាញហេដ្ឋារចនាសម្ព័ន្ធ..."
                        value={formData.schematicRiverBasinNotes}
                        onChange={(e) => setFormData({ ...formData, schematicRiverBasinNotes: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">កំណត់សម្គាល់ផែនទីអនុគម្រោង</label>
                      <input
                        type="text"
                        placeholder="ផែនទីបង្ហាញផ្ទៃដីស្រោចស្រព..."
                        value={formData.mapSubprojectNotes}
                        onChange={(e) => setFormData({ ...formData, mapSubprojectNotes: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={activeFormTab === 1}
                onClick={() => setActiveFormTab((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 rounded-lg"
              >
                ← ជំពូកមុន
              </button>

              <div className="flex items-center gap-2">
                {activeFormTab < 10 ? (
                  <button
                    type="button"
                    onClick={() => setActiveFormTab((prev) => Math.min(10, prev + 1))}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    ជំពូកបន្ទាប់ →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm"
                  >
                    {isSubmitting ? "កំពុងរក្សាទុក..." : editingId ? "រក្សាទុកការកែប្រែ" : "ដាក់ស្នើសំណើអនុគម្រោង"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

