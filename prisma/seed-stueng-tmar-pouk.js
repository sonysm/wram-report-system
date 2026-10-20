require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedStuengTmarPouk() {
  console.log("Starting Stueng Tmar Pouk Sub-basin seeding...");

  // 1. Locate Banteay Meanchey province and districts
  let province = await prisma.province.findFirst({
    where: {
      OR: [
        { name: { contains: "Banteay Meanchey", mode: "insensitive" } },
        { khmerName: { contains: "បន្ទាយមានជ័យ" } },
      ],
    },
    include: { districts: true },
  });

  if (!province) {
    console.log("Province Banteay Meanchey not found, creating baseline...");
    province = await prisma.province.create({
      data: {
        name: "Banteay Meanchey",
        khmerName: "បន្ទាយមានជ័យ",
        code: "KH-2",
        postalCode: 1000,
        sortOrder: 1,
      },
      include: { districts: true },
    });
  }

  // Find or map districts
  const thmaPuokDistrict = province.districts.find(
    (d) => d.name.toLowerCase().includes("thma") || d.name.toLowerCase().includes("tmar") || d.khmerName.includes("ថ្មពួក")
  ) || province.districts[0];

  const svayChekDistrict = province.districts.find(
    (d) => d.name.toLowerCase().includes("svay chek") || d.khmerName.includes("ស្វាយចេក")
  ) || province.districts[0];

  const phnumSrokDistrict = province.districts.find(
    (d) => d.name.toLowerCase().includes("phnum srok") || d.name.toLowerCase().includes("phnom srok") || d.khmerName.includes("ភ្នំស្រុក")
  ) || province.districts[0];

  // 2. Create or Update Basin
  const basin = await prisma.basin.upsert({
    where: { code: "BASIN-TMP-01" },
    update: {
      name: "Stueng Tmar Pouk Irrigation Sub-basin",
      khmerName: "អនុប្រព័ន្ធធារាសាស្ត្រ និងគ្រប់គ្រងទឹកស្ទឹងថ្មពួក",
      provinceId: province.id,
      mainRiverLengthKm: 55.0,
      tributaryLengthKm: 24.0,
      drySeasonCapacityHa: 5000.0,
      wetSeasonCapacityHa: 30000.0,
      avgParcelAreaHa: 5.0,
      coordinateX: 276528,
      coordinateY: 1549682,
      latitude: 14.015,
      longitude: 102.932,
      description: "Sub-basin spanning Tmar Pouk, Svay Chek, and Phnom Srok districts in Banteay Meanchey with cross-border inflows from Thailand and highland plateau runoff from Oddar Meanchey.",
    },
    create: {
      code: "BASIN-TMP-01",
      name: "Stueng Tmar Pouk Irrigation Sub-basin",
      khmerName: "អនុប្រព័ន្ធធារាសាស្ត្រ និងគ្រប់គ្រងទឹកស្ទឹងថ្មពួក",
      provinceId: province.id,
      mainRiverLengthKm: 55.0,
      tributaryLengthKm: 24.0,
      drySeasonCapacityHa: 5000.0,
      wetSeasonCapacityHa: 30000.0,
      avgParcelAreaHa: 5.0,
      coordinateX: 276528,
      coordinateY: 1549682,
      latitude: 14.015,
      longitude: 102.932,
      description: "Sub-basin spanning Tmar Pouk, Svay Chek, and Phnom Srok districts in Banteay Meanchey with cross-border inflows from Thailand and highland plateau runoff from Oddar Meanchey.",
    },
  });
  console.log(`Basin ready: ${basin.code} (${basin.khmerName})`);

  // 3. Environmental & Conservation Safeguard Boundaries
  const protectedZonesData = [
    {
      zoneName: "Banteay Chhmar Protected Landscape",
      zoneType: "PROTECTED_LANDSCAPE",
      minX: 285000,
      maxX: 315000,
      minY: 1555000,
      maxY: 1585000,
      minLat: 14.05,
      maxLat: 14.25,
      minLng: 102.98,
      maxLng: 103.15,
      restrictionLevel: "STRICT_NO_CONSTRUCTION",
      notes: "តំបន់ទេសភាពការពារបន្ទាយឆ្មារ - ហាមដាច់ខាតការកាប់ឆ្ការព្រៃ ឬសាងសង់ហេដ្ឋារចនាសម្ព័ន្ធរំលោភលើដែនជម្រក",
    },
    {
      zoneName: "Ang Trapeng Thmor Sarus Crane Reserve",
      zoneType: "WILDLIFE_SANCTUARY",
      minX: 300000,
      maxX: 330000,
      minY: 1515000,
      maxY: 1540000,
      minLat: 13.75,
      maxLat: 13.92,
      minLng: 103.10,
      maxLng: 103.35,
      restrictionLevel: "BUFFER_ZONE_PERMIT_REQUIRED",
      notes: "តំបន់អភិរក្សសត្វក្រៀល និងដីសើមអាងត្រពាំងថ្ម - ត្រូវមានការត្រួតពិនិត្យផលប៉ះពាល់បរិស្ថានជាមុន",
    },
  ];

  for (const pz of protectedZonesData) {
    const existingPz = await prisma.basinProtectedZone.findFirst({
      where: { basinId: basin.id, zoneName: pz.zoneName },
    });
    if (!existingPz) {
      await prisma.basinProtectedZone.create({
        data: {
          basinId: basin.id,
          ...pz,
        },
      });
    }
  }

  // 4. Physical Control Structures: 4 Cross-river Diversion Weirs/Dams
  const weirsData = [
    {
      code: "WEIR-TMP-01",
      name: "Upper Tmar Pouk Headworks Diversion Weir",
      khmerName: "ទំនប់ពង្វាងទឹកក្បាលស្ទឹងថ្មពួក (Headworks Weir)",
      structureType: "DIVERSION_WEIR",
      districtId: thmaPuokDistrict?.id,
      locationX: 276528,
      locationY: 1549682,
      latitude: 14.015,
      longitude: 102.932,
      gateCount: 4,
      currentGateOpeningPercent: 65,
      currentDischargeM3s: 24.8,
      maxDesignCapacityM3s: 65.0,
      upstreamWaterLevelM: 4.85,
      downstreamWaterLevelM: 3.12,
      floodMitigationRole: true,
      status: "OPERATIONAL",
    },
    {
      code: "WEIR-TMP-02",
      name: "Svay Chek Central Diversion Dam",
      khmerName: "ទំនប់ពង្វាងទឹកស្ទឹងស្វាយចេកកណ្តាល (Central Dam)",
      structureType: "DIVERSION_WEIR",
      districtId: svayChekDistrict?.id,
      locationX: 284100,
      locationY: 1538200,
      latitude: 13.912,
      longitude: 103.002,
      gateCount: 5,
      currentGateOpeningPercent: 50,
      currentDischargeM3s: 18.5,
      maxDesignCapacityM3s: 70.0,
      upstreamWaterLevelM: 4.20,
      downstreamWaterLevelM: 2.85,
      floodMitigationRole: true,
      status: "OPERATIONAL",
    },
    {
      code: "WEIR-TMP-03",
      name: "Phnum Srok Downstream Diversion Weir",
      khmerName: "ទំនប់ពង្វាងទឹកស្ទឹងភ្នំស្រុក (Downstream Weir)",
      structureType: "DIVERSION_WEIR",
      districtId: phnumSrokDistrict?.id,
      locationX: 295300,
      locationY: 1529100,
      latitude: 13.830,
      longitude: 103.105,
      gateCount: 4,
      currentGateOpeningPercent: 40,
      currentDischargeM3s: 14.2,
      maxDesignCapacityM3s: 55.0,
      upstreamWaterLevelM: 3.65,
      downstreamWaterLevelM: 2.40,
      floodMitigationRole: true,
      status: "OPERATIONAL",
    },
    {
      code: "WEIR-TMP-04",
      name: "Trapeang Thmor Feeder & Regulatory Weir",
      khmerName: "ទំនប់ពង្វាង និងនិយ័តកម្មបញ្ជូនទឹកត្រពាំងថ្ម (Reservoir Feeder)",
      structureType: "DIVERSION_WEIR",
      districtId: phnumSrokDistrict?.id,
      locationX: 304200,
      locationY: 1521400,
      latitude: 13.760,
      longitude: 103.188,
      gateCount: 6,
      currentGateOpeningPercent: 55,
      currentDischargeM3s: 28.0,
      maxDesignCapacityM3s: 85.0,
      upstreamWaterLevelM: 5.10,
      downstreamWaterLevelM: 3.50,
      floodMitigationRole: true,
      status: "OPERATIONAL",
    },
  ];

  const createdWeirs = [];
  for (const w of weirsData) {
    const weir = await prisma.hydraulicStructure.upsert({
      where: { code: w.code },
      update: { ...w, basinId: basin.id },
      create: { ...w, basinId: basin.id },
    });
    createdWeirs.push(weir);
  }
  console.log(`4 Diversion Weirs/Dams ready.`);

  // 5. 16 Water Distribution Control Structures (Intakes, Regulators, Pumping Lifts, Drainage Gates)
  const createdControls = [];
  for (let i = 1; i <= 16; i++) {
    const parentWeir = createdWeirs[(i - 1) % 4];
    const code = `CTRL-TMP-${String(i).padStart(2, "0")}`;
    const isPumping = i === 7 || i === 14;
    const isDrainage = i === 4 || i === 8 || i === 12 || i === 16;
    const type = isPumping ? "PUMPING_LIFT" : isDrainage ? "DRAINAGE_GATE" : "DISTRIBUTION_CONTROL";

    const ctrl = await prisma.hydraulicStructure.upsert({
      where: { code },
      update: {
        name: `Distribution Control Structure #${i}`,
        khmerName: `សំណង់ចែកចាយ និងបញ្ជាទឹកទី ${i} (${parentWeir.khmerName.split("(")[0].trim()})`,
        basinId: basin.id,
        structureType: type,
        districtId: parentWeir.districtId,
        locationX: (parentWeir.locationX || 280000) + (i * 1200),
        locationY: (parentWeir.locationY || 1535000) + ((i % 3) * 850),
        latitude: (parentWeir.latitude || 13.9) + (i * 0.008),
        longitude: (parentWeir.longitude || 103.0) + (i * 0.007),
        gateCount: isPumping ? 2 : 2 + (i % 3),
        currentGateOpeningPercent: 30 + (i * 3.5) % 60,
        currentDischargeM3s: +(1.8 + (i * 0.35)).toFixed(2),
        maxDesignCapacityM3s: +(8.0 + (i % 5)).toFixed(1),
        upstreamWaterLevelM: +(2.5 + (i * 0.12)).toFixed(2),
        downstreamWaterLevelM: +(1.6 + (i * 0.1)).toFixed(2),
        floodMitigationRole: isDrainage || isPumping,
        status: "OPERATIONAL",
      },
      create: {
        code,
        name: `Distribution Control Structure #${i}`,
        khmerName: `សំណង់ចែកចាយ និងបញ្ជាទឹកទី ${i} (${parentWeir.khmerName.split("(")[0].trim()})`,
        basinId: basin.id,
        structureType: type,
        districtId: parentWeir.districtId,
        locationX: (parentWeir.locationX || 280000) + (i * 1200),
        locationY: (parentWeir.locationY || 1535000) + ((i % 3) * 850),
        latitude: (parentWeir.latitude || 13.9) + (i * 0.008),
        longitude: (parentWeir.longitude || 103.0) + (i * 0.007),
        gateCount: isPumping ? 2 : 2 + (i % 3),
        currentGateOpeningPercent: 30 + (i * 3.5) % 60,
        currentDischargeM3s: +(1.8 + (i * 0.35)).toFixed(2),
        maxDesignCapacityM3s: +(8.0 + (i % 5)).toFixed(1),
        upstreamWaterLevelM: +(2.5 + (i * 0.12)).toFixed(2),
        downstreamWaterLevelM: +(1.6 + (i * 0.1)).toFixed(2),
        floodMitigationRole: isDrainage || isPumping,
        status: "OPERATIONAL",
      },
    });
    createdControls.push(ctrl);
  }
  console.log(`16 Distribution Control Structures ready.`);

  // 6. Canal Hierarchy: 16 Main Canals (48 km total, 3 km each)
  const createdMainCanals = [];
  for (let m = 1; m <= 16; m++) {
    const code = `MC-${String(m).padStart(2, "0")}`;
    const parentCtrl = createdControls[m - 1];
    const isModernPipeConnected = m % 3 === 0;

    const mc = await prisma.canal.upsert({
      where: { code },
      update: {
        name: `Main Canal #${m}`,
        khmerName: `ប្រឡាយមេខ្សែទី ${m} (MC-${String(m).padStart(2, "0")})`,
        basinId: basin.id,
        parentStructureId: parentCtrl.id,
        canalType: "MAIN",
        lengthKm: 3.0, // 16 * 3 = 48 km
        designDischargeM3s: 6.5,
        currentFlowM3s: +(3.8 + (m % 4) * 0.5).toFixed(2),
        conveyanceEfficiencyPercent: +(82.0 + (m % 10) * 1.2).toFixed(1),
        linedSectionKm: +(2.0 + (m % 2) * 0.5).toFixed(1),
        unlinedSectionKm: +(1.0 - (m % 2) * 0.5).toFixed(1),
        inspectionRoadCondition: m === 5 ? "FAIR" : m === 11 ? "DAMAGED" : "GOOD",
        liningIntegrityStatus: m === 11 ? "CRACKED" : "INTACT",
        commandAreaHa: +(1500.0 + (m * 80)).toFixed(0),
      },
      create: {
        code,
        name: `Main Canal #${m}`,
        khmerName: `ប្រឡាយមេខ្សែទី ${m} (MC-${String(m).padStart(2, "0")})`,
        basinId: basin.id,
        parentStructureId: parentCtrl.id,
        canalType: "MAIN",
        lengthKm: 3.0,
        designDischargeM3s: 6.5,
        currentFlowM3s: +(3.8 + (m % 4) * 0.5).toFixed(2),
        conveyanceEfficiencyPercent: +(82.0 + (m % 10) * 1.2).toFixed(1),
        linedSectionKm: +(2.0 + (m % 2) * 0.5).toFixed(1),
        unlinedSectionKm: +(1.0 - (m % 2) * 0.5).toFixed(1),
        inspectionRoadCondition: m === 5 ? "FAIR" : m === 11 ? "DAMAGED" : "GOOD",
        liningIntegrityStatus: m === 11 ? "CRACKED" : "INTACT",
        commandAreaHa: +(1500.0 + (m * 80)).toFixed(0),
      },
    });
    createdMainCanals.push(mc);
  }
  console.log(`16 Main Canals (48 km total) ready.`);

  // 7. 48 Secondary Canals (96 km total, 2 km each, 3 per Main Canal)
  const createdSecondaryCanals = [];
  let scCounter = 1;
  for (const parentMc of createdMainCanals) {
    for (let s = 1; s <= 3; s++) {
      const code = `SC-${String(scCounter).padStart(2, "0")}`;
      const isPipe = scCounter % 8 === 0;
      const canalType = isPipe ? "PRESSURIZED_PIPE" : "SECONDARY";

      const sc = await prisma.canal.upsert({
        where: { code },
        update: {
          name: `Secondary Canal #${scCounter} (${parentMc.code})`,
          khmerName: isPipe
            ? `បណ្តាញបំពង់ចែកចាយសម្ពាធទី ${scCounter} (${parentMc.khmerName.split("(")[0].trim()})`
            : `ប្រឡាយរងខ្សែទី ${scCounter} (${parentMc.khmerName.split("(")[0].trim()})`,
          basinId: basin.id,
          parentCanalId: parentMc.id,
          parentStructureId: parentMc.parentStructureId,
          canalType,
          lengthKm: 2.0, // 48 * 2 = 96 km
          designDischargeM3s: isPipe ? 1.5 : 2.2,
          currentFlowM3s: +(0.8 + (scCounter % 5) * 0.25).toFixed(2),
          conveyanceEfficiencyPercent: isPipe ? 96.5 : +(84.0 + (scCounter % 8) * 1.1).toFixed(1),
          linedSectionKm: isPipe ? 2.0 : +(1.2 + (scCounter % 3) * 0.3).toFixed(1),
          unlinedSectionKm: isPipe ? 0 : +(0.8 - (scCounter % 3) * 0.3).toFixed(1),
          inspectionRoadCondition: scCounter % 15 === 0 ? "FAIR" : "GOOD",
          liningIntegrityStatus: scCounter === 18 ? "ERODED" : "INTACT",
          commandAreaHa: +(550.0 + (scCounter * 12)).toFixed(0),
        },
        create: {
          code,
          name: `Secondary Canal #${scCounter} (${parentMc.code})`,
          khmerName: isPipe
            ? `បណ្តាញបំពង់ចែកចាយសម្ពាធទី ${scCounter} (${parentMc.khmerName.split("(")[0].trim()})`
            : `ប្រឡាយរងខ្សែទី ${scCounter} (${parentMc.khmerName.split("(")[0].trim()})`,
          basinId: basin.id,
          parentCanalId: parentMc.id,
          parentStructureId: parentMc.parentStructureId,
          canalType,
          lengthKm: 2.0,
          designDischargeM3s: isPipe ? 1.5 : 2.2,
          currentFlowM3s: +(0.8 + (scCounter % 5) * 0.25).toFixed(2),
          conveyanceEfficiencyPercent: isPipe ? 96.5 : +(84.0 + (scCounter % 8) * 1.1).toFixed(1),
          linedSectionKm: isPipe ? 2.0 : +(1.2 + (scCounter % 3) * 0.3).toFixed(1),
          unlinedSectionKm: isPipe ? 0 : +(0.8 - (scCounter % 3) * 0.3).toFixed(1),
          inspectionRoadCondition: scCounter % 15 === 0 ? "FAIR" : "GOOD",
          liningIntegrityStatus: scCounter === 18 ? "ERODED" : "INTACT",
          commandAreaHa: +(550.0 + (scCounter * 12)).toFixed(0),
        },
      });
      createdSecondaryCanals.push(sc);
      scCounter++;
    }
  }
  console.log(`48 Secondary Canals (96 km total) ready.`);

  // 8. FWUC Water User Groups (សកបទមូលដ្ឋាន)
  const existingFwucs = await prisma.fwuc.findMany({ where: { provinceId: province.id } });
  const baseFwucId = existingFwucs[0]?.id || null;

  const wugData = [
    {
      code: "WUG-TMP-01",
      name: "Tmar Pouk Central Farmers Group",
      khmerName: "ក្រុមអ្នកប្រើប្រាស់ទឹកថ្មពួកកណ្តាល",
      canalId: createdMainCanals[0].id,
      districtId: thmaPuokDistrict?.id,
      villageName: "ភូមិថ្មពួក ឃុំថ្មពួក",
      leaderName: "លោក សុខ វិបុល",
      leaderContact: "012 889 911",
      totalFarmersCount: 65,
      totalParcelAreaHa: 325.0, // 65 * 5 = 325 ha
    },
    {
      code: "WUG-TMP-02",
      name: "Koumrou Modern Pipe Irrigation Block",
      khmerName: "ប្លុកចែកចាយទឹកបំពង់សម្ពាធគំរូ",
      canalId: createdSecondaryCanals[7].id,
      districtId: thmaPuokDistrict?.id,
      villageName: "ភូមិគំរូ ឃុំគំរូ",
      leaderName: "អ្នកស្រី ម៉ៅ សុផល",
      leaderContact: "097 554 4321",
      totalFarmersCount: 48,
      totalParcelAreaHa: 240.0,
    },
    {
      code: "WUG-TMP-03",
      name: "Svay Chek North Water Users",
      khmerName: "សហគមន៍កសិករប្រើប្រាស់ទឹកស្វាយចេកជើង",
      canalId: createdMainCanals[4].id,
      districtId: svayChekDistrict?.id,
      villageName: "ភូមិស្វាយចេក ឃុំស្វាយចេក",
      leaderName: "លោក ហេង ចាន់ថន",
      leaderContact: "088 776 6554",
      totalFarmersCount: 82,
      totalParcelAreaHa: 410.0,
    },
    {
      code: "WUG-TMP-04",
      name: "Phnum Srok - Trapeang Thmor Downstream Cluster",
      khmerName: "បណ្តុំកសិករភ្នំស្រុក-អាងត្រពាំងថ្ម",
      canalId: createdMainCanals[12].id,
      districtId: phnumSrokDistrict?.id,
      villageName: "ភូមិពញាក្រែក ឃុំពញាក្រែក",
      leaderName: "លោក ឌុច សារ៉ន",
      leaderContact: "011 234 567",
      totalFarmersCount: 110,
      totalParcelAreaHa: 550.0,
    },
  ];

  const createdWugs = [];
  for (const w of wugData) {
    const wug = await prisma.waterUserGroup.upsert({
      where: { code: w.code },
      update: {
        ...w,
        basinId: basin.id,
        fwucId: baseFwucId,
      },
      create: {
        ...w,
        basinId: basin.id,
        fwucId: baseFwucId,
      },
    });
    createdWugs.push(wug);
  }
  console.log(`4 Water User Groups seeded.`);

  // 9. Telemetry & Inflow Monitoring (Gate & Weir, Cross-border, Anomaly Detection)
  const sampleTelemetry = [
    {
      basinId: basin.id,
      structureId: createdWeirs[0].id,
      sourceOrigin: "CROSS_BORDER_THAILAND",
      timestamp: new Date(Date.now() - 3600 * 1000 * 2),
      dischargeM3s: 14.8,
      gateOpeningPercent: 60.0,
      waterLevelM: 4.82,
      turbidityNtu: 24.5,
      anomalyDetected: false,
      notes: "Steady cross-border inflow from Thai border catchment.",
    },
    {
      basinId: basin.id,
      structureId: createdWeirs[0].id,
      sourceOrigin: "ODDAR_MEANCHEY_PLATEAU",
      timestamp: new Date(Date.now() - 3600 * 1000 * 5),
      dischargeM3s: 38.2,
      gateOpeningPercent: 85.0,
      waterLevelM: 5.45,
      turbidityNtu: 88.0,
      anomalyDetected: true,
      anomalyReason: "High highland plateau runoff surge detected from Oddar Meanchey (Dangrek range flash inflow).",
      notes: "Early warning gate control triggered to prevent bank overtopping.",
    },
    {
      basinId: basin.id,
      structureId: createdWeirs[1].id,
      sourceOrigin: "STUENG_TMAR_POUK_MAIN",
      timestamp: new Date(Date.now() - 3600 * 1000 * 1),
      dischargeM3s: 18.5,
      gateOpeningPercent: 50.0,
      waterLevelM: 4.20,
      turbidityNtu: 32.0,
      anomalyDetected: false,
      notes: "Main river conveyance at 55 km marker running at 86% conveyance efficiency.",
    },
    {
      basinId: basin.id,
      structureId: createdWeirs[2].id,
      sourceOrigin: "TRIBUTARY",
      timestamp: new Date(Date.now() - 3600 * 1000 * 3),
      dischargeM3s: 6.4,
      gateOpeningPercent: 45.0,
      waterLevelM: 2.95,
      turbidityNtu: 18.2,
      anomalyDetected: false,
      notes: "Secondary tributary 24 km reach inflow normal.",
    },
  ];

  for (const t of sampleTelemetry) {
    await prisma.inflowTelemetryLog.create({ data: t });
  }
  console.log(`Sample Inflow Telemetry Logs recorded.`);

  // 10. Multi-Season Command Area Scheduling & Water Allocation
  const allocationsData = [
    {
      basinId: basin.id,
      seasonName: "DRY_SEASON",
      year: 2026,
      cropSeasonCode: "DRY_SEASON_EXPANSION",
      plannedAreaHa: 5000.0, // Scaled from 3,000 ha to 5,000 ha
      allocatedWaterM3: 42500000.0,
      dispatchedWaterM3: 31200000.0,
      openCanalSharePercent: 70.0,
      pipeDistributionSharePercent: 30.0,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-04-15"),
      status: "COMPLETED",
    },
    {
      basinId: basin.id,
      seasonName: "WET_SEASON",
      year: 2026,
      cropSeasonCode: "S1_APR_JUL", // Season 1: April to July
      plannedAreaHa: 14000.0,
      allocatedWaterM3: 98000000.0,
      dispatchedWaterM3: 94500000.0,
      openCanalSharePercent: 78.0,
      pipeDistributionSharePercent: 22.0,
      startDate: new Date("2026-04-20"),
      endDate: new Date("2026-07-31"),
      status: "COMPLETED",
    },
    {
      basinId: basin.id,
      seasonName: "WET_SEASON",
      year: 2026,
      cropSeasonCode: "S2_OCT_DEC", // Season 2: October to December
      plannedAreaHa: 30000.0, // Scaled up to 30,000 ha
      allocatedWaterM3: 210000000.0,
      dispatchedWaterM3: 135000000.0,
      openCanalSharePercent: 75.0,
      pipeDistributionSharePercent: 25.0,
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-12-31"),
      status: "ACTIVE",
    },
  ];

  for (const alloc of allocationsData) {
    const existingAlloc = await prisma.seasonalWaterAllocation.findFirst({
      where: { basinId: basin.id, year: alloc.year, cropSeasonCode: alloc.cropSeasonCode },
    });
    if (!existingAlloc) {
      await prisma.seasonalWaterAllocation.create({ data: alloc });
    }
  }
  console.log(`Seasonal Water Allocations seeded.`);

  // 11. Flood Risk Mitigation & Surge Alerts (up to 80% flood risk reduction)
  const existingAlert = await prisma.floodSurgeAlert.findFirst({
    where: { basinId: basin.id, activeAlert: true },
  });

  if (!existingAlert) {
    await prisma.floodSurgeAlert.create({
      data: {
        basinId: basin.id,
        alertLevel: "WARNING",
        sourceLocation: "ខ្ពង់រាបឧត្តរមានជ័យ និងជួរភ្នំដងរែក (Dangrek Plateau)",
        peakInflowM3s: 142.5,
        diversionPlanKh: "បើកទ្វារទឹកពង្វាងទំនប់ក្បាលស្ទឹងថ្មពួក ៨០% និងបញ្ជូនលំហូរទឹកលើសទៅកាន់អាងស្តុកត្រពាំងថ្ម ព្រមទាំងបើកទ្វារដោះទឹក CTRL-TMP-04/08 ដើម្បីកាត់បន្ថយគ្រោះទឹកជំនន់រហូតដល់ ៨០%។",
        riskReductionPercent: 80.0,
        gatesCoordinated: [
          { code: "WEIR-TMP-01", gateOpening: 85, mode: "High-level flood diversion" },
          { code: "WEIR-TMP-04", gateOpening: 75, mode: "Emergency intake to Trapeng Thmor reservoir" },
          { code: "CTRL-TMP-04", gateOpening: 90, mode: "Drainage spillway bypass" },
          { code: "CTRL-TMP-08", gateOpening: 90, mode: "Drainage spillway bypass" },
        ],
        activeAlert: true,
      },
    });
    console.log(`Flood Surge Alert & Diversion Control plan seeded.`);
  }

  // 12. Asset O&M Inspection Tickets (with Environmental Safeguard Check)
  const ticketsData = [
    {
      ticketNumber: "TCK-TMP-2026-001",
      basinId: basin.id,
      canalId: createdMainCanals[10].id,
      assetType: "CANAL",
      defectCategory: "LINING_INTEGRITY",
      severity: "HIGH",
      status: "WORK_ORDER_APPROVED",
      locationX: 289400,
      locationY: 1541200,
      latitude: 13.935,
      longitude: 103.045,
      insideProtectedZone: false,
      safeguardValidationPassed: true,
      description: "ស្នាមប្រេះបេតុងបាតប្រឡាយមេ MC-11 ប្រវែង ៤៥ ម៉ែត្រ ធ្វើឲ្យជ្រាបទឹកបាត់បង់ប្រមាណ ១២%។",
      actionTaken: "ក្រុមការងារបច្ចេកទេសមន្ទីរបានអនុម័តប័ណ្ណការងារជួសជុលផ្សារភ្ជាប់ឡើងវិញ។",
    },
    {
      ticketNumber: "TCK-TMP-2026-002",
      basinId: basin.id,
      structureId: createdWeirs[1].id,
      assetType: "WEIR",
      defectCategory: "GATE_LEAKAGE",
      severity: "MEDIUM",
      status: "REPORTED",
      locationX: 284100,
      locationY: 1538200,
      latitude: 13.912,
      longitude: 103.002,
      insideProtectedZone: false,
      safeguardValidationPassed: true,
      description: "កៅស៊ូទប់ទឹកទ្វារលេខ ៣ មានសភាពពុកផុយ បណ្តាលឲ្យជ្រាបទឹក ០.២ m3/s។",
      actionTaken: "រង់ចាំការផ្គត់ផ្គង់គ្រឿងបន្លាស់កៅស៊ូសន្លឹកថ្មី។",
    },
    {
      ticketNumber: "TCK-TMP-2026-003",
      basinId: basin.id,
      assetType: "INSPECTION_ROAD",
      defectCategory: "ROAD_DAMAGE",
      severity: "CRITICAL",
      status: "REJECTED_PROTECTED_ZONE",
      locationX: 298000,
      locationY: 1568000,
      latitude: 14.150,
      longitude: 103.070,
      insideProtectedZone: true,
      protectedZoneName: "Banteay Chhmar Protected Landscape",
      safeguardValidationPassed: false,
      description: "សំណើឈូសឆាយពង្រីកផ្លូវអធិការកិច្ចថ្មីឆ្លងកាត់ព្រៃការពារបន្ទាយឆ្មារ។",
      actionTaken: "ស្វ័យប្រវត្តិតាមប្រព័ន្ធ៖ បដិសេធដាច់ខាតដោយសាររំលោភលើដែនជម្រកអភិរក្សធម្មជាតិ (Environmental Safeguard Triggered)។",
    },
  ];

  for (const t of ticketsData) {
    await prisma.assetInspectionTicket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: t,
      create: t,
    });
  }
  console.log(`Asset O&M inspection tickets seeded.`);

  // 13. FWUC Water Delivery Requests & ISC Billing Records
  const sampleRequest = await prisma.waterDeliveryRequest.upsert({
    where: { requestNumber: "REQ-TMP-2026-089" },
    update: {
      waterUserGroupId: createdWugs[0].id,
      requestType: "WATER_DELIVERY",
      requestedVolumeM3: 45000.0,
      requestedDischargeM3s: 1.2,
      requestedDate: new Date(),
      durationDays: 4,
      cropType: "WET_SEASON_RICE_S2",
      parcelsCount: 22,
      targetAreaHa: 110.0, // 22 parcels * 5 ha = 110 ha
      status: "APPROVED",
      pdwramReviewNotes: "មន្ទីរធនធានទឹកបានអនុម័តបញ្ជូនទឹកតាមប្រឡាយមេ MC-01 រយៈពេល ៤ ថ្ងៃ។",
    },
    create: {
      requestNumber: "REQ-TMP-2026-089",
      waterUserGroupId: createdWugs[0].id,
      requestType: "WATER_DELIVERY",
      requestedVolumeM3: 45000.0,
      requestedDischargeM3s: 1.2,
      requestedDate: new Date(),
      durationDays: 4,
      cropType: "WET_SEASON_RICE_S2",
      parcelsCount: 22,
      targetAreaHa: 110.0,
      status: "APPROVED",
      pdwramReviewNotes: "មន្ទីរធនធានទឹកបានអនុម័តបញ្ជូនទឹកតាមប្រឡាយមេ MC-01 រយៈពេល ៤ ថ្ងៃ។",
    },
  });

  const billingRecords = [
    {
      invoiceNumber: "INV-TMP-2026-001",
      waterUserGroupId: createdWugs[0].id,
      seasonName: "Season 1 (Apr-Jul)",
      year: 2026,
      billingType: "PER_HECTARE",
      ratePerUnit: 60000.0, // 60,000 KHR / ha (~$15)
      totalAreaHa: 325.0, // 65 farmers * 5 ha avg
      totalAmountKhr: 325.0 * 60000.0, // 19,500,000 KHR
      paymentStatus: "PAID",
      collectedAmountKhr: 19500000.0,
      dueDate: new Date("2026-08-15"),
      paidAt: new Date("2026-08-10"),
      notes: "ទូទាត់ពេញលេញសម្រាប់រដូវទី១",
    },
    {
      invoiceNumber: "INV-TMP-2026-002",
      waterUserGroupId: createdWugs[1].id,
      seasonName: "Season 2 (Oct-Dec)",
      year: 2026,
      billingType: "PER_HECTARE",
      ratePerUnit: 65000.0,
      totalAreaHa: 240.0, // 48 farmers * 5 ha avg
      totalAmountKhr: 240.0 * 65000.0, // 15,600,000 KHR
      paymentStatus: "PARTIALLY_PAID",
      collectedAmountKhr: 10000000.0,
      dueDate: new Date("2026-12-25"),
      paidAt: null,
      notes: "បានបង់ប្រាក់កក់មុន ១០,០០០,០០០ រៀល",
    },
    {
      invoiceNumber: "INV-TMP-2026-003",
      waterUserGroupId: createdWugs[2].id,
      seasonName: "Season 2 (Oct-Dec)",
      year: 2026,
      billingType: "PER_HECTARE",
      ratePerUnit: 60000.0,
      totalAreaHa: 410.0, // 82 farmers * 5 ha avg
      totalAmountKhr: 410.0 * 60000.0, // 24,600,000 KHR
      paymentStatus: "UNPAID",
      collectedAmountKhr: 0,
      dueDate: new Date("2026-12-30"),
      paidAt: null,
      notes: "រង់ចាំប្រមូលថ្លៃទឹកបន្ទាប់ពីប្រមូលផលស្រូវរដូវទី២",
    },
  ];

  for (const b of billingRecords) {
    await prisma.iscBillingRecord.upsert({
      where: { invoiceNumber: b.invoiceNumber },
      update: b,
      create: b,
    });
  }
  console.log(`FWUC Requests and ISC Billing records seeded.`);

  console.log("Stueng Tmar Pouk Sub-basin seeding completed successfully! ✨");
}

seedStuengTmarPouk()
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
