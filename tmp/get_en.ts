import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npdtneznlzganiolvhmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZHRuZXpubHpnYW5pb2x2aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE3NjksImV4cCI6MjA4NzM0Nzc2OX0.PwBd-ZIbABocG_jX5iAWxXhO3DpGLlJDNDyTlqvByxg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: students } = await supabase.from('students_details').select('*').ilike('student_name', '%Dabhi%');
  if (students && students.length > 0) {
    console.log('Enrollment No:', students[0].enrollment_no);
    console.log('Enrollment No Length:', students[0].enrollment_no.length);
  }
}
check();
