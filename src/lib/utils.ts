// Utility function to verify students_details table in Supabase
import { createClient } from '@supabase/supabase-js';

export async function verifyStudentsDetailsTable() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Query the students_details table
  const { data, error } = await supabase
    .from('students_details')
    .select('enrollment_no, name')
    .limit(1);

  if (error) {
    return { exists: false, error: error.message };
  }
  if (!data || data.length === 0) {
    return { exists: true, columns: ['enrollment_no', 'name'], sampleRow: null };
  }
  return {
    exists: true,
    tableName: 'students_details',
    columns: Object.keys(data[0]),
    sampleRow: data[0],
  };
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
