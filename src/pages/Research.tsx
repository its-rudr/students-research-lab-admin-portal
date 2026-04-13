import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Eye, Edit, Trash2, MoreHorizontal, FileText, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as api from "@/lib/api";


type ResearchProject = {
  id: number;
  title: string;
  description: string;
  team_image_url?: string;
  [key: string]: any;
};


export default function Research() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewProject, setViewProject] = useState<ResearchProject | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await api.getResearch();
        setProjects(data || []);
      } catch (error) {
        setProjects([]);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

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
              <div className="space-y-1.5"><Label>Title</Label><Input placeholder="Research paper title" className="rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label>Student</Label>
                <Select><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ayesha">Ayesha Khan</SelectItem>
                    <SelectItem value="rahul">Rahul Verma</SelectItem>
                    <SelectItem value="sara">Sara Ali</SelectItem>
                    <SelectItem value="james">James Chen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="Brief description..." className="rounded-xl resize-none" rows={3} /></div>
              <div className="space-y-1.5"><Label>Tags / Category</Label><Input placeholder="e.g. NLP, Deep Learning" className="rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label>File Upload</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
                  <FileText className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Upload PDF or paste link</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="rounded-xl" onClick={() => setOpen(false)}>Submit</Button>
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
