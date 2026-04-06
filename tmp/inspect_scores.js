const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: scores } = await supabase.from('debate_scores').select('enrollment_no, date, total_points').limit(20);
  console.log('Sample Scores:', scores);

  const { data: enrollment_nos } = await supabase.from('debate_scores').select('enrollment_no');
  const unique = [...new Set(enrollment_nos.map(e => e.enrollment_no))];
  console.log('Unique Enrollment Nos in debate_scores:', unique);
}

check();
