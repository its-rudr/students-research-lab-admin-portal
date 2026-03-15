
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Check, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import StudentAvatar from "@/components/StudentAvatar";
import { hasWriteAccess } from "@/lib/auth";

export default function Attendance() {
  const [students, setStudents] = useState<Array<{ enrollment_no: string; name: string; initials: string; hours: number; photo_url?: string }>>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addHours, setAddHours] = useState<{ [enrollment_no: string]: string }>({});
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attendanceDate, setAttendanceDate] = useState<string | null>(null);
  const [allDates, setAllDates] = useState<string[]>([]);
  const canEdit = hasWriteAccess();

  // Fetch all available attendance dates on mount
  useEffect(() => {
    const fetchDates = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("date")
        .order("date", { ascending: false });
      if (!error && data && data.length > 0) {
        // Remove duplicates and sort descending
        const uniqueDates = Array.from(new Set(data.map((row: any) => row.date))).sort((a, b) => b.localeCompare(a));
        setAllDates(uniqueDates);
        setAttendanceDate(uniqueDates[0]);
      }
    };
    fetchDates();
  }, []);

  // Fetch attendance for selected date
  useEffect(() => {
    if (!attendanceDate) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: attData, error: attError } = await supabase
        .from("attendance")
        .select("enrollment_no,hours")
        .eq("date", attendanceDate);
      const { data: stuData, error: stuError } = await supabase
        .from("students_details")
        .select("enrollment_no,student_name");
      if (attError || stuError) {
        setStudents([]);
        setLoading(false);
        return;
      }
      const stuMap: { [enrollment_no: string]: { name: string; initials: string; photo_url?: string } } = {};
      stuData.forEach((s: any) => {
        stuMap[s.enrollment_no] = {
          name: s.student_name,
          initials: s.student_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase(),
          photo_url: s.photo_url,
        };
      });
      const studentsList = attData.map((row: any) => {
        const details = stuMap[row.enrollment_no];
        return {
          enrollment_no: row.enrollment_no,
          name: details ? details.name : row.enrollment_no,
          initials: details ? details.initials : row.enrollment_no.slice(0, 2).toUpperCase(),
          photo_url: details?.photo_url,
          hours: row.hours,
        };
      });
      setStudents(studentsList);
      setLoading(false);
    };
    fetchData();
  }, [attendanceDate]);

  const handleAddAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setAddError("Only admin can add attendance.");
      return;
    }
    setAdding(true);
    setAddError("");
    if (!addDate) {
      setAddError("Please select a date.");
      setAdding(false);
      return;
    }
    // Prepare rows for students with entered hours
    const rows = Object.entries(addHours)
      .filter(([_, hours]) => hours !== "" && !isNaN(Number(hours)))
      .map(([enrollment_no, hours]) => ({
        enrollment_no,
        date: addDate,
        hours: parseFloat(hours),
      }));
    if (rows.length === 0) {
      setAddError("Please enter hours for at least one student.");
      setAdding(false);
      return;
    }
    const { error } = await supabase.from("attendance").insert(rows);
    if (error) {
      setAddError(error.message);
    } else {
      setShowAddForm(false);
      setAddHours({});
      setAddDate("");
      setAttendanceDate(addDate);
    }
    setAdding(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl">
      <div className="flex justify-start sm:justify-end">
        <Button onClick={() => setShowAddForm((v) => !v)} variant="default" className="text-sm sm:text-base" disabled={!canEdit}>
          {showAddForm ? "Cancel" : "Add Attendance"}
        </Button>
      </div>
      {!canEdit && <p className="text-xs text-muted-foreground">You have read-only access. Only admin can add attendance.</p>}
      {showAddForm && (
        <form onSubmit={handleAddAttendance} className="mb-4 p-3 sm:p-4 border rounded bg-card flex flex-col gap-3 max-w-2xl">
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
                  <th className="text-center px-2 py-1">Hours</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.enrollment_no}>
                    <td className="px-2 py-1">{student.name}</td>
                    <td className="px-2 py-1 text-center">{student.enrollment_no}</td>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={addHours[student.enrollment_no] || ""}
                        onChange={e => setAddHours({ ...addHours, [student.enrollment_no]: e.target.value })}
                        className="border px-2 py-1 rounded w-24"
                        placeholder="0.0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {addError && <div className="text-red-500 text-sm mt-2">{addError}</div>}
          <Button type="submit" disabled={adding} variant="default" className="mt-2">
            {adding ? "Adding..." : "Submit Attendance"}
          </Button>
        </form>
      )}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground shrink-0">
          Attendance for
        </h2>
        <select
          value={attendanceDate || ''}
          onChange={e => setAttendanceDate(e.target.value)}
          className="px-2 py-1.5 sm:py-1 rounded border text-sm flex-1 sm:flex-none"
          style={{ color: 'black' }}
        >
          {allDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading attendance...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 sticky left-0 bg-card z-10 min-w-[180px]">
                    Student
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-1 py-3 min-w-[80px]">Present</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-1 py-3 min-w-[80px]">Hours</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-muted-foreground">No attendance data found.</td>
                  </tr>
                ) : (
                  students.map((student, i) => {
                    const present = student.hours !== 0;
                    return (
                      <motion.tr key={student.enrollment_no} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-2.5 sticky left-0 bg-card z-10">
                          <div className="flex items-center gap-2.5">
                            <StudentAvatar
                              name={student.name}
                              enrollmentNo={student.enrollment_no}
                              photoUrl={student.photo_url}
                              className="w-7 h-7"
                              fallbackClassName="bg-primary/8 text-primary text-[10px] font-medium"
                            />
                            <span className="text-sm font-medium text-foreground">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-1 py-2.5">
                          <div className="flex items-center justify-center h-full">
                            {present ? <Check className="w-3.5 h-3.5 text-success" /> : <X className="w-3.5 h-3.5 text-destructive" />}
                          </div>
                        </td>
                        <td className="px-1 py-2.5 text-center">
                          {Number(student.hours).toFixed(1)}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
