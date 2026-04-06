import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight } from "lucide-react";

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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.21, 1.11, 0.81, 0.99] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden group cursor-default bg-[#f8fafc] hover:bg-[#f0fdf4] border-slate-100 hover:border-green-100 transition-all duration-500"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors duration-300">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <ArrowUpRight className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div>
        <div className="text-4xl font-extrabold tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors duration-300">{value}</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground group-hover:text-primary/70 transition-colors duration-300">{title}</div>
        {subtitle && (
          <p className="text-[11px] font-medium text-muted-foreground/80 mt-2.5 flex items-center gap-1.5 transition-colors duration-300 group-hover:text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}
