import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npdtneznlzganiolvhmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZHRuZXpubHpnYW5pb2x2aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE3NjksImV4cCI6MjA4NzM0Nzc2OX0.PwBd-ZIbABocG_jX5iAWxXhO3DpGLlJDNDyTlqvByxg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const en = '24BECE304';
  const { data: scores } = await supabase.from('debate_scores').select('*').eq('enrollment_no', en);
  console.log('Scores:', scores);
  
  const { data: att } = await supabase.from('attendance').select('*').eq('enrollment_no', en);
  console.log('Attendance Count:', att ? att.length : 0);
  if (att && att.length > 0) {
    console.log('Sample Attendance:', att.slice(0, 3));
  }
}
check();
