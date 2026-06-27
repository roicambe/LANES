"use client";
import { useState, useCallback } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

export function useMap() {
  const [map, setMap] = useState<MapLibreMap | null>(null);

  const onMapLoad = useCallback((mapInstance: MapLibreMap) => {
    setMap(mapInstance);
  }, []);

  return {
    map,
    onMapLoad,
    isLoaded: map !== null
  };
}
