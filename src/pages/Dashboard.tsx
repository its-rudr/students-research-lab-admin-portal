import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CalendarCheck, BookOpen, Trophy, TrendingUp, Clock, Loader2, Calendar } from "lucide-react";
import StatCard from "@/components/StatCard";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  name: string;
  score: number;
  field: string;
  enrollment_no: string;
}

interface Activity {
  id: number;
  title: string;
  date: string;
  description?: string;
}

export default function Dashboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [studentsCountLoading, setStudentsCountLoading] = useState(true);
  const [attendancePercent, setAttendancePercent] = useState<number>(0);
  const [attendanceSubtitle, setAttendanceSubtitle] = useState<string>("No attendance data");
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const { toast } = useToast();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    fetchLeaderboard();
    fetchActivities();
    fetchTotalStudents();
  }, []);

  useEffect(() => {
    if (!studentsCountLoading) {
      fetchAttendanceSummary();
    }
  }, [studentsCountLoading, totalStudents]);

  const fetchTotalStudents = async () => {
    try {
      setStudentsCountLoading(true);
      const { count, error } = await supabase
        .from("students_details")
        .select("id", { count: "exact", head: true });

      if (error) throw error;
      setTotalStudents(count || 0);
    } catch (error: any) {
      console.error("Error fetching total students:", error);
      setTotalStudents(0);
    } finally {
      setStudentsCountLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      setAttendanceLoading(true);

      const today = new Date().toISOString().split("T")[0];
      let targetDate = today;

      let { data: attendanceRows, error: todayError } = await supabase
        .from("attendance")
        .select("enrollment_no,hours")
        .eq("date", today);

      if (todayError) throw todayError;

      // If today's rows don't exist, use the latest available attendance date.
      if (!attendanceRows || attendanceRows.length === 0) {
        const { data: latestDateRows, error: latestDateError } = await supabase
          .from("attendance")
          .select("date")
          .order("date", { ascending: false })
          .limit(1);

        if (latestDateError) throw latestDateError;

        const latestDate = latestDateRows?.[0]?.date;
        if (!latestDate) {
          setAttendancePercent(0);
          setAttendanceSubtitle("No attendance data");
          return;
        }

        targetDate = latestDate;
        const { data: latestRows, error: latestRowsError } = await supabase
          .from("attendance")
          .select("enrollment_no,hours")
          .eq("date", latestDate);

        if (latestRowsError) throw latestRowsError;
        attendanceRows = latestRows || [];
      }

      const presentSet = new Set(
        (attendanceRows || [])
          .filter((row: any) => Number(row.hours || 0) > 0)
          .map((row: any) => row.enrollment_no)
      );

      const presentCount = presentSet.size;
      const percent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

      setAttendancePercent(percent);
      setAttendanceSubtitle(
        targetDate === today
          ? `${presentCount} of ${totalStudents} present`
          : `${presentCount} of ${totalStudents} present (${targetDate})`
      );
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
      setAttendancePercent(0);
      setAttendanceSubtitle("Attendance unavailable");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Fetch all scores
      const { data: scoresData, error: scoresError } = await supabase
        .from("debate_scores")
        .select("*");

      if (scoresError) throw scoresError;

      // Fetch student details
      const { data: studentsData, error: studentsError } = await supabase
        .from("students_details")
        .select("enrollment_no, student_name, department");

      if (studentsError) throw studentsError;

      // Aggregate scores by enrollment_no
      const scoreMap: { [key: string]: number } = {};
      (scoresData || []).forEach((score: any) => {
        const enrollNo = score.enrollment_no || score["enroll no."] || score.enroll_no || "";
        const points = Number(score.total_points ?? score.points ?? score.score ?? 0) || 0;
        if (enrollNo) {
          scoreMap[enrollNo] = (scoreMap[enrollNo] || 0) + points;
        }
      });

      // Create leaderboard entries
      const leaderboardData: LeaderboardEntry[] = (studentsData || [])
        .map((student: any) => ({
          name: student.student_name || "Unknown",
          score: Math.round(scoreMap[student.enrollment_no] || 0),
          field: student.department || "N/A",
          enrollment_no: student.enrollment_no,
        }))
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score)
        .slice(0, 5);

      setLeaderboard(leaderboardData);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      toast({
        variant: "destructive",
        title: "Error fetching leaderboard",
        description: error.message,
      });
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      const sortedData = (data || []).sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setActivities(sortedData);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-5 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary/80 font-semibold">Overview</p>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">Research Lab Performance Snapshot</h2>
            <p className="text-sm text-muted-foreground mt-1">{today} · Real-time visibility for members, activities, and outcomes</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:w-[360px]">
            <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active Members</p>
              <p className="text-lg font-semibold mt-0.5">{studentsCountLoading ? "..." : totalStudents}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Attendance</p>
              <p className="text-lg font-semibold mt-0.5">{attendanceLoading ? "..." : `${attendancePercent}%`}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          title="Total Students"
          value={studentsCountLoading ? "..." : totalStudents}
          subtitle="Live count from database"
          delay={0}
        />
        <StatCard
          icon={CalendarCheck}
          title="Today's Attendance"
          value={attendanceLoading ? "..." : `${attendancePercent}%`}
          subtitle={attendanceLoading ? "Loading attendance..." : attendanceSubtitle}
          delay={0.05}
        />
        <StatCard icon={BookOpen} title="Research Papers" value={24} subtitle="6 pending review" delay={0.1} />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card rounded-2xl p-5 lg:col-span-3"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Score Leaderboard
            </h2>
            <span className="text-xs font-medium text-muted-foreground">Top 5</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No scores available yet
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((student, i) => (
                <motion.div
                  key={student.enrollment_no}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary/8 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.field}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold text-foreground">{student.score}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="glass-card rounded-2xl p-5 lg:col-span-2"
        >
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            Recent Activities
          </h2>
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No activities yet
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(activity.date)}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
