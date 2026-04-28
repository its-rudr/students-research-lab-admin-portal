// Utility function to verify students_details table in Prisma/Neon
import prisma from './prismaClient';

export async function verifyStudentsDetailsTable() {
  try {
    // Query the students_details table using Prisma
    const data = await prisma.students_details.findMany({
      select: { enrollment_no: true, name: true },
      take: 1,
    });
    if (!data || data.length === 0) {
      return { exists: true, columns: ['enrollment_no', 'name'], sampleRow: null };
    }
    return {
      exists: true,
      tableName: 'students_details',
      columns: Object.keys(data[0]),
      sampleRow: data[0],
    };
  } catch (error: any) {
    return { exists: false, error: error.message };
  }
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
