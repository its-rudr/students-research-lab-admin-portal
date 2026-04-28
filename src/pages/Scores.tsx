import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, Edit2, Check, X } from "lucide-react";
import StudentAvatar from "@/components/StudentAvatar";
import { hasWriteAccess } from "@/lib/auth";
import { adminAPI } from "@/lib/adminApi";
import { useToast } from "@/hooks/use-toast";

interface ScoreRow {
  id: string;
  enrollment_no: string;
  points: number;
  name: string;
  initials: string;
  photo_url?: string;
}

export default function Scores() {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const [students, setStudents] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [cachedLeaderboardStats, setCachedLeaderboardStats] = useState<any[]>([]);
  const [cachedStudentsData, setCachedStudentsData] = useState<any[]>([]);
  
  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [isAddingScore, setIsAddingScore] = useState(false);
  const [newScoreEnrollment, setNewScoreEnrollment] = useState("");
  const [newScorePoints, setNewScorePoints] = useState(0);

  const canEdit = hasWriteAccess();
  const { toast } = useToast();

  const normalizeText = (value: unknown) => String(value || "").trim();
  const monthRank = (value: string) => {
    const raw = normalizeText(value);
    const match = raw.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
    if (!match) return 0;

    const monthLookup: Record<string, number> = {
      jan: 1, january: 1,
      feb: 2, february: 2,
      mar: 3, march: 3,
      apr: 4, april: 4,
      may: 5,
      jun: 6, june: 6,
      jul: 7, july: 7,
      aug: 8, august: 8,
      sep: 9, sept: 9, september: 9,
      oct: 10, october: 10,
      nov: 11, november: 11,
      dec: 12, december: 12,
    };

    const monthNumber = monthLookup[match[1].toLowerCase()] || 0;
    const yearNumber = Number(match[2]) || 0;
    return yearNumber * 100 + monthNumber;
  };

  const buildMonthOptions = (data: any, leaderboardStats: any[]): string[] => {
    const availableMonths = Array.isArray(data?.availableMonths) ? data.availableMonths : [];
    const monthsFromAvailable: string[] = availableMonths
      .map((item: any) => normalizeText(item?.label || item?.value || item?.period))
      .filter((period: string) => period && !/^all\s*time$/i.test(period));

    if (monthsFromAvailable.length > 0) {
      return Array.from(new Set<string>(monthsFromAvailable)).sort((a: string, b: string) => monthRank(b) - monthRank(a));
    }

    const monthsFromLeaderboard: string[] = leaderboardStats
      .map((row: any) => normalizeText(row.period))
      .filter((period: string) => period && !/^all\s*time$/i.test(period));

    return Array.from(new Set<string>(monthsFromLeaderboard)).sort((a: string, b: string) => monthRank(b) - monthRank(a));
  };

  const pickLatestRowsByEnrollment = (rows: any[]) => {
    const latestByEnrollment = new Map<string, any>();

    rows.forEach((row: any) => {
      const enrollment = normalizeText(row.enrollment_no);
      if (!enrollment) return;

      const nextTime = new Date(row.created_at || 0).getTime();
      const current = latestByEnrollment.get(enrollment);
      const currentTime = current ? new Date(current.created_at || 0).getTime() : -1;

      if (!current || nextTime >= currentTime) {
        latestByEnrollment.set(enrollment, row);
      }
    });

    return Array.from(latestByEnrollment.values());
  };

  // Fetch all available data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [scoresResponse, studentsResponse] = await Promise.all([
          adminAPI.getScores(),
          adminAPI.getStudents()
        ]);

        if (!scoresResponse.success) {
          setFetchError("Failed to fetch scores from backend");
          setLoading(false);
          return;
        }

        const data = scoresResponse.data;
        const leaderboardStats = Array.isArray(data.leaderboardStats) ? data.leaderboardStats : [];

        // Build student name map
        const nameMap = new Map<string, string>();
        if (Array.isArray(studentsResponse.data)) {
          studentsResponse.data.forEach((stu: any) => {
            const enrollment = normalizeText(stu.enrollment_no);
            const name = normalizeText(stu.student_name);
            if (enrollment && name) {
              nameMap.set(enrollment, name);
            }
          });
        }
        setStudents(nameMap);
        setCachedStudentsData(studentsResponse.data || []);

        const monthsArr = buildMonthOptions(data, leaderboardStats);
        setMonthOptions(monthsArr);

        // Cache leaderboard stats
        setCachedLeaderboardStats(leaderboardStats);

        // Set default to first/most recent month
        if (monthsArr.length > 0) {
          setSelectedMonth(monthsArr[0]);
        }

        setLoading(false);
      } catch (error: any) {
        setFetchError(error.message || "Failed to fetch scores");
        console.error("Error fetching scores:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch scores",
        });
        setLoading(false);
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process data for selected month - uses cached data
  useEffect(() => {
    if (!selectedMonth || cachedLeaderboardStats.length === 0) {
      setScores([]);
      return;
    }

    try {
      const monthlyScores = cachedLeaderboardStats.filter((score: any) => {
        return normalizeText(score.period) === selectedMonth;
      });

      const uniqueMonthlyScores = pickLatestRowsByEnrollment(monthlyScores);

      const nameMap = new Map<string, string>();
      cachedStudentsData.forEach((stu: any) => {
        const enrollment = normalizeText(stu.enrollment_no);
        const name = normalizeText(stu.student_name);
        if (enrollment && name) {
          nameMap.set(enrollment, name);
        }
      });

      const scoreRows: ScoreRow[] = uniqueMonthlyScores
        .map((score: any) => {
          const enrollment = normalizeText(score.enrollment_no);
          const name = nameMap.get(enrollment) || enrollment;
          const initials = typeof name === "string" && name.length > 0
            ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
            : enrollment.slice(0, 2).toUpperCase();

          return {
            id: normalizeText(score.id),
            enrollment_no: enrollment,
            points: Number(score.debate_score) || 0,
            name,
            initials,
            photo_url: undefined,
          };
        })
        .sort((a, b) => b.points - a.points);

      setScores(scoreRows);
    } catch (error: any) {
      console.error("Error processing scores:", error);
      setScores([]);
    }
  }, [selectedMonth, cachedLeaderboardStats, cachedStudentsData]);

  const handleAddScore = async () => {
    if (!newScoreEnrollment || newScorePoints < 0 || !selectedMonth) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please select a student and enter a valid score",
      });
      return;
    }

    try {
      const response = await adminAPI.createScore({
        enrollment_no: newScoreEnrollment,
        points: newScorePoints,
        period: selectedMonth,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Score added successfully",
        });
        setNewScoreEnrollment("");
        setNewScorePoints(0);
        setIsAddingScore(false);
        
        const scoresResponse = await adminAPI.getScores();
        if (scoresResponse.success) {
          const leaderboardStats = Array.isArray(scoresResponse.data.leaderboardStats) ? scoresResponse.data.leaderboardStats : [];
          setCachedLeaderboardStats(leaderboardStats);

          const monthsArr = buildMonthOptions(scoresResponse.data, leaderboardStats);
          setMonthOptions(monthsArr);
          if (monthsArr.length > 0 && !monthsArr.includes(selectedMonth)) {
            setSelectedMonth(monthsArr[0]);
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to add score",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add score",
      });
    }
  };

  const handleUpdateScore = async (id: string, newPoints: number) => {
    try {
      const response = await adminAPI.updateScore(id, { points: newPoints });

      if (response.success) {
        toast({
          title: "Success",
          description: "Score updated successfully",
        });
        setEditingId(null);
        
        const scoresResponse = await adminAPI.getScores();
        if (scoresResponse.success) {
          const leaderboardStats = Array.isArray(scoresResponse.data.leaderboardStats) ? scoresResponse.data.leaderboardStats : [];
          setCachedLeaderboardStats(leaderboardStats);

          const monthsArr = buildMonthOptions(scoresResponse.data, leaderboardStats);
          setMonthOptions(monthsArr);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to update score",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update score",
      });
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Month Selection Filter */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground shrink-0">
          Scores for
        </h2>
        {!canEdit && <p className="text-xs text-muted-foreground sm:ml-2">You have read-only access.</p>}
        <select
          id="month-select"
          value={selectedMonth || ""}
          onChange={(e) => setSelectedMonth(e.target.value || null)}
          className="px-2 py-1.5 sm:py-1 rounded border text-sm flex-1 sm:flex-none"
          style={{ color: 'black' }}
          disabled={monthOptions.length === 0}
        >
          {monthOptions.map((month, index) => (
            <option key={`month-${index}`} value={month}>
              {month}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Add Score Button (Admin Only) */}
      {canEdit && !isAddingScore && (
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddingScore(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Score
          </button>
        </div>
      )}

      {/* Add Score Form (Admin Only) */}
      {canEdit && isAddingScore && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-lg p-4 space-y-3 border border-border"
        >
          <h3 className="font-medium text-sm">Add New Score</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={newScoreEnrollment}
              onChange={(e) => setNewScoreEnrollment(e.target.value)}
              className="border px-3 py-2 rounded text-sm"
            >
              <option value="">Select Student</option>
              {Array.from(students.entries()).map(([enrollment, name]) => (
                <option key={enrollment} value={enrollment}>
                  {name} ({enrollment})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              value={newScorePoints}
              onChange={(e) => setNewScorePoints(Number(e.target.value))}
              placeholder="Score"
              className="border px-3 py-2 rounded text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddScore}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Add
              </button>
              <button
                onClick={() => {
                  setIsAddingScore(false);
                  setNewScoreEnrollment("");
                  setNewScorePoints(0);
                }}
                className="flex-1 px-3 py-2 bg-gray-400 text-white rounded text-sm hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <h2 className="section-title flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Scores
            {selectedMonth && ` - ${selectedMonth}`}
          </h2>
        </div>
        <div className="divide-y divide-border/50">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading scores...</div>
          ) : fetchError ? (
            <div className="p-6 text-center text-destructive text-sm">{fetchError}</div>
          ) : scores.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No scores found for this month.</div>
          ) : (
            <AnimatePresence>
              {scores.map((student, i) => (
                <motion.div
                  key={`${student.enrollment_no}-${i}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ layout: { duration: 0.3 } }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/8 text-xs font-bold text-primary shrink-0">
                    {i + 1}
                  </span>
                  <StudentAvatar
                    name={student.name}
                    enrollmentNo={student.enrollment_no}
                    photoUrl={student.photo_url}
                    className="w-8 h-8 shrink-0"
                    fallbackClassName="bg-primary/8 text-primary text-xs font-medium"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.enrollment_no}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === student.id ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          className="w-16 border px-2 py-1 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateScore(student.id, editValue)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <motion.span
                          key={student.points}
                          initial={{ scale: 1.15, color: "hsl(var(--primary))" }}
                          animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                          transition={{ duration: 0.2 }}
                          className="font-mono text-sm font-bold w-12 text-center"
                        >
                          {student.points}
                        </motion.span>
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingId(student.id);
                              setEditValue(student.points);
                            }}
                            className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/8 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
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