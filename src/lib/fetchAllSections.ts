import prisma from './prismaClient';

/**
 * Fetch all data from all main sections in the Neon/Postgres database using Prisma.
 */
export async function fetchAllSections() {
  try {
    const students = await prisma.students_details.findMany();
    const attendance = await prisma.attendance.findMany();
    const scores = await prisma.debate_scores.findMany();
    const activities = await prisma.activities.findMany();
    // Add more sections as needed
    return {
      students,
      attendance,
      scores,
      activities,
    };
  } catch (error) {
    console.error('Error fetching all sections:', error);
    throw error;
  }
}
