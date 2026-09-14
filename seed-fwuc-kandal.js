const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

async function main() {
  try {
    // 1. Find Kandal province
    const province = await prisma.province.findFirst({
      where: {
        OR: [
          { name: { contains: 'Kandal', mode: 'insensitive' } },
          { khmerName: { contains: 'កណ្តាល' } },
          { khmerName: { contains: 'កណ្ដាល' } }
        ]
      }
    });

    if (!province) {
      console.error("Could not find Kandal province.");
      return;
    }
    console.log("Found province:", province.name, province.id);

    // 2. Find a user in Kandal province
    let user = await prisma.user.findFirst({
      where: { provinceId: province.id }
    });

    if (!user) {
       console.log("No user found for Kandal province. Using an admin user or first available user.");
       user = await prisma.user.findFirst();
    }
    
    if (!user) {
        console.error("No users exist in the database.");
        return;
    }

    // 3. Find some districts in Kandal
    const districts = await prisma.district.findMany({
      where: { provinceId: province.id },
      take: 2
    });

    // 4. Create dummy records
    const dummyData = [
      {
        name: "សហគមន៍កសិករប្រើប្រាស់ទឹក ព្រែកតាតែន",
        provinceId: province.id,
        districtId: districts[0]?.id || null,
        longitude: 104.9189,
        latitude: 11.7583,
        registrationPlace: "ខេត្ត",
        registrationNumber: "០១២/សកបទ/កណ",
        registrationDate: new Date("2023-05-15"),
        irrigatedDryArea: 150.5,
        irrigatedWetArea: 320.0,
        efficiency: "ល្អ",
        note: "ដំណើរការបានល្អ",
        userId: user.id
      },
      {
        name: "សកបទ ស្វាយរលំ",
        provinceId: province.id,
        districtId: districts[1]?.id || districts[0]?.id || null,
        longitude: 104.9782,
        latitude: 11.4551,
        registrationPlace: "ក្រសួង",
        registrationNumber: "១៤៥/កសក",
        registrationDate: new Date("2020-11-20"),
        irrigatedDryArea: 80.0,
        irrigatedWetArea: 120.0,
        efficiency: "មធ្យម",
        note: "ត្រូវការជួសជុលប្រឡាយរង",
        userId: user.id
      },
      {
        name: "សកបទ កោះធំ",
        provinceId: province.id,
        districtId: districts[1]?.id || null,
        longitude: 105.0234,
        latitude: 11.2389,
        registrationPlace: "កំពុងដំណើរការ",
        registrationNumber: "",
        registrationDate: null,
        irrigatedDryArea: 250.0,
        irrigatedWetArea: 400.0,
        efficiency: "ល្អ",
        note: "ទើបសាងសង់ប្រព័ន្ធធារាសាស្ត្រថ្មី",
        userId: user.id
      }
    ];

    for (const data of dummyData) {
      await prisma.fwuc.create({ data });
    }

    console.log("Successfully created 3 dummy FWUC records for Kandal province.");
  } catch (e) {
    console.error("Error creating dummy records:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
