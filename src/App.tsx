import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AnimatedPreloader from "@/components/AnimatedPreloader";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Research from "@/pages/Research";
import Attendance from "@/pages/Attendance";
import Scores from "@/pages/Scores";
import Activities from "@/pages/Activities";
import Login from "@/pages/Login";
// import GoogleSheetData from "@/pages/GoogleSheetData"; // Commented until API key is added
// import SheetSync from "@/pages/SheetSync"; // Commented until API key is added
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <AnimatedPreloader finishLoading={() => setIsLoading(false)} />}
      </AnimatePresence>
      {!isLoading && (
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
                    {/* <Route path="/google-sheets" element={<GoogleSheetData />} /> */}
                    {/* <Route path="/sheet-sync" element={<SheetSync />} /> */}
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      )}
    </>
  );
};

export default App;
