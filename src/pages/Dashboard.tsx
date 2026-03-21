import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CalendarCheck, BookOpen, Trophy, TrendingUp, Loader2, Calendar, BarChart2, PieChart as PieIcon, Activity, Clock } from "lucide-react";
import StatCard from "@/components/StatCard";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeaderboardEntry {
  name: string;
  score: number;
  field: string;
  enrollment_no: string;
}

interface TopScoreChartEntry {
  name: string;
  score: number;
}

interface TopAttendanceChartEntry {
  name: string;
  hours: number;
}

interface MonthlyTrendEntry {
  month: string;
  score: number;
  hours: number;
}

interface ScoreBandEntry {
  name: string;
  value: number;
  color: string;
}

interface GenderChartEntry {
  name: string;
  value: number;
  color: string;
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
  const [topScoreChart, setTopScoreChart] = useState<TopScoreChartEntry[]>([]);
  const [topAttendanceChart, setTopAttendanceChart] = useState<TopAttendanceChartEntry[]>([]);
  const [monthlyTrendChart, setMonthlyTrendChart] = useState<MonthlyTrendEntry[]>([]);
  const [scoreBandChart, setScoreBandChart] = useState<ScoreBandEntry[]>([]);
  const [avgScorePerStudent, setAvgScorePerStudent] = useState<number>(0);
  const [avgHoursPerStudent, setAvgHoursPerStudent] = useState<number>(0);
  const [highPerformersCount, setHighPerformersCount] = useState<number>(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [genderRawData, setGenderRawData] = useState<{ gender: string; semester: string }[]>([]);
  const [genderSemesters, setGenderSemesters] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [genderLoading, setGenderLoading] = useState(true);
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
    fetchGenderData();
    fetchPerformanceAnalytics();
  }, []);

  useEffect(() => {
    if (!studentsCountLoading) {
      fetchAttendanceSummary();
    }
  }, [studentsCountLoading, totalStudents]);

  const fetchTotalStudents = async () => {
    try {
      setStudentsCountLoading(true);
      const { data, error } = await supabase
        .from("students_details")
        .select("member_type");

      if (error) throw error;
      const visibleStudents = (data || []).filter(
        (row: any) => String(row.member_type || "member").toLowerCase() !== "admin"
      );
      setTotalStudents(visibleStudents.length);
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

      const { data: studentsData, error: studentsError } = await supabase
        .from("students_details")
        .select("enrollment_no,member_type");

      if (studentsError) throw studentsError;

      const visibleEnrollmentSet = new Set(
        (studentsData || [])
          .filter((row: any) => String(row.member_type || "member").toLowerCase() !== "admin")
          .map((row: any) => row.enrollment_no)
          .filter(Boolean)
      );

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
          .filter((row: any) => visibleEnrollmentSet.has(row.enrollment_no) && Number(row.hours || 0) > 0)
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
      
      // Fetch top 5 from debate_scores table (only valid columns)
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("debate_scores")
        .select("enrollment_no, total_points")
        .order("total_points", { ascending: false })
        .limit(5);

      if (leaderboardError) throw leaderboardError;

      // Fetch student details for these enrollments
      const enrollmentNos = (leaderboardData || []).map(e => e.enrollment_no).filter(Boolean);
      let studentsMap = {};
      if (enrollmentNos.length > 0) {
        const { data: students, error: studentsError } = await supabase
          .from("students_details")
          .select("enrollment_no, student_name, field")
          .in("enrollment_no", enrollmentNos);
        if (!studentsError && students) {
          studentsMap = Object.fromEntries(students.map(s => [s.enrollment_no, s]));
        }
      }

      // Merge data for leaderboard
      setLeaderboard((leaderboardData || []).map(entry => ({
        ...entry,
        name: studentsMap[entry.enrollment_no]?.student_name || "",
        field: studentsMap[entry.enrollment_no]?.field || "",
        score: entry.total_points
      })));
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

  const fetchGenderData = async () => {
    try {
      setGenderLoading(true);
      const { data, error } = await supabase
        .from("students_details")
        .select("gender,semester,member_type");
      if (error) return;
      const rows = (data || [])
        .filter((row: any) => String(row.member_type || "member").toLowerCase() !== "admin")
        .map((r: any) => ({
          gender: (r.gender || "unknown").toLowerCase(),
          semester: r.semester ? String(r.semester).trim() : "Unknown",
        }));
      setGenderRawData(rows);
      const sems = Array.from(new Set(rows.map((r) => r.semester))).sort();
      setGenderSemesters(sems);
    } catch (e) {
      console.error("Gender data error:", e);
    } finally {
      setGenderLoading(false);
    }
  };

  const fetchPerformanceAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const [{ data: scoresData, error: scoresError }, { data: attendanceData, error: attError }, { data: studentsData, error: stuError }] = await Promise.all([
        supabase.from("debate_scores").select("enrollment_no,total_points,date"),
        supabase.from("attendance").select("enrollment_no,hours,date"),
        supabase.from("students_details").select("enrollment_no,student_name,member_type,field"),
      ]);

      if (scoresError || attError || stuError) {
        throw scoresError || attError || stuError;
      }

      const visibleStudents = (studentsData || []).filter(
        (student: any) => String(student.member_type || "member").toLowerCase() !== "admin"
      );

      const visibleEnrollmentSet = new Set(
        visibleStudents.map((student: any) => student.enrollment_no).filter(Boolean)
      );

      const nameMap: Record<string, string> = {};
      visibleStudents.forEach((student: any) => {
        nameMap[student.enrollment_no] = student.student_name;
      });

      const scoreMap: Record<string, number> = {};
      (scoresData || []).forEach((row: any) => {
        const enrollNo = row.enrollment_no || "";
        const points = Number(row.total_points) || 0;
        if (enrollNo && visibleEnrollmentSet.has(enrollNo)) {
          scoreMap[enrollNo] = (scoreMap[enrollNo] || 0) + points;
        }
      });

      const hoursMap: Record<string, number> = {};
      (attendanceData || []).forEach((row: any) => {
        const enrollNo = row.enrollment_no || "";
        const hours = Number(row.hours) || 0;
        if (enrollNo && visibleEnrollmentSet.has(enrollNo)) {
          hoursMap[enrollNo] = (hoursMap[enrollNo] || 0) + hours;
        }
      });

      const scoreTop5 = Object.entries(scoreMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([enrollNo, score]) => {
          const fullName = nameMap[enrollNo] || enrollNo;
          const shortName = fullName.split(" ").slice(0, 2).join(" ");
          return { name: shortName, score: Math.round(score) };
        });

      const attendanceTop5 = Object.entries(hoursMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([enrollNo, hours]) => {
          const fullName = nameMap[enrollNo] || enrollNo;
          const shortName = fullName.split(" ").slice(0, 2).join(" ");
          return { name: shortName, hours: Number(hours.toFixed(1)) };
        });

      setTopScoreChart(scoreTop5);
      setTopAttendanceChart(attendanceTop5);

      const monthKeys: string[] = [];
      const monthLabels: Record<string, string> = {};
      const today = new Date();
      for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthKeys.push(key);
        monthLabels[key] = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      }

      const trendMap: Record<string, { score: number; hours: number }> = {};
      monthKeys.forEach((key) => {
        trendMap[key] = { score: 0, hours: 0 };
      });

      (scoresData || []).forEach((row: any) => {
        const enrollNo = row.enrollment_no || "";
        const date = row.date ? String(row.date) : "";
        const key = date.slice(0, 7);
        if (visibleEnrollmentSet.has(enrollNo) && trendMap[key]) {
          trendMap[key].score += Number(row.total_points) || 0;
        }
      });

      (attendanceData || []).forEach((row: any) => {
        const enrollNo = row.enrollment_no || "";
        const date = row.date ? String(row.date) : "";
        const key = date.slice(0, 7);
        if (visibleEnrollmentSet.has(enrollNo) && trendMap[key]) {
          trendMap[key].hours += Number(row.hours) || 0;
        }
      });

      const trendRows: MonthlyTrendEntry[] = monthKeys.map((key) => ({
        month: monthLabels[key],
        score: Math.round(trendMap[key].score),
        hours: Number(trendMap[key].hours.toFixed(1)),
      }));
      setMonthlyTrendChart(trendRows);

      const scoreBandCounts = {
        "0-50": 0,
        "51-100": 0,
        "101-150": 0,
        "151+": 0,
      };

      visibleStudents.forEach((student: any) => {
        const total = Number(scoreMap[student.enrollment_no] || 0);
        if (total <= 50) scoreBandCounts["0-50"] += 1;
        else if (total <= 100) scoreBandCounts["51-100"] += 1;
        else if (total <= 150) scoreBandCounts["101-150"] += 1;
        else scoreBandCounts["151+"] += 1;
      });

      const bands: ScoreBandEntry[] = [
        { name: "0-50", value: scoreBandCounts["0-50"], color: "#94a3b8" },
        { name: "51-100", value: scoreBandCounts["51-100"], color: "#60a5fa" },
        { name: "101-150", value: scoreBandCounts["101-150"], color: "#34d399" },
        { name: "151+", value: scoreBandCounts["151+"], color: "#f59e0b" },
      ];
      setScoreBandChart(bands.filter((b) => b.value > 0));

      const totalVisibleStudents = visibleStudents.length || 1;
      const totalScore = Object.values(scoreMap).reduce((sum, v) => sum + v, 0);
      const totalHours = Object.values(hoursMap).reduce((sum, v) => sum + v, 0);
      setAvgScorePerStudent(Number((totalScore / totalVisibleStudents).toFixed(1)));
      setAvgHoursPerStudent(Number((totalHours / totalVisibleStudents).toFixed(1)));
      setHighPerformersCount(
        visibleStudents.filter((student: any) => Number(scoreMap[student.enrollment_no] || 0) >= 100).length
      );
    } catch (error) {
      console.error("Performance analytics error:", error);
      setTopScoreChart([]);
      setTopAttendanceChart([]);
      setMonthlyTrendChart([]);
      setScoreBandChart([]);
      setAvgScorePerStudent(0);
      setAvgHoursPerStudent(0);
      setHighPerformersCount(0);
    } finally {
      setAnalyticsLoading(false);
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

  const genderPieData = (() => {
    const filtered = selectedSemester === "all"
      ? genderRawData
      : genderRawData.filter((r) => r.semester === selectedSemester);
    const males = filtered.filter((r) => r.gender === "male" || r.gender === "m").length;
    const females = filtered.filter((r) => r.gender === "female" || r.gender === "f").length;
    const others = filtered.length - males - females;
    const result: GenderChartEntry[] = [];
    if (males > 0) result.push({ name: "Male", value: males, color: "#6366f1" });
    if (females > 0) result.push({ name: "Female", value: females, color: "#ec4899" });
    if (others > 0) result.push({ name: "Other", value: others, color: "#94a3b8" });
    return result;
  })();

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={TrendingUp}
          title="Avg Score / Student"
          value={analyticsLoading ? "..." : avgScorePerStudent}
          subtitle="Based on cumulative debate scores"
          delay={0.12}
        />
        <StatCard
          icon={Clock}
          title="Avg Attendance Hours"
          value={analyticsLoading ? "..." : avgHoursPerStudent}
          subtitle="Cumulative hours per student"
          delay={0.15}
        />
        <StatCard
          icon={Activity}
          title="High Performers"
          value={analyticsLoading ? "..." : highPerformersCount}
          subtitle="Students with score 100+"
          delay={0.18}
        />
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
                    {/* Date removed as requested */}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Bar Chart - Top 5 by Score */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Top 5
            </h2>
            <span className="text-xs font-medium text-muted-foreground">Total Points</span>
          </div>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : topScoreChart.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topScoreChart} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" } as any}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" } as any} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="score" name="Score" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Bar Chart - Top 5 by Attendance Hours */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" />
              Top 5 by Attendance
            </h2>
            <span className="text-xs font-medium text-muted-foreground">Hours</span>
          </div>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : topAttendanceChart.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topAttendanceChart} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" } as any}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" } as any} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="hours" name="Hours" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Line Chart - Monthly Trends */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              6-Month Trend
            </h2>
            <span className="text-xs font-medium text-muted-foreground">Scores vs Hours</span>
          </div>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : monthlyTrendChart.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No trend data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTrendChart} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" } as any} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" } as any} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="score" name="Score" stroke="#4f46e5" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="hours" name="Hours" stroke="#059669" strokeWidth={2.2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Pie Chart - Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.43, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Score Distribution
            </h2>
            <span className="text-xs font-medium text-muted-foreground">Student Bands</span>
          </div>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : scoreBandChart.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No score distribution available</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={scoreBandChart}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {scoreBandChart.map((entry, index) => (
                      <Cell key={`score-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3">
                {scoreBandChart.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                    <span className="text-xs font-semibold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Pie Chart - Gender Ratio by Semester */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Gender Ratio
            </h2>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-32 h-7 text-xs">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {genderSemesters.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    Sem {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {genderLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : genderPieData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No gender data available</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={genderPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {genderPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4">
                {genderPieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                    <span className="text-xs font-semibold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
