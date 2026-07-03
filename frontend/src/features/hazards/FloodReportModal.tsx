"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { apiClient } from "@/lib/apiClient";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface FloodReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Re-use createBufferPolygon from FloodOverlay.tsx
function createBufferPolygon(center: [number, number], radiusInMeters: number = 80): number[][][] {
  const [lng, lat] = center;
  const points = 32;
  const coords: number[][] = [];
  const latDegree = radiusInMeters / 111320;
  const lngDegree = radiusInMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    coords.push([lng + lngDegree * Math.cos(angle), lat + latDegree * Math.sin(angle)]);
  }
  return [coords];
}

export function FloodReportModal({ isOpen, onClose }: FloodReportModalProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [reportText, setReportText] = useState("");
  const [reportCoords, setReportCoords] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportCoords || !reportText) return alert("Enter coordinates and text!");

    setIsSubmitting(true);
    const coords = reportCoords.split(",").map(Number) as [number, number];

    try {
      const dbReport = await apiClient.post<any>('/reports/', {
        raw_text: reportText,
        source: "direct_user",
        severity: "medium",
        geometry: { type: "Point", coordinates: coords },
      });

      const bufferPoly = createBufferPolygon(coords, 100);
      await apiClient.post<any>('/reports/avoidance-zones', {
        report_id: dbReport.id,
        is_active: true,
        geometry: { type: "Polygon", coordinates: bufferPoly },
      });

      setReportText("");
      setReportCoords("");
      alert("Flood report submitted successfully!");
      onClose();
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <Card className={`w-full ${isMobile ? "h-full rounded-none" : "w-[360px] shadow-2xl"}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <CardTitle className="text-lg">Report Flood Hazard</CardTitle>
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={submitReport} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location (Lng, Lat)</label>
            <Input
              placeholder="e.g. 121.05, 14.58"
              value={reportCoords}
              onChange={(e) => setReportCoords(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Flood Details</label>
            <textarea
              placeholder="Describe the flood (e.g., knee deep, impassable to light vehicles)"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="danger" type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMobile ? (
            <motion.div
              key="mobile-modal"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 bg-white"
            >
              {modalContent}
            </motion.div>
          ) : (
            <motion.div
              key="desktop-modal"
              drag
              dragMomentum={false}
              initial={{ opacity: 0, scale: 0.9, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-20 right-4 z-50 cursor-move"
            >
              {modalContent}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
