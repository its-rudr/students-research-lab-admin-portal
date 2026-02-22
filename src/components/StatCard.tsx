import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  delay?: number;
}

export default function StatCard({ title, value, subtitle, icon: Icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/8">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="stat-number">{value}</div>
      <div className="stat-label mt-1">{title}</div>
      {subtitle && (
        <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}
