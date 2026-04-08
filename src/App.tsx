import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Research from "@/pages/Research";
import Attendance from "@/pages/Attendance";
import Scores from "@/pages/Scores";
import Activities from "@/pages/Activities";
import Timeline from "@/pages/Timeline";
import JoinRequests from "@/pages/JoinRequests";
import MemberCV from "./pages/MemberCV";
import Login from "@/pages/Login";
import GoogleSheetData from "@/pages/GoogleSheetData";
import SheetSync from "@/pages/SheetSync";
import NotFound from "./pages/NotFound";
import { hasWriteAccess } from "@/lib/auth";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/research" element={<Research />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/scores" element={<Scores />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route
                  path="/join-requests"
                  element={hasWriteAccess() ? <JoinRequests /> : <Navigate to="/" replace />}
                />
                <Route path="/member-cv" element={<MemberCV />} />
                <Route path="/google-sheets" element={<GoogleSheetData />} />
                <Route path="/sheet-sync" element={<SheetSync />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
