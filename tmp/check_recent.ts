import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npdtneznlzganiolvhmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZHRuZXpubHpnYW5pb2x2aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE3NjksImV4cCI6MjA4NzM0Nzc2OX0.PwBd-ZIbABocG_jX5iAWxXhO3DpGLlJDNDyTlqvByxg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: att } = await supabase.from('attendance').select('*').gt('date', '2026-03-01').limit(10);
  console.log('Recent Attendance Sample:', att);

  const { data: scores } = await supabase.from('debate_scores').select('*').gt('date', '2026-03-01').limit(10);
  console.log('Recent Score Sample:', scores);
}
check();
