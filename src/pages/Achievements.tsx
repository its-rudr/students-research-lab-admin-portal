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

interface Achievement {
  id: number;
  serial_no: number;
  title: string;
  description?: string;
  achievement_date?: string;
  category?: string;
  type?: string;
  linkedin_url?: string;
  image_url?: string;
  media_urls?: string[];
  created_at?: string;
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    achievement_date: "",
    category: "",
    linkedin_url: "",
    image_url: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    achievement_date: "",
    category: "",
    linkedin_url: "",
    image_url: "",
  });
  const { toast } = useToast();
  const canEdit = hasWriteAccess();

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAchievements();

      if (response.success && Array.isArray(response.data)) {
        const sorted = response.data.sort((a: any, b: any) => 
          (a.serial_no || 0) - (b.serial_no || 0)
        );
        setAchievements(sorted as Achievement[]);
      } else {
        setAchievements([]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching achievements",
        description: error.message,
      });
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAchievement = async () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can add achievements.",
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
      const response = await adminAPI.createAchievement({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        achievement_date: formData.achievement_date || null,
        category: formData.category.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        image_url: formData.image_url.trim() || null,
      });

      if (response.success) {
        toast({
          title: "Achievement added",
        });

        setOpen(false);
        setFormData({
          title: "",
          description: "",
          achievement_date: "",
          category: "",
          linkedin_url: "",
          image_url: "",
        });
        fetchAchievements();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding achievement",
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAchievement = async (id: number) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can delete achievements.",
      });
      return;
    }

    try {
      const response = await adminAPI.deleteAchievement(String(id));
      
      if (response.success) {
        toast({
          title: "Achievement deleted",
        });
        fetchAchievements();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting achievement",
        description: error.message,
      });
    }
  };

  const handleStartEdit = (achievement: Achievement) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can edit achievements.",
      });
      return;
    }

    setEditingAchievement(achievement);
    setEditFormData({
      title: achievement.title || "",
      description: achievement.description || "",
      achievement_date: achievement.achievement_date || "",
      category: achievement.category || "",
      linkedin_url: achievement.linkedin_url || "",
      image_url: achievement.image_url || "",
    });
    setEditOpen(true);
  };

  const handleUpdateAchievement = async () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can edit achievements.",
      });
      return;
    }

    if (!editingAchievement) return;

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
      const response = await adminAPI.updateAchievement(String(editingAchievement.id), {
        title: editFormData.title.trim(),
        description: editFormData.description.trim() || null,
        achievement_date: editFormData.achievement_date || null,
        category: editFormData.category.trim() || null,
        linkedin_url: editFormData.linkedin_url.trim() || null,
        image_url: editFormData.image_url.trim() || null,
      });

      if (response.success) {
        toast({
          title: "Achievement updated",
        });

        setEditOpen(false);
        setEditingAchievement(null);
        fetchAchievements();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating achievement",
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
                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add Achievement</span><span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Achievement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g., Won Best Research Paper"
                    className="rounded-xl"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Achievement description..."
                    className="rounded-xl resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Achievement Date</Label>
                  <Input
                    type="date"
                    className="rounded-xl"
                    value={formData.achievement_date}
                    onChange={(e) => setFormData({ ...formData, achievement_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input
                    placeholder="e.g., Award, Certificate, Recognition"
                    className="rounded-xl"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <ImageUpload
                  label="Achievement Image"
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
                  <Button className="rounded-xl" onClick={handleAddAchievement} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add"
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
              setEditingAchievement(null);
            }
          }}
        >
          <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Achievement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g., Won Best Research Paper"
                  className="rounded-xl"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Achievement description..."
                  className="rounded-xl resize-none"
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Achievement Date</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={editFormData.achievement_date}
                  onChange={(e) => setEditFormData({ ...editFormData, achievement_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  placeholder="e.g., Award, Certificate, Recognition"
                  className="rounded-xl"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                />
              </div>
              <ImageUpload
                label="Achievement Image"
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
                <Button className="rounded-xl" onClick={handleUpdateAchievement} disabled={editSubmitting}>
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {!canEdit && <p className="text-xs text-muted-foreground">You have read-only access. Only admin can manage achievements.</p>}

      {achievements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No achievements found. Add your first achievement.</div>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {achievements.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="relative pl-12"
              >
                <div className="absolute left-[14px] top-5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">SN: {achievement.serial_no}</p>
                      <h3 className="text-sm font-semibold text-foreground mt-1">{achievement.title}</h3>
                      {achievement.category && (
                        <p className="text-xs text-muted-foreground mt-1">Category: {achievement.category}</p>
                      )}
                      {achievement.description && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">{achievement.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => handleStartEdit(achievement)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAchievement(achievement.id)}
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
