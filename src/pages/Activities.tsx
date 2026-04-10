import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import prisma from "@/lib/prismaClient";
import { useToast } from "@/hooks/use-toast";
import { hasWriteAccess } from "@/lib/auth";

interface Activity {
  id: number;
  title: string;
  date: string;
  description?: string;
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    description: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    date: "",
    description: "",
  });
  const { toast } = useToast();
  const canEdit = hasWriteAccess();

  // Fetch activities from Supabase
  useEffect(() => {
    fetchActivities();
  }, []);

  const parseActivityDate = (value: string) => {
    if (!value) return null;

    const trimmed = value.trim();
    const direct = new Date(trimmed);
    if (!Number.isNaN(direct.getTime())) {
      return direct;
    }

    const slashOrDash = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (slashOrDash) {
      const [, p1, p2, year] = slashOrDash;
      const day = Number.parseInt(p1, 10);
      const month = Number.parseInt(p2, 10);
      const parsed = new Date(Number.parseInt(year, 10), month - 1, day);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const compact = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (compact) {
      const [, year, month, day] = compact;
      const parsed = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await prisma.activities.findMany({ select: { id: true, name: true, description: true, date: true } });
        setActivities(data || []);
      } catch (error) {
        setActivities([]);
      }
      setLoading(false);
    };
      return;
    }

    try {
      if (!formData.title || !formData.date) {
        toast({
          variant: "destructive",
          title: "Please fill in required fields",
          description: "Title and date are required.",
        });
        return;
      }

      const payload = {
        title: formData.title.trim(),
        date: formData.date,
        description: formData.description.trim(),
      };

      const { data, error } = await supabase
        .from('activities')
        .insert([payload])
        .select();

      if (error) throw error;

      toast({
        title: "Activity added successfully",
      });

      setOpen(false);
      setFormData({ title: "", date: "", description: "" });
      fetchActivities();
    } catch (error: any) {
      console.error('Error adding activity:', error);
      toast({
        variant: "destructive",
        title: "Error adding activity",
        description: error.message,
      });
    }
  };

  const handleStartEdit = (activity: Activity) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can edit activities.",
      });
      return;
    }

    setEditingActivity(activity);
    const parsedDate = parseActivityDate(activity.date);
    const isoDate = parsedDate ? parsedDate.toISOString().split('T')[0] : "";
    setEditFormData({
      title: activity.title,
      date: isoDate,
      description: activity.description || "",
    });
    setEditOpen(true);
  };

  const handleUpdateActivity = async () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can edit activities.",
      });
      return;
    }

    if (!editingActivity) return;

    if (!editFormData.title.trim() || !editFormData.date) {
      toast({
        variant: "destructive",
        title: "Please fill in required fields",
        description: "Title and date are required.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('activities')
        .update({
          title: editFormData.title.trim(),
          date: editFormData.date,
          description: editFormData.description.trim(),
        })
        .eq('id', editingActivity.id);

      if (error) throw error;

      toast({
        title: "Activity updated successfully",
      });

      setEditOpen(false);
      setEditingActivity(null);
      fetchActivities();
    } catch (error: any) {
      console.error('Error updating activity:', error);
      toast({
        variant: "destructive",
        title: "Error updating activity",
        description: error.message,
      });
    }
  };

  // Delete activity
  const handleDeleteActivity = async (id: number) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can delete activities.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Activity deleted successfully",
      });

      fetchActivities();
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast({
        variant: "destructive",
        title: "Error deleting activity",
        description: error.message,
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const parsed = parseActivityDate(dateString);
    if (!parsed) {
      return dateString || "Date unavailable";
    }
    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add Activity</span><span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader><DialogTitle>Add Activity / Event</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input 
                    placeholder="Event title" 
                    className="rounded-xl"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input 
                    type="date" 
                    className="rounded-xl"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Describe the event..." 
                    className="rounded-xl resize-none" 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button className="rounded-xl" onClick={handleAddActivity}>Create</Button>
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
              setEditingActivity(null);
            }
          }}
        >
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Activity / Event</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  placeholder="Event title"
                  className="rounded-xl"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the event..."
                  className="rounded-xl resize-none"
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button className="rounded-xl" onClick={handleUpdateActivity}>Update</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {!canEdit && <p className="text-xs text-muted-foreground">You have read-only access. Only admin can manage activities.</p>}

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No activities found. Add your first activity!
        </div>
      ) : (
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
                        {formatDate(activity.date)}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{activity.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => handleStartEdit(activity)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-lg text-destructive"
                          onClick={() => handleDeleteActivity(activity.id)}
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
