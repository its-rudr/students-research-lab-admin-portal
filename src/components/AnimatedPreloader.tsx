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
          <div className="srl-text-logo">
            <div className="logo-line1">SRL</div>
            <div className="logo-line2">MMPSRPC, KSV</div>
          </div>
          {/* Pulse effect */}
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
