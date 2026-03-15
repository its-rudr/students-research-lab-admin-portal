-- Activities data with standardized date format (YYYY-MM-DD) for proper sorting
-- Run this in your Supabase SQL Editor

INSERT INTO "public"."activities" ("title", "description", "date") VALUES 
('Faculty-Led Research Sessions', 'Guided research discussions and mentoring sessions conducted by experienced faculty members. At the Students Research Lab under the M. M. Patel Students Research Project Cell (KSV-MMPSRPC), Kadi Sarva Vishwavidyalaya, Gandhinagar, a research-oriented session was conducted focusing on algorithm optimization within a problem-driven research framework.', '2026-02-04'),

('Project Showcase', 'Gujarat Innovation Project Showcase – Regional Project Showcase. OSMAR: Advanced Oil Spill Monitoring using SAR Imagery. Team OSMAR secured the Second Prize (Booth Track) at the Gujarat Innovation Project Showcase held at GEC Surat.', '2026-02-13'),

('ImpactThon - KSV', 'Winner teams from SRL. During the ImpactThon hackathon at Kadi Sarva Vishwavidyalaya, eight teams from the Students Research Lab (SRL) were shortlisted for the advanced round of evaluation, demonstrating originality, feasibility, and real-world impact of their solutions.', '2026-01-31'),

('InnovAItion Hackathon', 'A 24-hour hackathon where students build prototypes to solve real-world problems. Students innovate and build solutions in a time-bound event.', '2026-01-10'),

('Alumni Meet', 'Connecting with past students to build a strong professional network. An event to connect current students with alumni for networking.', '2025-12-28'),

('Weekly Exercise Debate Sessions', 'Students evolving out of routine academics. Students Research Lab shows students steadily moving beyond routine academic thinking. Weekly topics and spontaneous exercises encourage sharper reasoning, and deeper engagement with ideas, strengthening their research mindset.', '2025-12-15'),

('Active research culture', 'Showcases the active culture at SRL - A new Beginning of MMPSRPC. Inside this lab, students are not just creating projects; they are nurturing a research-driven approach where ideas develop with purpose, conversations bring clarity, and collaboration happens naturally.', '2025-11-15'),

('Technical Enrichment', 'Team-based activities designed to promote collaboration and problem-solving skills. The session encouraged students to apply concepts through discussion and collaborative team work.', '2026-01-15');

-- Verify the data is sorted correctly (newest first)
SELECT * FROM activities ORDER BY date DESC;
