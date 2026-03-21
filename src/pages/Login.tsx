

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { isAuthenticated, saveSession } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogo, setShowLogo] = useState(true); // Desktop logo visibility
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const passwordValue = password.trim();

      let users: any[] | null = null;
      const primaryResult = await supabase
        .from("students_details")
        .select("student_name,email,enrollment_no,member_type,login_password")
        .eq("email", normalizedEmail)
        .limit(1);

      if (primaryResult.error) {
        const missingPasswordColumn = primaryResult.error.message?.toLowerCase().includes("login_password");

        if (!missingPasswordColumn) {
          throw primaryResult.error;
        }

        const fallbackResult = await supabase
          .from("students_details")
          .select("student_name,email,enrollment_no,member_type")
          .eq("email", normalizedEmail)
          .limit(1);

        if (fallbackResult.error) {
          throw fallbackResult.error;
        }

        users = fallbackResult.data;
      } else {
        users = primaryResult.data;
      }

      const matchedUser = users?.[0];
      if (!matchedUser) {
        throw new Error("No account found for this email address.");
      }

      const enrollmentNo = String(matchedUser.enrollment_no || "").trim();
      const assignedPassword = String(matchedUser.login_password || enrollmentNo).trim();

      if (!assignedPassword || assignedPassword !== passwordValue) {
        throw new Error(matchedUser.login_password ? "Invalid password." : "Invalid password. Use your enrollment number.");
      }

      const memberType = String(matchedUser.member_type || "member").toLowerCase();
      const role = memberType === "admin" ? "admin" : "member";

      saveSession({
        email: normalizedEmail,
        name: matchedUser.student_name || normalizedEmail,
        enrollmentNo,
        role,
      });

      toast({
        title: "Login successful",
        description: role === "admin" ? "Admin access enabled." : "Read-only member access enabled.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/20 p-4" style={{ backgroundImage: 'none' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl flex items-center gap-8 lg:gap-16"
      >
        {/* Logo Section - Left Side (always visible, closable on desktop) */}
        {showLogo && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center flex-1 relative bg-white/0"
            style={{ minWidth: 0 }}
          >
            {/* Close button removed as per request */}
            <img src="/SRL Logo.svg" alt="SRL Logo" className="w-80 h-80 mb-8" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Students Research Lab</h2>
              <p className="text-muted-foreground">MMPSRPC, KSV</p>
            </div>
          </motion.div>
        )}

        {/* Login Section - Right Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary mb-4">
              Secure Member Access
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <img src="/SRL Logo.svg" alt="SRL Logo" className="w-32 h-32 mx-auto" />
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Portal</h1>
            <p className="text-muted-foreground">Students Research Lab Management</p>
            <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
              Access member records, research activities, scoreboards, and profile updates from one clean workspace.
            </p>
          </div>

          {/* Login Header - Desktop */}
          <div className="hidden lg:block text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Portal</h1>
            <p className="text-muted-foreground">Login to your account</p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Access member records and manage research activities
            </p>
          </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-8 shadow-xl"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2 items-center">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="rounded-xl flex-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2 items-center">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pr-10 rounded-xl w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-11"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-sm text-muted-foreground w-full"
        >
          <p>© 2026 Students Research Lab. All rights reserved.</p>
        </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
