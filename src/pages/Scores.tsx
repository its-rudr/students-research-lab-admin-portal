import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initialScores = [
  { id: 1, name: "Ayesha Khan", field: "NLP", score: 94, initials: "AK" },
  { id: 2, name: "Rahul Verma", field: "Computer Vision", score: 89, initials: "RV" },
  { id: 3, name: "Li Wei", field: "Cryptography", score: 88, initials: "LW" },
  { id: 4, name: "Sara Ali", field: "Bioinformatics", score: 85, initials: "SA" },
  { id: 5, name: "James Chen", field: "Robotics", score: 82, initials: "JC" },
  { id: 6, name: "Priya Patel", field: "Machine Learning", score: 78, initials: "PP" },
  { id: 7, name: "Fatima Noor", field: "Cybersecurity", score: 75, initials: "FN" },
  { id: 8, name: "Omar Hassan", field: "IoT Systems", score: 71, initials: "OH" },
];

export default function Scores() {
  const [scores, setScores] = useState(initialScores);

  const updateScore = (id: number, delta: number) => {
    setScores((prev) =>
      [...prev.map((s) => (s.id === id ? { ...s, score: Math.max(0, Math.min(100, s.score + delta)) } : s))]
        .sort((a, b) => b.score - a.score)
    );
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="section-title flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Live Score Leaderboard
          </h2>
        </div>
        <div className="divide-y divide-border/50">
          <AnimatePresence>
            {scores.map((student, i) => (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ layout: { duration: 0.3 } }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/8 text-xs font-bold text-primary shrink-0">
                  {i + 1}
                </span>
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary/8 text-primary text-xs font-medium">{student.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.field}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() => updateScore(student.id, -1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <motion.span
                    key={student.score}
                    initial={{ scale: 1.15, color: "hsl(var(--primary))" }}
                    animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                    transition={{ duration: 0.2 }}
                    className="font-mono text-sm font-bold w-8 text-center"
                  >
                    {student.score}
                  </motion.span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() => updateScore(student.id, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
