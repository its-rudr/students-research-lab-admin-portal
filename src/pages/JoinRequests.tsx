import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { Navigate } from "react-router-dom";
import { hasWriteAccess } from "@/lib/auth";
// Excel and PDF export
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface JoinUsRow {
  id: number;
  name: string;
  enrollment: string;
  semester: string;
  division: string;
  branch: string;
  college: string;
  contact: string;
  email: string;
  batch: string;
  source: string;
  reference_name: string | null;
  created_at: string;
}

export default function JoinRequests() {
  const [rows, setRows] = useState<JoinUsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const canAccess = hasWriteAccess();

  useEffect(() => {
    if (!canAccess) return;
    fetchRows();
  }, [canAccess]);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await api.getJoinRequests();
      setRows(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching join requests",
        description: error.message,
      });
      setRows([]);
    }
    setLoading(false);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "JoinRequests");
    XLSX.writeFile(wb, "join_requests.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [
        [
          "Name", "Enrollment", "Semester", "Division", "Branch", "College", "Contact", "Email", "Batch", "Source", "Reference Name", "Created At"
        ]
      ],
      body: rows.map(r => [
        r.name, r.enrollment, r.semester, r.division, r.branch, r.college, r.contact, r.email, r.batch, r.source, r.reference_name || "", r.created_at
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 178, 157] },
      margin: { top: 20 },
    });
    doc.save("join_requests.pdf");
  };

  // Accept handler
  const handleAccept = async (id: number) => {
    try {
      await api.updateJoinRequest(id, "accepted");
      toast({ variant: "success", title: "Request accepted" });
      fetchRows();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error accepting request", description: error.message });
    }
  };

  // Reject handler
  const handleReject = async (id: number) => {
    try {
      await api.updateJoinRequest(id, "rejected");
      toast({ variant: "success", title: "Request rejected" });
      fetchRows();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error rejecting request", description: error.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h2 className="text-xl font-bold">Join Us Requests</h2>
        <div className="flex gap-2">
          <Button onClick={exportExcel} variant="outline" className="gap-1 rounded-xl"><Download className="w-4 h-4" />Excel</Button>
          <Button onClick={exportPDF} variant="outline" className="gap-1 rounded-xl"><Download className="w-4 h-4" />PDF</Button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No join requests found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white/60">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-primary/10">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Enrollment</th>
                <th className="px-2 py-2">Semester</th>
                <th className="px-2 py-2">Division</th>
                <th className="px-2 py-2">Branch</th>
                <th className="px-2 py-2">College</th>
                <th className="px-2 py-2">Contact</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Batch</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">Reference Name</th>
                <th className="px-2 py-2">Created At</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-primary/5">
                  <td className="px-2 py-1 whitespace-nowrap">{r.name}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.enrollment}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.semester}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.division}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.branch}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.college}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.contact}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.email}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.batch}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.source}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{r.reference_name}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    <Button size="sm" variant="success" className="mr-1" onClick={() => handleAccept(r.id)}>Accept</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(r.id)}>Reject</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}