"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { apiClient } from "@/lib/apiClient";

// Helper function to create a 32-point circle approximation for PostGIS Polygon input
function createBufferPolygon(center: [number, number], radiusInMeters: number = 80): number[][][] {
  const [lng, lat] = center;
  const points = 32;
  const coords: number[][] = [];

  const latDegree = radiusInMeters / 111320;
  const lngDegree = radiusInMeters / (111320 * Math.cos((lat * Math.PI) / 180));

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const pLng = lng + lngDegree * Math.cos(angle);
    const pLat = lat + latDegree * Math.sin(angle);
    coords.push([pLng, pLat]);
  }

  return [coords];
}

export default function FloodOverlay() {
  const [reports, setReports] = useState<any[]>([]);
  const [activeZones, setActiveZones] = useState<any[]>([]);

  // New Report Form
  const [reportText, setReportText] = useState("");
  const [reportSource, setReportSource] = useState("direct_user");
  const [reportSeverity, setReportSeverity] = useState("medium");
  const [reportCoords, setReportCoords] = useState<string>("");
  const [createZone, setCreateZone] = useState(true);

  // Fetch reports & active avoidance zones from backend
  const fetchData = async () => {
    try {
      const reportsData = await apiClient.get<any[]>('/reports/');
      setReports(reportsData);
      
      const zonesData = await apiClient.get<any[]>('/reports/active-zones');
      setActiveZones(zonesData);
    } catch (err) {
      console.error("Failed to fetch reports/zones:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportCoords || !reportText) return alert("Enter coordinates and text!");

    const coords = reportCoords.split(",").map(Number) as [number, number];

    try {
      // 1. Submit flood report
      const dbReport = await apiClient.post<any>('/reports/', {
        raw_text: reportText,
        source: reportSource,
        severity: reportSeverity,
        geometry: { type: "Point", coordinates: coords },
      });

      // 2. Submit associated avoidance zone if requested
      if (createZone) {
        const bufferPoly = createBufferPolygon(coords, 100); // 100 meter buffer
        await apiClient.post<any>('/reports/avoidance-zones', {
          report_id: dbReport.id,
          is_active: true,
          geometry: { type: "Polygon", coordinates: bufferPoly },
        });
      }

      setReportText("");
      fetchData();
      alert("Flood report submitted successfully!");
    } catch (err) {
      console.error("Error submitting report:", err);
    }
  };

  return (
    <Card className="absolute top-4 right-4 z-10 w-80">
      <CardHeader>
        <CardTitle>Report Flood</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submitReport} className="space-y-3">
          <textarea
            placeholder="Flood details (e.g. lagpas tuhod)"
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Input
            placeholder="Coordinates (lng, lat)"
            value={reportCoords}
            onChange={(e) => setReportCoords(e.target.value)}
          />
          <Button variant="danger" type="submit" className="w-full">
            Submit Report
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
