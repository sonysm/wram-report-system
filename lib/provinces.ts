import prisma from "./db";

export const CAMBODIA_PROVINCES = [
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

export async function ensureProvincesSeeded(): Promise<void> {
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