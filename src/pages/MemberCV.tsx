import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { getStoredUser } from "@/lib/auth";

type MemberRecord = {
  enrollment_no: string;
  student_name: string;
  email?: string;
  department?: string;
  member_type?: string;
};

type HackathonItem = {
  name: string;
  level: string;
  result: string;
  year: string;
  details: string;
};

type ResearchPaperItem = {
  title: string;
  journal: string;
  year: string;
  doi: string;
};

type PatentItem = {
  title: string;
  patent_number: string;
  status: string;
  year: string;
};

type ProjectItem = {
  title: string;
  description: string;
  tech_stack: string;
  year: string;
  url: string;
};

type CVFormData = {
  research_work_summary: string;
  research_area: string;
  hackathons: HackathonItem[];
  research_papers: ResearchPaperItem[];
  patents: PatentItem[];
  projects: ProjectItem[];
};

const emptyHackathon = (): HackathonItem => ({
  name: "",
  level: "",
  result: "",
  year: "",
  details: "",
});

const emptyResearchPaper = (): ResearchPaperItem => ({
  title: "",
  journal: "",
  year: "",
  doi: "",
});

const emptyPatent = (): PatentItem => ({
  title: "",
  patent_number: "",
  status: "",
  year: "",
});

const emptyProject = (): ProjectItem => ({
  title: "",
  description: "",
  tech_stack: "",
  year: "",
  url: "",
});

const emptyFormData = (): CVFormData => ({
  research_work_summary: "",
  research_area: "",
  hackathons: [emptyHackathon()],
  research_papers: [emptyResearchPaper()],
  patents: [emptyPatent()],
  projects: [emptyProject()],
});

const toHackathons = (value: unknown): HackathonItem[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return [emptyHackathon()];
  }

  return value.map((item: any) => ({
    name: String(item?.name || ""),
    level: String(item?.level || ""),
    result: String(item?.result || ""),
    year: String(item?.year || ""),
    details: String(item?.details || ""),
  }));
};

const toPapers = (value: unknown): ResearchPaperItem[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return [emptyResearchPaper()];
  }

  return value.map((item: any) => ({
    title: String(item?.title || ""),
    journal: String(item?.journal || ""),
    year: String(item?.year || ""),
    doi: String(item?.doi || ""),
  }));
};

const toPatents = (value: unknown): PatentItem[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return [emptyPatent()];
  }

  return value.map((item: any) => ({
    title: String(item?.title || ""),
    patent_number: String(item?.patent_number || ""),
    status: String(item?.status || ""),
    year: String(item?.year || ""),
  }));
};

const toProjects = (value: unknown): ProjectItem[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return [emptyProject()];
  }

  return value.map((item: any) => ({
    title: String(item?.title || ""),
    description: String(item?.description || ""),
    tech_stack: String(item?.tech_stack || ""),
    year: String(item?.year || ""),
    url: String(item?.url || ""),
  }));
};

export default function MemberCV() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState("");
  const [formData, setFormData] = useState<CVFormData>(emptyFormData());

  const { toast } = useToast();
  const currentUser = useMemo(() => getStoredUser(), []);
  const isAdmin = currentUser?.role === "admin";

  const selectedMember = useMemo(
    () => members.find((member) => member.enrollment_no === selectedEnrollment) || null,
    [members, selectedEnrollment]
  );

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const { data, error } = await supabase
          .from("students_details")
          .select("enrollment_no,student_name,email,department,member_type")
          .order("student_name", { ascending: true });

        if (error) {
          throw error;
        }

        const fetchedMembers = (data || []).filter(
          (row: any) => row.enrollment_no && String(row.member_type || "member").toLowerCase() !== "admin"
        );
        setMembers(fetchedMembers);

        if (!currentUser) {
          setSelectedEnrollment("");
          return;
        }

        if (isAdmin) {
          setSelectedEnrollment(fetchedMembers[0]?.enrollment_no || "");
        } else {
          const ownEnrollment = currentUser.enrollmentNo || "";
          const exists = fetchedMembers.some((row: any) => row.enrollment_no === ownEnrollment);
          setSelectedEnrollment(exists ? ownEnrollment : fetchedMembers[0]?.enrollment_no || "");
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Unable to load members",
          description: error.message || "Please check database connection.",
        });
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [currentUser, isAdmin]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!selectedEnrollment) {
        setFormData(emptyFormData());
        return;
      }

      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from("member_cv_profiles")
          .select("research_work_summary,research_area,hackathons,research_papers,patents,projects")
          .eq("enrollment_no", selectedEnrollment)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          setFormData(emptyFormData());
          return;
        }

        setFormData({
          research_work_summary: String(data.research_work_summary || ""),
          research_area: String(data.research_area || ""),
          hackathons: toHackathons(data.hackathons),
          research_papers: toPapers(data.research_papers),
          patents: toPatents(data.patents),
          projects: toProjects(data.projects),
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Unable to load profile",
          description: error.message || "Please try again.",
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [selectedEnrollment]);

  const updateHackathon = (index: number, key: keyof HackathonItem, value: string) => {
    setFormData((prev) => {
      const next = [...prev.hackathons];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, hackathons: next };
    });
  };

  const updatePaper = (index: number, key: keyof ResearchPaperItem, value: string) => {
    setFormData((prev) => {
      const next = [...prev.research_papers];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, research_papers: next };
    });
  };

  const updatePatent = (index: number, key: keyof PatentItem, value: string) => {
    setFormData((prev) => {
      const next = [...prev.patents];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, patents: next };
    });
  };

  const updateProject = (index: number, key: keyof ProjectItem, value: string) => {
    setFormData((prev) => {
      const next = [...prev.projects];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, projects: next };
    });
  };

  const canEditSelected =
    !!selectedEnrollment &&
    (!!isAdmin || (currentUser?.enrollmentNo && currentUser.enrollmentNo === selectedEnrollment));

  const profileCompletion = useMemo(() => {
    const sections = [
      formData.research_work_summary.trim().length > 0,
      formData.research_area.trim().length > 0,
      formData.hackathons.some((item) => item.name.trim().length > 0),
      formData.research_papers.some((item) => item.title.trim().length > 0),
      formData.patents.some((item) => item.title.trim().length > 0),
      formData.projects.some((item) => item.title.trim().length > 0),
    ];

    const completed = sections.filter(Boolean).length;
    const total = sections.length;

    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
    };
  }, [formData]);

  const handleSave = async () => {
    if (!selectedMember || !selectedEnrollment) {
      toast({
        variant: "destructive",
        title: "No profile selected",
        description: "Please select a member profile first.",
      });
      return;
    }

    if (!canEditSelected) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You can edit only your own profile.",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        enrollment_no: selectedEnrollment,
        student_name: selectedMember.student_name,
        research_work_summary: formData.research_work_summary,
        research_area: formData.research_area,
        hackathons: formData.hackathons,
        research_papers: formData.research_papers,
        patents: formData.patents,
        projects: formData.projects,
        updated_by: currentUser?.email || null,
      };

      const { error } = await supabase
        .from("member_cv_profiles")
        .upsert(payload, { onConflict: "enrollment_no" });

      if (error) {
        throw error;
      }

      toast({
        title: "Profile saved",
        description: `CV profile updated for ${selectedMember.student_name}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Could not save profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Member Profile Workspace
            </div>
            <h2 className="section-title mt-2">Add Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Members can edit only their own profile. Admin can update all profiles.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[320px]">
            <div className="rounded-xl border border-border/70 bg-background/75 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Completion</p>
              <p className="text-lg font-semibold mt-0.5">{profileCompletion.percent}%</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/75 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sections</p>
              <p className="text-lg font-semibold mt-0.5">{profileCompletion.completed}/{profileCompletion.total}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/75 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Access</p>
              <p className="text-sm font-semibold mt-1">{canEditSelected ? "Edit" : "View"}</p>
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-1.5">
            <Label>Select Member Profile</Label>
            {loadingMembers ? (
              <div className="h-10 rounded-xl border border-border flex items-center px-3 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading members...
              </div>
            ) : (
              <Select
                value={selectedEnrollment}
                onValueChange={(value) => setSelectedEnrollment(value)}
                disabled={!isAdmin || members.length === 0}
              >
                <SelectTrigger className="rounded-xl bg-card">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.enrollment_no} value={member.enrollment_no}>
                      {member.student_name} ({member.enrollment_no})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {selectedMember && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label>Member Name</Label>
              <Input value={selectedMember.student_name} disabled className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Enrollment Number</Label>
              <Input value={selectedMember.enrollment_no} disabled className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={selectedMember.department || "N/A"} disabled className="rounded-xl" />
            </div>
          </div>
        )}
      </div>

      {!selectedEnrollment ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
          No member profile available.
        </div>
      ) : loadingProfile ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading profile...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Research Details</h3>
              <p className="text-sm text-muted-foreground">Capture your core research direction and the work currently in progress.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Research Work</Label>
              <Textarea
                value={formData.research_work_summary}
                onChange={(e) => setFormData((prev) => ({ ...prev, research_work_summary: e.target.value }))}
                placeholder="Describe research work done"
                className="rounded-xl min-h-24"
                disabled={!canEditSelected}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Research Area</Label>
              <Input
                value={formData.research_area}
                onChange={(e) => setFormData((prev) => ({ ...prev, research_area: e.target.value }))}
                placeholder="Example: Machine Learning, Cyber Security"
                className="rounded-xl"
                disabled={!canEditSelected}
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Hackathons</h3>
                <p className="text-sm text-muted-foreground mt-1">List participation, wins, competition level, and highlights.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setFormData((prev) => ({ ...prev, hackathons: [...prev.hackathons, emptyHackathon()] }))}
                disabled={!canEditSelected}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Hackathon
              </Button>
            </div>
            <div className="space-y-3">
              {formData.hackathons.map((item, index) => (
                <div key={`hackathon-${index}`} className="border border-border rounded-xl p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Input value={item.name} onChange={(e) => updateHackathon(index, "name", e.target.value)} placeholder="Hackathon name" disabled={!canEditSelected} className="rounded-xl" />
                    <Input value={item.level} onChange={(e) => updateHackathon(index, "level", e.target.value)} placeholder="Level (College/State/National)" disabled={!canEditSelected} className="rounded-xl" />
                    <Input value={item.result} onChange={(e) => updateHackathon(index, "result", e.target.value)} placeholder="Result (Participated/Won)" disabled={!canEditSelected} className="rounded-xl" />
                    <Input value={item.year} onChange={(e) => updateHackathon(index, "year", e.target.value)} placeholder="Year" disabled={!canEditSelected} className="rounded-xl" />
                  </div>
                  <div className="flex gap-2">
                    <Input value={item.details} onChange={(e) => updateHackathon(index, "details", e.target.value)} placeholder="Additional details" disabled={!canEditSelected} className="rounded-xl" />
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-destructive"
                      onClick={() => setFormData((prev) => ({ ...prev, hackathons: prev.hackathons.filter((_, i) => i !== index) || [emptyHackathon()] }))}
                      disabled={!canEditSelected || formData.hackathons.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Research Papers Published</h3>
                <p className="text-sm text-muted-foreground mt-1">Add journals, conferences, years, and links for published work.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setFormData((prev) => ({ ...prev, research_papers: [...prev.research_papers, emptyResearchPaper()] }))}
                disabled={!canEditSelected}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Paper
              </Button>
            </div>
            <div className="space-y-3">
              {formData.research_papers.map((item, index) => (
                <div key={`paper-${index}`} className="border border-border rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <Input value={item.title} onChange={(e) => updatePaper(index, "title", e.target.value)} placeholder="Paper title" disabled={!canEditSelected} className="rounded-xl lg:col-span-2" />
                  <Input value={item.journal} onChange={(e) => updatePaper(index, "journal", e.target.value)} placeholder="Journal/Conference" disabled={!canEditSelected} className="rounded-xl" />
                  <Input value={item.year} onChange={(e) => updatePaper(index, "year", e.target.value)} placeholder="Year" disabled={!canEditSelected} className="rounded-xl" />
                  <div className="flex gap-2">
                    <Input value={item.doi} onChange={(e) => updatePaper(index, "doi", e.target.value)} placeholder="DOI/Link" disabled={!canEditSelected} className="rounded-xl" />
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-destructive"
                      onClick={() => setFormData((prev) => ({ ...prev, research_papers: prev.research_papers.filter((_, i) => i !== index) || [emptyResearchPaper()] }))}
                      disabled={!canEditSelected || formData.research_papers.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Patents Published</h3>
                <p className="text-sm text-muted-foreground mt-1">Store patent titles, numbers, status, and filing year.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setFormData((prev) => ({ ...prev, patents: [...prev.patents, emptyPatent()] }))}
                disabled={!canEditSelected}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Patent
              </Button>
            </div>
            <div className="space-y-3">
              {formData.patents.map((item, index) => (
                <div key={`patent-${index}`} className="border border-border rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <Input value={item.title} onChange={(e) => updatePatent(index, "title", e.target.value)} placeholder="Patent title" disabled={!canEditSelected} className="rounded-xl lg:col-span-2" />
                  <Input value={item.patent_number} onChange={(e) => updatePatent(index, "patent_number", e.target.value)} placeholder="Patent number" disabled={!canEditSelected} className="rounded-xl" />
                  <Input value={item.status} onChange={(e) => updatePatent(index, "status", e.target.value)} placeholder="Status" disabled={!canEditSelected} className="rounded-xl" />
                  <div className="flex gap-2">
                    <Input value={item.year} onChange={(e) => updatePatent(index, "year", e.target.value)} placeholder="Year" disabled={!canEditSelected} className="rounded-xl" />
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-destructive"
                      onClick={() => setFormData((prev) => ({ ...prev, patents: prev.patents.filter((_, i) => i !== index) || [emptyPatent()] }))}
                      disabled={!canEditSelected || formData.patents.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Projects Done</h3>
                <p className="text-sm text-muted-foreground mt-1">Document project scope, technology stack, year, and supporting links.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setFormData((prev) => ({ ...prev, projects: [...prev.projects, emptyProject()] }))}
                disabled={!canEditSelected}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Project
              </Button>
            </div>
            <div className="space-y-3">
              {formData.projects.map((item, index) => (
                <div key={`project-${index}`} className="border border-border rounded-xl p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Input value={item.title} onChange={(e) => updateProject(index, "title", e.target.value)} placeholder="Project title" disabled={!canEditSelected} className="rounded-xl" />
                    <Input value={item.tech_stack} onChange={(e) => updateProject(index, "tech_stack", e.target.value)} placeholder="Tech stack" disabled={!canEditSelected} className="rounded-xl" />
                    <Input value={item.year} onChange={(e) => updateProject(index, "year", e.target.value)} placeholder="Year" disabled={!canEditSelected} className="rounded-xl" />
                    <Input value={item.url} onChange={(e) => updateProject(index, "url", e.target.value)} placeholder="URL (optional)" disabled={!canEditSelected} className="rounded-xl" />
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateProject(index, "description", e.target.value)}
                      placeholder="Project information / summary"
                      className="rounded-xl min-h-20"
                      disabled={!canEditSelected}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-destructive self-start"
                      onClick={() => setFormData((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) || [emptyProject()] }))}
                      disabled={!canEditSelected || formData.projects.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-3 z-20 flex justify-end">
            <div className="rounded-2xl border border-border/70 bg-background/90 p-2 shadow-[var(--shadow-elevated)] backdrop-blur-md">
            <Button className="rounded-xl min-w-36" onClick={handleSave} disabled={saving || !canEditSelected}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : (
                "Save Profile"
              )}
            </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
