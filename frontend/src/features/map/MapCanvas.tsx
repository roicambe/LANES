"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { Map, Marker, MapMouseEvent } from "maplibre-gl";
import { Loader2, MapPin } from "lucide-react";
import { CONSTANTS } from "./mapUtils";
import { useMapContext } from "./MapContext";
import { LoadingOverlay } from "@/shared/ui";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { apiClient } from "@/lib/apiClient";

const ROUTE_SOURCE_ID = "route-line";
const ROUTE_LAYER_ID = "route-line-layer";

const OSM_FALLBACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "#10b981",      // Green
  medium: "#f59e0b",   // Amber
  high: "#f97316",     // Orange
  extreme: "#ef4444",  // Red
};

const isPointInPolygon = (point: [number, number], polygon: any): boolean => {
  if (!polygon || polygon.type !== "Polygon" || !polygon.coordinates) return false;
  const x = point[0];
  const y = point[1];
  let inside = false;
  const ring = polygon.coordinates[0];
  if (!ring) return false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export default function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const endMarkerRef = useRef<Marker | null>(null);
  const floodStartMarkerRef = useRef<Marker | null>(null);
  const floodEndMarkerRef = useRef<Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<any>(
    "https://api.maptiler.com/maps/streets-v2/style.json?key=BHhRqsneD3M4HnOd57WU"
  );
  const [usingFallback, setUsingFallback] = useState(false);
  const [activeZones, setActiveZones] = useState<any[]>([]);

  const isTouchDevice = useMediaQuery("(max-width: 640px), (pointer: coarse)");
  const isTouchDeviceRef = useRef(isTouchDevice);

  useEffect(() => {
    isTouchDeviceRef.current = isTouchDevice;
  }, [isTouchDevice]);

  const { start, end, floodStart, floodEnd, routeGeometry, routeInfo, setPointFromMap, activePoint, isPickingOnMap } = useMapContext();
  const setPointFromMapRef = useRef(setPointFromMap);
  setPointFromMapRef.current = setPointFromMap;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let fallbackTimeout: NodeJS.Timeout;
    let didFail = false;

    const handleFailure = (reason: string) => {
      if (didFail || usingFallback) return;
      didFail = true;
      console.warn(`Map load failed (${reason}). Switching to OpenStreetMap fallback.`);
      setUsingFallback(true);
      setMapStyle(OSM_FALLBACK_STYLE);
    };

    // If style hasn't loaded successfully in 8 seconds, fall back
    fallbackTimeout = setTimeout(() => {
      if (!isLoaded) {
        handleFailure("Timeout waiting for style to load");
      }
    }, 8000);

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: CONSTANTS.DEFAULT_CENTER,
      zoom: 16.5, // Initial zoom level (street level)
      maxZoom: 20, // Allow zooming in close to buildings
      pitch: 0, // Default to top view
      maxPitch: 70, // Capped at 70 (only achievable when zoomed in)
      bearing: -17.6, // Slightly rotate the camera for a dynamic perspective
      maxBounds: [
        [110.0, 0.0], // Expanded Southwest coordinates to add panning padding
        [132.0, 26.0] // Expanded Northeast coordinates to add panning padding
      ],
    });

    mapInstance.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showAccuracyCircle: false,
      }),
      "bottom-right"
    );

    mapInstance.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
      "bottom-right"
    );

    mapInstance.on("error", (e) => {
      const errMsg = (e.message || (e.error && e.error.message) || "").toLowerCase();
      // Check if it's a style-related load failure (fatal)
      const isStyleError = errMsg.includes("style") || 
                           errMsg.includes("fetch") || 
                           errMsg.includes("failed to fetch") || 
                           errMsg.includes("ajax");
      if (isStyleError && !isLoaded) {
        handleFailure(errMsg || "MapLibre AJAX or source loading error");
      }
    });

    mapInstance.on("load", () => {
      clearTimeout(fallbackTimeout);
      mapRef.current = mapInstance;

      // 1. Add Philippines Border Line
      mapInstance.addSource("philippines-boundary", {
        type: "geojson",
        data: "/philippines-boundary.geojson"
      });

      mapInstance.addLayer({
        id: "philippines-boundary-line",
        type: "line",
        source: "philippines-boundary",
        paint: {
          "line-color": "#10b981", // Emerald green color
          "line-width": 3,
          "line-opacity": 0.5,
        }
      });

      // 2. Add Pasig City Dark Mask (Shade everything outside Pasig)
      mapInstance.addSource("pasig-mask", {
        type: "geojson",
        data: "/pasig-mask.geojson"
      });

      mapInstance.addLayer({
        id: "pasig-mask-fill",
        type: "fill",
        source: "pasig-mask",
        paint: {
          "fill-color": "#000000",
          "fill-opacity": 0.35 // Darken outside by 35%
        }
      });

      // 3. Add Pasig City Boundary Line
      mapInstance.addSource("pasig-boundary", {
        type: "geojson",
        data: "/pasig-boundary.geojson"
      });

      mapInstance.addLayer({
        id: "pasig-boundary-line",
        type: "line",
        source: "pasig-boundary",
        paint: {
          "line-color": "#3b82f6", // Blue color
          "line-width": 4,
          "line-opacity": 0.8, // Slightly higher opacity to pop against the mask
          "line-dasharray": [2, 2]
        }
      });

      setIsLoaded(true);
    });

    mapInstance.on("click", (event: MapMouseEvent) => {
      if (!isTouchDeviceRef.current) {
        setPointFromMapRef.current([event.lngLat.lng, event.lngLat.lat]);
      }
    });

    mapInstance.on("moveend", () => {
      const center = mapInstance.getCenter();
      window.dispatchEvent(new CustomEvent("map-center-changed", { detail: [center.lng, center.lat] }));
    });

    return () => {
      clearTimeout(fallbackTimeout);
      startMarkerRef.current?.remove();
      endMarkerRef.current?.remove();
      floodStartMarkerRef.current?.remove();
      floodEndMarkerRef.current?.remove();
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      floodStartMarkerRef.current = null;
      floodEndMarkerRef.current = null;
      mapInstance.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, [mapStyle]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;

    startMarkerRef.current?.remove();
    startMarkerRef.current = null;

    if (start) {
      startMarkerRef.current = new maplibregl.Marker({ color: "#16a34a" })
        .setLngLat(start.coords)
        .addTo(map);
    }
  }, [start, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;

    endMarkerRef.current?.remove();
    endMarkerRef.current = null;

    if (end) {
      endMarkerRef.current = new maplibregl.Marker({ color: "#dc2626" })
        .setLngLat(end.coords)
        .addTo(map);
    }
  }, [end, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;

    floodStartMarkerRef.current?.remove();
    floodStartMarkerRef.current = null;

    if (floodStart) {
      floodStartMarkerRef.current = new maplibregl.Marker({ color: "#f97316" })
        .setLngLat(floodStart.coords)
        .addTo(map);
    }
  }, [floodStart, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;

    floodEndMarkerRef.current?.remove();
    floodEndMarkerRef.current = null;

    if (floodEnd) {
      floodEndMarkerRef.current = new maplibregl.Marker({ color: "#991b1b" }) // darker red
        .setLngLat(floodEnd.coords)
        .addTo(map);
    }
  }, [floodEnd, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;

    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

    if (!routeGeometry) return;

    // Default: solid blue gradient for clear routes
    let gradientExpression: any = [
      "interpolate",
      ["linear"],
      ["line-progress"],
      0.0, "#2563eb",
      1.0, "#2563eb"
    ];

    // Calculate dynamic gradient based on flood intersection progress
    const coords = routeGeometry.coordinates;
    if (coords && coords.length > 0) {
      // 1. Calculate cumulative distance along path (in meters)
      const dists = [0];
      let totalDist = 0;
      for (let i = 1; i < coords.length; i++) {
        const c1 = coords[i - 1];
        const c2 = coords[i];
        const dx = c2[0] - c1[0];
        const dy = c2[1] - c1[1];
        const degDist = Math.sqrt(dx * dx + dy * dy);
        const distInMeters = degDist * 111000; // Approximate degrees to meters
        totalDist += distInMeters;
        dists.push(totalDist);
      }

      // 2. Find first and last coordinate intersecting any active zone
      let firstIntersectIdx = -1;
      let lastIntersectIdx = -1;
      for (let i = 0; i < coords.length; i++) {
        const pt = coords[i] as [number, number];
        const isFlooded = activeZones.some(zone => isPointInPolygon(pt, zone.geometry));
        if (isFlooded) {
          if (firstIntersectIdx === -1) {
            firstIntersectIdx = i;
          }
          lastIntersectIdx = i;
        }
      }

      if (firstIntersectIdx !== -1 && totalDist > 0) {
        const D_start = dists[firstIntersectIdx];
        const D_end = dists[lastIntersectIdx];

        const P_start_flood = D_start / totalDist;
        const P_end_flood = D_end / totalDist;

        // Define progress thresholds based on absolute distances in meters
        const p_blue_approach = Math.max(0.0, D_start - 80) / totalDist;
        const p_yellow_approach = Math.max(0.0, D_start - 40) / totalDist;
        const p_orange_approach = Math.max(0.0, D_start - 15) / totalDist;

        const rawStops = [
          // Approach gradient (before the flood)
          { p: 0.0, c: "#2563eb" }, // Blue
          { p: p_blue_approach, c: "#2563eb" }, // Blue
          { p: p_yellow_approach, c: "#eab308" }, // Yellow warning
          { p: p_orange_approach, c: "#f97316" }, // Orange danger
          { p: P_start_flood, c: "#ef4444" }, // Red flooded road starts

          // Flood segment (stays Red)
          { p: P_end_flood, c: "#ef4444" } // Red flooded road ends
        ];

        // Receding gradient (after the flood)
        if (P_end_flood < 1.0) {
          const p_orange_recede = Math.min(totalDist, D_end + 15) / totalDist;
          const p_yellow_recede = Math.min(totalDist, D_end + 40) / totalDist;
          const p_blue_recede = Math.min(totalDist, D_end + 80) / totalDist;

          rawStops.push({ p: p_orange_recede, c: "#f97316" }); // Orange receding
          rawStops.push({ p: p_yellow_recede, c: "#eab308" }); // Yellow receding
          rawStops.push({ p: p_blue_recede, c: "#2563eb" }); // Blue receding
          rawStops.push({ p: 1.0, c: "#2563eb" }); // Blue end
        }

        // Sort stops and deduplicate overlapping progress values
        rawStops.sort((a, b) => a.p - b.p);
        const uniqueStops: [number, string][] = [];
        rawStops.forEach(stop => {
          if (uniqueStops.length === 0) {
            uniqueStops.push([stop.p, stop.c]);
          } else {
            const last = uniqueStops[uniqueStops.length - 1];
            if (last[0] === stop.p) {
              last[1] = stop.c;
            } else {
              uniqueStops.push([stop.p, stop.c]);
            }
          }
        });

        gradientExpression = [
          "interpolate",
          ["linear"],
          ["line-progress"],
        ];
        uniqueStops.forEach(([p, c]) => {
          gradientExpression.push(p);
          gradientExpression.push(c);
        });
      }
    }


    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      lineMetrics: true, // Required for line-gradient
      data: {
        type: "Feature",
        properties: {},
        geometry: routeGeometry,
      },
    });

    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-gradient": gradientExpression,
        "line-width": 5,
        "line-opacity": 0.85,
      },
    });

  }, [routeGeometry, routeInfo, activeZones, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = "crosshair";
  }, [isLoaded]);

  // Poll and render active flood avoidance zone polygons on the commuter map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const fetchAndDrawActiveZones = async () => {
      try {
        const zones = await apiClient.get<any[]>("/reports/active-zones");

        
        setActiveZones(zones);

        // Remove existing sources/layers if they exist
        if (map.getLayer("active-zones-layer")) map.removeLayer("active-zones-layer");
        if (map.getLayer("active-zones-outline")) map.removeLayer("active-zones-outline");
        if (map.getLayer("active-zones-road-layer")) map.removeLayer("active-zones-road-layer");
        if (map.getSource("active-zones-source")) map.removeSource("active-zones-source");

        const features: any[] = [];
        zones.forEach((zone: any) => {
          const severity = zone.severity || "medium";
          const color = SEVERITY_COLORS[severity] || "#f59e0b";
          const isRoadBased = zone.report_geometry && zone.report_geometry.type === "LineString";

          if (isRoadBased) {
            // Add LineString feature for highlighted road segment
            features.push({
              type: "Feature",
              properties: {
                id: zone.id,
                report_id: zone.report_id,
                severity: severity.toUpperCase(),
                color: color,
                is_road_line: true,
                is_road_based: true,
              },
              geometry: zone.report_geometry
            });
          }

          // Add Polygon feature (avoidance zone buffer)
          features.push({
            type: "Feature",
            properties: {
              id: zone.id,
              report_id: zone.report_id,
              severity: severity.toUpperCase(),
              color: color,
              is_road_line: false,
              is_road_based: isRoadBased,
            },
            geometry: zone.geometry
          });
        });

        map.addSource("active-zones-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: features
          }
        });

        // 1. Polygon Fill Layer (only for point-based/non-road-based zones)
        map.addLayer({
          id: "active-zones-layer",
          type: "fill",
          source: "active-zones-source",
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": 0.4,
          },
          filter: ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "is_road_based"], false]]
        });

        // 2. Polygon Outline Layer (only for point-based/non-road-based zones)
        map.addLayer({
          id: "active-zones-outline",
          type: "line",
          source: "active-zones-source",
          paint: {
            "line-color": ["get", "color"],
            "line-width": 2
          },
          filter: ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "is_road_based"], false]]
        });

        // 3. Highlighted Road Line Layer (only for road segment LineStrings)
        // Set width to 10 and opacity to 0.45 to form a soft background glow around the street
        map.addLayer({
          id: "active-zones-road-layer",
          type: "line",
          source: "active-zones-source",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 22,
            "line-opacity": 0.6
          },
          filter: ["==", ["geometry-type"], "LineString"]
        }, map.getLayer(ROUTE_LAYER_ID) ? ROUTE_LAYER_ID : undefined);
      } catch (err) {
        console.error("Failed to load active zones on commuter map:", err);
      }
    };

    fetchAndDrawActiveZones();
    const interval = setInterval(fetchAndDrawActiveZones, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !start) return;
    const map = mapRef.current;
    map.flyTo({
      center: start.coords,
      zoom: Math.max(map.getZoom(), 14),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      duration: 600,
    });
  }, [start?.coords[0], start?.coords[1], isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !end) return;
    const map = mapRef.current;
    map.flyTo({
      center: end.coords,
      zoom: Math.max(map.getZoom(), 14),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      duration: 600,
    });
  }, [end?.coords[0], end?.coords[1], isLoaded]);

  // Zoom in slightly when picking on map mode is activated
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !isPickingOnMap) return;
    const map = mapRef.current;
    map.flyTo({
      zoom: map.getZoom() + 1,
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      duration: 400,
    });

    // Immediately dispatch center so it's available for selection without panning
    const center = map.getCenter();
    window.dispatchEvent(new CustomEvent("map-center-changed", { detail: [center.lng, center.lat] }));
  }, [isPickingOnMap, isLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full bg-neutral-200" />

      {usingFallback && (
        <div className="absolute top-20 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-30 bg-amber-500/95 text-white text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 backdrop-blur-sm animate-pulse max-w-md pointer-events-auto border border-amber-400/20 font-medium">
          <span>⚠️ MapTiler tiles blocked or offline. Switched to OpenStreetMap fallback.</span>
        </div>
      )}

      <LoadingOverlay
        isVisible={!isLoaded}
        message="Initializing 3D Map Engine..."
        variant="absolute"
        zIndex={20}
      />

      {/* Center Pin Overlay (for touch device panning) */}
      {isTouchDevice && isPickingOnMap && activePoint && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full mt-[1.5px] pointer-events-none z-10 drop-shadow-md">
          <svg width="32" height="32" viewBox="0 0 24 24" className="animate-bounce">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" 
              fill={activePoint === "start" ? "#16a34a" : activePoint === "flood_start" ? "#f97316" : activePoint === "flood_end" ? "#991b1b" : "#dc2626"} 
              stroke={activePoint === "start" ? "#16a34a" : activePoint === "flood_start" ? "#f97316" : activePoint === "flood_end" ? "#991b1b" : "#dc2626"} 
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" fill="white" />
          </svg>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-1 bg-black/25 rounded-full blur-[1px]"></div>
        </div>
      )}

      {/* Force map controls above the navigation bar */}
      <style>{`
        .mapboxgl-ctrl-bottom-right,
        .maplibregl-ctrl-bottom-right {
          bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }
        @media (min-width: 641px) {
          .mapboxgl-ctrl-bottom-right,
          .maplibregl-ctrl-bottom-right {
            bottom: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
