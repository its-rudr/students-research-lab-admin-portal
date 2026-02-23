import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";



export default function Scores() {
  const [scores, setScores] = useState<Array<{ enroll_no: string; score: number; name: string; initials: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addScores, setAddScores] = useState<{ [enroll_no: string]: string }>({});
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const handleAddScores = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Fetch debate scores
      const { data: scoresData, error: scoresError } = await supabase.from("debate_scores").select();
      console.log("debate_scores data", scoresData);
      if (scoresError || !scoresData) {
        setScores([]);
        setLoading(false);
        return;
      }
      // Fetch student details
      const { data: studentsData, error: studentsError } = await supabase.from("students_details").select("enrollment_no,student_name");
      console.log("students_details data", studentsData);
      if (studentsError || !studentsData) {
        setScores([]);
        setLoading(false);
        return;
      }
      // Map enrollment_no to name
      const nameMap: { [enroll_no: string]: string } = {};
      studentsData.forEach((stu: any) => {
        nameMap[stu.enrollment_no] = stu.student_name;
      });
      // Try both possible field names for enrollment number and score
      const merged = scoresData.map((row: any) => {
        const enrollNo = row.enrollment_no || row["enroll no."] || row.enroll_no || "";
        const score = row.total_points ?? 0;
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
        };
      });
      setScores(merged.sort((a, b) => b.score - a.score));
      setLoading(false);
    };
    fetchScores();
  }, []);

  // Optionally, you can keep the updateScore logic for local UI changes, but it won't persist to Supabase unless you add an update query.
  // Optionally, you can keep the updateScore logic for local UI changes, but it won't persist to Supabase unless you add an update query.
  const updateScore = (enroll_no: string, delta: number) => {
    setScores((prev) =>
      [...prev.map((s) => (s.enroll_no === enroll_no ? { ...s, score: Math.max(0, Math.min(100, s.score + delta)) } : s))]
        .sort((a, b) => b.score - a.score)
    );
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm((v) => !v)} variant="default">
          {showAddForm ? "Cancel" : "Add Score"}
        </Button>
      </div>
      {showAddForm && (
        <form onSubmit={handleAddScores} className="mb-4 p-4 border rounded bg-card flex flex-col gap-2 max-w-2xl">
          <div className="flex gap-2 items-center mb-2">
            <label className="font-medium">Date:</label>
            <input
              type="date"
              value={addDate}
              onChange={e => setAddDate(e.target.value)}
              className="border px-2 py-1 rounded"
              required
            />
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
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
            <Trophy className="w-4 h-4 text-primary" /> Live Score Leaderboard
          </h2>
        </div>
        <div className="divide-y divide-border/50">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading scores...</div>
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
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-primary/8 text-primary text-xs font-medium">{student.initials}</AvatarFallback>
                  </Avatar>
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
