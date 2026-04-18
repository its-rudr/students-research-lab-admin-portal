import prisma from '../src/lib/prismaClient';

async function check() {
  const scores = await prisma.debate_scores.findMany({ select: { enrollment_no: true } });
  if (scores) {
    const unique = [...new Set(scores.map(s => s.enrollment_no))];
    console.log('Unique enrollment numbers in debate_scores:', unique);
  }
}
check();
