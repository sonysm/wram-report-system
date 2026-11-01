require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedSubprojectPlans() {
  console.log("Seeding Subproject Research Plan data from docx...");

  // 1. Locate Banteay Meanchey province
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

  const thmaPuokDistrict = province.districts.find(
    (d) => d.name.toLowerCase().includes("thma") || d.name.toLowerCase().includes("tmar") || d.khmerName.includes("ថ្មពួក")
  ) || province.districts[0] || null;

  // 2. Upsert the Candidate Sub-Project Concept Note from docx
  const tmarPoukPlan = await prisma.subprojectPlan.upsert({
    where: { subprojectCode: "SP-BMC-001" },
    update: {
      subprojectName: "អនុគម្រោងប្រព័ន្ធស្ទឹងថ្មពួក",
      subprojectEnglishName: "Stueng Tmar Pouk Subproject Research & Development Plan",
      provinceId: province.id,
      districtId: thmaPuokDistrict ? thmaPuokDistrict.id : null,
      status: "APPROVED",
      riverBasinName: "ប្រព័ន្ធស្ទឹងថ្មពួក",
      coordinateX: 276528,
      coordinateY: 1549682,
      latitude: 14.015,
      longitude: 102.932,
      keyLocationsDescription: "ប្រព័ន្ធស្ទឹងថ្មពួក ស្ថិតក្នុងស្រុកថ្មពួក ខេត្តបន្ទាយមានជ័យ (X=276528, Y=1549682)",
      catchmentRainfallSource: "មកពីប្រទេសថៃ និងតំបន់ខ្ពង់រាបពីខេត្តឧត្ដរមានជ័យ",
      mainRiverLengthKm: 55.0,
      tributaryLengthKm: 24.0,
      existingDrySeasonAreaHa: 3000.0,
      existingWetSeasonAreaHa: 24000.0,
      postProjectDrySeasonAreaHa: 5000.0,
      postProjectWetSeasonAreaHa: 30000.0,
      avgLandPerPersonHa: 5.0,
      basinOverviewDescription: "ផ្ទៃរងទឹកភ្លៀង៖ មកពីប្រទេសថៃ និងតំបន់ខ្ពង់រាបពីខេត្តឧត្ដរមានជ័យ។ ស្ទឹងចាស់ ប្រវែង ៥៥ គម និងដៃអូរ ២៤ គម។ ផ្ទៃដីស្រោចស្រពរដូវប្រាំង ៣,០០០ ហិកតា និងវស្សា ២៤,០០០ ហិកតា។ ផ្ទៃដីស្រោចស្រពបន្ទាប់ពីកែលម្អដោយគម្រោងរដូវប្រាំងចំនួន ៥,០០០ ហិកតា និងស្រូវវស្សា ៣០,០០០ ហិកតា។ ផ្ទៃដីជាមធ្យមសម្រាប់ប្រជាពលរដ្ឋម្នាក់ចំនួន ៥ ហិកតា។",
      basinPlannedInvestments: "មានផែនការអភិវឌ្ឍន៍ និងវិនិយោគពង្រីកប្រព័ន្ធធារាសាស្ត្រ និងការគ្រប់គ្រងទឹកជំនន់ក្នុងអាងទន្លេ។",
      riverBasinCommitteeStatus: "បានបង្កើត និងកំពុងរៀបចំយន្តការដំណើរការគណៈកម្មការគ្រប់គ្រងអាងទន្លេ (River Basin Management Committee)។",
      proposedComponentsSummary: "ស្តារស្ទឹងប្រវែង ៥៥ គម និងស្តារអូរប្រវែងសរុប ២៤ គម, សាងសង់សំណង់ស្ទាក់ទឹកកាត់ស្ទឹងចំនួន ៤ កន្លែង និងសំណង់ចែកចាយទឹកសរុបចំនួន ១៦ កន្លែង, ស្តារសង់ប្រឡាយមេ ១៦ ខ្សែ ប្រវែងសរុប ៤៨ គម និងប្រឡាយរង ៤៨ ខ្សែ ប្រវែងសរុប ៩៦ គម។",
      riverRestorationLengthKm: 55.0,
      streamRestorationLengthKm: 24.0,
      weirsCount: 4,
      distributionStructuresCount: 16,
      mainCanalsCount: 16,
      mainCanalsLengthKm: 48.0,
      secondaryCanalsCount: 48,
      secondaryCanalsLengthKm: 96.0,
      commandAreaEstimateHa: 35000.0,
      pastOrOngoingStudies: "ប្រមូលទិន្នន័យពីមន្ទីរធនធានទឹក និងឧតុនិយមខេត្ត (PDWRAM) គម្រោងមុនៗ និងព័ត៌មានពីប្រព័ន្ធ IAMS។",
      existingInfraDescription: "ស្តារស្ទឹង និងស្តារអូរ, សាងសង់សំណង់សិល្បការ្យផ្សេងៗដូចជា សំណង់កាត់ស្ទឹង និងសំណង់ចែកចាយទឹក, សាងសង់ប្រឡាយមេ និងប្រឡាយរង។",
      existingCanalsCondition: "ប្រឡាយមេ និងប្រឡាយរងមួយចំនួនជាប្រឡាយដី ទទួលរងការខូចខាត និងគោករាក់ ត្រូវការកែលម្អជាបេតុង និងស្តារជម្រៅឡើងវិញ។",
      existingReservoirsCondition: "សំណង់ស្ទាក់ទឹក និងអាងស្តុកទឹកមានស្រាប់នៅមានកម្រិត ត្រូវការស្តារដើម្បីធានាការផ្គត់ផ្គង់ទឹកទាំងរដូវវស្សា និងរដូវប្រាំង។",
      existingDrainageCondition: "មិនទាន់មានប្រព័ន្ធប្រឡាយរំដោះទឹកគ្រប់គ្រាន់ បង្កឱ្យមានការលិចលង់រហ័ស។",
      existingFloodEmbankments: "ត្រូវការសាងសង់សណ្តរការពារទឹកជំនន់បន្ថែមដើម្បីការពារតំបន់កសិកម្ម និងលំនៅឋាន។",
      existingRoadsCondition: "ផ្លូវដីក្រហម និងផ្លូវក្រាលគ្រួសខូចខាតក្នុងរដូវវស្សា ត្រូវការកែលម្អជាផ្លូវអធិការកិច្ច។",
      otherExistingInfra: "ប្រភពទិន្នន័យពី PDWRAM, គម្រោងមុនៗក្នុងតំបន់ និងប្រព័ន្ធ IAMS។",
      climateDescription: "អាកាសធាតុមានលក្ខណៈក្តៅ ហើយសើម",
      soilAndTopography: "ជាប្រភេទដីកសិកម្ម (ស្រូវ និងដំណាំរួមផ្សំ)",
      surfaceWaterResources: "ស្ទឹង និងផ្ទៃរងទឹកភ្លៀងពីតំបន់ខ្ពង់រាបខាងលើ និងប្រទេសថៃ",
      groundwaterResources: "ធនធានទឹកក្រោមដីមានកម្រិតមធ្យម សម្រាប់ប្រើប្រាស់ក្នុងជីវភាព",
      landUseDescription: "ដីកសិកម្ម (ស្រែស្រូវ និងដំណាំរួមផ្សំ)",
      cropPatternAndSeasonality: "ដំណាំស្រូវ ធ្វើ ២ដងក្នុង១ឆ្នាំ (ចាប់ពីខែ៤ ដល់ខែ៧ និងចាប់ពីខែ១០ ដល់ខែ១២)",
      farmSizeAndTenure: "ជាប្រភេទដីឯកជន (មធ្យម ៥ ហិកតាក្នុងម្នាក់)",
      fwucStatusAndInstitutions: "ស្ថាប័នពាក់ព័ន្ធ៖ សហគមន៍កសិករប្រើប្រាស់ទឹក (សកបទ/FWUC) និងអាជ្ញាធរមូលដ្ឋាន",
      farmingPracticesAndPumping: "ប្រើគ្រឿងចក្រ, ម៉ាស៊ីនបូមទឹក និងប្រព័ន្ធអគ្គីសនី",
      subprojectRationale: "១. ជាតំបន់ដែលមានប្រភពទឹកច្បាស់លាស់\n២. មានសក្តារនុពលក្នុងការដាំដុះ\n៣. ជាតម្រូវការចាំបាច់របស់ប្រជាជននៅតំបន់នោះ\n៤. អាចកាត់បន្ថយទឹកជំនន់បាន ៨០%\n៥. ប្រព័ន្ធមានស្រាប់ មានការប៉ះពាល់ផ្ទៃស្រែចម្ការរបស់ប្រជាពលរដ្ឋតិចតួច",
      constraintsAddressed: "១. ជាតំបន់ដែលមានការលិចលង់រហ័ស\n២. មិនទាន់មានប្រព័ន្ធប្រឡាយរំដោះទឹក",
      expectedBenefits: "១. មិនប៉ះពាល់ដល់បរិស្ថាន\n២. លើកស្ទួយកម្រិតជីវភាពរបស់ប្រជាជន\n៣. បង្កើនការងារបន្ថែមដល់វិស័យយេនឌ័រ",
      integrationIntoBasinPlan: "បំពេញបន្ថែមដល់ប្រព័ន្ធគ្រប់គ្រងអាងទន្លេ និងជួយកាត់បន្ថយគ្រោះទឹកជំនន់ក្នុងតំបន់",
      modernizationCanalDistribution: "កាត់បន្ថយការបាត់បង់ទឹកនៅក្នុងប្រព័ន្ធដែលមានស្រាប់ និងធ្វើទំនើបកម្មប្រព័ន្ធប្រឡាយ ប្រព័ន្ធសំណង់ និងសំណង់សិល្បការ្យ",
      pipeDistributionSystems: "ការប្រើប្រាស់ប្រព័ន្ធទុយោ",
      floodManagementDrainage: "ការគ្រប់គ្រងទឹកជំនន់ និងប្រព័ន្ធរំដោះទឹក",
      inspectionAccessRoads: "ការធ្វើផ្លូវអធិការកិច្ច",
      managementEquipmentFacilities: "ឧបករណ៍និងសម្ភារ និងអគារគ្រប់គ្រង",
      agriculturalSupportServices: "ការជួយគាំទ្រផ្នែកកសិកម្ម និងបច្ចេកទេស",
      institutionalSustainabilityOandM: "ការបង្កើតស្ថាប័នគ្រប់គ្រង ការប្រមូលវិភាគទាន និងការជួលជុលថែទាំ O&M",
      totalEstimatedCostUsd: 18500000.0,
      costPerHectareUsd: 528.0,
      costBreakdownMajorItems: "តម្លៃប៉ាន់ស្មានសរុបការស្តារឡើងវិញ ក្នុងប្រព័ន្ធស្ទឹងថ្មពួក (សំណង់ស្ទាក់ទឹក ស្ដារស្ទឹង និងប្រឡាយមេ-រង)",
      pumpingLiftMeters: 3.5,
      pumpingDischargeLs: 850.0,
      stakeholderConsultationsDetails: "មានកិច្ចប្រជុំជាមួយភាគីពាក់ព័ន្ធលើការប្រើប្រាស់ទឹក ដែលមានការចូលរួមពីៈ មន្ទីរធនធានទឹក និងឧតុនិយម, អាជ្ញាធរមូលដ្ឋាន",
      farmerInterestHighValueCrops: "ដំណាំមានទីផ្សារ និងមានតម្លៃសមរម្យ",
      farmerInterestModernization: "ការប្តូរមកប្រើប្រាស់ទំនើបកម្ម លើវិស័យកសិកម្ម",
      farmerFwucWillingness: "ចង់បានប្រព័ន្ធស្រោចស្រពគ្រប់ជ្រុងជ្រោយ និងចូលរួមក្នុង FWUC",
      majorFarmerBenefits: "១. ដំណាំមានទីផ្សារ និងមានតម្លៃសមរម្យ\n២. ការប្តូរមកប្រើប្រាស់ទំនើបកម្ម លើវិស័យកសិម្ម\n៣. ចង់បានប្រព័ន្ធស្រោចស្រពគ្រប់ជ្រុងជ្រោយ",
      resettlementImpacts: "គ្មានការផ្លាស់ទីផ្ទះសម្បែងរបស់ប្រជាពលរដ្ឋ",
      lossOfAssetsImpacts: "មិនមានការបាត់បង់ទ្រព្យសម្បត្តិធំដុំ (ប៉ះពាល់តិចតួចលើដីកសិកម្មចាស់)",
      environmentalImpactsProtection: "សូមធានាថាការអនុវត្តអនុគម្រោងនេះ មិនធ្វើឱ្យប៉ះពាល់ដល់តំបន់អភិរក្ស និងតំបន់ការពារណាមួយឡើយ។",
      safeguardMitigationMeasures: "អនុវត្តតាមគោលការណ៍សុវត្ថិភាពសង្គម និងបរិស្ថានរបស់ក្រសួងធនធានទឹក និងឧតុនិយម",
      mapRiverBasinNotes: "ផែនទីបង្ហាញពីទីតាំងនិងវិសាលភាពគម្រោង និងហេដ្ឋារចនាសម្ព័ន្ធ",
      schematicRiverBasinNotes: "ដ្យាក្រាមបង្ហាញពីហេដ្ឋារចនាសម្ព័ន្ធ អាងស្តុកទឹក និងតម្រូវការទឹកសំខាន់ក្នុងអាងទន្លេ",
      mapSubprojectNotes: "ផែនទីបង្ហាញពីផ្ទៃដីស្រោចស្រព និងហេដ្ឋារចនាសម្ព័ន្ធដែលមានស្រាប់ សំណង់ស្ទាក់ ប្រឡាយ ផ្លូវ ។ល។",
      additionalAttachmentsNotes: "ឯកសារអនុគម្រោងគំរូ Candidate Sub-Project Concept Note Outline (Proforma) សម្រាប់ខេត្តបន្ទាយមានជ័យ",
    },
    create: {
      subprojectCode: "SP-BMC-001",
      subprojectName: "អនុគម្រោងប្រព័ន្ធស្ទឹងថ្មពួក",
      subprojectEnglishName: "Stueng Tmar Pouk Subproject Research & Development Plan",
      provinceId: province.id,
      districtId: thmaPuokDistrict ? thmaPuokDistrict.id : null,
      status: "APPROVED",
      riverBasinName: "ប្រព័ន្ធស្ទឹងថ្មពួក",
      coordinateX: 276528,
      coordinateY: 1549682,
      latitude: 14.015,
      longitude: 102.932,
      keyLocationsDescription: "ប្រព័ន្ធស្ទឹងថ្មពួក ស្ថិតក្នុងស្រុកថ្មពួក ខេត្តបន្ទាយមានជ័យ (X=276528, Y=1549682)",
      catchmentRainfallSource: "មកពីប្រទេសថៃ និងតំបន់ខ្ពង់រាបពីខេត្តឧត្ដរមានជ័យ",
      mainRiverLengthKm: 55.0,
      tributaryLengthKm: 24.0,
      existingDrySeasonAreaHa: 3000.0,
      existingWetSeasonAreaHa: 24000.0,
      postProjectDrySeasonAreaHa: 5000.0,
      postProjectWetSeasonAreaHa: 30000.0,
      avgLandPerPersonHa: 5.0,
      basinOverviewDescription: "ផ្ទៃរងទឹកភ្លៀង៖ មកពីប្រទេសថៃ និងតំបន់ខ្ពង់រាបពីខេត្តឧត្ដរមានជ័យ។ ស្ទឹងចាស់ ប្រវែង ៥៥ គម និងដៃអូរ ២៤ គម។ ផ្ទៃដីស្រោចស្រពរដូវប្រាំង ៣,០០០ ហិកតា និងវស្សា ២៤,០០០ ហិកតា។ ផ្ទៃដីស្រោចស្រពបន្ទាប់ពីកែលម្អដោយគម្រោងរដូវប្រាំងចំនួន ៥,០០០ ហិកតា និងស្រូវវស្សា ៣០,០០០ ហិកតា។ ផ្ទៃដីជាមធ្យមសម្រាប់ប្រជាពលរដ្ឋម្នាក់ចំនួន ៥ ហិកតា។",
      basinPlannedInvestments: "មានផែនការអភិវឌ្ឍន៍ និងវិនិយោគពង្រីកប្រព័ន្ធធារាសាស្ត្រ និងការគ្រប់គ្រងទឹកជំនន់ក្នុងអាងទន្លេ។",
      riverBasinCommitteeStatus: "បានបង្កើត និងកំពុងរៀបចំយន្តការដំណើរការគណៈកម្មការគ្រប់គ្រងអាងទន្លេ (River Basin Management Committee)។",
      proposedComponentsSummary: "ស្តារស្ទឹងប្រវែង ៥៥ គម និងស្តារអូរប្រវែងសរុប ២៤ គម, សាងសង់សំណង់ស្ទាក់ទឹកកាត់ស្ទឹងចំនួន ៤ កន្លែង និងសំណង់ចែកចាយទឹកសរុបចំនួន ១៦ កន្លែង, ស្តារសង់ប្រឡាយមេ ១៦ ខ្សែ ប្រវែងសរុប ៤៨ គម និងប្រឡាយរង ៤៨ ខ្សែ ប្រវែងសរុប ៩៦ គម។",
      riverRestorationLengthKm: 55.0,
      streamRestorationLengthKm: 24.0,
      weirsCount: 4,
      distributionStructuresCount: 16,
      mainCanalsCount: 16,
      mainCanalsLengthKm: 48.0,
      secondaryCanalsCount: 48,
      secondaryCanalsLengthKm: 96.0,
      commandAreaEstimateHa: 35000.0,
      pastOrOngoingStudies: "ប្រមូលទិន្នន័យពីមន្ទីរធនធានទឹក និងឧតុនិយមខេត្ត (PDWRAM) គម្រោងមុនៗ និងព័ត៌មានពីប្រព័ន្ធ IAMS។",
      existingInfraDescription: "ស្តារស្ទឹង និងស្តារអូរ, សាងសង់សំណង់សិល្បការ្យផ្សេងៗដូចជា សំណង់កាត់ស្ទឹង និងសំណង់ចែកចាយទឹក, សាងសង់ប្រឡាយមេ និងប្រឡាយរង។",
      existingCanalsCondition: "ប្រឡាយមេ និងប្រឡាយរងមួយចំនួនជាប្រឡាយដី ទទួលរងការខូចខាត និងគោករាក់ ត្រូវការកែលម្អជាបេតុង និងស្តារជម្រៅឡើងវិញ។",
      existingReservoirsCondition: "សំណង់ស្ទាក់ទឹក និងអាងស្តុកទឹកមានស្រាប់នៅមានកម្រិត ត្រូវការស្តារដើម្បីធានាការផ្គត់ផ្គង់ទឹកទាំងរដូវវស្សា និងរដូវប្រាំង។",
      existingDrainageCondition: "មិនទាន់មានប្រព័ន្ធប្រឡាយរំដោះទឹកគ្រប់គ្រាន់ បង្កឱ្យមានការលិចលង់រហ័ស។",
      existingFloodEmbankments: "ត្រូវការសាងសង់សណ្តរការពារទឹកជំនន់បន្ថែមដើម្បីការពារតំបន់កសិកម្ម និងលំនៅឋាន។",
      existingRoadsCondition: "ផ្លូវដីក្រហម និងផ្លូវក្រាលគ្រួសខូចខាតក្នុងរដូវវស្សា ត្រូវការកែលម្អជាផ្លូវអធិការកិច្ច។",
      otherExistingInfra: "ប្រភពទិន្នន័យពី PDWRAM, គម្រោងមុនៗក្នុងតំបន់ និងប្រព័ន្ធ IAMS។",
      climateDescription: "អាកាសធាតុមានលក្ខណៈក្តៅ ហើយសើម",
      soilAndTopography: "ជាប្រភេទដីកសិកម្ម (ស្រូវ និងដំណាំរួមផ្សំ)",
      surfaceWaterResources: "ស្ទឹង និងផ្ទៃរងទឹកភ្លៀងពីតំបន់ខ្ពង់រាបខាងលើ និងប្រទេសថៃ",
      groundwaterResources: "ធនធានទឹកក្រោមដីមានកម្រិតមធ្យម សម្រាប់ប្រើប្រាស់ក្នុងជីវភាព",
      landUseDescription: "ដីកសិកម្ម (ស្រែស្រូវ និងដំណាំរួមផ្សំ)",
      cropPatternAndSeasonality: "ដំណាំស្រូវ ធ្វើ ២ដងក្នុង១ឆ្នាំ (ចាប់ពីខែ៤ ដល់ខែ៧ និងចាប់ពីខែ១០ ដល់ខែ១២)",
      farmSizeAndTenure: "ជាប្រភេទដីឯកជន (មធ្យម ៥ ហិកតាក្នុងម្នាក់)",
      fwucStatusAndInstitutions: "ស្ថាប័នពាក់ព័ន្ធ៖ សហគមន៍កសិករប្រើប្រាស់ទឹក (សកបទ/FWUC) និងអាជ្ញាធរមូលដ្ឋាន",
      farmingPracticesAndPumping: "ប្រើគ្រឿងចក្រ, ម៉ាស៊ីនបូមទឹក និងប្រព័ន្ធអគ្គីសនី",
      subprojectRationale: "១. ជាតំបន់ដែលមានប្រភពទឹកច្បាស់លាស់\n២. មានសក្តារនុពលក្នុងការដាំដុះ\n៣. ជាតម្រូវការចាំបាច់របស់ប្រជាជននៅតំបន់នោះ\n៤. អាចកាត់បន្ថយទឹកជំនន់បាន ៨០%\n៥. ប្រព័ន្ធមានស្រាប់ មានការប៉ះពាល់ផ្ទៃស្រែចម្ការរបស់ប្រជាពលរដ្ឋតិចតួច",
      constraintsAddressed: "១. ជាតំបន់ដែលមានការលិចលង់រហ័ស\n២. មិនទាន់មានប្រព័ន្ធប្រឡាយរំដោះទឹក",
      expectedBenefits: "១. មិនប៉ះពាល់ដល់បរិស្ថាន\n២. លើកស្ទួយកម្រិតជីវភាពរបស់ប្រជាជន\n៣. បង្កើនការងារបន្ថែមដល់វិស័យយេនឌ័រ",
      integrationIntoBasinPlan: "បំពេញបន្ថែមដល់ប្រព័ន្ធគ្រប់គ្រងអាងទន្លេ និងជួយកាត់បន្ថយគ្រោះទឹកជំនន់ក្នុងតំបន់",
      modernizationCanalDistribution: "កាត់បន្ថយការបាត់បង់ទឹកនៅក្នុងប្រព័ន្ធដែលមានស្រាប់ និងធ្វើទំនើបកម្មប្រព័ន្ធប្រឡាយ ប្រព័ន្ធសំណង់ និងសំណង់សិល្បការ្យ",
      pipeDistributionSystems: "ការប្រើប្រាស់ប្រព័ន្ធទុយោ",
      floodManagementDrainage: "ការគ្រប់គ្រងទឹកជំនន់ និងប្រព័ន្ធរំដោះទឹក",
      inspectionAccessRoads: "ការធ្វើផ្លូវអធិការកិច្ច",
      managementEquipmentFacilities: "ឧបករណ៍និងសម្ភារ និងអគារគ្រប់គ្រង",
      agriculturalSupportServices: "ការជួយគាំទ្រផ្នែកកសិកម្ម និងបច្ចេកទេស",
      institutionalSustainabilityOandM: "ការបង្កើតស្ថាប័នគ្រប់គ្រង ការប្រមូលវិភាគទាន និងការជួលជុលថែទាំ O&M",
      totalEstimatedCostUsd: 18500000.0,
      costPerHectareUsd: 528.0,
      costBreakdownMajorItems: "តម្លៃប៉ាន់ស្មានសរុបការស្តារឡើងវិញ ក្នុងប្រព័ន្ធស្ទឹងថ្មពួក (សំណង់ស្ទាក់ទឹក ស្ដារស្ទឹង និងប្រឡាយមេ-រង)",
      pumpingLiftMeters: 3.5,
      pumpingDischargeLs: 850.0,
      stakeholderConsultationsDetails: "មានកិច្ចប្រជុំជាមួយភាគីពាក់ព័ន្ធលើការប្រើប្រាស់ទឹក ដែលមានការចូលរួមពីៈ មន្ទីរធនធានទឹក និងឧតុនិយម, អាជ្ញាធរមូលដ្ឋាន",
      farmerInterestHighValueCrops: "ដំណាំមានទីផ្សារ និងមានតម្លៃសមរម្យ",
      farmerInterestModernization: "ការប្តូរមកប្រើប្រាស់ទំនើបកម្ម លើវិស័យកសិកម្ម",
      farmerFwucWillingness: "ចង់បានប្រព័ន្ធស្រោចស្រពគ្រប់ជ្រុងជ្រោយ និងចូលរួមក្នុង FWUC",
      majorFarmerBenefits: "១. ដំណាំមានទីផ្សារ និងមានតម្លៃសមរម្យ\n២. ការប្តូរមកប្រើប្រាស់ទំនើបកម្ម លើវិស័យកសិម្ម\n៣. ចង់បានប្រព័ន្ធស្រោចស្រពគ្រប់ជ្រុងជ្រោយ",
      resettlementImpacts: "គ្មានការផ្លាស់ទីផ្ទះសម្បែងរបស់ប្រជាពលរដ្ឋ",
      lossOfAssetsImpacts: "មិនមានការបាត់បង់ទ្រព្យសម្បត្តិធំដុំ (ប៉ះពាល់តិចតួចលើដីកសិកម្មចាស់)",
      environmentalImpactsProtection: "សូមធានាថាការអនុវត្តអនុគម្រោងនេះ មិនធ្វើឱ្យប៉ះពាល់ដល់តំបន់អភិរក្ស និងតំបន់ការពារណាមួយឡើយ។",
      safeguardMitigationMeasures: "អនុវត្តតាមគោលការណ៍សុវត្ថិភាពសង្គម និងបរិស្ថានរបស់ក្រសួងធនធានទឹក និងឧតុនិយម",
      mapRiverBasinNotes: "ផែនទីបង្ហាញពីទីតាំងនិងវិសាលភាពគម្រោង និងហេដ្ឋារចនាសម្ព័ន្ធ",
      schematicRiverBasinNotes: "ដ្យាក្រាមបង្ហាញពីហេដ្ឋារចនាសម្ព័ន្ធ អាងស្តុកទឹក និងតម្រូវការទឹកសំខាន់ក្នុងអាងទន្លេ",
      mapSubprojectNotes: "ផែនទីបង្ហាញពីផ្ទៃដីស្រោចស្រព និងហេដ្ឋារចនាសម្ព័ន្ធដែលមានស្រាប់ សំណង់ស្ទាក់ ប្រឡាយ ផ្លូវ ។ល។",
      additionalAttachmentsNotes: "ឯកសារអនុគម្រោងគំរូ Candidate Sub-Project Concept Note Outline (Proforma) សម្រាប់ខេត្តបន្ទាយមានជ័យ",
    },
  });

  console.log(`Subproject plan seeded: [${tmarPoukPlan.subprojectCode}] ${tmarPoukPlan.subprojectName}`);
}

seedSubprojectPlans()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

