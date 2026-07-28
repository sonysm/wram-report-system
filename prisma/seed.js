const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const CAMBODIA_PROVINCES = [
    { name: "Banteay Meanchey", khmerName: "បន្ទាយមានជ័យ" },
    { name: "Battambang", khmerName: "បាត់ដំបង" },
    { name: "Kampong Cham", khmerName: "កំពង់ចាម" },
    { name: "Kampong Chhnang", khmerName: "កំពង់ឆ្នាំង" },
    { name: "Kampong Speu", khmerName: "កំពង់ស្ពឺ" },
    { name: "Kampong Thom", khmerName: "កំពង់ធំ" },
    { name: "Kampot", khmerName: "កំពត" },
    { name: "Kandal", khmerName: "កណ្ដាល" },
    { name: "Kep", khmerName: "កែប" },
    { name: "Koh Kong", khmerName: "កោះកុង" },
    { name: "Kratie", khmerName: "ក្រចេះ" },
    { name: "Mondulkiri", khmerName: "មណ្ឌលគិរី" },
    { name: "Oddar Meanchey", khmerName: "ឧត្តរមានជ័យ" },
    { name: "Pailin", khmerName: "ប៉ៃលិន" },
    { name: "Phnom Penh", khmerName: "ភ្នំពេញ" },
    { name: "Preah Vihear", khmerName: "ព្រះវិហារ" },
    { name: "Prey Veng", khmerName: "ព្រៃវែង" },
    { name: "Pursat", khmerName: "ពោធិ៍សាត់" },
    { name: "Ratanakiri", khmerName: "រតនគិរី" },
    { name: "Siem Reap", khmerName: "សៀមរាប" },
    { name: "Preah Sihanouk", khmerName: "ព្រះសីហនុ" },
    { name: "Stung Treng", khmerName: "ស្ទឹងត្រែង" },
    { name: "Svay Rieng", khmerName: "ស្វាយរៀង" },
    { name: "Takeo", khmerName: "តាកែវ" },
    { name: "Tboung Khmum", khmerName: "ត្បូងឃ្មុំ" },
];

async function seedProvinces() {
    await Promise.all(
        CAMBODIA_PROVINCES.map(({ name, khmerName }) =>
            prisma.province.upsert({
                where: { name },
                update: { khmerName },
                create: { name, khmerName },
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