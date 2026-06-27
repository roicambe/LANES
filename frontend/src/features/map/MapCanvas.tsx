"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { Map, Marker, MapMouseEvent } from "maplibre-gl";
import { Loader2, MapPin } from "lucide-react";
import { CONSTANTS } from "./mapUtils";
import { useMapContext } from "./MapContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const ROUTE_SOURCE_ID = "route-line";
const ROUTE_LAYER_ID = "route-line-layer";

export default function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const endMarkerRef = useRef<Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const isTouchDevice = useMediaQuery("(max-width: 640px), (pointer: coarse)");
  const isTouchDeviceRef = useRef(isTouchDevice);
  
  useEffect(() => {
    isTouchDeviceRef.current = isTouchDevice;
  }, [isTouchDevice]);

  const { start, end, routeGeometry, setPointFromMap, activePoint } = useMapContext();
  const setPointFromMapRef = useRef(setPointFromMap);
  setPointFromMapRef.current = setPointFromMap;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://api.maptiler.com/maps/streets-v2/style.json?key=BHhRqsneD3M4HnOd57WU",
      center: CONSTANTS.DEFAULT_CENTER,
      zoom: 16.5, // Zoom in closer to see building details
      pitch: 60, // Tilt the camera by 60 degrees to see 3D buildings
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

    mapInstance.on("load", () => {
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
      startMarkerRef.current?.remove();
      endMarkerRef.current?.remove();
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      mapInstance.remove();
      mapRef.current = null;
    };
  }, []);

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

    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

    if (!routeGeometry) return;

    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
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
        "line-color": "#2563eb",
        "line-width": 5,
        "line-opacity": 0.85,
      },
    });

    const bounds = new maplibregl.LngLatBounds(
      routeGeometry.coordinates[0] as [number, number],
      routeGeometry.coordinates[0] as [number, number]
    );
    for (const coord of routeGeometry.coordinates) {
      bounds.extend(coord as [number, number]);
    }
    map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
  }, [routeGeometry, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = "crosshair";
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !start) return;
    mapRef.current.flyTo({ center: start.coords, zoom: Math.max(mapRef.current.getZoom(), 14), duration: 600 });
  }, [start?.coords[0], start?.coords[1], isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !end) return;
    mapRef.current.flyTo({ center: end.coords, zoom: Math.max(mapRef.current.getZoom(), 14), duration: 600 });
  }, [end?.coords[0], end?.coords[1], isLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full bg-neutral-200" />

      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100/50 backdrop-blur-sm pointer-events-none z-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <p className="text-neutral-600 font-medium animate-pulse">Initializing 3D Map Engine...</p>
        </div>
      )}

      {/* Center Pin Overlay (for touch device panning) */}
      {isTouchDevice && activePoint && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full mt-[1.5px] pointer-events-none z-10 drop-shadow-md">
          <svg width="32" height="32" viewBox="0 0 24 24" className="animate-bounce">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill={activePoint === "start" ? "#16a34a" : "#dc2626"} stroke={activePoint === "start" ? "#16a34a" : "#dc2626"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="10" r="3" fill="white"/>
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
