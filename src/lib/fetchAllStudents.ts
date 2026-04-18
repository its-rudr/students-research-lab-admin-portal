import prisma from './prismaClient';

/**
 * Fetch all student details from the Neon/Postgres database using Prisma.
 */
export async function fetchAllStudents() {
  try {
    const students = await prisma.students_details.findMany();
    return students;
  } catch (error) {
    console.error('Error fetching students_details:', error);
    throw error;
  }
}
