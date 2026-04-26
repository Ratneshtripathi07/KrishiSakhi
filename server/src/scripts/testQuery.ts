import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const data = await prisma.sensorData.findMany({
      where: { farm_id: 1 },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    console.log(data);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
