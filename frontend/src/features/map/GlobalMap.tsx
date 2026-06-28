"use client";

import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { MapProvider } from "./MapContext";
import RoutePanel from "@/features/routing/RoutePanel";
import { ReportFab } from "@/features/hazards/ReportFab";
import { FloodReportModal } from "@/features/hazards/FloodReportModal";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false });

export default function GlobalMap() {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div
      className={`fixed inset-0 z-0 transition-opacity duration-300 ${
        isMapPage ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <Suspense fallback={null}>
        <MapProvider>
          <MapCanvas />
          {isMobile && <ReportFab onClick={() => setIsReportModalOpen(true)} />}
          <FloodReportModal 
            isOpen={isMobile ? isReportModalOpen : true} 
            onClose={() => setIsReportModalOpen(false)} 
          />
          <RoutePanel />
        </MapProvider>
      </Suspense>
    </div>
  );
}
