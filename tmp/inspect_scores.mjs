import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: scores } = await supabase.from('debate_scores').select('enrollment_no, total_points, date');
  if (scores) {
    const uniqueEn = [...new Set(scores.map(s => s.enrollment_no))];
    console.log('Unique enrollment numbers in debate_scores:', uniqueEn);
    console.log('Sample score dates:', scores.slice(0, 10).map(s => s.date));
  } else {
    console.log('No scores found in debate_scores');
  }
}
check();
