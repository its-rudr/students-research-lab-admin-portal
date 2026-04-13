import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { hasWriteAccess } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TimelineEntry {
  id: number;
  step: string;
  title: string;
  description: string;
  icon_svg?: string | null;
  display_order: number;
  is_active: boolean;
}

export default function Timeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [formData, setFormData] = useState({
    step: "",
    title: "",
    description: "",
    display_order: "",
  });
  const [editFormData, setEditFormData] = useState({
    step: "",
    title: "",
    description: "",
    display_order: "",
  });
  const { toast } = useToast();
  const canEdit = hasWriteAccess();

  useEffect(() => {
    fetchTimelineEntries();
  }, []);

  const fetchTimelineEntries = async () => {
    try {
      setLoading(true);
      const data = await api.getTimeline();
      // Filter and sort on client side
      const filtered = (data || [])
        .filter((entry: any) => entry.is_active !== false)
        .sort((a: any, b: any) => {
          const aOrder = Number(a.display_order) || a.id || 0;
          const bOrder = Number(b.display_order) || b.id || 0;
          return aOrder - bOrder;
        });
      setEntries(filtered);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching timeline",
        description: error.message,
      });
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can add timeline entries.",
      });
      return;
    }

    if (!formData.step.trim() || !formData.title.trim() || !formData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Step, title and description are required.",
      });
      return;
    }

    try {
      const orderValue = Number.parseInt(formData.display_order, 10);
      await api.createTimeline({
        step: formData.step.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        display_order: Number.isNaN(orderValue) ? entries.length + 1 : orderValue,
        is_active: true,
      });
      toast({ title: "Timeline entry added" });
      setOpen(false);
      setFormData({ step: "", title: "", description: "", display_order: "" });
      fetchTimelineEntries();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding timeline entry",
        description: error.message,
      });
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can delete timeline entries.",
      });
      return;
    }

    try {
      await api.deleteTimeline(id);
      toast({ title: "Timeline entry deleted" });
      fetchTimelineEntries();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting timeline entry",
        description: error.message,
      });
    }
  };

  const handleStartEdit = (entry: TimelineEntry) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can edit timeline entries.",
      });
      return;
    }

    setEditingEntry(entry);
    setEditFormData({
      step: entry.step,
      title: entry.title,
      description: entry.description,
      display_order: String(entry.display_order),
    });
    setEditOpen(true);
  };

  const handleUpdateEntry = async () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can edit timeline entries.",
      });
      return;
    }

    if (!editingEntry) return;

    if (!editFormData.step.trim() || !editFormData.title.trim() || !editFormData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Step, title and description are required.",
      });
      return;
    }

    try {
      const orderValue = Number.parseInt(editFormData.display_order, 10);
      await api.updateTimeline(editingEntry.id, {
        step: editFormData.step.trim(),
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        display_order: Number.isNaN(orderValue) ? editingEntry.display_order : orderValue,
      });
      toast({ title: "Timeline entry updated" });
      setEditOpen(false);
      setEditingEntry(null);
      fetchTimelineEntries();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating timeline entry",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl">
      {canEdit && (
        <div className="flex justify-start sm:justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5 text-sm sm:text-base">
                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add Timeline Entry</span><span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Timeline Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Step *</Label>
                  <Input
                    placeholder="Nov 2025"
                    className="rounded-xl"
                    value={formData.step}
                    onChange={(e) => setFormData({ ...formData, step: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input
                    placeholder="Marked The Beginning"
                    className="rounded-xl"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="The origin of SRL, where innovation and research journey began."
                    className="rounded-xl resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Display Order (optional)</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    className="rounded-xl"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="rounded-xl" onClick={handleAddEntry}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {canEdit && (
        <Dialog
          open={editOpen}
          onOpenChange={(isOpen) => {
            setEditOpen(isOpen);
            if (!isOpen) {
              setEditingEntry(null);
            }
          }}
        >
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Timeline Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Step *</Label>
                <Input
                  placeholder="Nov 2025"
                  className="rounded-xl"
                  value={editFormData.step}
                  onChange={(e) => setEditFormData({ ...editFormData, step: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  placeholder="Marked The Beginning"
                  className="rounded-xl"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description *</Label>
                <Textarea
                  placeholder="The origin of SRL, where innovation and research journey began."
                  className="rounded-xl resize-none"
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Display Order (optional)</Label>
                <Input
                  type="number"
                  placeholder="1"
                  className="rounded-xl"
                  value={editFormData.display_order}
                  onChange={(e) => setEditFormData({ ...editFormData, display_order: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button className="rounded-xl" onClick={handleUpdateEntry}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {!canEdit && <p className="text-xs text-muted-foreground">You have read-only access. Only admin can manage timeline entries.</p>}

      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No timeline entries found. Add your first timeline entry.</div>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="relative pl-12"
              >
                <div className="absolute left-[14px] top-5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">{entry.step}</p>
                      <h3 className="text-sm font-semibold text-foreground mt-1">{entry.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Order {entry.display_order}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{entry.description}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => handleStartEdit(entry)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-destructive"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
