import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const students = [
  { id: 1, name: "Ayesha Khan", email: "ayesha@lab.edu", dept: "Computer Science", field: "NLP", score: 94, initials: "AK" },
  { id: 2, name: "Rahul Verma", email: "rahul@lab.edu", dept: "Computer Science", field: "Computer Vision", score: 89, initials: "RV" },
  { id: 3, name: "Sara Ali", email: "sara@lab.edu", dept: "Biotechnology", field: "Bioinformatics", score: 85, initials: "SA" },
  { id: 4, name: "James Chen", email: "james@lab.edu", dept: "Mechanical Eng.", field: "Robotics", score: 82, initials: "JC" },
  { id: 5, name: "Priya Patel", email: "priya@lab.edu", dept: "Data Science", field: "Machine Learning", score: 78, initials: "PP" },
  { id: 6, name: "Fatima Noor", email: "fatima@lab.edu", dept: "Computer Science", field: "Cybersecurity", score: 75, initials: "FN" },
  { id: 7, name: "Omar Hassan", email: "omar@lab.edu", dept: "Electrical Eng.", field: "IoT Systems", score: 71, initials: "OH" },
  { id: 8, name: "Li Wei", email: "li@lab.edu", dept: "Mathematics", field: "Cryptography", score: 88, initials: "LW" },
];

export default function Students() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.field.toLowerCase().includes(search.toLowerCase()) ||
      s.dept.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students, fields..."
            className="pl-9 rounded-xl border-border bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input placeholder="Enter student name" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="student@lab.edu" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Research Domain</Label>
                  <Input placeholder="e.g. Natural Language Processing" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="researcher">Researcher</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="lead">Team Lead</SelectItem>
                      <SelectItem value="assistant">Research Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Profile Image</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
                    <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button className="rounded-xl" onClick={() => setOpen(false)}>Add Student</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Student</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">Department</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Research Field</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Score</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Actions</th>
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
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/8 text-primary text-xs font-medium">
                            {student.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-foreground">{student.dept}</span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-primary/8 text-primary">
                        {student.field}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm font-semibold text-foreground">{student.score}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="gap-2 rounded-lg">
                            <Eye className="w-3.5 h-3.5" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 rounded-lg">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 rounded-lg text-destructive">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
    </div>
  );
}
