import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npdtneznlzganiolvhmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZHRuZXpubHpnYW5pb2x2aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE3NjksImV4cCI6MjA4NzM0Nzc2OX0.PwBd-ZIbABocG_jX5iAWxXhO3DpGLlJDNDyTlqvByxg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: students } = await supabase.from('students_details').select('enrollment_no, student_name');
  const dabhi = students.filter(s => s.student_name && s.student_name.includes('Dabhi'));
  console.log('Dabhi results:', dabhi);

  const { data: scores } = await supabase.from('debate_scores').select('enrollment_no, points');
  if (dabhi.length > 0) {
    const en = dabhi[0].enrollment_no;
    const userScores = scores.filter(s => s.enrollment_no === en);
    console.log(`Scores for ${en}:`, userScores);
  }
}
check();
