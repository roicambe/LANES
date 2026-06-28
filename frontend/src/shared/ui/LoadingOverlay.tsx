import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  variant?: "fixed" | "absolute";
  zIndex?: number;
}

export function LoadingOverlay({
  isVisible,
  message = "Loading...",
  variant = "fixed",
  zIndex = 100,
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex }}
          className={cn(
            variant === "fixed" ? "fixed" : "absolute",
            "inset-0 flex flex-col items-center justify-center bg-neutral-100/50 backdrop-blur-sm pointer-events-none"
          )}
        >
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <p className="text-neutral-600 font-medium animate-pulse">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
