"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

const BACKEND_URL = "http://127.0.0.1:8000";

// Helper function to create a 32-point circle approximation for PostGIS Polygon input
function createBufferPolygon(center: [number, number], radiusInMeters: number = 80): number[][][] {
  const [lng, lat] = center;
  const points = 32;
  const coords: number[][] = [];
  
  // Approximate meters to degrees conversion
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

export default function Home() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);

  // Map state
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [activeSelection, setActiveSelection] = useState<"start" | "end" | "report">("start");
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
    avoided_floods: boolean;
    blocked: boolean;
  } | null>(null);

  // Database lists
  const [reports, setReports] = useState<any[]>([]);
  const [activeZones, setActiveZones] = useState<any[]>([]);
  
  // New Report Form
  const [reportText, setReportText] = useState("");
  const [reportSource, setReportSource] = useState("direct_user");
  const [reportSeverity, setReportSeverity] = useState("medium");
  const [reportCoords, setReportCoords] = useState<[number, number] | null>(null);
  const [createZone, setCreateZone] = useState(true);

  // Fetch reports & active avoidance zones from backend
  const fetchData = async () => {
    try {
      const reportsRes = await fetch(`${BACKEND_URL}/api/v1/reports/`);
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data);
      }
      const zonesRes = await fetch(`${BACKEND_URL}/api/v1/reports/active-zones`);
      if (zonesRes.ok) {
        const data = await zonesRes.json();
        setActiveZones(data);
      }
    } catch (err) {
      console.error("Failed to fetch reports/zones:", err);
    }
  };

  // Trigger route calculation
  const calculateRoute = async () => {
    if (!startCoords || !endCoords) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/reports/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: startCoords,
          end: endCoords,
        }),
      });
      if (!res.ok) throw new Error("Routing failed");
      const data = await res.json();
      
      setRouteInfo({
        distance: data.distance,
        duration: data.duration,
        avoided_floods: data.avoided_floods,
        blocked: data.blocked || false,
      });

      // Update route line on the map
      if (mapRef.current) {
        const map = mapRef.current;
        if (map.getSource("route")) {
          map.getSource("route").setData(data.geometry);
        }
      }
    } catch (err) {
      console.error("Routing error:", err);
      alert("Pathfinding error: Could not query the route.");
    }
  };

  // Submit a new flood report
  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportCoords || !reportText) {
      alert("Please enter report details and select a location on the map!");
      return;
    }

    try {
      // 1. Submit flood report
      const reportRes = await fetch(`${BACKEND_URL}/api/v1/reports/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: reportText,
          source: reportSource,
          severity: reportSeverity,
          geometry: {
            type: "Point",
            coordinates: reportCoords,
          },
        }),
      });

      if (!reportRes.ok) throw new Error("Report creation failed");
      const dbReport = await reportRes.json();

      // 2. Submit associated avoidance zone if requested
      if (createZone) {
        const bufferPoly = createBufferPolygon(reportCoords, 100); // 100 meter buffer
        const zoneRes = await fetch(`${BACKEND_URL}/api/v1/reports/avoidance-zones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report_id: dbReport.id,
            is_active: true,
            geometry: {
              type: "Polygon",
              coordinates: bufferPoly,
            },
          }),
        });
        if (!zoneRes.ok) console.error("Failed to create avoidance zone");
      }

      setReportText("");
      setReportCoords(null);
      fetchData(); // Refresh lists
      alert("Flood report submitted successfully!");
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Error submitting report.");
    }
  };

  // Initialize MapLibre Map
  useEffect(() => {
    // Import dynamically since maplibre uses window API and breaks SSR build
    import("maplibre-gl").then((maplibregl) => {
      if (!mapContainerRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "&copy; OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm-layer",
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [121.061, 14.576], // Pasig City Coordinates
        zoom: 13,
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      map.on("load", () => {
        mapRef.current = map;

        // Initialize empty source/layer for Route Line
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#2563eb",
            "line-width": 6,
            "line-opacity": 0.85,
          },
        });

        // Initialize source/layer for Avoidance Zone Polygons
        map.addSource("avoidance-zones", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.addLayer({
          id: "avoidance-polygons",
          type: "fill",
          source: "avoidance-zones",
          paint: {
            "fill-color": "#dc2626",
            "fill-opacity": 0.35,
          },
        });

        map.addLayer({
          id: "avoidance-polygons-outline",
          type: "line",
          source: "avoidance-zones",
          paint: {
            "line-color": "#dc2626",
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });

        // Initial Data Fetch
        fetchData();
      });

      // Handle map clicks to set coordinates
      map.on("click", (e) => {
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];

        if (activeSelection === "start") {
          setStartCoords(coords);
          if (startMarkerRef.current) {
            startMarkerRef.current.setLngLat(coords);
          } else {
            const el = document.createElement("div");
            el.className = "w-6 h-6 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg";
            el.innerText = "S";
            startMarkerRef.current = new maplibregl.Marker({ element: el })
              .setLngLat(coords)
              .addTo(map);
          }
        } else if (activeSelection === "end") {
          setEndCoords(coords);
          if (endMarkerRef.current) {
            endMarkerRef.current.setLngLat(coords);
          } else {
            const el = document.createElement("div");
            el.className = "w-6 h-6 bg-emerald-600 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg";
            el.innerText = "E";
            endMarkerRef.current = new maplibregl.Marker({ element: el })
              .setLngLat(coords)
              .addTo(map);
          }
        } else if (activeSelection === "report") {
          setReportCoords(coords);
        }
      });

      return () => {
        map.remove();
      };
    });
  }, [activeSelection]);

  // Recalculate route whenever start/end coordinates change
  useEffect(() => {
    if (startCoords && endCoords) {
      calculateRoute();
    }
  }, [startCoords, endCoords]);

  // Render Reports & Avoidance zones onto Map Libre Layers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Load Avoidance Zones Polygons
    if (map.getSource("avoidance-zones")) {
      const features = activeZones
        .filter((z) => z.geometry)
        .map((z) => ({
          type: "Feature",
          properties: { id: z.id, report_id: z.report_id },
          geometry: z.geometry,
        }));
      map.getSource("avoidance-zones").setData({
        type: "FeatureCollection",
        features,
      });
    }

    // Load markers for raw report points
    // Keep a simple collection of markers and clean up old ones
    const reportMarkers: any[] = [];
    
    // Remove existing markers if we have class markers on DOM
    const existingMarkers = document.querySelectorAll(".report-marker-el");
    existingMarkers.forEach((m) => m.remove());

    import("maplibre-gl").then((maplibregl) => {
      reports
        .filter((r) => r.geometry && r.geometry.coordinates)
        .forEach((r) => {
          const el = document.createElement("div");
          // Choose marker color based on severity
          const colorClass = 
            r.severity === "high" ? "bg-red-600" :
            r.severity === "medium" ? "bg-orange-500" : "bg-yellow-400";
          el.className = `report-marker-el w-5 h-5 ${colorClass} border-2 border-white rounded-full cursor-pointer shadow-md transform hover:scale-125 transition-transform`;
          
          const popup = new maplibregl.Popup({ offset: 10 }).setHTML(`
            <div class="p-2 font-sans">
              <p class="font-bold text-xs uppercase tracking-wider text-gray-500">${r.source} (${r.severity} severity)</p>
              <p class="text-sm text-gray-800 font-medium mt-1">"${r.raw_text}"</p>
              <p class="text-xs text-gray-400 mt-2">${new Date(r.created_at).toLocaleTimeString()}</p>
            </div>
          `);

          new maplibregl.Marker({ element: el })
            .setLngLat(r.geometry.coordinates)
            .setPopup(popup)
            .addTo(map);
        });
    });

  }, [reports, activeZones]);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-50">
      
      {/* 1. Sidebar Control Panel */}
      <section className="flex flex-col w-96 max-w-full h-full bg-zinc-900 border-r border-zinc-800 z-10 p-6 overflow-y-auto space-y-6 shadow-2xl">
        <header className="border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            🗺️ <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">LANES</span> PH
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Flood-Adaptive Commuter Route Calculator</p>
        </header>

        {/* Input Coordinates Selection */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Navigation</h2>
          
          <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
            <button
              onClick={() => setActiveSelection("start")}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                activeSelection === "start"
                  ? "bg-blue-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              🚩 Start Pin
            </button>
            <button
              onClick={() => setActiveSelection("end")}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                activeSelection === "end"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              🏁 End Pin
            </button>
          </div>

          <div className="space-y-2 text-xs text-zinc-300">
            <p className="flex justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-500">Start Coordinates:</span>
              <span className="font-mono text-blue-400">
                {startCoords ? `${startCoords[0].toFixed(5)}, ${startCoords[1].toFixed(5)}` : "Click map to set"}
              </span>
            </p>
            <p className="flex justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-500">End Coordinates:</span>
              <span className="font-mono text-emerald-400">
                {endCoords ? `${endCoords[0].toFixed(5)}, ${endCoords[1].toFixed(5)}` : "Click map to set"}
              </span>
            </p>
          </div>
        </div>

        {/* Route Information Results */}
        {routeInfo && (
          <div className={`p-4 rounded-xl border ${
            routeInfo.blocked 
              ? "bg-red-950/40 border-red-800" 
              : routeInfo.avoided_floods 
                ? "bg-indigo-950/40 border-indigo-800" 
                : "bg-zinc-950/60 border-zinc-800"
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              {routeInfo.blocked 
                ? "⚠️ Locked Down (Flooded)" 
                : routeInfo.avoided_floods 
                  ? "🛡️ Bypassed Flooded Streets" 
                  : "🚗 Direct Route Clear"}
            </h3>
            
            <div className="mt-2.5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-zinc-500">Distance</p>
                <p className="font-semibold text-sm">{(routeInfo.distance / 1000).toFixed(2)} km</p>
              </div>
              <div>
                <p className="text-zinc-500">Duration</p>
                <p className="font-semibold text-sm">{Math.round(routeInfo.duration / 60)} mins</p>
              </div>
            </div>
            
            {routeInfo.blocked && (
              <p className="text-[11px] text-red-400 mt-2 font-medium">
                Warning: No safe alternative route is available. All path options intersect active flood barriers.
              </p>
            )}
          </div>
        )}

        {/* Admin Action: Submit Mock Flood Report */}
        <form onSubmit={submitReport} className="border-t border-zinc-800 pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Mock Flood Alert</h2>
            <button
              type="button"
              onClick={() => setActiveSelection("report")}
              className={`px-3 py-1 text-[11px] rounded font-bold border transition-colors ${
                activeSelection === "report"
                  ? "bg-red-600 border-red-500 text-white"
                  : "border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              📍 Tap Map Location
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-500 mb-1">Feed / Raw Text Description</label>
              <textarea
                placeholder="Taglish post: e.g., Baha sa Caruncho Ave Pasig, lubog hanggang tuhod, di madaanan."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-red-500 placeholder-zinc-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-500 mb-1">Severity</label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white"
                >
                  <option value="low">Low (Gutter)</option>
                  <option value="medium">Medium (Knee)</option>
                  <option value="high">High (Submerged)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Source</label>
                <select
                  value={reportSource}
                  onChange={(e) => setReportSource(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white"
                >
                  <option value="direct_user">User Alert</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="create-zone-cb"
                checked={createZone}
                onChange={(e) => setCreateZone(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="create-zone-cb" className="text-zinc-400 cursor-pointer select-none">
                Create 80-meter avoidance polygon
              </label>
            </div>

            <p className="text-[10px] text-zinc-500 flex justify-between">
              Selected Point:
              <span className="font-mono text-red-400">
                {reportCoords ? `${reportCoords[0].toFixed(5)}, ${reportCoords[1].toFixed(5)}` : "None"}
              </span>
            </p>

            <button
              type="submit"
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors cursor-pointer text-xs"
            >
              🚨 Broadcast Flood Report
            </button>
          </div>
        </form>

        <footer className="border-t border-zinc-800 pt-4 mt-auto text-[10px] text-zinc-600 text-center">
          LANES PH &copy; 2026. Self-Hosted Spatial Analytics.
        </footer>
      </section>

      {/* 2. Interactive Map Container */}
      <section ref={mapContainerRef} className="flex-1 h-full w-full relative bg-zinc-900" />
      
    </main>
  );
}
