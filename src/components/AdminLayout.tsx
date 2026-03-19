import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  Trophy,
  UserCog,
  Calendar,
  Bell,
  Menu,
  X,
  ChevronRight,
  Beaker,
  LogOut,
  FileSpreadsheet,
  RefreshCw,
  FileUser,
  Milestone,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { clearSession, getStoredUser } from "@/lib/auth";
import ScrollToTopButton from "@/components/ScrollToTopButton";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Students", path: "/students", icon: Users },
  { title: "Research", path: "/research", icon: BookOpen },
  { title: "Attendance", path: "/attendance", icon: CalendarCheck },
  { title: "Scores", path: "/scores", icon: Trophy },
  { title: "Activities", path: "/activities", icon: Calendar },
  { title: "Timeline", path: "/timeline", icon: Milestone },
  { title: "Member CV", path: "/member-cv", icon: FileUser },
  // { title: "Sheet Sync", path: "/sheet-sync", icon: RefreshCw },
  // { title: "Google Sheets", path: "/google-sheets", icon: FileSpreadsheet },
  { title: "Join Requests", path: "/join-requests", icon: ShieldCheck },
];

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/students": "Student Management",
  "/research": "Research Work",
  "/attendance": "Attendance",
  "/scores": "Live Scores",
  "/activities": "Activities & Events",
  "/timeline": "Journey Timeline",
  "/member-cv": "Member CV Profiles",
  "/sheet-sync": "Sync Google Sheets",
  "/google-sheets": "Google Sheets Data",
  "/join-requests": "Join Us Requests",
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getStoredUser();
  const currentPage = pageNames[location.pathname] || "Dashboard";
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      clearSession();
      
      toast({
        title: "Logged out",
        description: "Session cleared successfully.",
      });
      navigate("/login", { replace: true });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to logout",
      });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      {/* Mobile overlay when sidebar is open */}
      <AnimatePresence>
        {sidebarOpen && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden on mobile unless opened */}
      <motion.aside
        initial={false}
        animate={{ width: window.innerWidth >= 1024 ? (sidebarOpen ? 260 : 72) : sidebarOpen ? 260 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col border-r border-border bg-sidebar h-full shrink-0 z-30 fixed top-0 left-0 lg:static"
      >
        {/* Logo */}
        <NavLink to="/" end className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
          <img src="/SRL Logo.svg" alt="SRL Logo" className="w-10 h-10 rounded-xl flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-semibold text-foreground">SRL Admin</span>
                <span className="block text-[10px] text-muted-foreground font-medium">MMPSRPC, KSV</span>
              </motion.div>
            )}
          </AnimatePresence>
        </NavLink>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : ""}`
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Collapse button */}
        <div className="px-3 py-3 border-t border-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-item w-full justify-center"
          >
            <motion.div animate={{ rotate: sidebarOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </motion.aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 border-b border-border/70 bg-card/65 backdrop-blur-md shrink-0 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0 h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="page-title text-base sm:text-lg truncate">{currentPage}</h1>
                <span className="hidden md:inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Live</span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground/90 truncate font-medium tracking-[0.08em] uppercase">Student Research Lab</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden md:inline-flex items-center px-3 py-1 rounded-full border border-primary/15 bg-background/80 text-primary text-xs font-semibold shadow-sm">
              {today}
            </div>
            <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground h-9 w-9 sm:h-10 sm:w-10">
              <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <div className="w-px h-5 bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2.5">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {user?.name?.slice(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground leading-tight">{user?.name || "User"}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight capitalize">{user?.role || "member"}</p>
                </div>
              </AnimatePresence>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-xl text-muted-foreground hover:text-destructive h-9 w-9 sm:h-10 sm:w-10"
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main data-scroll-container="app-main" className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
        <ScrollToTopButton />
      </div>
    </div>
  );
}
