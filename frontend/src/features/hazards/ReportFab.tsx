"use client";

import { motion } from "framer-motion";

interface ReportFabProps {
  /** Whether the FAB action menu is currently expanded. */
  isMenuOpen: boolean;
  /** Whether the flood report panel is expanded (not collapsed). */
  isPanelExpanded: boolean;
  /** Callback when the FAB is clicked. */
  onClick: () => void;
}

/**
 * Floating Action Button for the map view.
 *
 * - Smoothly morphs between a "+" and "×" icon using a 45° rotation.
 * - Dynamically adjusts its z-index based on panel state:
 *     • Panel collapsed → FAB sits ABOVE the panel (z-[45]).
 *     • Panel expanded  → FAB sits BELOW the panel (z-[35]).
 */
export function ReportFab({ isMenuOpen, isPanelExpanded, onClick }: ReportFabProps) {
  // When the panel is fully expanded, the FAB drops below it (z-35 < panel z-40).
  // When collapsed or closed, the FAB floats above (z-45 > panel z-40).
  const zClass = isPanelExpanded ? "z-[35]" : "z-[45]";

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={`fixed bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] left-4 ${zClass} w-14 h-14 rounded-full shadow-xl flex items-center justify-center cursor-pointer bg-blue-600 hover:bg-blue-700 transition-colors`}
      title={isMenuOpen ? "Close menu" : "Report Flood Hazard"}
    >
      {/* Two crossing bars that rotate to morph between + and × */}
      <motion.span
        animate={{ rotate: isMenuOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="absolute w-6 h-0.5 bg-white rounded-full"
      />
      <motion.span
        animate={{ rotate: isMenuOpen ? -45 : 90 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="absolute w-6 h-0.5 bg-white rounded-full"
      />
    </motion.button>
  );
}
