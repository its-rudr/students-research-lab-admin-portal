import { useState } from "react";
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
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Students", path: "/students", icon: Users },
  { title: "Research", path: "/research", icon: BookOpen },
  { title: "Attendance", path: "/attendance", icon: CalendarCheck },
  { title: "Scores", path: "/scores", icon: Trophy },
  { title: "Leadership", path: "/leadership", icon: UserCog },
  { title: "Activities", path: "/activities", icon: Calendar },
];

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/students": "Student Management",
  "/research": "Research Work",
  "/attendance": "Attendance",
  "/scores": "Live Scores",
  "/leadership": "Research Leadership",
  "/activities": "Activities & Events",
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPage = pageNames[location.pathname] || "Dashboard";

  const handleLogout = async () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userData');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to logout",
      });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col border-r border-border bg-sidebar h-full shrink-0 z-20"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
            <Beaker className="w-5 h-5 text-primary" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-semibold text-foreground">SRL Admin</span>
                <span className="block text-[10px] text-muted-foreground font-medium">Research Lab Portal</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <h1 className="page-title">{currentPage}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2.5">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  AD
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground leading-tight">Admin</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Lab Director</p>
                </div>
              </AnimatePresence>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-xl text-muted-foreground hover:text-destructive"
              title="Logout"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
