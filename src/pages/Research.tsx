import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Eye, Edit, Trash2, MoreHorizontal, FileText, ImageOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { adminAPI } from "@/lib/adminApi";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";


type ResearchProject = {
  id: number;
  title: string;
  description: string;
  team_image_url?: string;
  [key: string]: any;
};

type Student = {
  student_name: string;
  enrollment_no: string;
  email?: string;
};

export default function Research() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewProject, setViewProject] = useState<ResearchProject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    student_enrollment: "",
    description: "",
    tags: "",
    link: "",
    team_image_url: "",
  });

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("research_projects")
        .select("id, title, description, team_image_url");
      if (error) {
        setProjects([]);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const response = await adminAPI.getStudents();
        if (response.success && Array.isArray(response.data)) {
          setStudents(response.data);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        setStudents([]);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch students",
        });
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [toast]);

  const handleSubmitResearch = async () => {
    if (!formData.title.trim() || !selectedStudent) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Title and student are required",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await adminAPI.createResearch({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        tags: formData.tags.trim() || null,
        link: formData.link.trim() || null,
        team_image_url: formData.team_image_url.trim() || null,
        student_enrollment: selectedStudent,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Research entry added successfully",
        });
        setOpen(false);
        setFormData({ title: "", student_enrollment: "", description: "", tags: "", link: "", team_image_url: "" });
        setSelectedStudent("");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create research entry",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl">
      <div className="flex flex-col gap-3 items-start sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search papers..." className="pl-9 rounded-xl border-border bg-card text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Research
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader><DialogTitle>Add Research Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input 
                  placeholder="Research paper title" 
                  className="rounded-xl" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Student *</Label>
                {studentsLoading ? (
                  <div className="flex items-center justify-center p-2 border border-border rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length > 0 ? (
                        students.map((student) => (
                          <SelectItem key={student.enrollment_no} value={student.enrollment_no}>
                            {student.student_name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground p-2">No students available</div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Brief description..." 
                  className="rounded-xl resize-none" 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tags / Category</Label>
                <Input 
                  placeholder="e.g. NLP, Deep Learning" 
                  className="rounded-xl"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Paper Link</Label>
                <Input 
                  placeholder="https://example.com/paper.pdf" 
                  className="rounded-xl"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>
              <ImageUpload
                label="Team Image"
                onImageUpload={(url) => setFormData({ ...formData, team_image_url: url })}
                currentImage={formData.team_image_url}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="rounded-xl" 
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  className="rounded-xl" 
                  onClick={handleSubmitResearch}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!viewProject} onOpenChange={() => setViewProject(null)}>
        {viewProject && (
          <DialogContent className="rounded-2xl w-full max-w-4xl p-0 overflow-hidden">
            <div className="flex flex-col md:flex-row w-full h-[420px]">
              <div className="md:w-1/2 w-full flex items-center justify-center bg-muted p-6">
                {viewProject.team_image_url ? (
                  <img
                    src={viewProject.team_image_url}
                    alt={viewProject.title}
                    className="w-full h-80 object-contain rounded-xl shadow"
                    loading="lazy"
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/600x300?text=No+Image'; }}
                  />
                ) : (
                  <img
                    src="https://via.placeholder.com/600x300?text=No+Image"
                    alt="No image available"
                    className="w-full h-80 object-contain rounded-xl shadow"
                  />
                )}
              </div>
              <div className="md:w-1/2 w-full flex flex-col p-8">
                <DialogHeader>
                  <DialogTitle className="mb-2 text-2xl">{viewProject.title}</DialogTitle>
                </DialogHeader>
                <div className="text-base text-foreground whitespace-pre-line overflow-y-auto pr-2" style={{maxHeight: '300px'}}>
                  {viewProject.description}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground col-span-full">Loading research projects...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground col-span-full">No research projects found.</div>
        ) : (
          filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-white dark:bg-card shadow-xl rounded-2xl overflow-hidden flex flex-col border border-border hover:shadow-2xl transition-all duration-300 h-full"
            >
              <div className="w-full h-48 bg-muted flex items-center justify-center overflow-hidden">
                {project.team_image_url ? (
                  <img
                    src={project.team_image_url}
                    alt={project.title}
                    className="w-full h-48 object-cover object-center"
                    loading="lazy"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                {!project.team_image_url && (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <ImageOff className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col p-5">
                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">{project.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{project.description}</p>
                <div className="mt-auto flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setViewProject(project)}>
                    View
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
