import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import { hasWriteAccess } from "@/lib/auth";



export default function Scores() {
  const [scores, setScores] = useState<Array<{ enroll_no: string; score: number; name: string; initials: string; photo_url?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addScores, setAddScores] = useState<{ [enroll_no: string]: string }>({});
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const canEdit = hasWriteAccess();

  const handleAddScores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setAddError("Only admin can add scores.");
      return;
    }
    setAdding(true);
    setAddError("");
    if (!addDate) {
      setAddError("Please select a date.");
      setAdding(false);
      return;
    }
    // Prepare rows for students with entered scores
    const rows = Object.entries(addScores)
      .filter(([_, score]) => score !== "" && !isNaN(Number(score)))
      .map(([enroll_no, score]) => ({
        enrollment_no: enroll_no,
        points: parseFloat(score),
        date: addDate,
      }));
    if (rows.length === 0) {
      setAddError("Please enter a score for at least one student.");
      setAdding(false);
      return;
    }
    const { error } = await supabase.from("debate_scores").insert(rows);
    if (error) {
      setAddError(error.message);
    } else {
      setShowAddForm(false);
      setAddScores({});
      setAddDate("");
    }
    setAdding(false);
  };

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      setFetchError("");
      // Fetch debate scores
      const { data: scoresData, error: scoresError } = await supabase.from("debate_scores").select();
      if (scoresError || !scoresData) {
        setFetchError(scoresError?.message || "Failed to read score records from database.");
        setScores([]);
        setLoading(false);
        return;
      }
      // Fetch student details
      const { data: studentsData, error: studentsError } = await supabase.from("students_details").select("enrollment_no,student_name,member_type");
      if (studentsError || !studentsData) {
        setFetchError(studentsError?.message || "Failed to read student records from database.");
        setScores([]);
        setLoading(false);
        return;
      }
      const visibleStudents = studentsData.filter(
        (stu: any) => String(stu.member_type || "member").toLowerCase() !== "admin"
      );
      const visibleEnrollmentSet = new Set(
        visibleStudents
          .map((stu: any) => stu.enrollment_no)
          .filter(Boolean)
      );
      // Map enrollment_no to name
      const nameMap: { [enroll_no: string]: string } = {};
      const photoMap: { [enroll_no: string]: string | undefined } = {};
      visibleStudents.forEach((stu: any) => {
        nameMap[stu.enrollment_no] = stu.student_name;
        photoMap[stu.enrollment_no] = undefined;
      });

      const now = new Date();
      const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const targetMonth = previousMonthDate.getMonth() + 1;
      const targetYear = previousMonthDate.getFullYear();

      const isTargetMonth = (value: any) => {
        const dateStr = String(value || "").trim();
        if (!dateStr) return false;

        const monthPad = String(targetMonth).padStart(2, "0");
        if (
          dateStr.includes(`${targetYear}-${monthPad}`) ||
          dateStr.includes(`${monthPad}/${targetYear}`) ||
          dateStr.includes(`${targetMonth}/${targetYear}`)
        ) {
          return true;
        }

        const parsed = new Date(dateStr);
        return !Number.isNaN(parsed.getTime()) && parsed.getMonth() + 1 === targetMonth && parsed.getFullYear() === targetYear;
      };

      const scoreMap: Record<string, number> = {};
      const merged = scoresData.map((row: any) => {
        if (!isTargetMonth(row.date || row.Date || row.DATE)) {
          return null;
        }

        const enrollNo = row.enrollment_no || row["enroll no."] || row.enroll_no || "";
        const scoreValue = row.total_points ?? row.points ?? row.score ?? 0;
        const score = Number(scoreValue) || 0;

        if (enrollNo) {
          scoreMap[enrollNo] = (scoreMap[enrollNo] || 0) + score;
        }

        const name = nameMap[enrollNo] || enrollNo;
        let initials = "";
        if (typeof name === "string" && name.length > 0) {
          initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
        } else if (enrollNo) {
          initials = String(enrollNo).slice(0, 2).toUpperCase();
        }
        return {
          enroll_no: enrollNo,
          score,
          name,
          initials,
          photo_url: photoMap[enrollNo],
        };
      }).filter(Boolean) as Array<{ enroll_no: string; score: number; name: string; initials: string; photo_url?: string }>;

      // Keep one row per student and show previous-month leaderboard only.
      const aggregated = Object.entries(scoreMap)
        .filter(([enrollNo]) => visibleEnrollmentSet.has(enrollNo))
        .map(([enrollNo, total]) => {
        const name = nameMap[enrollNo] || enrollNo;
        const initials = typeof name === "string" && name.length > 0
          ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
          : enrollNo.slice(0, 2).toUpperCase();

        return {
          enroll_no: enrollNo,
          score: total,
          name,
          initials,
          photo_url: photoMap[enrollNo],
        };
      });

      const fallbackMerged = merged.filter((item) => item.enroll_no && visibleEnrollmentSet.has(item.enroll_no));

      const leaderboardRows = aggregated.length > 0 ? aggregated : fallbackMerged;
      setScores(leaderboardRows.sort((a, b) => b.score - a.score).slice(0, 5));
      setLoading(false);
    };
    fetchScores();
  }, []);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm((v) => !v)} variant="default" disabled={!canEdit}>
          {showAddForm ? "Cancel" : "Add Score"}
        </Button>
      </div>
      {!canEdit && <p className="text-xs text-muted-foreground">You have read-only access. Only admin can add scores.</p>}
      {showAddForm && (
        <form onSubmit={handleAddScores} className="mb-4 p-3 sm:p-4 border rounded bg-card flex flex-col gap-3 max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
            <label className="font-medium text-sm shrink-0">Date:</label>
            <input
              type="date"
              value={addDate}
              onChange={e => setAddDate(e.target.value)}
              className="border px-2 py-1.5 sm:py-1 rounded text-sm flex-1"
              required
            />
          </div>
          <div className="overflow-x-auto max-h-96 -mx-3 sm:-mx-4 px-3 sm:px-4">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1">Student</th>
                  <th className="text-center px-2 py-1">Enrollment No.</th>
                  <th className="text-center px-2 py-1">Score</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((student) => (
                  <tr key={student.enroll_no}>
                    <td className="px-2 py-1">{student.name}</td>
                    <td className="px-2 py-1 text-center">{student.enroll_no}</td>
                    <td className="px-2 py-1 text-center">
                          <input
                            type="number"
                            min="-1000"
                        value={addScores[student.enroll_no] || ""}
                        onChange={e => setAddScores({ ...addScores, [student.enroll_no]: e.target.value })}
                        className="border px-2 py-1 rounded w-24"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {addError && <div className="text-red-500 text-sm mt-2">{addError}</div>}
          <Button type="submit" disabled={adding} variant="default" className="mt-2">
            {adding ? "Adding..." : "Submit Scores"}
          </Button>
        </form>
      )}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="section-title flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Last Month Top Scorers
          </h2>
        </div>
        <div className="divide-y divide-border/50">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading scores...</div>
          ) : fetchError ? (
            <div className="p-6 text-center text-destructive text-sm">{fetchError}</div>
          ) : scores.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No leaderboard data found.</div>
          ) : (
            <AnimatePresence>
              {scores.map((student, i) => (
                <motion.div
                  key={student.enroll_no}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ layout: { duration: 0.3 } }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/8 text-xs font-bold text-primary shrink-0">
                    {i + 1}
                  </span>
                  <StudentAvatar
                    name={student.name}
                    enrollmentNo={student.enroll_no}
                    photoUrl={student.photo_url}
                    className="w-8 h-8 shrink-0"
                    fallbackClassName="bg-primary/8 text-primary text-xs font-medium"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.span
                      key={student.score}
                      initial={{ scale: 1.15, color: "hsl(var(--primary))" }}
                      animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                      transition={{ duration: 0.2 }}
                      className="font-mono text-sm font-bold w-8 text-center"
                    >
                      {student.score}
                    </motion.span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
