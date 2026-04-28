
import prisma from '../src/lib/prismaClient';

async function checkData() {
  try {
    const scores = await prisma.debate_scores.findMany({ take: 10 });
    console.log("Sample records from debate_scores:", scores);
  } catch (error) {
    console.error("Error fetching scores:", error);
  }

  try {
    const students = await prisma.students_details.findMany({
      select: { enrollment_no: true, student_name: true },
      take: 5,
    });
    console.log("Sample student enrollment numbers:", students);
  } catch (error) {
    console.error("Error fetching students:", error);
  }
}

checkData();
