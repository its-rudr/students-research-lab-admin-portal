import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Plus, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hasWriteAccess } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminAPI } from "@/lib/adminApi";
import ImageUpload from "@/components/ImageUpload";

interface ResearchProject {
  id: number;
  title: string;
  description?: string;
  team_image_url?: string;
  social_link?: string;
  guide_name?: string;
  created_at?: string;
}

export default function Research() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    guide_name: "",
    social_link: "",
    team_image_url: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    guide_name: "",
    social_link: "",
    team_image_url: "",
  });
  const { toast } = useToast();
  const canEdit = hasWriteAccess();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getResearchProjects();

      if (response.success && Array.isArray(response.data)) {
        const sorted = response.data.sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        setProjects(sorted as ResearchProject[]);
      } else {
        setProjects([]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching research projects",
        description: error.message,
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can add research projects.",
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
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        guide_name: formData.guide_name.trim() || null,
        social_link: formData.social_link.trim() || null,
        team_image_url: formData.team_image_url.trim() || null,
      };

      const response = await adminAPI.createResearchProject(payload);

      if (response.success) {
        toast({
          title: "Success",
          description: "Research project added successfully",
        });
        setOpen(false);
        setFormData({ title: "", description: "", guide_name: "", social_link: "", team_image_url: "" });
        fetchProjects();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add research project",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can delete research projects.",
      });
      return;
    }

    try {
      const response = await adminAPI.deleteResearchProject(String(id));
      if (response.success) {
        toast({
          title: "Success",
          description: "Research project deleted successfully",
        });
        fetchProjects();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete research project",
      });
    }
  };

  const handleEditProject = (project: ResearchProject) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can edit research projects.",
      });
      return;
    }

    setEditingProject(project);
    setEditFormData({
      title: project.title || "",
      description: project.description || "",
      guide_name: project.guide_name || "",
      social_link: project.social_link || "",
      team_image_url: project.team_image_url || "",
    });
    setEditOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !canEdit) {
      toast({
        variant: "destructive",
        title: "Read-only access",
        description: "Only admin can edit research projects.",
      });
      return;
    }

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
      const payload = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim() || null,
        guide_name: editFormData.guide_name.trim() || null,
        social_link: editFormData.social_link.trim() || null,
        team_image_url: editFormData.team_image_url.trim() || null,
      };

      const response = await adminAPI.updateResearchProject(String(editingProject.id), payload);

      if (response.success) {
        toast({
          title: "Success",
          description: "Research project updated successfully",
        });
        setEditOpen(false);
        setEditingProject(null);
        fetchProjects();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update research project",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Research Projects
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage lab research projects and team initiatives</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-lg">
                <Plus className="w-4 h-4" /> Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Research Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="Project title"
                    className="rounded-lg"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Brief description of the research project"
                    className="rounded-lg resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Guide/Mentor Name</Label>
                  <Input
                    placeholder="Research guide or mentor name"
                    className="rounded-lg"
                    value={formData.guide_name}
                    onChange={(e) => setFormData({ ...formData, guide_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Social Link</Label>
                  <Input
                    placeholder="GitHub, Website, or other social link"
                    className="rounded-lg"
                    value={formData.social_link}
                    onChange={(e) => setFormData({ ...formData, social_link: e.target.value })}
                  />
                </div>
                <ImageUpload
                  label="Team Image"
                  onImageUpload={(url) => setFormData({ ...formData, team_image_url: url })}
                  currentImage={formData.team_image_url}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-lg"
                    onClick={handleAddProject}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Project"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!canEdit && <p className="text-xs text-muted-foreground">You have read-only access. Only admin can manage research projects.</p>}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Research Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Project title"
                className="rounded-lg"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the research project"
                className="rounded-lg resize-none"
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Guide/Mentor Name</Label>
              <Input
                placeholder="Research guide or mentor name"
                className="rounded-lg"
                value={editFormData.guide_name}
                onChange={(e) => setEditFormData({ ...editFormData, guide_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Social Link</Label>
              <Input
                placeholder="GitHub, Website, or other social link"
                className="rounded-lg"
                value={editFormData.social_link}
                onChange={(e) => setEditFormData({ ...editFormData, social_link: e.target.value })}
              />
            </div>
            <ImageUpload
              label="Team Image"
              onImageUpload={(url) => setEditFormData({ ...editFormData, team_image_url: url })}
              currentImage={editFormData.team_image_url}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  setEditOpen(false);
                  setEditingProject(null);
                }}
                disabled={editSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="rounded-lg"
                onClick={handleUpdateProject}
                disabled={editSubmitting}
              >
                {editSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Project"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No research projects found. Add your first project.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden"
            >
              {/* Image Section */}
              <div className="relative h-40 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                {project.team_image_url ? (
                  <img
                    src={project.team_image_url}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-semibold text-foreground line-clamp-2">{project.title}</h3>

                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                )}

                {project.guide_name && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Guide:</span> {project.guide_name}
                    </p>
                  </div>
                )}

                {project.social_link && (
                  <div className="pt-2">
                    <a
                      href={project.social_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View Details →
                    </a>
                  </div>
                )}

                {/* Actions */}
                {canEdit && (
                  <div className="flex gap-2 pt-4 border-t border-border/50">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
