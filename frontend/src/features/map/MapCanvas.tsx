"use client";

import { useEffect, useRef, useState } from "react";
import type { Map, Marker, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CONSTANTS } from "./mapUtils";
import { useMapContext } from "./MapContext";

const ROUTE_SOURCE_ID = "route-line";
const ROUTE_LAYER_ID = "route-line-layer";

export default function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const endMarkerRef = useRef<Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { start, end, routeGeometry, setPointFromMap } = useMapContext();
  const setPointFromMapRef = useRef(setPointFromMap);
  setPointFromMapRef.current = setPointFromMap;

  useEffect(() => {
    let mapInstance: Map | null = null;

    import("maplibre-gl").then((maplibregl) => {
      if (!mapContainerRef.current || mapRef.current) return;

      mapInstance = new maplibregl.Map({
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
        center: CONSTANTS.DEFAULT_CENTER,
        zoom: CONSTANTS.DEFAULT_ZOOM,
      });

      mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");

      mapInstance.on("load", () => {
        mapRef.current = mapInstance;
        setIsLoaded(true);
      });

      mapInstance.on("click", (event: MapMouseEvent) => {
        setPointFromMapRef.current([event.lngLat.lng, event.lngLat.lat]);
      });
    });

    return () => {
      startMarkerRef.current?.remove();
      endMarkerRef.current?.remove();
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      mapInstance?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    import("maplibre-gl").then((maplibregl) => {
      const map = mapRef.current;
      if (!map) return;

      startMarkerRef.current?.remove();
      startMarkerRef.current = null;

      if (start) {
        startMarkerRef.current = new maplibregl.Marker({ color: "#16a34a" })
          .setLngLat(start.coords)
          .addTo(map);
      }
    });
  }, [start, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    import("maplibre-gl").then((maplibregl) => {
      const map = mapRef.current;
      if (!map) return;

      endMarkerRef.current?.remove();
      endMarkerRef.current = null;

      if (end) {
        endMarkerRef.current = new maplibregl.Marker({ color: "#dc2626" })
          .setLngLat(end.coords)
          .addTo(map);
      }
    });
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

    import("maplibre-gl").then((maplibregl) => {
      const bounds = new maplibregl.LngLatBounds(
        routeGeometry.coordinates[0] as [number, number],
        routeGeometry.coordinates[0] as [number, number]
      );
      for (const coord of routeGeometry.coordinates) {
        bounds.extend(coord as [number, number]);
      }
      map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    });
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <p className="text-neutral-500 font-medium">Map Canvas Loading...</p>
        </div>
      )}
    </div>
  );
}
