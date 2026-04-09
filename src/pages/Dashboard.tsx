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
import { getStoredUser } from "@/lib/auth";
import { Sparkles, ArrowUpRight } from "lucide-react";

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
  
  // Student specific metrics
  const [userMonthlyAttendance, setUserMonthlyAttendance] = useState<number>(0);
  const [userMonthlyScore, setUserMonthlyScore] = useState<number>(0);
  const [userTotalScore, setUserTotalScore] = useState<number>(0);
  const [userMetricsLoading, setUserMetricsLoading] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string>("");

  const { toast } = useToast();
  const user = getStoredUser();
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
    fetchWelcomeName();
    if (user?.role !== 'admin' && user?.enrollmentNo) {
      fetchUserSpecificMetrics();
    }
  }, [user?.email, user?.enrollmentNo]);

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

  const fetchUserSpecificMetrics = async () => {
    if (!user?.enrollmentNo) return;
    try {
      setUserMetricsLoading(true);
      const enNo = String(user.enrollmentNo).trim().toLowerCase();
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const cleanEnNo = enNo.replace(/[^a-z0-9]/g, '');

      // 1. Fetch Scores
      const { data: allScoresRaw, error: scoreError } = await supabase
        .from("debate_scores")
        .select("*");

      if (scoreError) throw scoreError;

      const userScores = (allScoresRaw || []).filter(s => {
        const dbEnNoRaw = String(s.enrollment_no || s.enroll_no || s["enroll no."] || "").trim().toLowerCase();
        const dbEnNoClean = dbEnNoRaw.replace(/[^a-z0-9]/g, '');
        return dbEnNoClean === cleanEnNo || dbEnNoRaw === enNo;
      });
      
      // Calculate Total Lifetime Score
      const lifetime = userScores.reduce((sum, s) => {
        const val = s.total_points || s.points || s.score || 0;
        return sum + (typeof val === 'number' ? val : parseFloat(String(val)) || 0);
      }, 0);
      setUserTotalScore(lifetime);

      // Calculate Monthly Score
      const monthly = userScores.filter(s => {
        const dateStr = String(s.date || s.Date || s.DATE || "").trim();
        if (!dateStr) return false;
        
        try {
          // Check for substring matches like "03/2026" or "2026-03" or "March" as a first pass
          const monthPad = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
          if (dateStr.includes(`${monthPad}/${currentYear}`) || 
              dateStr.includes(`${currentMonth}/${currentYear}`) ||
              dateStr.includes(`${currentYear}-${monthPad}`) ||
              dateStr.toLowerCase().includes("mar")) return true;

          // Manual parts check
          const parts = dateStr.split(/[\/\-\.]/);
          if (parts.length >= 2) {
             const m = parseInt(parts[1]);
             const yStr = parts[parts.length-1];
             const y = yStr.length === 2 ? 2000 + parseInt(yStr) : parseInt(yStr);
             if (m === currentMonth && y === currentYear) return true;
          }
          
          const d = new Date(dateStr);
          return !isNaN(d.getTime()) && (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear);
        } catch { return false; }
      }).reduce((sum, s) => {
        const val = s.total_points || s.points || s.score || 0;
        return sum + (typeof val === 'number' ? val : parseFloat(String(val)) || 0);
      }, 0);
      
      setUserMonthlyScore(monthly);

      // 2. Fetch Attendance
      const { data: allAttRaw, error: attError } = await supabase
        .from("attendance")
        .select("*");

      if (!attError && allAttRaw) {
        const userAtt = allAttRaw.filter(a => {
          const dbEnNoRaw = String(a.enrollment_no || a.enroll_no || a["enroll no."] || "").trim().toLowerCase();
          const dbEnNoClean = dbEnNoRaw.replace(/[^a-z0-9]/g, '');
          return dbEnNoClean === cleanEnNo || dbEnNoRaw === enNo;
        });

        const monthAtt = userAtt.filter(a => {
          const dateStr = String(a.date || a.Date || a.DATE || "").trim();
          if (!dateStr) return false;
          const monthPad = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
          if (dateStr.includes(`${monthPad}/${currentYear}`) || dateStr.includes(`${currentMonth}/${currentYear}`)) return true;
          
          const d = new Date(dateStr);
          return !isNaN(d.getTime()) && (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear);
        });
        
        const daysPassed = Math.max(1, now.getDate());
        const presentDays = monthAtt.filter(a => {
          const h = a.hours || a.Hours || a.HOURS || 0;
          return (typeof h === 'number' ? h : parseFloat(String(h)) || 0) > 0;
        }).length;
        const attPercent = Math.min(100, Math.round((presentDays / daysPassed) * 100));
        setUserMonthlyAttendance(attPercent);
      }

      console.log("METRIC_TRACE:", {
        enNo,
        cleanEnNo,
        scoresFound: (allScoresRaw || []).length,
        userScoresFound: userScores.length,
        lifetime
      });

    } catch (error) {
      console.error("Error fetching student metrics:", error);
    } finally {
      setUserMetricsLoading(false);
    }
  };

  const fetchWelcomeName = async () => {
    if (user?.role === "admin") {
      setWelcomeName("Admin");
      return;
    }

    if (!user?.email) {
      setWelcomeName("");
      return;
    }

    try {
      const normalizedEmail = String(user.email).trim().toLowerCase();
      const { data, error } = await supabase
        .from("students_details")
        .select("student_name")
        .eq("email", normalizedEmail)
        .limit(1);

      if (error) throw error;

      const studentName = String(data?.[0]?.student_name || "").trim();
      setWelcomeName(studentName);
    } catch {
      setWelcomeName("");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      const [{ data: statsData, error: statsError }, { data: studentsData, error: studentsError }] = await Promise.all([
        supabase.from("leaderboard_stats").select("*"),
        supabase.from("students_details").select("enrollment_no,student_name,member_type"),
      ]);

      if (statsError) throw statsError;
      if (studentsError) throw studentsError;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const monthPad = String(currentMonth).padStart(2, "0");

      const isCurrentMonthByDateValue = (value: any) => {
        const dateStr = String(value || "").trim();
        if (!dateStr) return false;

        if (
          dateStr.includes(`${currentYear}-${monthPad}`) ||
          dateStr.includes(`${monthPad}/${currentYear}`) ||
          dateStr.includes(`${currentMonth}/${currentYear}`)
        ) {
          return true;
        }

        const parts = dateStr.split(/[\/\-.]/);
        if (parts.length >= 3) {
          const m = Number.parseInt(parts[1], 10);
          const yRaw = parts[parts.length - 1];
          const y = yRaw.length === 2 ? 2000 + Number.parseInt(yRaw, 10) : Number.parseInt(yRaw, 10);
          if (!Number.isNaN(m) && !Number.isNaN(y) && m === currentMonth && y === currentYear) {
            return true;
          }
        }

        const parsed = new Date(dateStr);
        return !Number.isNaN(parsed.getTime()) && parsed.getMonth() + 1 === currentMonth && parsed.getFullYear() === currentYear;
      };

      const isCurrentMonthRow = (row: any) => {
        if (isCurrentMonthByDateValue(row.date || row.Date || row.DATE || row.created_at || row.updated_at)) {
          return true;
        }

        if (isCurrentMonthByDateValue(row.period)) {
          return true;
        }

        const monthValue = row.month ?? row.month_name ?? row.month_label ?? row.month_no ?? row.period;
        const yearValue = row.year ?? row.year_no;

        if (monthValue != null && yearValue != null) {
          const yearNum = Number.parseInt(String(yearValue), 10);
          const monthRaw = String(monthValue).trim().toLowerCase();
          const monthNum = Number.parseInt(monthRaw, 10);

          if (!Number.isNaN(monthNum) && !Number.isNaN(yearNum)) {
            return monthNum === currentMonth && yearNum === currentYear;
          }

          const monthNames = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december",
          ];
          const monthShort = monthNames[currentMonth - 1]?.slice(0, 3);
          if (!Number.isNaN(yearNum) && monthShort) {
            return yearNum === currentYear && (monthRaw === monthNames[currentMonth - 1] || monthRaw === monthShort);
          }
        }

        return false;
      };

      const visibleStudents = (studentsData || []).filter(
        (student: any) => String(student.member_type || "member").toLowerCase() !== "admin"
      );

      const visibleEnrollmentSet = new Set(
        visibleStudents.map((student: any) => String(student.enrollment_no || "").trim()).filter(Boolean)
      );

      const nameMap: Record<string, string> = {};
      const fieldMap: Record<string, string> = {};
      visibleStudents.forEach((student: any) => {
        const en = String(student.enrollment_no || "").trim();
        if (!en) return;
        nameMap[en] = String(student.student_name || "").trim();
        fieldMap[en] = String(student.field || "").trim();
      });

      const scoreMap: Record<string, number> = {};
      (statsData || []).forEach((row: any) => {
        if (!isCurrentMonthRow(row)) return;

        const enrollment_no = String(row.enrollment_no || row.enroll_no || row["enroll no."] || "").trim();
        if (!enrollment_no || !visibleEnrollmentSet.has(enrollment_no)) return;

        const scoreValue =
          row.monthly_points ??
          row.month_points ??
          row.monthly_score ??
          row.debate_score ??
          row.total_points ??
          row.points ??
          row.score ??
          row.total_score ??
          0;
        const score = Number(scoreValue) || 0;
        scoreMap[enrollment_no] = (scoreMap[enrollment_no] || 0) + score;
      });

      const rows = Object.entries(scoreMap)
        .map(([enrollment_no, score]) => ({
          enrollment_no,
          score,
          name: nameMap[enrollment_no] || enrollment_no,
          field: fieldMap[enrollment_no] || "",
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setLeaderboard(rows);
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
        supabase.from("debate_scores").select("enrollment_no,points,date"),
        supabase.from("attendance").select("enrollment_no,hours,date"),
        supabase.from("students_details").select("enrollment_no,student_name,member_type"),
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
        const points = Number(row.points) || 0;
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
          trendMap[key].score += Number(row.points) || 0;
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
        { name: "51-100", value: scoreBandCounts["51-100"], color: "#2dd4bf" },
        { name: "101-150", value: scoreBandCounts["101-150"], color: "#0d9488" },
        { name: "151+", value: scoreBandCounts["151+"], color: "#115e59" },
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
    if (males > 0) result.push({ name: "Male", value: males, color: "#0d9488" });
    if (females > 0) result.push({ name: "Female", value: females, color: "#2dd4bf" });
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
    <div className="space-y-6 sm:space-y-8 max-w-7xl animate-in fade-in duration-700">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#ece5d4] to-[#d8ecea] border border-white/40 shadow-[var(--shadow-card)] p-8 sm:p-12"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-green-500/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-teal-500/10 rounded-full blur-[60px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-[10px] font-bold tracking-[0.14em] uppercase text-green-700">
              <Sparkles className="w-3.5 h-3.5" />
              SRL Ecosystem
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
              Welcome back,<br />
              <span className="text-green-600">{welcomeName?.split(' ')[0] || "Scholar"}!</span>
              {user?.enrollmentNo && (
                <div className="mt-2 space-y-1">
                  <span className="block text-xs font-mono text-slate-400">ID: {user.enrollmentNo}</span>
                  <span className="block text-[10px] text-slate-500">
                    Trace: {userMonthlyAttendance}% | {userMonthlyScore} pts | {userTotalScore} tot (Matched: {(userTotalScore > 0 ? "YES" : "NO")})
                  </span>
                </div>
              )}
            </h1>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:w-[600px]">
            {user?.role === 'admin' ? (
              <>
                <div className="glass-card bg-white/60 border-green-100 p-6 rounded-[2rem] group transition-all duration-300 hover:bg-white hover:border-green-200">
                  <p className="text-green-600 font-black text-3xl mb-1">{studentsCountLoading ? "..." : totalStudents}</p>
                  <p className="text-[10px] uppercase tracking-widest text-green-700/60 font-bold flex items-center gap-1 group-hover:text-green-700 transition-colors">
                    Active Members
                    <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </p>
                </div>
                {/*
                <div className="glass-card bg-white/60 border-green-100 p-6 rounded-[2rem] group transition-all duration-300 hover:bg-white hover:border-green-200">
                  <p className="text-green-600 font-black text-3xl mb-1">{attendanceLoading ? "..." : `${attendancePercent}%`}</p>
                  <p className="text-[10px] uppercase tracking-widest text-green-700/60 font-bold flex items-center gap-1 group-hover:text-green-700 transition-colors">
                    Avg. Attendance
                    <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </p>
                </div>
                */}
              </>
            ) : (
              <>
                <div className="glass-card bg-white/60 border-green-100 p-5 rounded-[2rem] group transition-all duration-300 hover:bg-white hover:border-green-200">
                  <p className="text-green-600 font-black text-2xl mb-1">{userMetricsLoading ? "..." : `${userMonthlyAttendance}%`}</p>
                  <p className="text-[10px] uppercase tracking-widest text-green-700/60 font-bold flex items-center gap-1 group-hover:text-green-700 transition-colors">
                    Monthly Att.
                  </p>
                </div>
                <div className="glass-card bg-white/60 border-green-100 p-5 rounded-[2rem] group transition-all duration-300 hover:bg-white hover:border-green-200">
                  <p className="text-green-600 font-black text-2xl mb-1">{userMetricsLoading ? "..." : userMonthlyScore}</p>
                  <p className="text-[10px] uppercase tracking-widest text-green-700/60 font-bold flex items-center gap-1 group-hover:text-green-700 transition-colors">
                    Monthly Score
                  </p>
                </div>
                <div className="glass-card bg-white/60 border-green-100 p-5 rounded-[2rem] group transition-all duration-300 hover:bg-white hover:border-green-200">
                  <p className="text-green-600 font-black text-2xl mb-1">{userMetricsLoading ? "..." : userTotalScore}</p>
                  <p className="text-[10px] uppercase tracking-widest text-green-700/60 font-bold flex items-center gap-1 group-hover:text-green-700 transition-colors">
                    Total Score
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {/*
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
        */}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card rounded-2xl p-5 lg:col-span-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-[1rem] bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                Score Leaderboard
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em] mt-1.5 ml-12">Top Performers this month</p>
            </div>
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
            <div className="space-y-4">
              {leaderboard.map((student, i) => (
                <motion.div
                  key={student.enrollment_no}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="flex items-center gap-4 p-5 rounded-[2rem] bg-background border border-border group hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-2xl text-sm font-black shadow-inner ${
                    i === 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                    i === 1 ? 'bg-slate-100/50 text-slate-500 border border-slate-200/50' : 
                    i === 2 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                    'bg-slate-50 text-muted-foreground border border-slate-100'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-foreground truncate group-hover:text-primary transition-colors">{student.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] mt-0.5">{student.field}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm font-black text-foreground">{student.score}</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                      <TrendingUp className="w-3 h-3" />
                      TOP {i + 1}
                    </div>
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
          <div className="mb-10">
            <h2 className="text-xl font-black text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-[1rem] bg-primary/5 border border-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              Recent Activities
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em] mt-1.5 ml-12">Latest lab updates</p>
          </div>
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No activities yet
            </div>
          ) : (
            <div className="space-y-6">
              {activities.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="relative pl-7 border-l-2 border-border hover:border-primary transition-colors duration-500"
                >
                  <div className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-border border-2 border-white group-hover:bg-primary transition-colors" />
                  <div className="min-w-0 flex-1 group">
                    <p className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs font-semibold text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Bar Chart - Top 5 by Score (HIDDEN) */}
        {false && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-3">
                <BarChart2 className="w-5 h-5 text-primary" />
                Performance Rank
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em] mt-1 ml-8">Total cumulative points</p>
            </div>
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
                <Bar dataKey="score" name="Score" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
        )}

        {/* Bar Chart - Top 5 by Attendance Hours (HIDDEN) */}
        {false && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-3">
                <CalendarCheck className="w-5 h-5 text-primary" />
                Attendance Leader
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em] mt-1 ml-8">Most active this month</p>
            </div>
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
                <Bar dataKey="hours" name="Hours" fill="#115e59" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
        )}

        {/* Line Chart - Monthly Trends (HIDDEN) */}
        {false && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                Growth Velocity
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em] mt-1 ml-8">Score & hours progress</p>
            </div>
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
                <Line type="monotone" dataKey="score" name="Score" stroke="#0d9488" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="hours" name="Hours" stroke="#115e59" strokeWidth={2.2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
        )}

        {/* Pie Chart - Score Distribution (HIDDEN) */}
        {false && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.43, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-3">
                <PieIcon className="w-5 h-5 text-primary" />
                Score Distribution
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em] mt-1 ml-8">Talent segmentation</p>
            </div>
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
        )}

        {/* Pie Chart - Gender Ratio by Semester */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-3">
                <PieIcon className="w-5 h-5 text-primary" />
                Demographics
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em] mt-1 ml-8">Gender balance ratio</p>
            </div>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-32 h-9 rounded-xl border-border bg-background text-[10px] font-bold uppercase tracking-[0.1em]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border">
                <SelectItem value="all" className="text-xs font-semibold">ALL SEMESTERS</SelectItem>
                {genderSemesters.map((sem) => (
                  <SelectItem key={sem} value={sem} className="text-xs font-semibold">
                    SEMESTER {sem}
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
