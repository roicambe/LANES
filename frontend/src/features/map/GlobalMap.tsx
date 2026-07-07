"use client";

import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { MapProvider, useMapContext } from "./MapContext";
import RoutePanel from "@/features/routing/RoutePanel";
import { ReportFab } from "@/features/hazards/ReportFab";
import { FloodReportPanel } from "@/features/hazards/FloodReportPanel";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false });

// ── Animation Variants ─────────────────────────────────────────────────────────

/** Backdrop fades from transparent to a dark blur. */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } },
};

/** Action pill slides up from the FAB with a spring, fading in simultaneously. */
const actionPillVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.85 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 26, delay: 0.06 },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.9,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

// ── MapOverlays ────────────────────────────────────────────────────────────────

/**
 * Sub-component that lives _inside_ MapProvider to consume map context.
 *
 * Renders:
 * 1. A full-screen backdrop blur overlay (z-[45]) that covers everything
 *    except the navigation bars (z-50).
 * 2. The "Flood Report" action pill that springs upward from the FAB.
 * 3. The FAB button itself, with dynamic z-index:
 *    - above collapsed panels (z-[45])
 *    - below expanded panels (z-[35])
 */
function MapOverlays({
  isReportPanelOpen,
  setIsReportPanelOpen,
}: {
  isReportPanelOpen: boolean;
  setIsReportPanelOpen: (open: boolean) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px), (pointer: coarse)");
  const { activePanel, setActivePanel } = useMapContext();

  // The panel is expanded when it is both open and actively selected.
  const isPanelExpanded = isReportPanelOpen && activePanel === "flood";

  const handleSelectFloodReport = () => {
    setIsReportPanelOpen(true);
    setActivePanel("flood");
    setIsMenuOpen(false);
  };

  const handleCloseMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* ── 1. Backdrop blur overlay ──────────────────────────────────────── */}
      {/*  z-[45] sits above panels (z-40) but below navigation bars (z-50). */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="fab-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleCloseMenu}
            className="fixed inset-0 z-[45] bg-slate-900/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ── 2. Action Pill ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.button
            key="fab-action-pill"
            variants={actionPillVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleSelectFloodReport}
            className="fixed bottom-[calc(64px+env(safe-area-inset-bottom)+160px)] left-4 z-[46] flex items-center gap-3 bg-white text-slate-800 font-semibold pl-3 pr-5 py-2.5 rounded-full shadow-2xl border border-gray-200/60 hover:bg-gray-50 active:scale-95 cursor-pointer select-none"
          >
            <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-sm tracking-tight">Flood Report</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── 3. FAB Button ─────────────────────────────────────────────────── */}
      {isMobile && (
        <ReportFab
          isMenuOpen={isMenuOpen}
          isPanelExpanded={isPanelExpanded}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        />
      )}
    </>
  );
}

// ── GlobalMap ──────────────────────────────────────────────────────────────────

export default function GlobalMap() {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px), (pointer: coarse)");

  return (
    <div
      className={`fixed inset-0 z-0 transition-opacity duration-300 ${
        isMapPage ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <Suspense fallback={null}>
        <MapProvider>
          <MapCanvas />
          <MapOverlays
            isReportPanelOpen={isReportPanelOpen}
            setIsReportPanelOpen={setIsReportPanelOpen}
          />
          <FloodReportPanel
            isOpen={isMobile ? isReportPanelOpen : true}
            onClose={() => setIsReportPanelOpen(false)}
          />
          <RoutePanel />
        </MapProvider>
      </Suspense>
    </div>
  );
}
