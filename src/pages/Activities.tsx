import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hasWriteAccess } from "@/lib/auth";
import { adminAPI } from "@/lib/adminApi";
import ImageUpload from "@/components/ImageUpload";

interface Activity {
  id: string | number;
  title: string;
  date?: string;
  enrollment_no?: string;
  description?: string;
  category?: string;
  hours?: number;
  status?: string;
  Photo?: string;
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    enrollment_no: "",
    hours: "",
    Photo: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    category: "",
    description: "",
    date: "",
    hours: "",
    Photo: "",
  });
  const { toast } = useToast();
  const canEdit = hasWriteAccess();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getActivities();
      
      if (response.success && Array.isArray(response.data)) {
        setActivities(response.data.sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          return dateB - dateA;
        }));
      } else {
        setActivities([]);
      }
    } catch (error: any) {
      console.error('API error:', error);
      toast({
        variant: "destructive",
        title: "Error fetching activities",
        description: error.message,
      });
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can add activities.",
      });
      return;
    }

    try {
      if (!formData.title) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: "Title is required.",
        });
        return;
      }

      const response = await adminAPI.createActivity({
        title: formData.title.trim(),
        category: formData.category || null,
        description: formData.description.trim() || null,
        date: formData.date || new Date().toISOString(),
        enrollment_no: formData.enrollment_no || null,
        hours: formData.hours ? parseFloat(formData.hours) : 0,
        Photo: formData.Photo.trim() || null,
      });

      if (response.success) {
        toast({
          title: "Activity added successfully",
        });

        setOpen(false);
        setFormData({
          title: "",
          category: "",
          description: "",
          date: new Date().toISOString().split('T')[0],
          enrollment_no: "",
          hours: "",
          Photo: "",
        });
        fetchActivities();
      }
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
    const dateStr = activity.date ? activity.date.split('T')[0] : new Date().toISOString().split('T')[0];
    setEditFormData({
      title: activity.title,
      category: activity.category || "",
      description: activity.description || "",
      date: dateStr,
      hours: activity.hours?.toString() || "",
      Photo: activity.Photo || "",
    });
    setEditOpen(true);
  };

  const handleUpdateActivity = async () => {
    if (!canEdit || !editingActivity) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot update activity.",
      });
      return;
    }

    try {
      if (!editFormData.title.trim()) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: "Title is required.",
        });
        return;
      }

      const response = await adminAPI.updateActivity(String(editingActivity.id), {
        title: editFormData.title.trim(),
        category: editFormData.category || null,
        description: editFormData.description.trim() || null,
        date: editFormData.date,
        hours: editFormData.hours ? parseFloat(editFormData.hours) : 0,
        Photo: editFormData.Photo.trim() || null,
      });

      if (response.success) {
        toast({
          title: "Activity updated successfully",
        });
        setEditOpen(false);
        setEditingActivity(null);
        fetchActivities();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating activity",
        description: error.message,
      });
    }
  };

  const handleDeleteActivity = async (id: string | number) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can delete activities.",
      });
      return;
    }

    try {
      const response = await adminAPI.deleteActivity(String(id));
      if (response.success) {
        toast({
          title: "Activity deleted successfully",
        });
        fetchActivities();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting activity",
        description: error.message,
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date unavailable";
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
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
                  <Label>Category</Label>
                  <Input 
                    placeholder="e.g. Workshop, Seminar" 
                    className="rounded-xl"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    className="rounded-xl"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hours</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 2" 
                    className="rounded-xl"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  />
                </div>
                <ImageUpload
                  label="Activity Photo"
                  onImageUpload={(url) => setFormData({ ...formData, Photo: url })}
                  currentImage={formData.Photo}
                />
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
                <Label>Category</Label>
                <Input
                  placeholder="e.g. Workshop, Seminar"
                  className="rounded-xl"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hours</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2"
                  className="rounded-xl"
                  value={editFormData.hours}
                  onChange={(e) => setEditFormData({ ...editFormData, hours: e.target.value })}
                />
              </div>
              <ImageUpload
                label="Activity Photo"
                onImageUpload={(url) => setEditFormData({ ...editFormData, Photo: url })}
                currentImage={editFormData.Photo}
              />
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

      {/* Activities List */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        {activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No activities found.
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(activity)}
                      className="rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="rounded-lg text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
