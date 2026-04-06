import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npdtneznlzganiolvhmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZHRuZXpubHpnYW5pb2x2aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE3NjksImV4cCI6MjA4NzM0Nzc2OX0.PwBd-ZIbABocG_jX5iAWxXhO3DpGLlJDNDyTlqvByxg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const en = '24BECE30489';
  const { data: scores } = await supabase.from('debate_scores').select('*').eq('enrollment_no', en);
  console.log('Scores for exact 24BECE30489:', (scores || []).length);
  
  const { data: allScores } = await supabase.from('debate_scores').select('enrollment_no');
  const dabhiScores = (allScores || []).filter(s => String(s.enrollment_no).includes('24BECE30489'));
  console.log('Loose match count for 24BECE30489:', dabhiScores.length);
  if (dabhiScores.length > 0) {
    console.log('Original DB value:', JSON.stringify(dabhiScores[0].enrollment_no));
  }
}
check();
