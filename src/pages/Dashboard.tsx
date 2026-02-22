import { motion } from "framer-motion";
import { Users, CalendarCheck, BookOpen, Trophy, TrendingUp, Clock } from "lucide-react";
import StatCard from "@/components/StatCard";

const leaderboard = [
  { name: "Ayesha Khan", score: 94, field: "NLP" },
  { name: "Rahul Verma", score: 89, field: "Computer Vision" },
  { name: "Sara Ali", score: 85, field: "Bioinformatics" },
  { name: "James Chen", score: 82, field: "Robotics" },
  { name: "Priya Patel", score: 78, field: "Data Science" },
];

const recentActivity = [
  { action: "Published research paper", student: "Ayesha Khan", time: "2h ago", type: "research" },
  { action: "Attendance marked", student: "Batch 2024", time: "4h ago", type: "attendance" },
  { action: "Score updated", student: "Rahul Verma", time: "5h ago", type: "score" },
  { action: "New student enrolled", student: "Fatima Noor", time: "1d ago", type: "student" },
  { action: "Research submitted", student: "James Chen", time: "1d ago", type: "research" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Total Students" value={48} subtitle="+3 this month" delay={0} />
        <StatCard icon={CalendarCheck} title="Today's Attendance" value="92%" subtitle="44 of 48 present" delay={0.05} />
        <StatCard icon={BookOpen} title="Research Papers" value={24} subtitle="6 pending review" delay={0.1} />
        <StatCard icon={Trophy} title="Avg. Score" value={78.4} subtitle="↑ 3.2 from last month" delay={0.15} />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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
          <div className="space-y-2">
            {leaderboard.map((student, i) => (
              <motion.div
                key={student.name}
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
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="glass-card rounded-2xl p-5 lg:col-span-2"
        >
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.student} · {item.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Monthly Attendance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="glass-card rounded-2xl p-5"
      >
        <h2 className="section-title flex items-center gap-2 mb-4">
          <CalendarCheck className="w-4 h-4 text-primary" />
          Monthly Attendance Overview
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }, (_, i) => {
            const rate = Math.random();
            return (
              <div
                key={i}
                className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors"
                style={{
                  backgroundColor: `hsl(var(--primary) / ${0.08 + rate * 0.3})`,
                  color: rate > 0.5 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
                title={`Day ${i + 1}: ${Math.round(rate * 100)}%`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/10" />
            Low
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/25" />
            Medium
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/40" />
            High
          </div>
        </div>
      </motion.div>
    </div>
  );
}
