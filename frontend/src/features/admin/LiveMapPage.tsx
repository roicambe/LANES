"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LoadingOverlay } from "@/shared/ui";
import { RefreshCw, ShieldAlert, Layers } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// Constants matching MapCanvas.tsx
const DEFAULT_CENTER: [number, number] = [121.0772, 14.5620]; // Pasig City Center

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
      id: "osm-layer",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "#f59e0b",      // Yellow/Amber
  medium: "#f97316",   // Orange
  high: "#f97316",     // Orange (compatibility)
  extreme: "#ef4444",  // Red
};

export default function LiveMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [mapStyle, setMapStyle] = useState<any>(
    "https://api.maptiler.com/maps/streets-v2/style.json?key=BHhRqsneD3M4HnOd57WU"
  );
  const { data: activeZonesData, refetch } = useQuery({
    queryKey: ["activeZones"],
    queryFn: () => apiClient.get<any[]>("/reports/active-zones"),
    refetchInterval: 15000, // 15s background polling fallback
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let fallbackTimeout: NodeJS.Timeout;
    let didFail = false;

    const handleFailure = (reason: string) => {
      if (didFail || usingFallback) return;
      didFail = true;
      console.warn(`LiveMap load failed (${reason}). Switching to OpenStreetMap fallback.`);
      setUsingFallback(true);
      setMapStyle(OSM_FALLBACK_STYLE);
    };

    fallbackTimeout = setTimeout(() => {
      if (!isLoaded) {
        handleFailure("Timeout waiting for style to load");
      }
    }, 8000);

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: DEFAULT_CENTER,
      zoom: 13.8, // Slightly zoomed out to see whole of Pasig
      maxZoom: 20,
      pitch: 0,
      bearing: 0,
    });

    mapInstance.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
      "bottom-right"
    );

    mapInstance.on("error", (e) => {
      const errMsg = (e.message || (e.error && e.error.message) || "").toLowerCase();
      const isStyleError = errMsg.includes("style") || 
                           errMsg.includes("fetch") || 
                           errMsg.includes("failed to fetch") || 
                           errMsg.includes("ajax");
      if (isStyleError && !isLoaded) {
        handleFailure(errMsg || "MapLibre AJAX loading error");
      }
    });

    mapInstance.on("load", () => {
      clearTimeout(fallbackTimeout);
      mapRef.current = mapInstance;
      setIsLoaded(true);
    });

    return () => {
      clearTimeout(fallbackTimeout);
      mapInstance.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, [mapStyle]);

  // Re-run zone loading when activeZonesData or map load state changes reactively
  useEffect(() => {
    if (mapRef.current && isLoaded && activeZonesData) {
      updateZoneLayers(mapRef.current, activeZonesData);
    }
  }, [activeZonesData, isLoaded]);

  const updateZoneLayers = (map: Map, zones: any[]) => {

    // Remove existing sources/layers if they exist
    if (map.getLayer("active-zones-layer")) map.removeLayer("active-zones-layer");
    if (map.getLayer("active-zones-outline")) map.removeLayer("active-zones-outline");
    if (map.getLayer("active-zones-road-layer")) map.removeLayer("active-zones-road-layer");
    if (map.getSource("active-zones-source")) map.removeSource("active-zones-source");

    // Format active detours to GeoJSON FeatureCollection
    const features: any[] = [];
    zones.forEach((zone: any) => {
      const severity = zone.severity || "medium";
      const color = SEVERITY_COLORS[severity] || "#f59e0b";
      const isRoadBased = zone.report_geometry && zone.report_geometry.type === "LineString";

      const commonProps = {
        id: zone.id,
        report_id: zone.report_id,
        severity: severity.toUpperCase(),
        color: color,
        created_at: new Date(zone.created_at).toLocaleString(),
        expires_at: zone.expires_at ? new Date(zone.expires_at).toLocaleString() : "Never",
      };

      if (isRoadBased) {
        // LineString road segment highlight
        features.push({
          type: "Feature",
          properties: {
            ...commonProps,
            is_road_line: true,
            is_road_based: true,
          },
          geometry: zone.report_geometry
        });
      }

      // Polygon avoidance zone buffer
      features.push({
        type: "Feature",
        properties: {
          ...commonProps,
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
        "fill-opacity": 0.45,
      },
      filter: ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "is_road_based"], false]]
    });

    // 2. Outline layer (only for point-based/non-road-based zones)
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
        "line-width": 10,
        "line-opacity": 0.45
      },
      filter: ["==", ["geometry-type"], "LineString"]
    });

    // Click popup details
    const handlePopup = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const properties = e.features[0].properties;
      if (!properties) return;

      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: sans-serif; padding: 6px; color: #1e293b;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${properties.color};"></span>
              <strong style="font-size: 13px;">Zone #${properties.id}</strong>
              <span style="font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 9999px; background-color: #f1f5f9; color: #475569;">
                ${properties.severity}
              </span>
            </div>
            <p style="font-size: 11px; margin: 2px 0;"><strong>Linked Report:</strong> #${properties.report_id}</p>
            <p style="font-size: 11px; margin: 2px 0;"><strong>Created At:</strong> ${properties.created_at}</p>
            <p style="font-size: 11px; margin: 2px 0;"><strong>Expires At:</strong> ${properties.expires_at}</p>
          </div>
        `)
        .addTo(map);
    };

    map.on("click", "active-zones-layer", handlePopup);
    map.on("click", "active-zones-road-layer", handlePopup);

    // Mouse styling updates
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("mouseenter", "active-zones-layer", handleMouseEnter);
    map.on("mouseleave", "active-zones-layer", handleMouseLeave);
    map.on("mouseenter", "active-zones-road-layer", handleMouseEnter);
    map.on("mouseleave", "active-zones-road-layer", handleMouseLeave);
  };

  return (
    <div className="w-full h-full relative flex flex-col bg-white">
      {/* Floating control bar */}
      <div className="absolute top-20 left-4 z-20 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-xl border border-gray-200 flex items-center gap-4 max-w-sm pointer-events-auto text-gray-900">
        <div className="p-2 rounded-lg bg-blue-50">
          <Layers className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-800">Detour Overlays</h2>
          <p className="text-[11px] text-gray-500 font-medium">Polygons represent blocked driving paths.</p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="p-1.5 rounded-lg hover:bg-gray-100 shrink-0"
          title="Force Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </Button>
      </div>

      {/* Fallback Banner */}
      {usingFallback && (
        <div className="absolute top-36 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-30 bg-amber-500/95 text-white text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 backdrop-blur-sm animate-pulse max-w-md pointer-events-auto border border-amber-400/20 font-medium">
          <ShieldAlert className="w-4 h-4" />
          <span>⚠️ MapTiler tiles offline. Using OpenStreetMap fallback.</span>
        </div>
      )}

      {/* Map canvas Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full bg-neutral-100" />

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={!isLoaded}
        message="Loading live administration map..."
        variant="absolute"
        zIndex={40}
      />
    </div>
  );
}
