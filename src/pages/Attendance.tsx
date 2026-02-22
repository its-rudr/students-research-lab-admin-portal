import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const students = [
  { id: 1, name: "Ayesha Khan", initials: "AK" },
  { id: 2, name: "Rahul Verma", initials: "RV" },
  { id: 3, name: "Sara Ali", initials: "SA" },
  { id: 4, name: "James Chen", initials: "JC" },
  { id: 5, name: "Priya Patel", initials: "PP" },
  { id: 6, name: "Fatima Noor", initials: "FN" },
  { id: 7, name: "Omar Hassan", initials: "OH" },
  { id: 8, name: "Li Wei", initials: "LW" },
];

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Generate random attendance
const generateAttendance = () => {
  const result: Record<number, Record<number, boolean>> = {};
  students.forEach((s) => {
    result[s.id] = {};
    for (let d = 1; d <= 28; d++) {
      result[s.id][d] = Math.random() > 0.15;
    }
  });
  return result;
};

export default function Attendance() {
  const [monthIdx, setMonthIdx] = useState(1); // February
  const [attendance, setAttendance] = useState(generateAttendance);
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const weekDays = days.filter((d) => {
    const day = new Date(2026, monthIdx, d).getDay();
    return day !== 0 && day !== 6;
  });

  const toggle = (studentId: number, day: number) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [day]: !prev[studentId][day] },
    }));
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Month Selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setMonthIdx((p) => Math.max(0, p - 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground min-w-[160px] text-center">
          {months[monthIdx]} 2026
        </h2>
        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setMonthIdx((p) => Math.min(11, p + 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="ml-auto">
          <Button variant="outline" size="sm" className="rounded-xl">Mark All Present</Button>
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 sticky left-0 bg-card z-10 min-w-[180px]">
                  Student
                </th>
                {weekDays.slice(0, 15).map((d) => (
                  <th key={d} className="text-center text-xs font-medium text-muted-foreground px-1 py-3 min-w-[36px]">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-2.5 sticky left-0 bg-card z-10">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-primary/8 text-primary text-[10px] font-medium">{student.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{student.name}</span>
                    </div>
                  </td>
                  {weekDays.slice(0, 15).map((d) => {
                    const present = attendance[student.id]?.[d] ?? true;
                    return (
                      <td key={d} className="px-1 py-2.5 text-center">
                        <button
                          onClick={() => toggle(student.id, d)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 ${
                            present
                              ? "bg-success/15 text-success hover:bg-success/25"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                        >
                          {present ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
