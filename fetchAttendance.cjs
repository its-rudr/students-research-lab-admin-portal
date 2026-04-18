const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = await prisma.leaderboard_stats.findMany({
    select: {
      enrollment_no: true,
      attendance: true,
    },
  });
  console.log(data);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
