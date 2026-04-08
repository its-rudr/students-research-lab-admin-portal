import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import StudentAvatar from "@/components/StudentAvatar";
import { hasWriteAccess } from "@/lib/auth";

// Define the student type based on your Supabase table structure
interface Student {
  id: number;
  student_name: string;
  enrollment_no?: string;
  institute_name?: string;
  department?: string;
  semester?: string;
  division?: string;
  batch?: string;
  email: string;
  contact_no?: string;
  gender?: string;
  member_type?: string;
  photo_url?: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_name: "",
    enrollment_no: "",
    email: "",
    contact_no: "",
    department: "",
    institute_name: "",
    semester: "",
    division: "",
    batch: "",
    gender: "male",
    member_type: "member",
  });
  const { toast } = useToast();
  const canEdit = hasWriteAccess();

  // Fetch students from Supabase
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students_details')
        .select('*');

      if (error) throw error;
      const visibleStudents = (data || []).filter(
        (row: any) => String(row.member_type || "member").toLowerCase() !== "admin"
      );
      setStudents(visibleStudents);
    } catch (error: any) {
      console.error('Supabase error:', error);
      toast({
        variant: "destructive",
        title: "Error fetching students",
        description: error.message,
      });
      setStudents([]); // Set empty array on error so page still renders
    } finally {
      setLoading(false);
    }
  };

  // Add new student
  const handleAddStudent = async () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can add students.",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students_details')
        .insert([formData])
        .select();

      if (error) throw error;

      setStudents([data[0], ...students]);
      setOpen(false);
      setFormData({
        student_name: "",
        enrollment_no: "",
        email: "",
        contact_no: "",
        department: "",
        institute_name: "",
        semester: "",
        division: "",
        batch: "",
        gender: "male",
        member_type: "member",
      });
      
      toast({
        title: "Student added",
        description: "New student has been added successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding student",
        description: error.message,
      });
    }
  };

  const filtered = students.filter(
    (s) =>
      (s.student_name && s.student_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.enrollment_no && s.enrollment_no.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(search.toLowerCase())) ||
      (s.batch && s.batch.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 items-start sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-9 rounded-xl border-border bg-card text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 flex-1 sm:flex-none">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </Button>
          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl gap-1.5 flex-1 sm:flex-none">
                  <Plus className="w-3.5 h-3.5" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Student Name</Label>
                    <Input 
                      placeholder="Enter student name" 
                      className="rounded-xl"
                      value={formData.student_name}
                      onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Enrollment Number</Label>
                    <Input
                    placeholder="e.g. 2024CS001" 
                    className="rounded-xl"
                    value={formData.enrollment_no}
                    onChange={(e) => setFormData({ ...formData, enrollment_no: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    placeholder="student@example.com" 
                    className="rounded-xl"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Number</Label>
                  <Input 
                    placeholder="e.g. +91 98765 43210" 
                    className="rounded-xl"
                    value={formData.contact_no}
                    onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Institute Name</Label>
                  <Input 
                    placeholder="e.g. ABC Institute of Technology" 
                    className="rounded-xl"
                    value={formData.institute_name}
                    onChange={(e) => setFormData({ ...formData, institute_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input 
                    placeholder="e.g. Computer Science" 
                    className="rounded-xl"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Semester</Label>
                    <Input 
                      placeholder="e.g. 5" 
                      className="rounded-xl"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Division</Label>
                    <Input 
                      placeholder="e.g. A" 
                      className="rounded-xl"
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Batch</Label>
                    <Input 
                      placeholder="e.g. 2024" 
                      className="rounded-xl"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Member Type</Label>
                  <Select value={formData.member_type} onValueChange={(value) => setFormData({ ...formData, member_type: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select member type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button className="rounded-xl" onClick={handleAddStudent}>Add Student</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>
      {!canEdit && <p className="text-xs text-muted-foreground">You have read-only access. Only admin can add students.</p>}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Enrollment No</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">Department</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Batch</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden xl:table-cell">Member Type</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((student, i) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <StudentAvatar
                            name={student.student_name || "N/A"}
                            enrollmentNo={student.enrollment_no}
                            photoUrl={student.photo_url}
                            className="w-8 h-8"
                            fallbackClassName="bg-primary/10 text-primary text-xs font-medium"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">{student.student_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{student.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-sm font-mono text-foreground">{student.enrollment_no || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="text-sm text-foreground">{student.department || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                          {student.batch || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden xl:table-cell">
                        <span className="text-sm text-foreground capitalize">{student.member_type || 'N/A'}</span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No students found matching your search.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
