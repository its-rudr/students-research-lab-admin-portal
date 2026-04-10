import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/StudentAvatar";
import { hasWriteAccess } from "@/lib/auth";



export default function Scores() {
  const [scores, setScores] = useState<Array<{ enroll_no: string; score: number; name: string; initials: string; photo_url?: string }>>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addScores, setAddScores] = useState<{ [enroll_no: string]: string }>({});
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [editScores, setEditScores] = useState<{ [enroll_no: string]: string }>({});
  const [savingEdits, setSavingEdits] = useState(false);
  const [editError, setEditError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const canEdit = hasWriteAccess();

  const normalizeText = (value: unknown) => String(value || "").trim();

  const toMonthKey = (value: unknown): string | null => {
    const raw = normalizeText(value);
    if (!raw || /^all\s*time$/i.test(raw)) return null;

    const parsed = dayjs(raw);
    if (parsed.isValid()) return parsed.format("YYYY-MM");

    const shortMonthMatch = raw.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
    if (shortMonthMatch) {
      const monthParsed = dayjs(`01 ${raw}`);
      if (monthParsed.isValid()) return monthParsed.format("YYYY-MM");
    }

    return null;
  };

  const monthKeyToPeriodLabel = (monthKey: string) => dayjs(`${monthKey}-01`).format("MMM YYYY");

  const fetchScores = async (monthOverride?: string | null) => {
    setLoading(true);
    setFetchError("");

    const { data: scoresData, error: scoresError } = await supabase.from("leaderboard_stats").select();
    if (scoresError || !scoresData) {
      setFetchError(scoresError?.message || "Failed to read score records from database.");
      setScores([]);
      setLoading(false);
      return;
    }

    const { data: studentsData, error: studentsError } = await supabase
      .from("students_details")
      .select("enrollment_no,student_name,member_type");

    if (studentsError || !studentsData) {
      setFetchError(studentsError?.message || "Failed to read student records from database.");
      setScores([]);
      setLoading(false);
      return;
    }

    const monthsSet = new Set<string>();
    scoresData.forEach((row: any) => {
      const monthKey = toMonthKey(row.period || row.month || row.date || row.created_at);
      if (monthKey) monthsSet.add(monthKey);
    });
    const monthsArr = Array.from(monthsSet).sort().reverse();
    const fallbackMonths = Array.from({ length: 12 }, (_, i) =>
      dayjs().subtract(i, "month").format("YYYY-MM")
    );
    const mergedMonths = Array.from(new Set([...monthsArr, ...fallbackMonths])).sort().reverse();
    setMonthOptions(mergedMonths);

    const effectiveMonth = monthOverride || selectedMonth || mergedMonths[0] || null;
    if (!selectedMonth && mergedMonths.length > 0) {
      setSelectedMonth(mergedMonths[0]);
    }

    const visibleStudents = studentsData.filter((stu: any) => normalizeText(stu.enrollment_no));

    const nameMap: { [enroll_no: string]: string } = {};
    const enrollmentByName: { [name: string]: string } = {};
    visibleStudents.forEach((stu: any) => {
      const enrollment = normalizeText(stu.enrollment_no);
      const name = normalizeText(stu.student_name);
      if (!enrollment) return;
      nameMap[enrollment] = name || enrollment;
      if (name) {
        enrollmentByName[name.toLowerCase()] = enrollment;
      }
    });

    const scoreMap: Record<string, number> = {};
    scoresData.forEach((row: any) => {
      const directEnrollment = normalizeText(row.enrollment_no || row["enroll no."] || row.enroll_no);
      const fallbackName = normalizeText(row.student_name || row.name || row.student).toLowerCase();
      const enrollNo = directEnrollment || enrollmentByName[fallbackName] || "";
      if (!enrollNo) return;

      const rowMonth = toMonthKey(row.period || row.month || row.date || row.created_at);
      if (effectiveMonth && rowMonth !== effectiveMonth) return;

      const scoreValue =
        row.debate_score ??
        row.monthly_score ??
        row.month_points ??
        row.monthly_points ??
        row.total_score ??
        row.total_points ??
        row.points ??
        row.score ??
        0;
      const score = Number(scoreValue) || 0;
      scoreMap[enrollNo] = (scoreMap[enrollNo] || 0) + score;
    });

    const leaderboardRows = visibleStudents
      .filter((stu: any) => stu.enrollment_no)
      .map((stu: any) => {
        const enrollNo = stu.enrollment_no;
        const name = nameMap[enrollNo] || enrollNo;
        const initials = typeof name === "string" && name.length > 0
          ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
          : String(enrollNo).slice(0, 2).toUpperCase();

        return {
          enroll_no: enrollNo,
          score: scoreMap[enrollNo] || 0,
          name,
          initials,
          photo_url: undefined,
        };
      })
      .sort((a, b) => b.score - a.score);

    setScores(leaderboardRows);
    setLoading(false);
  };

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
        total_points: parseFloat(score),
        date: addDate,
      }));
    if (rows.length === 0) {
      setAddError("Please enter a score for at least one student.");
      setAdding(false);
      return;
    }
    const leaderboardRows = rows.map((row) => ({
      enrollment_no: row.enrollment_no,
      debate_score: row.total_points,
      period: dayjs(row.date).format("MMM YYYY"),
    }));

    const { error } = await supabase.from("leaderboard_stats").insert(leaderboardRows);
    if (error) {
      setAddError(error.message);
    } else {
      setShowAddForm(false);
      setAddScores({});
      setAddDate("");
      await fetchScores(selectedMonth);
    }
    setAdding(false);
  };

  const handleSaveEdits = async () => {
    if (!canEdit || !selectedMonth) return;
    setSavingEdits(true);
    setEditError("");

    const monthPeriod = monthKeyToPeriodLabel(selectedMonth);
    const entries = Object.entries(editScores).filter(([_, value]) => value !== "" && !isNaN(Number(value)));

    try {
      for (const [enrollNo, value] of entries) {
        const numericValue = Number(value);

        const { data: existingRows, error: existingError } = await supabase
          .from("leaderboard_stats")
          .select("enrollment_no")
          .eq("enrollment_no", enrollNo)
          .eq("period", monthPeriod)
          .limit(1);

        if (existingError) {
          throw new Error(existingError.message);
        }

        if (existingRows && existingRows.length > 0) {
          const { error: updateError } = await supabase
            .from("leaderboard_stats")
            .update({ debate_score: numericValue })
            .eq("enrollment_no", enrollNo)
            .eq("period", monthPeriod);

          if (updateError) {
            throw new Error(updateError.message);
          }
        } else {
          const { error: insertError } = await supabase
            .from("leaderboard_stats")
            .insert({ enrollment_no: enrollNo, debate_score: numericValue, period: monthPeriod });

          if (insertError) {
            throw new Error(insertError.message);
          }
        }
      }

      setEditScores({});
      setIsEditMode(false);
      await fetchScores(selectedMonth);
    } catch (error: any) {
      setEditError(error?.message || "Failed to save edits.");
    }

    setSavingEdits(false);
  };

  useEffect(() => {
    fetchScores(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="month-select" className="font-medium text-sm">Month:</label>
          <select
            id="month-select"
            value={selectedMonth || ""}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
            disabled={monthOptions.length === 0}
          >
            {monthOptions.length === 0 && <option value="">No months</option>}
            {monthOptions.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsEditMode((v) => !v)}
            variant={isEditMode ? "secondary" : "outline"}
            disabled={!canEdit || scores.length === 0}
          >
            {isEditMode ? "Cancel Edit" : "Edit Scores"}
          </Button>
          <Button onClick={() => setShowAddForm((v) => !v)} variant="default" disabled={!canEdit}>
            {showAddForm ? "Cancel" : "Add Score"}
          </Button>
        </div>
      </div>
      {!canEdit && <p className="text-xs text-muted-foreground">You have read-only access. Only admin can add scores.</p>}
      {editError && <p className="text-xs text-destructive">{editError}</p>}
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
            <Trophy className="w-4 h-4 text-primary" /> Scores for Selected Month
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
                    {canEdit && isEditMode && (
                      <input
                        type="number"
                        min="-1000"
                        value={editScores[student.enroll_no] ?? String(student.score)}
                        onChange={e => setEditScores({ ...editScores, [student.enroll_no]: e.target.value })}
                        className="border px-2 py-1 rounded w-16 ml-2"
                        placeholder="Edit"
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        {canEdit && isEditMode && scores.length > 0 && (
          <div className="p-4 border-t border-border flex justify-end">
            <Button onClick={handleSaveEdits} disabled={savingEdits || !selectedMonth}>
              {savingEdits ? "Saving..." : "Save Month Edits"}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
