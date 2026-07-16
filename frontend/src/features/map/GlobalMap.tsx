"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { MapProvider, useMapContext } from "./MapContext";
import RoutePanel from "@/features/routing/RoutePanel";
import { ReportFab } from "@/features/hazards/ReportFab";
import { FloodReportPanel } from "@/features/hazards/FloodReportPanel";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/shared/ui";
import { AnalyticsPanel } from "@/features/analytics/AnalyticsPanel";

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

// ── MapLayout ──────────────────────────────────────────────────────────────────

/**
 * Inner layout component that wraps all UI over the map.
 * Because it is rendered inside MapProvider, it can fully access layout state.
 */
function MapLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px), (pointer: coarse)");
  
  const { isAuthenticated } = useAuth();
  const { error } = useToast();
  
  const { 
    activePanel, 
    setActivePanel, 
    isPickingOnMap, 
    isReportPanelOpen, 
    setIsReportPanelOpen,
    hasBottomOffset,
    isAnalyticsOpen,
    setIsAnalyticsOpen
  } = useMapContext();

  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/admin/analytics") {
      setIsAnalyticsOpen(true);
    }
  }, [pathname, setIsAnalyticsOpen]);

  // -- Event Handlers --
  // Automatically open the report panel if navigated with ?action=report
  useEffect(() => {
    if (searchParams.get("action") === "report") {
      setIsReportPanelOpen(true);
      setActivePanel("flood");
    }
  }, [searchParams, setIsReportPanelOpen, setActivePanel]);

  // The panel is expanded when it is both open and actively selected.
  const isPanelExpanded = isReportPanelOpen && activePanel === "flood";
  
  const pillBottomClass = hasBottomOffset 
    ? "bottom-[calc(64px+env(safe-area-inset-bottom)+160px)]" 
    : "bottom-[calc(64px+env(safe-area-inset-bottom)+88px)]";

  const handleSelectFloodReport = () => {
    if (!isAuthenticated) {
      error("Login Required", "You must be logged in to report a flood.");
      return;
    }
    setIsReportPanelOpen(true);
    setActivePanel("flood");
    setIsMenuOpen(false);
  };

  const handleCloseMenu = () => setIsMenuOpen(false);

  return (
    <>
      <MapCanvas />

      {/* -- 1. Backdrop blur overlay ---------------------------------------- */}
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

      {/* -- 2. Action Pill -------------------------------------------------- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.button
            key="fab-action-pill"
            variants={actionPillVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleSelectFloodReport}
            className={`fixed ${pillBottomClass} left-4 z-[46] flex items-center gap-3 bg-white text-slate-800 font-semibold pl-3 pr-5 py-2.5 rounded-full shadow-2xl border border-gray-200/60 hover:bg-gray-50 active:scale-95 cursor-pointer select-none`}
          >
            <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-sm tracking-tight">Flood Report</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* -- 3. FAB Button --------------------------------------------------- */}
      {isMobile && !isPickingOnMap && (
        <ReportFab
          isMenuOpen={isMenuOpen}
          isPanelExpanded={isPanelExpanded}
          onClick={() => {
            if (!isMenuOpen && !isAuthenticated) {
              error("Login Required", "You must be logged in to report a flood.");
              return;
            }
            setIsMenuOpen((prev) => !prev);
          }}
        />
      )}

      {/* -- 4. Panels ------------------------------------------------------- */}
      <AnimatePresence>
        {isAnalyticsOpen && <AnalyticsPanel />}
      </AnimatePresence>
      {pathname !== "/admin/analytics" && (
        <>
          <FloodReportPanel
            isOpen={isMobile ? isReportPanelOpen : true}
            onClose={() => setIsReportPanelOpen(false)}
          />
          <RoutePanel />
        </>
      )}
    </>
  );
}

// -- GlobalMap ------------------------------------------------------------------

export default function GlobalMap() {
  const pathname = usePathname();
  const isMapVisible = pathname === "/map" || pathname === "/analytics" || pathname === "/admin/analytics";

  return (
    <div
      className={`fixed inset-0 z-0 transition-opacity duration-300 ${
        isMapVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <Suspense fallback={null}>
        <MapProvider>
          <MapLayout />
        </MapProvider>
      </Suspense>
    </div>
  );
}
