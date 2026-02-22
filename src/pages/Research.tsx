import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Eye, Edit, Trash2, MoreHorizontal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const papers = [
  { id: 1, title: "Attention Mechanisms in Low-Resource NLP", student: "Ayesha Khan", date: "Feb 15, 2026", status: "published", tags: ["NLP", "Deep Learning"] },
  { id: 2, title: "Real-Time Object Detection for Autonomous Drones", student: "Rahul Verma", date: "Feb 10, 2026", status: "published", tags: ["CV", "Robotics"] },
  { id: 3, title: "Gene Expression Clustering via Transformer Models", student: "Sara Ali", date: "Feb 8, 2026", status: "pending", tags: ["Bioinformatics", "ML"] },
  { id: 4, title: "Soft Actuator Design Using Reinforcement Learning", student: "James Chen", date: "Feb 5, 2026", status: "pending", tags: ["Robotics", "RL"] },
  { id: 5, title: "Federated Learning for Privacy-Preserving Healthcare", student: "Priya Patel", date: "Jan 28, 2026", status: "published", tags: ["ML", "Privacy"] },
  { id: 6, title: "Post-Quantum Lattice-Based Key Exchange", student: "Li Wei", date: "Jan 22, 2026", status: "pending", tags: ["Cryptography"] },
];

export default function Research() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = papers.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.student.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search papers..." className="pl-9 rounded-xl border-border bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
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

      <div className="grid gap-3">
        {filtered.map((paper, i) => (
          <motion.div
            key={paper.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            whileHover={{ y: -1 }}
            className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{paper.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{paper.student} · {paper.date}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {paper.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-primary/8 text-primary">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${paper.status === "published" ? "badge-published" : "badge-pending"}`}>
                {paper.status === "published" ? "Published" : "Pending"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreHorizontal className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem className="gap-2 rounded-lg"><Eye className="w-3.5 h-3.5" /> View</DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 rounded-lg"><Edit className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 rounded-lg text-destructive"><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
