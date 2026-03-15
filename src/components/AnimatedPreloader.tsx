import { useEffect } from "react";
import "./Animatedpreloader.css";
import { motion } from "framer-motion";

interface AnimatedPreloaderProps {
  finishLoading: () => void;
}

export default function AnimatedPreloader({ finishLoading }: AnimatedPreloaderProps) {
  useEffect(() => {
    // Auto-hide after 2.5 seconds
    const timer = setTimeout(() => {
      if (finishLoading) finishLoading();
    }, 2800);
    return () => clearTimeout(timer);
  }, [finishLoading]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="preloader-container"
    >
      {/* Main animated logo background */}
      <div className="preloader-wrapper">
        {/* Outer rotating ring */}
        <div className="rotating-ring ring-outer-1"></div>
        <div className="rotating-ring ring-outer-2"></div>
        <div className="rotating-ring ring-outer-3"></div>

        {/* Center logo */}
        <div className="logo-wrapper">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center"
          >
            <img src="/SRL Logo.svg" alt="SRL Logo" className="w-32 h-32 sm:w-40 sm:h-40" />
          </motion.div>
          <div className="pulse-ring"></div>
        </div>

        {/* Loading text dots */}
        <div className="loading-text">
          <span className="dot dot-1">•</span>
          <span className="dot dot-2">•</span>
          <span className="dot dot-3">•</span>
        </div>
      </div>

      {/* Background blur */}
      <div className="preloader-blur"></div>
    </motion.div>
  );
}
