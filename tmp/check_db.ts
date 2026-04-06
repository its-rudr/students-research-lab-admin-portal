
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npdtneznlzganiolvhmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZHRuZXpubHpnYW5pb2x2aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE3NjksImV4cCI6MjA4NzM0Nzc2OX0.PwBd-ZIbABocG_jX5iAWxXhO3DpGLlJDNDyTlqvByxg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  const { data: scores, error } = await supabase
    .from('debate_scores')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error("Error fetching scores:", error);
  } else {
    console.log("Sample records from debate_scores:", scores);
  }

  const { data: students, error: sError } = await supabase
    .from('students_details')
    .select('enrollment_no, student_name')
    .limit(5);

  if (sError) {
    console.error("Error fetching students:", sError);
  } else {
    console.log("Sample student enrollment numbers:", students);
  }
}

checkData();
