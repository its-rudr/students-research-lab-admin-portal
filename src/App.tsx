import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Research from "@/pages/Research";
import Attendance from "@/pages/Attendance";
import Scores from "@/pages/Scores";
import Leadership from "@/pages/Leadership";
import Activities from "@/pages/Activities";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Authentication temporarily disabled */}
          {/* <Route element={<ProtectedRoute />}> */}
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/research" element={<Research />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/scores" element={<Scores />} />
              <Route path="/leadership" element={<Leadership />} />
              <Route path="/activities" element={<Activities />} />
            </Route>
          {/* </Route> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
