import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hasWriteAccess } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminAPI } from "@/lib/adminApi";
import ImageUpload from "@/components/ImageUpload";

interface TimelineEntry {
  id: number;
  serial_no: number;
  title: string;
  description?: string;
  session_date?: string;
  category?: string;
  type?: string;
  linkedin_url?: string;
  image_url?: string;
  media_urls?: string[];
  created_at?: string;
}

export default function Timeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",

    session_date: "",
    category: "",
    type: "video",
    linkedin_url: "",
    image_url: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",

    session_date: "",
    category: "",
    type: "video",
    linkedin_url: "",
    image_url: "",
  });
  const { toast } = useToast();
  const canEdit = hasWriteAccess();

  useEffect(() => {
    fetchTimelineEntries();
  }, []);

  const fetchTimelineEntries = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTimeline();

      if (response.success && Array.isArray(response.data)) {
        const sorted = response.data.sort((a: any, b: any) => 
          (a.serial_no || 0) - (b.serial_no || 0)
        );
        setEntries(sorted as TimelineEntry[]);
      } else {
        setEntries([]);
      }
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

    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Title is required.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await adminAPI.createTimelineEntry({
        title: formData.title.trim(),
        description: formData.description.trim() || null,

        session_date: formData.session_date || null,
        category: formData.category.trim() || null,
        type: formData.type || "video",
        linkedin_url: formData.linkedin_url.trim() || null,
        image_url: formData.image_url.trim() || null,
      });

      if (response.success) {
        toast({
          title: "Timeline entry added",
        });

        setOpen(false);
        setFormData({
          title: "",
          description: "",

          session_date: "",
          category: "",
          type: "video",
          linkedin_url: "",
          image_url: "",
        });
        fetchTimelineEntries();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding timeline entry",
        description: error.message,
      });
    } finally {
      setSubmitting(false);
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
      const response = await adminAPI.deleteTimelineEntry(String(id));
      
      if (response.success) {
        toast({
          title: "Timeline entry deleted",
        });
        fetchTimelineEntries();
      }
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

    // Format session_date to YYYY-MM-DD string for date input
    let formattedDate = "";
    if (entry.session_date) {
      try {
        const dateObj = new Date(entry.session_date);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      } catch (e) {
        formattedDate = "";
      }
    }

    setEditingEntry(entry);
    setEditFormData({
      title: entry.title || "",
      description: entry.description || "",
      session_date: formattedDate,
      category: entry.category || "",
      type: entry.type || "video",
      linkedin_url: entry.linkedin_url || "",
      image_url: entry.image_url || "",
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

    if (!editFormData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Title is required.",
      });
      return;
    }

    try {
      setEditSubmitting(true);
      const response = await adminAPI.updateTimelineEntry(String(editingEntry.id), {
        title: editFormData.title.trim(),
        description: editFormData.description.trim() || null,

        session_date: editFormData.session_date || null,
        category: editFormData.category.trim() || null,
        type: editFormData.type || "video",
        linkedin_url: editFormData.linkedin_url.trim() || null,
        image_url: editFormData.image_url.trim() || null,
      });

      if (response.success) {
        toast({
          title: "Timeline entry updated",
        });

        setEditOpen(false);
        setEditingEntry(null);
        fetchTimelineEntries();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating timeline entry",
        description: error.message,
      });
    } finally {
      setEditSubmitting(false);
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
            <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Timeline Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g., SRL Foundation Ceremony"
                    className="rounded-xl"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Event description..."
                    className="rounded-xl resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">

                  <Label>Session Date</Label>
                  <Input
                    type="date"
                    className="rounded-xl"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input
                    placeholder="e.g., Workshop, Seminar"
                    className="rounded-xl"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="document">Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <ImageUpload
                  label="Timeline Media"
                  onImageUpload={(url) => setFormData({ ...formData, image_url: url })}
                  currentImage={formData.image_url}
                />
                <div className="space-y-1.5">
                  <Label>LinkedIn URL</Label>
                  <Input
                    placeholder="https://linkedin.com/..."
                    className="rounded-xl"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button className="rounded-xl" onClick={handleAddEntry} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
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
                <Label>Title *</Label>
                <Input
                  placeholder="e.g., SRL Foundation Ceremony"
                  className="rounded-xl"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Event description..."
                  className="rounded-xl resize-none"
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">

                <Label>Session Date</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={editFormData.session_date}
                  onChange={(e) => setEditFormData({ ...editFormData, session_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  placeholder="e.g., Workshop, Seminar"
                  className="rounded-xl"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                >
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="document">Document</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <ImageUpload
                label="Timeline Media"
                onImageUpload={(url) => setEditFormData({ ...editFormData, image_url: url })}
                currentImage={editFormData.image_url}
              />
              <div className="space-y-1.5">
                <Label>LinkedIn URL</Label>
                <Input
                  placeholder="https://linkedin.com/..."
                  className="rounded-xl"
                  value={editFormData.linkedin_url}
                  onChange={(e) => setEditFormData({ ...editFormData, linkedin_url: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)} disabled={editSubmitting}>
                  Cancel
                </Button>
                <Button className="rounded-xl" onClick={handleUpdateEntry} disabled={editSubmitting}>
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
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
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">SN: {entry.serial_no}</p>
                      <h3 className="text-sm font-semibold text-foreground mt-1">{entry.title}</h3>
                      {entry.category && (
                        <p className="text-xs text-muted-foreground mt-1">Category: {entry.category}</p>
                      )}
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">{entry.description}</p>
                      )}
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
