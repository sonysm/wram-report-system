const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found");
      return;
    }
    
    console.log("User:", user.username, "Province:", user.provinceId);
    
    const newFwuc = await prisma.fwuc.create({
      data: {
        name: "Test FWUC",
        provinceId: user.provinceId || 1,
        userId: user.id
      }
    });
    console.log("Success:", newFwuc);
    
    await prisma.fwuc.delete({ where: { id: newFwuc.id } });
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
