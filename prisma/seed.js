const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const CAMBODIA_PROVINCES = [
    { code: "KH-2", name: "Banteay Meanchey", khmerName: "បន្ទាយមានជ័យ", postalCode: 1000, sortOrder: 1 },
    { code: "KH-1", name: "Battambang", khmerName: "បាត់ដំបង", postalCode: 2000, sortOrder: 2 },
    { code: "KH-3", name: "Kampong Cham", khmerName: "កំពង់ចាម", postalCode: 3000, sortOrder: 3 },
    { code: "KH-4", name: "Kampong Chhnang", khmerName: "កំពង់ឆ្នាំង", postalCode: 4000, sortOrder: 4 },
    { code: "KH-5", name: "Kampong Speu", khmerName: "កំពង់ស្ពឺ", postalCode: 5000, sortOrder: 5 },
    { code: "KH-18", name: "Kampong Thom", khmerName: "កំពង់ធំ", postalCode: 6000, sortOrder: 6 },
    { code: "KH-7", name: "Kampot", khmerName: "កំពត", postalCode: 7000, sortOrder: 7 },
    { code: "KH-8", name: "Kandal", khmerName: "កណ្ដាល", postalCode: 8000, sortOrder: 8 },
    { code: "KH-23", name: "Kep", khmerName: "កែប", postalCode: 22000, sortOrder: 9 },
    { code: "KH-9", name: "Koh Kong", khmerName: "កោះកុង", postalCode: 9000, sortOrder: 10 },
    { code: "KH-10", name: "Kratie", khmerName: "ក្រចេះ", postalCode: 10000, sortOrder: 11 },
    { code: "KH-11", name: "Mondulkiri", khmerName: "មណ្ឌលគិរី", postalCode: 11000, sortOrder: 12 },
    { code: "KH-22", name: "Oddar Meanchey", khmerName: "ឧត្តរមានជ័យ", postalCode: 23000, sortOrder: 13 },
    { code: "KH-24", name: "Pailin", khmerName: "ប៉ៃលិន", postalCode: 24000, sortOrder: 14 },
    { code: "KH-12", name: "Phnom Penh", khmerName: "ភ្នំពេញ", postalCode: 12000, sortOrder: 15 },
    { code: "KH-13", name: "Preah Vihear", khmerName: "ព្រះវិហារ", postalCode: 13000, sortOrder: 16 },
    { code: "KH-6", name: "Preah Sihanouk", khmerName: "ព្រះសីហនុ", postalCode: 18000, sortOrder: 17 },
    { code: "KH-14", name: "Prey Veng", khmerName: "ព្រៃវែង", postalCode: 14000, sortOrder: 18 },
    { code: "KH-15", name: "Pursat", khmerName: "ពោធិ៍សាត់", postalCode: 15000, sortOrder: 19 },
    { code: "KH-16", name: "Ratanakiri", khmerName: "រតនគិរី", postalCode: 16000, sortOrder: 20 },
    { code: "KH-17", name: "Siem Reap", khmerName: "សៀមរាប", postalCode: 17000, sortOrder: 21 },
    { code: "KH-19", name: "Stung Treng", khmerName: "ស្ទឹងត្រែង", postalCode: 19000, sortOrder: 22 },
    { code: "KH-20", name: "Svay Rieng", khmerName: "ស្វាយរៀង", postalCode: 20000, sortOrder: 23 },
    { code: "KH-21", name: "Takeo", khmerName: "តាកែវ", postalCode: 21000, sortOrder: 24 },
    { code: "KH-25", name: "Tboung Khmum", khmerName: "ត្បូងឃ្មុំ", postalCode: 25000, sortOrder: 25 },
];

async function seedProvinces() {
    await Promise.all(
        CAMBODIA_PROVINCES.map(({ code, name, khmerName, postalCode, sortOrder }) =>
            prisma.province.upsert({
                where: { name },
                update: { code, khmerName, postalCode, sortOrder },
                create: { code, name, khmerName, postalCode, sortOrder },
            }),
        ),
    );
}

async function seedUsers() {
    const defaultPassword = "demo12345";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const kandalProvince = await prisma.province.findUnique({
        where: { name: "Kandal" },
        select: { id: true },
    });

    if (!kandalProvince) {
        throw new Error("Kandal province was not found after province seed.");
    }

    const usersToSeed = [
        {
            username: "demo_admin",
            role: "admin",
            provinceId: null,
        },
        {
            username: "demo_user",
            role: "admin",
            provinceId: null,
        },
        {
            username: "demo_kandal",
            role: "user",
            provinceId: kandalProvince.id,
        },
    ];

    for (const user of usersToSeed) {
        await prisma.user.upsert({
            where: { username: user.username },
            update: {
                role: user.role,
                provinceId: user.provinceId,
                passwordHash,
            },
            create: {
                username: user.username,
                role: user.role,
                provinceId: user.provinceId,
                passwordHash,
            },
        });
    }
}

async function main() {
    await seedProvinces();
    await seedUsers();

    console.log("Seed completed: provinces + demo users are ready.");
    console.log("Demo credentials: demo_admin/demo12345, demo_kandal/demo12345");
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });