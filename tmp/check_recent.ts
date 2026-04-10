import prisma from '../src/lib/prismaClient';

async function check() {
  const att = await prisma.attendance.findMany({
    where: { date: { gt: '2026-03-01' } },
    take: 10,
  });
  console.log('Recent Attendance Sample:', att);

  const scores = await prisma.debate_scores.findMany({
    where: { date: { gt: '2026-03-01' } },
    take: 10,
  });
  console.log('Recent Score Sample:', scores);
}
check();
