import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Calendar, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const activities = [
  { id: 1, title: "Annual Research Symposium", date: "Mar 15, 2026", description: "Presenting lab-wide research outcomes and student achievements to faculty and external reviewers." },
  { id: 2, title: "AI Workshop Series — Week 4", date: "Mar 8, 2026", description: "Hands-on workshop on transformer architectures and their applications in NLP and vision tasks." },
  { id: 3, title: "Industry Collaboration Day", date: "Feb 28, 2026", description: "Panel discussion with industry partners on bridging the gap between research and product development." },
  { id: 4, title: "Paper Writing Bootcamp", date: "Feb 20, 2026", description: "Intensive two-day workshop on academic writing, citation management, and peer review processes." },
  { id: 5, title: "New Member Orientation", date: "Feb 10, 2026", description: "Introduction to lab resources, safety protocols, and ongoing research projects for new lab members." },
];

export default function Activities() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader><DialogTitle>Add Activity / Event</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5"><Label>Title</Label><Input placeholder="Event title" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="Describe the event..." className="rounded-xl resize-none" rows={3} /></div>
              <div className="space-y-1.5">
                <Label>Media Upload</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
                  <Image className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Upload images or media</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="rounded-xl" onClick={() => setOpen(false)}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="relative pl-12"
            >
              <div className="absolute left-[14px] top-5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{activity.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {activity.date}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{activity.description}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
