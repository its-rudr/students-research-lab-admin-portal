import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector("[data-scroll-container='app-main']") as HTMLElement | null;

    const handleScroll = () => {
      const offset = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      setVisible(offset > 280);
    };

    handleScroll();
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.querySelector("[data-scroll-container='app-main']") as HTMLElement | null;

    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.92 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 h-12 w-12 rounded-full border border-primary/25 bg-card/85 text-primary shadow-[var(--shadow-elevated)] backdrop-blur-xl transition-colors hover:bg-primary hover:text-primary-foreground"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp className="mx-auto h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}